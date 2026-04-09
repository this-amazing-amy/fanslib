import { useEffect, useState } from "react";
import type { ExportRegion } from "~/stores/editorStore";

type ExportRegionMetadataProps = {
  region: ExportRegion;
  onUpdate: (updates: Partial<ExportRegion>) => void;
  showHeader?: boolean;
};

export const ExportRegionMetadata = ({
  region,
  onUpdate,
  showHeader = true,
}: ExportRegionMetadataProps) => {
  const [pkg, setPkg] = useState(region.package ?? "");
  const [role, setRole] = useState(region.role ?? "");
  const [contentRating, setContentRating] = useState(region.contentRating ?? "sg");
  const [quality, setQuality] = useState(region.quality ?? "pretty");

  // Sync local state when region props change (e.g., after undo/redo)
  useEffect(() => {
    setPkg(region.package ?? "");
    setRole(region.role ?? "");
    setContentRating(region.contentRating ?? "sg");
    setQuality(region.quality ?? "pretty");
  }, [region.id, region.package, region.role, region.contentRating, region.quality]);

  return (
    <div className="flex flex-col gap-3">
      {showHeader && (
        <h4 className="text-sm font-semibold text-base-content/80">
          Region: {region.startFrame}&ndash;{region.endFrame}
        </h4>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-base-content/70">Package</span>
        <input
          type="text"
          aria-label="Package"
          className="input input-bordered input-sm w-full"
          value={pkg}
          onChange={(e) => setPkg(e.target.value)}
          onBlur={() => onUpdate({ package: pkg })}
          placeholder="e.g. premium, free"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-base-content/70">Role</span>
        <input
          type="text"
          aria-label="Role"
          className="input input-bordered input-sm w-full"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onBlur={() => onUpdate({ role })}
          placeholder="e.g. main, alt"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-base-content/70">Content Rating</span>
        <select
          aria-label="Content Rating"
          className="select select-bordered select-sm w-full"
          value={contentRating}
          onChange={(e) => {
            setContentRating(e.target.value);
            onUpdate({ contentRating: e.target.value });
          }}
        >
          <option value="sf">SF - Safe</option>
          <option value="sg">SG - Suggestive</option>
          <option value="cn">CN - Cautionary Nudity</option>
          <option value="uc">UC - Uncensored</option>
          <option value="xt">XT - Explicit</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-base-content/70">Quality</span>
        <select
          aria-label="Quality"
          className="select select-bordered select-sm w-full"
          value={quality}
          onChange={(e) => {
            setQuality(e.target.value);
            onUpdate({ quality: e.target.value });
          }}
        >
          <option value="fast">Fast</option>
          <option value="pretty">Pretty</option>
        </select>
      </label>
    </div>
  );
};
