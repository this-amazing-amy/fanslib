import type { PaginationParams } from '../../common/pagination';

export type MediaType = "image" | "video";

export type Media = {
  id: string;
  relativePath: string;
  type: MediaType;
  name: string;
  size: number;
  duration?: number;
  redgifsUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  fileCreationDate: Date;
  fileModificationDate: Date;
};

export type MediaWithoutRelations = Omit<Media, "id">;

export type SortField = "fileModificationDate" | "fileCreationDate" | "lastPosted" | "random";
export type SortDirection = "ASC" | "DESC";

export type MediaSort = {
  field: SortField;
  direction: SortDirection;
};

export type FilterItem =
  | {
      type: "channel" | "subreddit" | "tag" | "shoot";
      id: string;
    }
  | {
      type: "filename" | "caption";
      value: string;
    }
  | {
      type: "posted";
      value: boolean;
    }
  | {
      type: "createdDateStart" | "createdDateEnd";
      value: Date;
    }
  | {
      type: "mediaType";
      value: "image" | "video";
    }
  | {
      type: "dimensionEmpty";
      dimensionId: number;
    };

export type FilterGroup = {
  include: boolean;
  items: FilterItem[];
};

export type MediaFilters = FilterGroup[];

export type TagFilter = {
  tagIds?: number[];
};

export type GetAllMediaParams = Partial<
  PaginationParams & { filters: MediaFilters; sort?: MediaSort }
>;

export type LibraryScanResult = {
  added: number;
  updated: number;
  removed: number;
  total: number;
};

export type LibraryScanProgress = {
  current: number;
  total: number;
};

export type FileScanResult = {
  action: "added" | "updated" | "unchanged";
  media: Media;
};

export type UpdateMediaPayload = Partial<
  Omit<Media, "id" | "createdAt" | "updatedAt" | "postMedia">
>;

