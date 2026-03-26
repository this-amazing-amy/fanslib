import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImageIcon, Upload, Trash2, Pencil, Check, X, Music } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import {
  useAssetsQuery,
  useUploadAssetMutation,
  useRenameAssetMutation,
  useDeleteAssetMutation,
} from "~/lib/queries/assets";
import { DeleteConfirmDialog } from "~/components/ui/DeleteConfirmDialog";

const AssetCard = ({
  asset,
}: {
  asset: { id: string; name: string; filename: string; type: "image" | "audio" };
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(asset.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const renameMutation = useRenameAssetMutation();
  const deleteMutation = useDeleteAssetMutation();

  const handleRename = () => {
    if (editName.trim() && editName !== asset.name) {
      renameMutation.mutate({ id: asset.id, name: editName.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className="card bg-base-200 shadow-sm">
      <figure className="px-4 pt-4">
        {asset.type === "audio" ? (
          <div className="h-32 w-full rounded-lg bg-base-300 flex flex-col items-center justify-center gap-2">
            <Music className="h-8 w-8 text-base-content/30" />
            <audio controls preload="none" className="w-full px-2">
              <source src={`/api/assets/${asset.id}/file`} />
            </audio>
          </div>
        ) : (
          <img
            src={`/api/assets/${asset.id}/file`}
            alt={asset.name}
            className="h-32 w-full rounded-lg object-contain bg-base-300"
          />
        )}
      </figure>
      <div className="card-body p-4 pt-2">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              value={editName}
              onChange={setEditName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onPress={handleRename}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onPress={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{asset.name}</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  setEditName(asset.name);
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onPress={() => setDeleteOpen(true)}>
                <Trash2 className="h-3 w-3 text-error" />
              </Button>
              <DeleteConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete Asset"
                description={`Are you sure you want to delete "${asset.name}"? This cannot be undone.`}
                onConfirm={() => deleteMutation.mutate(asset.id)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AssetsSettings = () => {
  const [typeFilter, setTypeFilter] = useState<"image" | "audio" | undefined>(undefined);
  const { data: assets = [] } = useAssetsQuery(typeFilter);
  const uploadMutation = useUploadAssetMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.replace(/\.[^.]+$/, "");
    uploadMutation.mutate({ file, name });

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ImageIcon /> Asset Library
          </h1>
          <p className="text-base-content/60">
            Upload images and audio for watermarks, overlays, and music tracks
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,image/png,.mp3,audio/mpeg,.wav,audio/wav,.aac,audio/aac,.m4a"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button onPress={() => fileInputRef.current?.click()} isDisabled={uploadMutation.isPending}>
            <Upload className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "image", "audio"] as const).map((t) => (
          <button
            key={t}
            className={`px-3 py-1 rounded-full text-sm ${
              (t === "all" ? typeFilter === undefined : typeFilter === t)
                ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content/60 hover:bg-base-300"
            }`}
            onClick={() => setTypeFilter(t === "all" ? undefined : t)}
          >
            {t === "all" ? "All" : t === "image" ? "Images" : "Audio"}
          </button>
        ))}
      </div>

      {uploadMutation.isError && (
        <div className="alert alert-error text-sm">{uploadMutation.error.message}</div>
      )}

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
          <ImageIcon className="mb-4 h-12 w-12" />
          <p>No assets uploaded yet</p>
          <p className="text-sm">Upload a PNG file to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute("/settings/assets")({
  component: AssetsSettings,
});
