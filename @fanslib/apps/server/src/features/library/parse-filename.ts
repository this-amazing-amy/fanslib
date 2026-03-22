import { CONTENT_RATINGS, type ContentRating } from "./content-rating";

export type ParsedFilename = {
  date: string | null;
  shootName: string | null;
  package: string | null;
  role: string | null;
  contentRating: ContentRating | null;
  seq: number | null;
};

const NULL_RESULT: ParsedFilename = {
  date: null,
  shootName: null,
  package: null,
  role: null,
  contentRating: null,
  seq: null,
};

const parseRating = (raw: string | undefined): ContentRating | null =>
  raw !== undefined && (CONTENT_RATINGS as readonly string[]).includes(raw)
    ? (raw as ContentRating)
    : null;

export const parseFilename = (filename: string): ParsedFilename => {
  const dotIndex = filename.lastIndexOf(".");
  const stem = dotIndex >= 0 ? filename.slice(0, dotIndex) : filename;

  const parts = stem.split("_");

  if (parts.length === 5) {
    const date = parts[0] ?? "";
    const shootName = parts[1] ?? "";
    const pkg = parts[2] ?? "";
    const role = parts[3] ?? "";
    const ratingRaw = parts[4];

    return {
      date,
      shootName,
      package: pkg,
      role,
      contentRating: parseRating(ratingRaw),
      seq: null,
    };
  }

  if (parts.length === 6) {
    const seqNum = Number(parts[5]);

    if (!Number.isInteger(seqNum) || seqNum < 2) {
      return { ...NULL_RESULT };
    }

    const date = parts[0] ?? "";
    const shootName = parts[1] ?? "";
    const pkg = parts[2] ?? "";
    const role = parts[3] ?? "";
    const ratingRaw = parts[4];

    return {
      date,
      shootName,
      package: pkg,
      role,
      contentRating: parseRating(ratingRaw),
      seq: seqNum,
    };
  }

  return { ...NULL_RESULT };
};
