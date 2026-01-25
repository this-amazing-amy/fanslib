import { LibraryPreferencesProvider } from "~/contexts/LibraryPreferencesContext";
import { LibraryContent } from "~/features/library/components/LibraryContent";

const STORAGE_KEY = "unfilledSlotsLibraryPreferences";

export const UnfilledSlotsLibrary = () => (
  <LibraryPreferencesProvider storageKey={STORAGE_KEY}>
    <div className="h-full">
      <LibraryContent showScan={false} contentClassName="px-0 py-0" />
    </div>
  </LibraryPreferencesProvider>
);
