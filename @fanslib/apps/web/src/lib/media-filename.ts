const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Build a preview filename following the managed naming convention:
 * `{YYYYMMDD}_{name}_{pkg}_{role}_{rating}[_seq]{ext}`
 */
export const buildPreviewFilename = (
  name: string,
  pkg: string,
  role: string,
  contentRating: string,
  ext: string,
  seq?: number,
  date: Date = new Date(),
): string => {
  const dateStr = formatDate(date);
  const base = `${dateStr}_${name}_${pkg}_${role}_${contentRating}`;
  const seqSuffix = seq ? `_${seq}` : "";
  return `${base}${seqSuffix}${ext}`;
};
