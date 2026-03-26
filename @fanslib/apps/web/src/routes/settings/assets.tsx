import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImageIcon, Upload, Trash2, Pencil, Check, X } from "lucide-react";
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
  asset: { id: string; name: string; filename: string };
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
        <img
          src={`/api/assets/${asset.id}/file`}
          alt={asset.name}
          className="h-32 w-full rounded-lg object-contain bg-base-300"
        />
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
  const { data: assets = [] } = useAssetsQuery("image");
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
            Upload PNG images for use as watermarks and overlays
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,image/png"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button onPress={() => fileInputRef.current?.click()} isDisabled={uploadMutation.isPending}>
            <Upload className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? "Uploading..." : "Upload PNG"}
          </Button>
        </div>
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
