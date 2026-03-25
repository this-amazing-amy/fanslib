import type { Media } from "@fanslib/server/schemas";

const CONTENT_RATINGS = ["xt", "uc", "cn", "sg", "sf"] as const;
type ContentRating = (typeof CONTENT_RATINGS)[number];

export type MatrixCell = {
  contentRating: ContentRating | null;
  media: Media[];
};

export type MatrixRow = {
  role: string;
  cells: MatrixCell[];
};

export type PackageGroup = {
  packageName: string;
  rows: MatrixRow[];
};

export const groupMediaByPackage = (media: Media[]): PackageGroup[] => {
  const packageMap = new Map<string, Media[]>();

  media.forEach((m) => {
    const pkg = m.package ?? "Ungrouped";
    const existing = packageMap.get(pkg) ?? [];
    existing.push(m);
    packageMap.set(pkg, existing);
  });

  return Array.from(packageMap.entries()).map(([packageName, packageMedia]) => {
    const roleMap = new Map<string, Map<string | null, Media[]>>();

    packageMedia.forEach((m) => {
      const role = m.role ?? "—";
      const rating = m.contentRating ?? null;

      if (!roleMap.has(role)) roleMap.set(role, new Map());
      const ratingMap = roleMap.get(role) ?? new Map();
      const existing = ratingMap.get(rating) ?? [];
      existing.push(m);
      ratingMap.set(rating, existing);
    });

    const rows: MatrixRow[] = Array.from(roleMap.entries()).map(([role, ratingMap]) => ({
      role,
      cells: [
        ...CONTENT_RATINGS.map((cr): MatrixCell => ({
          contentRating: cr,
          media: ratingMap.get(cr) ?? [],
        })),
        { contentRating: null, media: ratingMap.get(null) ?? [] } as MatrixCell,
      ],
    }));

    return { packageName, rows };
  });
};

export const getPopulatedColumns = (groups: PackageGroup[]): (ContentRating | null)[] => {
  const populated = new Set<ContentRating | null>();

  groups.forEach((g) =>
    g.rows.forEach((r) =>
      r.cells.forEach((c) => {
        if (c.media.length > 0) populated.add(c.contentRating);
      }),
    ),
  );

  // Return in canonical order: xt, uc, cn, sg, sf, then null
  const ordered: (ContentRating | null)[] = [];
  CONTENT_RATINGS.forEach((cr) => {
    if (populated.has(cr)) ordered.push(cr);
  });
  if (populated.has(null)) ordered.push(null);

  return ordered;
};
