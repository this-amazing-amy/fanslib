import { useState, useMemo } from "react";
import { List, Plus } from "lucide-react";
import type { Media } from "@fanslib/server/schemas";
import { Input } from "~/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/Select";
import { MediaTile } from "~/features/library/components/MediaTile";
import { useUnmanagedMediaQuery, useOrganizeMutation } from "~/lib/queries/organize";
import { useShootsQuery, useCreateShootMutation } from "~/lib/queries/shoots";
import { inferMetadataFromFilename } from "./infer-metadata-from-filename";

type FolderGroup = {
  folder: string;
  media: Media[];
};

type ShootMode = "select" | "create";

type ContentRating = "xt" | "uc" | "cn" | "sg" | "sf";

type FileMetadata = {
  package: string;
  role: string;
  contentRating: ContentRating | "";
};

type OrganizeError = {
  mediaId: string;
  error: string;
};

const CONTENT_RATINGS = [
  { value: "xt", label: "Extreme" },
  { value: "uc", label: "Uncensored" },
  { value: "cn", label: "Censored" },
  { value: "sg", label: "Suggestive" },
  { value: "sf", label: "Safe" },
] as const;

const CONTENT_RATING_UNSET = "__none__";

const SHOOT_SELECT_UNSET = "__shoot_unset__";

const DEFAULT_PACKAGE = "main";

const DEFAULT_CONTENT_RATING: ContentRating = "uc";

const packageValueOrDefault = (meta: FileMetadata | undefined): string =>
  meta?.package === undefined ? DEFAULT_PACKAGE : meta.package;

const contentRatingValueOrDefault = (meta: FileMetadata | undefined): ContentRating | "" =>
  meta?.contentRating === undefined ? DEFAULT_CONTENT_RATING : meta.contentRating;

const metadataFromInference = (filename: string): FileMetadata => {
  const inferred = inferMetadataFromFilename(filename);
  return {
    package: inferred.package ?? DEFAULT_PACKAGE,
    role: inferred.role ?? "",
    contentRating: inferred.contentRating ?? DEFAULT_CONTENT_RATING,
  };
};

const ensureMetadataWithInference = (
  mediaItems: Media[],
  metaPrev: Record<string, FileMetadata>,
): Record<string, FileMetadata> => {
  const next = { ...metaPrev };
  mediaItems
    .filter((m) => next[m.id] === undefined)
    .forEach((m) => {
      next[m.id] = metadataFromInference(m.name);
    });
  return next;
};

const getExtension = (filename: string): string => {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot) : "";
};

const buildPreviewPath = (
  shootName: string,
  pkg: string,
  role: string,
  contentRating: string,
  ext: string,
): string => {
  const date = "YYYYMMDD";
  const year = "YYYY";
  const shootFolder = `${date}_${shootName}`;
  const baseName = `${date}_${shootName}_${pkg}_${role}_${contentRating}`;
  return `${year}/${shootFolder}/${baseName}${ext}`;
};

export const OrganizePage = () => {
  const { data: groups, isLoading } = useUnmanagedMediaQuery();
  const { data: shootsData } = useShootsQuery({ limit: 200 });
  const shoots = shootsData?.items ?? [];
  const organizeMutation = useOrganizeMutation();
  const createShootMutation = useCreateShootMutation();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedShootId, setSelectedShootId] = useState("");
  const [shootMode, setShootMode] = useState<ShootMode>("select");
  const [newShootName, setNewShootName] = useState("");
  const [fileMetadata, setFileMetadata] = useState<Record<string, FileMetadata>>({});
  const [errors, setErrors] = useState<OrganizeError[]>([]);

  const toggleFile = (media: Media) => {
    setSelectedIds((prev) => {
      const wasSelected = prev.has(media.id);
      if (!wasSelected) {
        setFileMetadata((metaPrev) => ensureMetadataWithInference([media], metaPrev));
      }
      const next = new Set(prev);
      if (wasSelected) {
        next.delete(media.id);
      } else {
        next.add(media.id);
      }
      return next;
    });
  };

  const toggleFolderSelection = (group: FolderGroup) => {
    const ids = group.media.map((m) => m.id);
    if (ids.length === 0) return;
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const idSet = new Set(ids);
      if (allSelected) {
        return new Set([...prev].filter((id) => !idSet.has(id)));
      }
      const newlySelected = group.media.filter((m) => !prev.has(m.id));
      if (newlySelected.length > 0) {
        setFileMetadata((metaPrev) => ensureMetadataWithInference(newlySelected, metaPrev));
      }
      return new Set([...prev, ...ids]);
    });
  };

  const updateMetadata = (mediaId: string, field: keyof FileMetadata, value: string) => {
    setFileMetadata((prev) => ({
      ...prev,
      [mediaId]: {
        ...prev[mediaId],
        package: prev[mediaId]?.package ?? DEFAULT_PACKAGE,
        role: prev[mediaId]?.role ?? "",
        contentRating: prev[mediaId]?.contentRating ?? DEFAULT_CONTENT_RATING,
        [field]: value,
      },
    }));
  };

  const folderGroups = useMemo(
    () => (groups ?? []) as unknown as FolderGroup[],
    [groups],
  );

  // Resolve the shoot name for preview
  const shootName = useMemo(() => {
    if (shootMode === "create") return newShootName;
    const selected = shoots.find((s: { id: string; name: string }) => s.id === selectedShootId);
    return selected?.name ?? "";
  }, [shootMode, newShootName, selectedShootId, shoots]);

  // Build preview entries for all selected files
  const allMedia = useMemo(() => folderGroups.flatMap((g) => g.media), [folderGroups]);

  const mediaGlobalIndexById = useMemo(() => {
    const map = new Map<string, number>();
    allMedia.forEach((m, index) => {
      map.set(m.id, index);
    });
    return map;
  }, [allMedia]);

  // Files that are fully ready to submit (selected + all metadata filled)
  const readyEntries = useMemo(
    () =>
      allMedia
        .filter((m) => selectedIds.has(m.id))
        .filter((m) => {
          const meta = fileMetadata[m.id];
          const pkg = packageValueOrDefault(meta).trim();
          const rating = contentRatingValueOrDefault(meta);
          return pkg.length > 0 && Boolean(meta?.role?.trim()) && Boolean(rating?.trim());
        }),
    [allMedia, selectedIds, fileMetadata],
  );

  const previewEntries = useMemo(() => {
    if (!shootName) return [];
    return readyEntries
      .map((m) => {
        const meta = fileMetadata[m.id];
        const rating = contentRatingValueOrDefault(meta);
        if (!meta?.role?.trim() || !rating) return null;
        const pkg = packageValueOrDefault(meta).trim();
        if (!pkg) return null;
        const ext = getExtension(m.name);
        return {
          mediaId: m.id,
          originalName: m.name,
          targetPath: buildPreviewPath(shootName, pkg, meta.role, rating, ext),
        };
      })
      .filter(Boolean);
  }, [readyEntries, fileMetadata, shootName]);

  const shootReady = shootMode === "select" ? !!selectedShootId : newShootName.trim().length > 0;
  const canSubmit = selectedIds.size > 0 && shootReady && readyEntries.length > 0;

  const handleSubmit = async () => {
    setErrors([]);

    const shootId =
      shootMode === "create"
        ? (
            await createShootMutation.mutateAsync({
              name: newShootName.trim(),
              shootDate: new Date(),
            })
          ).id
        : selectedShootId;

    const entries = readyEntries.map((m) => {
      const meta = fileMetadata[m.id];
      return {
        mediaId: m.id,
        shootId,
        package: packageValueOrDefault(meta).trim(),
        role: meta?.role ?? "",
        contentRating: contentRatingValueOrDefault(meta) as ContentRating,
      };
    });

    const result = await organizeMutation.mutateAsync(entries);

    if (result.errors && result.errors.length > 0) {
      setErrors(result.errors);
    }

    // Clear successfully organized files from selection
    if (result.results) {
      const successIds = new Set(result.results.map((r: { mediaId: string }) => r.mediaId));
      setSelectedIds((prev) => new Set([...prev].filter((id) => !successIds.has(id))));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div>Loading…</div>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">All files are organized</p>
          <p className="text-sm opacity-60">
            No unmanaged files found. Files added to the library root will appear here for organizing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {folderGroups.map((group) => {
          const folderIds = group.media.map((m) => m.id);
          const folderHasFiles = folderIds.length > 0;
          const allInFolderSelected =
            folderHasFiles && folderIds.every((id) => selectedIds.has(id));
          const someInFolderSelected =
            folderHasFiles && folderIds.some((id) => selectedIds.has(id));
          const folderSelectionIndeterminate = someInFolderSelected && !allInFolderSelected;

          return (
            <div key={group.folder} className="space-y-2 pb-4 last:pb-0">
              <div className="flex items-center gap-2">
                {folderHasFiles ? (
                  <input
                    ref={(el) => {
                      if (el) el.indeterminate = folderSelectionIndeterminate;
                    }}
                    type="checkbox"
                    checked={allInFolderSelected}
                    onChange={() => toggleFolderSelection(group)}
                    className="checkbox checkbox-sm"
                    aria-label={`Select all files in ${group.folder}`}
                  />
                ) : null}
                <h3 className="text-sm font-semibold opacity-70">{group.folder}</h3>
              </div>
              <div className="space-y-1">
                {group.media.map((media) => {
                const isSelected = selectedIds.has(media.id);
                const meta = fileMetadata[media.id] ?? {
                  package: DEFAULT_PACKAGE,
                  role: "",
                  contentRating: DEFAULT_CONTENT_RATING,
                };
                const ratingValue = contentRatingValueOrDefault(meta);

                  return (
                    <div key={media.id} className="rounded-lg p-2 hover:bg-base-200">
                      <div
                        className="flex cursor-pointer items-start gap-3"
                        onClick={() => toggleFile(media)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleFile(media)}
                          className="checkbox checkbox-sm mt-1"
                          aria-label={`Select ${media.name}`}
                        />
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-md">
                          <MediaTile
                            media={media}
                            index={mediaGlobalIndexById.get(media.id) ?? 0}
                            className="h-full w-full !border-0 bg-base-100 shadow-none"
                            withPreview
                          />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col gap-2">
                          <span className="text-sm break-all">{media.name}</span>
                          {isSelected ? (
                            <div
                              className="flex flex-wrap gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Input
                                value={meta.package ?? DEFAULT_PACKAGE}
                                onChange={(value) => updateMetadata(media.id, "package", value)}
                                placeholder="Package"
                                aria-label={`Package for ${media.name}`}
                                className="input-sm min-w-[6rem] flex-1"
                              />
                              <Input
                                value={meta.role}
                                onChange={(value) => updateMetadata(media.id, "role", value)}
                                placeholder="Role"
                                aria-label={`Role for ${media.name}`}
                                className="input-sm min-w-[6rem] flex-1"
                              />
                              <Select
                                value={ratingValue === "" ? CONTENT_RATING_UNSET : ratingValue}
                                onValueChange={(value) =>
                                  updateMetadata(
                                    media.id,
                                    "contentRating",
                                    value === CONTENT_RATING_UNSET ? "" : value,
                                  )
                                }
                                aria-label={`Content rating for ${media.name}`}
                              >
                                <SelectTrigger className="input-sm h-8 min-h-8 min-w-[13.5rem] flex-1 py-0">
                                  <SelectValue placeholder="Rating…" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={CONTENT_RATING_UNSET}>Rating…</SelectItem>
                                  {CONTENT_RATINGS.map((r) => (
                                    <SelectItem
                                      key={r.value}
                                      value={r.value}
                                      textValue={`${r.label} (${r.value})`}
                                    >
                                      {r.label} ({r.value})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 space-y-4">
        {previewEntries.length > 0 && (
          <div data-testid="preview-section" className="space-y-2">
            <h3 className="text-sm font-semibold">Preview</h3>
            <div className="rounded-lg bg-base-200 p-4 space-y-1">
              {previewEntries.map((entry) =>
                entry ? (
                  <div key={entry.mediaId} className="flex items-center gap-2 text-xs font-mono">
                    <span className="opacity-50">{entry.originalName}</span>
                    <span className="opacity-30">→</span>
                    <span>{entry.targetPath}</span>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="rounded-lg bg-error/10 p-4 space-y-1">
            {errors.map((err) => (
              <p key={err.mediaId} className="text-sm text-error">
                {err.error}
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xl">
            {shootMode === "select" ? (
              <>
                <div className="min-w-0 flex-1">
                  <Select
                    value={selectedShootId || SHOOT_SELECT_UNSET}
                    onValueChange={(value) =>
                      setSelectedShootId(value === SHOOT_SELECT_UNSET ? "" : value)
                    }
                    aria-label="Select shoot"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a shoot…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SHOOT_SELECT_UNSET}>Select a shoot…</SelectItem>
                      {shoots.map((shoot: { id: string; name: string }) => (
                        <SelectItem key={shoot.id} value={shoot.id}>
                          {shoot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-square shrink-0"
                  aria-label="New shoot"
                  onClick={() => setShootMode("create")}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </>
            ) : (
              <>
                <Input
                  value={newShootName}
                  onChange={setNewShootName}
                  placeholder="Shoot name…"
                  aria-label="Shoot name"
                  className="min-w-0 flex-1"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-square shrink-0"
                  aria-label="Select existing shoot"
                  onClick={() => setShootMode("select")}
                >
                  <List className="h-4 w-4" aria-hidden />
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary w-full shrink-0 sm:w-auto"
            disabled={!canSubmit || organizeMutation.isPending}
            onClick={handleSubmit}
          >
            {organizeMutation.isPending
              ? "Moving…"
              : `Move ${selectedIds.size} ${selectedIds.size === 1 ? "file" : "files"}`}
          </button>
        </div>
      </div>
    </div>
  );
};
