type CaptionPreviewOptions = {
  maxChars?: number;
};

export const getCaptionPreview = (
  caption: string,
  { maxChars = 150 }: CaptionPreviewOptions = {}
): string => {
  const trimmedCaption = caption.trim();
  if (!trimmedCaption) return "";

  const firstParagraph = trimmedCaption.split(/\r?\n/u)[0]?.trim() ?? "";
  if (!firstParagraph) return "";

  const chars = Array.from(firstParagraph);
  const isTruncated = chars.length > maxChars;
  if (!isTruncated) return firstParagraph;

  return `${chars.slice(0, maxChars).join("").trimEnd()}…`;
};

