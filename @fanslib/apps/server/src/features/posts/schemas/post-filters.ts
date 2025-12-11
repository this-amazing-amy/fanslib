import { t } from "elysia";
import { PostStatusSchema } from "../entity";

export const PostFiltersSchema = t.Object({
  search: t.Optional(t.String()),
  channels: t.Optional(t.Array(t.String())),
  channelTypes: t.Optional(t.Array(t.String())),
  statuses: t.Optional(t.Array(PostStatusSchema)),
  dateRange: t.Optional(t.Object({
    startDate: t.String(),
    endDate: t.String(),
  })),
});
