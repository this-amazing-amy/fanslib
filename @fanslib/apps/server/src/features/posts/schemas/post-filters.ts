import { z } from "zod";
import { PostStatusSchema } from "../schema";

export const PostFiltersSchema = z.object({
  search: z.string().optional(),
  channels: z.array(z.string()).optional(),
  channelTypes: z.array(z.string()).optional(),
  statuses: z.array(PostStatusSchema).optional(),
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }).optional(),
});
