export type FetchDriftPreventionStatsRequest = never;

export type FetchDriftPreventionStatsResponse = {
  totalMedia: number;
  totalMediaTags: number;
  orphanedMediaTags: number;
  inconsistentStickerDisplayProperties: number;
  totalTagDefinitions: number;
  integrityPercentage: number;
};

