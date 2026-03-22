import { z } from "zod";

/**
 * Ordered content rating codes, from most explicit to safest.
 * xt = Extreme, uc = Uncensored, cn = Censored, sg = Suggestive, sf = Safe
 */
export const CONTENT_RATINGS = ["xt", "uc", "cn", "sg", "sf"] as const;

export const ContentRatingSchema = z.enum(CONTENT_RATINGS);

export type ContentRating = z.infer<typeof ContentRatingSchema>;

/**
 * Compare two content ratings by explicitness.
 * Returns positive if `a` is more explicit than `b`, negative if less, 0 if equal.
 */
export const compareContentRating = (a: ContentRating, b: ContentRating): number => {
  const indexA = CONTENT_RATINGS.indexOf(a);
  const indexB = CONTENT_RATINGS.indexOf(b);
  // Lower index = more explicit, so invert
  return indexB - indexA;
};
