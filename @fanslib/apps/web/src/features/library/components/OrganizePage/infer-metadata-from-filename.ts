type ContentRating = "xt" | "uc" | "cn" | "sg" | "sf";

export type InferredFields = {
  package?: string;
  role?: string;
  contentRating?: ContentRating | "";
};

/**
 * Pre-fills package / role / content rating from filename substrings.
 * Rules are applied in order; earlier rules win (e.g. `clip` before `full`).
 */
export const inferMetadataFromFilename = (filename: string): InferredFields => {
  const lower = filename.toLowerCase();

  if (lower.includes("clip")) {
    return {
      package: "clip",
      role: "full",
      contentRating: "uc",
    };
  }

  if (lower.includes("short") || lower.includes("promo")) {
    return { role: "short" };
  }

  if (lower.includes("full")) {
    return { role: "full", contentRating: "uc" };
  }

  if (lower.includes("censored") && !lower.includes("uncensored")) {
    return { contentRating: "cn" };
  }

  return {};
};
