import type { GetAllMediaParams, Media } from "../../media";
import type { PaginatedResponse } from "../../../../common/pagination";

export type FetchAllMediaRequest = GetAllMediaParams;

export type FetchAllMediaResponse = PaginatedResponse<Media>;
