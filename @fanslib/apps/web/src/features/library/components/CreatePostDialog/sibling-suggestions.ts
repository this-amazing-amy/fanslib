type MediaLike = { id: string; package: string | null };

/**
 * Determines which media item to use for fetching sibling suggestions.
 * Returns the first media's id if all selected media share a single non-null package.
 * Returns null otherwise (no suggestions should be shown).
 */
export const getSiblingSuggestionMediaId = (selectedMedia: MediaLike[]): string | null => {
  if (selectedMedia.length === 0) return null;

  const firstPackage = selectedMedia[0]?.package;
  if (!firstPackage) return null;

  const allSamePackage = selectedMedia.every((m) => m.package === firstPackage);
  if (!allSamePackage) return null;

  return selectedMedia[0]?.id ?? null;
};
