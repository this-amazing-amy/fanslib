import { ParentSize } from '@visx/responsive';
import { AreaSeries, Axis, Grid, Tooltip, XYChart, buildChartTheme } from '@visx/xychart';
import { useMemo } from 'react';
import { Button } from '~/components/ui/Button';
import { aggregateDatapoints } from '~/lib/analytics/aggregate';
import { useFetchFanslyDataMutation } from '~/lib/queries/analytics';

type AnalyticsViewsChartProps = {
  datapoints: Array<{ timestamp: number; views: number; interactionTime: number }>;
  postDate: string;
  postMediaId: string;
  hasGap: boolean;
  suggestedFetchRange: { startDate: string; endDate: string } | null;
};

const chartTheme = buildChartTheme({
  colors: ['hsl(var(--p))'],
  gridColor: 'hsl(var(--bc) / 0.1)',
  gridColorDark: 'hsl(var(--bc) / 0.1)',
  backgroundColor: 'transparent',
  tickLength: 4,
});

const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const AnalyticsViewsChart = ({
  datapoints,
  postDate,
  postMediaId,
  hasGap,
  suggestedFetchRange,
}: AnalyticsViewsChartProps) => {
  const fetchAnalyticsMutation = useFetchFanslyDataMutation();

  const aggregatedData = useMemo(
    () => aggregateDatapoints(datapoints, postDate),
    [datapoints, postDate]
  );

  if (aggregatedData.length === 0) {
    return null;
  }

  const handleFetchMore = () => {
    if (suggestedFetchRange) {
      fetchAnalyticsMutation.mutate({
        postMediaId,
        startDate: suggestedFetchRange.startDate,
        endDate: suggestedFetchRange.endDate,
      });
    }
  };

  const chartData = aggregatedData.map((point) => ({
    date: point.date,
    views: point.views,
    timestamp: point.timestamp,
    daysSincePost: point.daysSincePost,
  }));

  const accessors = {
    xAccessor: (d: typeof chartData[number]) => new Date(d.timestamp),
    yAccessor: (d: typeof chartData[number]) => d.views,
  };

  const sevenDayIndex = chartData.findIndex((d) => d.daysSincePost >= 7);
  const thirtyDayIndex = chartData.findIndex((d) => d.daysSincePost >= 30);

  const maxViews = Math.max(...chartData.map((d) => d.views), 0);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Views Over Time</h3>
      <div className="relative" style={{ minHeight: '300px' }}>
        <ParentSize>
          {({ width }) => (
            <XYChart
              theme={chartTheme}
              xScale={{ type: 'time' }}
              yScale={{ type: 'linear', domain: [0, maxViews * 1.1] }}
              width={width}
              height={300}
              margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
            >
              <Grid columns={false} numTicks={4} />
              <Axis
                orientation="bottom"
                numTicks={5}
                tickFormat={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <Axis
                orientation="left"
                numTicks={5}
                tickFormat={formatNumber}
              />
              <AreaSeries
                dataKey="views"
                data={chartData}
                {...accessors}
                fillOpacity={0.2}
              />
              <Tooltip
                snapTooltipToDatumX
                snapTooltipToDatumY
                showVerticalCrosshair
                showSeriesGlyphs
                renderTooltip={({ tooltipData }) => {
                  if (!tooltipData?.nearestDatum) return null;
                  const datum = tooltipData.nearestDatum.datum as typeof chartData[number];
                  return (
                    <div className="bg-base-100 border border-base-300 rounded-lg p-2 shadow-lg">
                      <div className="text-sm font-medium">{datum.date}</div>
                      <div className="text-sm text-base-content/70">
                        Views: {formatNumber(datum.views)}
                      </div>
                      <div className="text-xs text-base-content/50">
                        Day {datum.daysSincePost}
                      </div>
                    </div>
                  );
                }}
              />
            </XYChart>
          )}
        </ParentSize>

        {sevenDayIndex >= 0 && (
          <div
            className="absolute border-l-2 border-dashed border-amber-500 h-[calc(100%-45px)] top-0 pointer-events-none"
            style={{
              left: `${Math.min(95, (sevenDayIndex / (chartData.length - 1)) * 100)}%`,
            }}
          >
            <div className="absolute -top-6 -translate-x-1/2 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
              7 days
            </div>
          </div>
        )}

        {thirtyDayIndex >= 0 && (
          <div
            className="absolute border-l-2 border-dashed border-green-500 h-[calc(100%-45px)] top-0 pointer-events-none"
            style={{
              left: `${Math.min(95, (thirtyDayIndex / (chartData.length - 1)) * 100)}%`,
            }}
          >
            <div className="absolute -top-6 -translate-x-1/2 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
              30 days
            </div>
          </div>
        )}

        {hasGap && suggestedFetchRange && (
          <div
            className="absolute top-0 right-0 h-full w-1/4 bg-primary/10 border-l-2 border-primary/30 cursor-pointer hover:bg-primary/20 transition-colors flex items-center justify-center"
            onClick={handleFetchMore}
            style={{ minWidth: '100px' }}
          >
            <div className="text-center p-4">
              <div className="text-sm font-medium mb-2">Fetch More</div>
              <Button
                size="sm"
                variant="secondary"
                isDisabled={fetchAnalyticsMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFetchMore();
                }}
              >
                {fetchAnalyticsMutation.isPending ? 'Fetching...' : 'Update'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

