import { IsNull, Not } from "typeorm";
import { db } from "../../lib/db";
import { isAppError } from "../../lib/errors";
import { loadFanslyCredentials } from "../settings/operations/credentials/load";
import { FanslyAnalyticsAggregate, FanslyAnalyticsDatapoint } from "./entity";
import { fetchFanslyAnalyticsData } from "./fetch-fansly-data";

export type FetchInterval = { days: number } | null;

export type CronTickResult = {
  processed: number;
  skipped: number;
  errors: number;
  halted: boolean;
  credentialsStale?: boolean;
};

const DELAY_BETWEEN_CALLS_MS = 2000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const computeGrowthRate = (
  datapoints: Pick<FanslyAnalyticsDatapoint, "views" | "timestamp">[],
): number => {
  if (datapoints.length < 2) return 0;

  const sorted = [...datapoints].sort((a, b) => a.timestamp - b.timestamp);
  const previous = sorted[sorted.length - 2];
  const current = sorted[sorted.length - 1];

  if (!previous || !current || previous.views === 0) return 0;

  return ((current.views - previous.views) / previous.views) * 100;
};

export const computeNextFetchInterval = (
  growthRatePercent: number,
  plateauDetectedAt: Date | null | undefined,
): FetchInterval => {
  if (growthRatePercent > 5) {
    return { days: 1 };
  }

  if (growthRatePercent >= 1) {
    return { days: 3 };
  }

  // Plateaued (< 1%)
  if (plateauDetectedAt) {
    const daysSincePlateau = (Date.now() - plateauDetectedAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSincePlateau >= 90) {
      return null; // Stop fetching
    }
  }

  return { days: 7 };
};

const findDueAggregates = async (): Promise<FanslyAnalyticsAggregate[]> => {
  const dataSource = await db();
  const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

  return aggregateRepo
    .find({
      where: {
        nextFetchAt: Not(IsNull()) as unknown as Date,
      },
      relations: {
        postMedia: true,
      },
    })
    .then((aggregates) =>
      aggregates.filter((a) => a.nextFetchAt && a.nextFetchAt.getTime() <= Date.now()),
    );
};

const updateAggregateNextFetchAt = async (
  aggregateId: string,
  postMediaId: string,
  originalPlateauDetectedAt: Date | null | undefined,
): Promise<void> => {
  const dataSource = await db();
  const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);
  const dpRepo = dataSource.getRepository(FanslyAnalyticsDatapoint);

  const datapoints = await dpRepo.find({
    where: { postMediaId },
    order: { timestamp: "ASC" },
  });

  const aggregate = await aggregateRepo.findOneOrFail({ where: { id: aggregateId } });

  // Preserve original plateauDetectedAt if it was already set before this fetch.
  // addDatapointsToPostMedia resets it to new Date() on every fetch, losing the
  // original detection time that we need for the 90-day stop-fetching logic.
  const effectivePlateauDetectedAt = originalPlateauDetectedAt ?? aggregate.plateauDetectedAt;
  if (originalPlateauDetectedAt && aggregate.plateauDetectedAt) {
    aggregate.plateauDetectedAt = originalPlateauDetectedAt;
  }

  const growthRate = computeGrowthRate(datapoints);
  const interval = computeNextFetchInterval(growthRate, effectivePlateauDetectedAt);

  if (interval) {
    aggregate.nextFetchAt = new Date(Date.now() + interval.days * 24 * 60 * 60 * 1000);
  } else {
    // TypeORM/sqljs: set to null explicitly (undefined won't persist as NULL)
    (aggregate as { nextFetchAt: Date | null }).nextFetchAt = null;
  }

  await aggregateRepo.save(aggregate);
};

export const processAnalyticsCronTick = async (): Promise<CronTickResult> => {
  const credentials = await loadFanslyCredentials();

  if (!credentials || credentials.stale) {
    return { processed: 0, skipped: 0, errors: 0, halted: false, credentialsStale: true };
  }

  const dueAggregates = await findDueAggregates();

  if (dueAggregates.length === 0) {
    return { processed: 0, skipped: 0, errors: 0, halted: false };
  }

  const result: CronTickResult = { processed: 0, skipped: 0, errors: 0, halted: false };

  // eslint-disable-next-line functional/no-loop-statements
  for (const aggregate of dueAggregates) {
    if (!aggregate.postMedia?.fanslyStatisticsId) {
      result.skipped++;
      continue;
    }

    try {
      await fetchFanslyAnalyticsData(aggregate.postMediaId);
      await updateAggregateNextFetchAt(
        aggregate.id,
        aggregate.postMediaId,
        aggregate.plateauDetectedAt,
      );
      result.processed++;
    } catch (error) {
      if (isAppError(error) && error.code === "CONFIGURATION_ERROR") {
        // 401/403 — credentials marked stale by fetchFanslyAnalyticsData
        result.halted = true;
        result.errors++;
        break;
      }
      console.error(`Analytics cron: failed to process aggregate ${aggregate.id}:`, error);
      result.errors++;
    }

    // 2-second gap between API calls
    if (result.processed + result.skipped + result.errors < dueAggregates.length) {
      await delay(DELAY_BETWEEN_CALLS_MS);
    }
  }

  return result;
};

export const runAnalyticsCronTick = async (): Promise<void> => {
  const result = await processAnalyticsCronTick();
  console.info("analytics-cron:tick", {
    processed: result.processed,
    skipped: result.skipped,
    errors: result.errors,
    halted: result.halted,
    credentialsStale: result.credentialsStale,
  });
};
