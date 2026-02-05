import { memo, useRef } from "react";
import { FilterPresetProvider } from "~/contexts/FilterPresetContext";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { PostDragProvider } from "~/contexts/PostDragContext";
import { MediaFiltersProvider } from "~/features/library/components/MediaFilters/MediaFiltersContext";
import { InlinePickerProvider, useInlinePickerActions, useInlinePickerState } from "../contexts/InlinePickerContext";
import { FloatingVirtualPostCard } from "./FloatingVirtualPostCard";
import { PlanContent } from "./PlanContent";
import { PlanLibraryPanel } from "./PlanLibraryPanel";
import { PickerPanel } from "./PostCalendar/PickerPanel";

// Memoized to prevent re-renders from parent state changes
const MemoizedPlanContent = memo(PlanContent);

// Isolated component for the picker panel that needs state
const PickerPanelContainer = () => {
  const { state } = useInlinePickerState();
  const { closePicker, setFilters } = useInlinePickerActions();
  
  return (
    <MediaFiltersProvider value={state.filters} onChange={setFilters}>
      <FilterPresetProvider onFiltersChange={setFilters}>
        <div className="min-[1600px]:hidden">
          <PickerPanel
            virtualPost={state.virtualPost}
            isOpen={state.isOpen}
            onClose={closePicker}
          />
        </div>
      </FilterPresetProvider>
    </MediaFiltersProvider>
  );
};

const PlanPageInner = () => {
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="h-full grid grid-cols-[1fr] min-[1600px]:grid-cols-[2fr_1fr] overflow-hidden pt-4 sm:pt-6 lg:pt-8 pr-4 sm:pr-6 lg:pr-8">
        <div ref={calendarContainerRef} className="relative min-h-0 overflow-hidden">
          <MemoizedPlanContent />
        </div>
        <div className="hidden min-[1600px]:flex min-[1600px]:flex-col h-full border-l border-base-200">
          <PlanLibraryPanel />
        </div>
      </div>
      <PickerPanelContainer />
      <FloatingVirtualPostCard calendarContainerRef={calendarContainerRef} />
    </>
  );
};

export const PlanPage = () => (
  <MediaDragProvider>
    <PostDragProvider>
      <InlinePickerProvider>
        <PlanPageInner />
      </InlinePickerProvider>
    </PostDragProvider>
  </MediaDragProvider>
);

