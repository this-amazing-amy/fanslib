import type { z } from "zod";
import { db } from "../../../../lib/db";
import { FanslyMediaCandidate } from "../../candidate-entity";
import type { FetchAllCandidatesRequestQuerySchema, FetchAllCandidatesResponseSchema } from "../schema";

export const fetchAllCandidates = async (
  params?: z.infer<typeof FetchAllCandidatesRequestQuerySchema>
): Promise<z.infer<typeof FetchAllCandidatesResponseSchema>> => {
  const status = params?.status;
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;

  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const queryBuilder = candidateRepository.createQueryBuilder("candidate");

  if (status) {
    queryBuilder.where("candidate.status = :status", { status });
  }

  const total = await queryBuilder.getCount();

  const items = await queryBuilder
    .orderBy("candidate.capturedAt", "DESC")
    .skip(offset)
    .take(limit)
    .getMany();

  return { items, total };
};
