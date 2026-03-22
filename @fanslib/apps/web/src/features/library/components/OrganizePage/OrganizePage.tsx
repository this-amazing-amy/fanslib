import { useState, useMemo } from "react";
import { useUnmanagedMediaQuery, useOrganizeMutation } from "~/lib/queries/organize";
import { useShootsQuery, useCreateShootMutation } from "~/lib/queries/shoots";
import { getMediaThumbnailUrl } from "~/lib/media-urls";

type MediaItem = {
  id: string;
  name: string;
  type: string;
  relativePath: string;
};

type FolderGroup = {
  folder: string;
  media: MediaItem[];
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
];

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

  const toggleFile = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateMetadata = (mediaId: string, field: keyof FileMetadata, value: string) => {
    setFileMetadata((prev) => ({
      ...prev,
      [mediaId]: {
        ...prev[mediaId],
        package: prev[mediaId]?.package ?? "",
        role: prev[mediaId]?.role ?? "",
        contentRating: prev[mediaId]?.contentRating ?? "",
        [field]: value,
      },
    }));
  };

  // Resolve the shoot name for preview
  const shootName = useMemo(() => {
    if (shootMode === "create") return newShootName;
    const selected = shoots.find((s: { id: string; name: string }) => s.id === selectedShootId);
    return selected?.name ?? "";
  }, [shootMode, newShootName, selectedShootId, shoots]);

  // Build preview entries for all selected files
  const allMedia = useMemo(() => {
    if (!groups) return [];
    return (groups as FolderGroup[]).flatMap((g) => g.media);
  }, [groups]);

  // Files that are fully ready to submit (selected + all metadata filled)
  const readyEntries = useMemo(
    () =>
      allMedia
        .filter((m) => selectedIds.has(m.id))
        .filter((m) => {
          const meta = fileMetadata[m.id];
          return meta?.package && meta?.role && meta?.contentRating;
        }),
    [allMedia, selectedIds, fileMetadata],
  );

  const previewEntries = useMemo(() => {
    if (!shootName) return [];
    return readyEntries
      .map((m) => {
        const meta = fileMetadata[m.id];
        if (!meta?.package || !meta?.role || !meta?.contentRating) return null;
        const ext = getExtension(m.name);
        return {
          mediaId: m.id,
          originalName: m.name,
          targetPath: buildPreviewPath(shootName, meta.package, meta.role, meta.contentRating, ext),
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
        package: meta.package,
        role: meta.role,
        contentRating: meta.contentRating as ContentRating,
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
    return <div>Loading…</div>;
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
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
    <div className="flex flex-col gap-6 p-6">
      {/* Shoot selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">
            {shootMode === "select" ? "Shoot" : "New Shoot"}
          </label>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setShootMode((m) => (m === "select" ? "create" : "select"))}
          >
            {shootMode === "select" ? "New shoot" : "Select existing"}
          </button>
        </div>

        {shootMode === "select" ? (
          <select
            value={selectedShootId}
            onChange={(e) => setSelectedShootId(e.target.value)}
            className="select select-bordered w-full"
            aria-label="Select shoot"
          >
            <option value="">Select a shoot…</option>
            {shoots.map((shoot: { id: string; name: string }) => (
              <option key={shoot.id} value={shoot.id}>
                {shoot.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={newShootName}
            onChange={(e) => setNewShootName(e.target.value)}
            placeholder="Shoot name…"
            className="input input-bordered w-full"
            aria-label="Shoot name"
          />
        )}
      </div>

      {/* File groups */}
      {(groups as FolderGroup[]).map((group) => (
        <div key={group.folder} className="space-y-2">
          <h3 className="text-sm font-semibold opacity-70">{group.folder}</h3>
          <div className="space-y-1">
            {group.media.map((media) => {
              const isSelected = selectedIds.has(media.id);
              const meta = fileMetadata[media.id] ?? { package: "", role: "", contentRating: "" };

              return (
                <div key={media.id} className="space-y-2 rounded-lg p-2 hover:bg-base-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFile(media.id)}
                      className="checkbox checkbox-sm"
                      aria-label={`Select ${media.name}`}
                    />
                    <img
                      src={getMediaThumbnailUrl(media.id)}
                      alt={media.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <span className="text-sm">{media.name}</span>
                  </div>

                  {isSelected && (
                    <div className="ml-8 flex gap-2">
                      <input
                        value={meta.package}
                        onChange={(e) => updateMetadata(media.id, "package", e.target.value)}
                        placeholder="Package"
                        className="input input-bordered input-sm flex-1"
                        aria-label={`Package for ${media.name}`}
                      />
                      <input
                        value={meta.role}
                        onChange={(e) => updateMetadata(media.id, "role", e.target.value)}
                        placeholder="Role"
                        className="input input-bordered input-sm flex-1"
                        aria-label={`Role for ${media.name}`}
                      />
                      <select
                        value={meta.contentRating}
                        onChange={(e) => updateMetadata(media.id, "contentRating", e.target.value)}
                        className="select select-bordered select-sm flex-1"
                        aria-label={`Content rating for ${media.name}`}
                      >
                        <option value="">Rating…</option>
                        {CONTENT_RATINGS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label} ({r.value})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Live preview */}
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

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-error/10 p-4 space-y-1">
          {errors.map((err) => (
            <p key={err.mediaId} className="text-sm text-error">
              {err.error}
            </p>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        className="btn btn-primary"
        disabled={!canSubmit || organizeMutation.isPending}
        onClick={handleSubmit}
      >
        {organizeMutation.isPending
          ? "Moving…"
          : `Move ${selectedIds.size} ${selectedIds.size === 1 ? "file" : "files"}`}
      </button>
    </div>
  );
};
