import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useMediaEditQueueQuery } from "~/lib/queries/media-edits";
import { RenderQueueDrawer } from "./RenderQueueDrawer";

export const RenderQueueBadge = () => {
  const { data: queueItems = [] } = useMediaEditQueueQuery();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount = queueItems.filter(
    (i) => i.status === "rendering" || i.status === "queued",
  ).length;

  if (activeCount === 0) return null;

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onPress={() => setDrawerOpen(true)}
        aria-label={`Render queue: ${activeCount} active`}
      >
        <div className="relative">
          <Clapperboard className="h-4 w-4" />
          <span className="absolute -top-1.5 -right-1.5 bg-info text-info-content text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {activeCount}
          </span>
        </div>
      </Button>

      <RenderQueueDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
};
