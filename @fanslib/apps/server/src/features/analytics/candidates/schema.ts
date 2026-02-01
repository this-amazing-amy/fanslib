import { z } from "zod";

// Base schemas from candidate-entity
export const CandidateStatusSchema = z.enum(["pending", "matched", "ignored"]);

export const MatchMethodSchema = z.enum([
  "exact_filename",
  "fuzzy_filename",
  "manual",
  "auto_detected",
]);

export const FanslyMediaTypeSchema = z.enum(["image", "video"]);

export const FanslyMediaCandidateSchema = z.object({
  id: z.string(),
  fanslyStatisticsId: z.string(),
  fanslyPostId: z.string(),
  filename: z.string(),
  caption: z.string().nullable(),
  fanslyCreatedAt: z.number(),
  position: z.number(),
  mediaType: FanslyMediaTypeSchema,
  status: CandidateStatusSchema,
  matchedPostMediaId: z.string().nullable(),
  matchConfidence: z.number().nullable(),
  matchMethod: MatchMethodSchema.nullable(),
  capturedAt: z.date(),
  matchedAt: z.date().nullable(),
});

export const CreateCandidateSchema = z.object({
  fanslyStatisticsId: z.string(),
  fanslyPostId: z.string(),
  filename: z.string(),
  caption: z.string().nullable(),
  fanslyCreatedAt: z.number(),
  position: z.number(),
  mediaType: FanslyMediaTypeSchema,
});

export const MatchSuggestionSchema = z.object({
  postMediaId: z.string(),
  confidence: z.number(),
  method: MatchMethodSchema,
  filename: z.string(),
  caption: z.string().optional(),
});

// Operation schemas

// Create
export const CreateCandidatesRequestBodySchema = z.object({
  items: z.array(CreateCandidateSchema),
});

export const CandidateCreationResultSchema = z.object({
  candidate: FanslyMediaCandidateSchema,
  status: z.enum(["created", "existing", "already_matched"]),
});

export const CreateCandidatesResponseSchema = z.array(CandidateCreationResultSchema);

// Fetch
export const FetchAllCandidatesRequestQuerySchema = z.object({
  status: CandidateStatusSchema.optional(),
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});

export const FetchAllCandidatesResponseSchema = z.object({
  items: z.array(FanslyMediaCandidateSchema),
  total: z.number(),
});

// Suggestions
export const FetchCandidateSuggestionsRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchCandidateSuggestionsResponseSchema = z.array(MatchSuggestionSchema);

// Match
export const ConfirmMatchRequestParamsSchema = z.object({
  id: z.string(),
});

export const ConfirmMatchRequestBodySchema = z.object({
  postMediaId: z.string(),
});

export const ConfirmMatchResponseSchema = FanslyMediaCandidateSchema;

// Ignore
export const IgnoreCandidateRequestParamsSchema = z.object({
  id: z.string(),
});

export const IgnoreCandidateResponseSchema = FanslyMediaCandidateSchema;

// Bulk confirm
export const BulkConfirmCandidatesRequestBodySchema = z.object({
  threshold: z.number(),
});

export const BulkConfirmCandidatesResponseSchema = z.object({
  confirmed: z.number(),
  failed: z.number(),
});

// Unmatch
export const UnmatchCandidateRequestParamsSchema = z.object({
  id: z.string(),
});

export const UnmatchCandidateResponseSchema = FanslyMediaCandidateSchema;

// Unignore
export const UnignoreCandidateRequestParamsSchema = z.object({
  id: z.string(),
});

export const UnignoreCandidateResponseSchema = FanslyMediaCandidateSchema;

// Error responses
export const ErrorResponseSchema = z.object({
  error: z.string(),
});
