import { Link } from "@tanstack/react-router";
import { Edit3, Plus, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useMediaEditsBySourceQuery } from "~/lib/queries/media-edits";

const statusConfig = {
  draft: { icon: Edit3, label: "Draft", color: "text-base-content/50" },
  queued: { icon: Clock, label: "Queued", color: "text-warning" },
  rendering: { icon: Loader2, label: "Rendering", color: "text-info" },
  completed: { icon: CheckCircle2, label: "Completed", color: "text-success" },
  failed: { icon: XCircle, label: "Failed", color: "text-error" },
} as const;

type MediaEditsSectionProps = {
  mediaId: string;
};

export const MediaEditsSection = ({ mediaId }: MediaEditsSectionProps) => {
  const { data: edits = [] } = useMediaEditsBySourceQuery(mediaId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Edits</h3>
        <Link to="/library/$mediaId/edit" params={{ mediaId }}>
          <Button variant="primary" size="icon">
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      {edits.length === 0 ? (
        <p className="text-sm text-base-content/40">No edits yet</p>
      ) : (
        <div className="space-y-2">
          {edits.map((edit) => {
            const config = statusConfig[edit.status];
            const StatusIcon = config.icon;
            return (
              <Link
                key={edit.id}
                to="/library/$mediaId/edit/$editId"
                params={{ mediaId, editId: edit.id }}
                className="flex items-center gap-3 p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
              >
                <StatusIcon className={`h-4 w-4 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium capitalize">{edit.type}</span>
                  <span className="text-xs text-base-content/50 ml-2">
                    {edit.operations.length} operation{edit.operations.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className={`text-xs ${config.color}`}>{config.label}</span>
                <span className="text-xs text-base-content/40">
                  {new Date(edit.createdAt).toLocaleDateString()}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
