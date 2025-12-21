import { db } from "../../../lib/db";
import { PostMedia } from "../../posts/entity";
import type { FanslyMediaCandidate } from "../candidate-entity";

type MatchSuggestion = {
  postMediaId: string;
  confidence: number;
  method: "exact_filename" | "fuzzy_filename" | "manual";
  filename: string;
  caption?: string;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // eslint-disable-next-line functional/no-loop-statements, functional/no-let
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  // eslint-disable-next-line functional/no-loop-statements, functional/no-let
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // eslint-disable-next-line functional/no-loop-statements, functional/no-let
  for (let i = 1; i <= len1; i++) {
  // eslint-disable-next-line functional/no-loop-statements, functional/no-let
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
};

const normalizeFilename = (filename: string): string => filename
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

export const computeMatchSuggestions = async (
  candidate: FanslyMediaCandidate
): Promise<MatchSuggestion[]> => {
  const dataSource = await db();
  const postMediaRepository = dataSource.getRepository(PostMedia);

  const normalizedCandidateFilename = normalizeFilename(candidate.filename);

  const allPostMedia = await postMediaRepository
    .createQueryBuilder("postMedia")
    .leftJoinAndSelect("postMedia.post", "post")
    .leftJoinAndSelect("postMedia.media", "media")
    .where("postMedia.fanslyStatisticsId IS NULL")
    .getMany();

  const suggestions: MatchSuggestion[] = [];

  allPostMedia.forEach((postMedia) => {
    if (!postMedia.media?.name) return;

    const normalizedMediaFilename = normalizeFilename(postMedia.media.name);

    if (normalizedCandidateFilename === normalizedMediaFilename) {
      suggestions.push({
        postMediaId: postMedia.id,
        confidence: 1.0,
        method: "exact_filename",
        filename: postMedia.media.name,
        caption: postMedia.post.caption ?? undefined,
      });
      return;
    }

    const similarity = calculateSimilarity(normalizedCandidateFilename, normalizedMediaFilename);

    if (similarity >= 0.5) {
      suggestions.push({
        postMediaId: postMedia.id,
        confidence: similarity,
        method: "fuzzy_filename",
        filename: postMedia.media.name,
        caption: postMedia.post.caption ?? undefined,
      });
    }
  });

  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions.slice(0, 3);
};

