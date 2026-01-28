import { PageContainer } from "~/components/ui/PageContainer";
import { LibraryContent } from "./LibraryContent";

export const Library = () => (
  <PageContainer className="flex h-full w-full flex-col overflow-hidden px-0 py-0">
    <LibraryContent />
  </PageContainer>
);
