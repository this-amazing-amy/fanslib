import type { ReactNode } from "react";
import { useState } from "react";
import { PageContainer } from "~/components/ui/PageContainer/PageContainer";
import { cn } from "~/lib/cn";
import { ActiveFypPostsPage } from "~/features/analytics/components/ActiveFypPostsPage";
import {
  FypAnalyticsSortSelect,
  type FypAnalyticsSortBy,
} from "~/features/analytics/components/FypAnalyticsSortSelect";
import { QueueStatusBar } from "~/features/analytics/components/QueueStatusBar";
import { RepostCandidatesPage } from "~/features/analytics/components/RepostCandidatesPage";

const scrollPanelMaxClass = "max-h-[calc(100dvh-13rem)]";

const FypScrollPanel = ({ children }: { children: ReactNode }) => (
  <div className={cn("relative min-h-0", scrollPanelMaxClass)}>
    <div
      className={cn(
        scrollPanelMaxClass,
        "overflow-y-auto overscroll-contain pb-24",
        "[scrollbar-gutter:stable]",
      )}
    >
      {children}
    </div>
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-14 bg-gradient-to-t from-base-100 via-base-100/70 to-transparent"
      aria-hidden
    />
  </div>
);

const defaultSort: FypAnalyticsSortBy = "engagementSeconds";

export const FanslyFypRoute = () => {
  const [sortBy, setSortBy] = useState<FypAnalyticsSortBy>(defaultSort);

  return (
    <PageContainer>
      <div className="mb-6 flex w-full justify-end">
        <FypAnalyticsSortSelect value={sortBy} onChange={setSortBy} />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <section className="min-w-0 flex flex-col gap-4">
          <h2 className="text-lg font-semibold shrink-0">Repostables</h2>
          <FypScrollPanel>
            <RepostCandidatesPage sortBy={sortBy} />
          </FypScrollPanel>
        </section>
        <section className="min-w-0 flex flex-col gap-4">
          <h2 className="text-lg font-semibold shrink-0">Poor Performers</h2>
          <FypScrollPanel>
            <ActiveFypPostsPage sortBy={sortBy} />
          </FypScrollPanel>
        </section>
      </div>
      <QueueStatusBar />
    </PageContainer>
  );
};
