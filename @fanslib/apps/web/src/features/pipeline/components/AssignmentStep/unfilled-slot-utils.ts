import type { AssignMediaResponseSchema } from "@fanslib/server/schemas";

type UnfilledSlot = typeof AssignMediaResponseSchema.static["unfilled"][number];

export const getUnfilledSlotReasonText = (reason: UnfilledSlot["reason"]) => {
  switch (reason) {
    case "no_eligible_media":
      return "No matching media";
    case "no_subreddits":
      return "No subreddits configured";
    default:
      return "Unknown reason";
  }
};
