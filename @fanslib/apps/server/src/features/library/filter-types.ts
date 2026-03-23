import type { z } from "zod";
import type { MediaFilterSchema } from "./schemas/media-filter";
import type { Settings } from "../settings/schemas/settings";

export type MediaFilters = z.infer<typeof MediaFilterSchema>;
export type FilterGroup = MediaFilters[number];
export type FilterItem = FilterGroup["items"][number];

export type FilterContext = {
  channelCooldownHours?: number;
  repostSettings?: Settings["repostSettings"];
};
