import { PageHeader } from "~/components/ui/PageHeader";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { PostDragProvider } from "~/contexts/PostDragContext";
import { PlanContent } from "./PlanContent";

export const PlanPage = () => (
  <MediaDragProvider>
    <PostDragProvider>
      <div className="h-full w-full overflow-hidden flex flex-col">
        <PageHeader
          title="Plan"
          className="py-6 pl-6 pr-4 flex-none"
        />
        <PlanContent />
      </div>
    </PostDragProvider>
  </MediaDragProvider>
);

