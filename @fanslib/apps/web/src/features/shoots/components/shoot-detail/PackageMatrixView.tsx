import type { Media } from "@fanslib/server/schemas";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { MediaTile } from "~/features/library/components/MediaTile";
import { cn } from "~/lib/cn";
import { groupMediaByPackage, getPopulatedColumns } from "./group-media-by-package";
import type { MatrixCell } from "./group-media-by-package";

const CONTENT_RATING_LABELS: Record<string, string> = {
  xt: "XT",
  uc: "UC",
  cn: "CN",
  sg: "SG",
  sf: "SF",
};

type PackageMatrixViewProps = {
  medias: Media[];
  onAddMedia?: () => void;
};

export const PackageMatrixView = ({ medias, onAddMedia }: PackageMatrixViewProps) => {
  const [compactView, setCompactView] = useState(false);

  const groups = useMemo(() => groupMediaByPackage(medias), [medias]);
  const populatedColumns = useMemo(() => getPopulatedColumns(groups), [groups]);

  const columns = compactView ? populatedColumns : (["xt", "uc", "cn", "sg", "sf", null] as const);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        {onAddMedia && (
          <button
            onClick={onAddMedia}
            className={cn(
              "w-32 h-32 rounded-2xl border-2 border-dashed border-base-300",
              "flex items-center justify-center",
              "hover:border-primary hover:bg-primary/10 transition-colors cursor-pointer",
            )}
          >
            <div className="flex flex-col items-center gap-2 text-base-content/60">
              <Plus className="h-8 w-8" />
              <span className="text-sm">Add Media</span>
            </div>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm text-base-content/60 hover:text-base-content transition-colors"
          onClick={() => setCompactView((v) => !v)}
        >
          {compactView ? "Show all columns" : "Compact view"}
        </button>
      </div>

      {groups.map((group) => (
        <div key={group.packageName} className="flex flex-col gap-2">
          <h3 className="text-lg font-medium">{group.packageName}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-base-content/50 px-2 py-1 w-24">
                    Role
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col ?? "unrated"}
                      className="text-center text-xs font-medium text-base-content/50 px-2 py-1"
                    >
                      {col ? (CONTENT_RATING_LABELS[col] ?? col) : "Unrated"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.role}>
                    <td className="text-sm font-medium px-2 py-2 align-top">{row.role}</td>
                    {columns.map((col) => {
                      const cell = row.cells.find((c) => c.contentRating === col) as
                        | MatrixCell
                        | undefined;
                      const hasMedia = cell && cell.media.length > 0;

                      return (
                        <td key={col ?? "unrated"} className="px-1 py-1 align-top">
                          {hasMedia ? (
                            <div className="flex flex-col gap-1">
                              {cell.media.map((media, index) => (
                                <MediaTile
                                  key={media.id}
                                  media={media}
                                  index={index}
                                  withNavigation
                                  withTags
                                  withDuration
                                  aspectFrameClassName="aspect-square"
                                  className="w-28"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="w-28 aspect-square rounded-lg border-2 border-dashed border-base-300/50 bg-base-200/30" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {onAddMedia && (
        <button
          onClick={onAddMedia}
          className={cn(
            "w-28 h-28 rounded-2xl border-2 border-dashed border-base-300",
            "flex items-center justify-center",
            "hover:border-primary hover:bg-primary/10 transition-colors cursor-pointer",
          )}
        >
          <div className="flex flex-col items-center gap-2 text-base-content/60">
            <Plus className="h-6 w-6" />
            <span className="text-xs">Add Media</span>
          </div>
        </button>
      )}
    </div>
  );
};
