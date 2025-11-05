import { Button } from "~/components/ui/Button";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";

type GalleryPaginationProps = {
  totalItems: number;
  totalPages: number;
};

export const GalleryPagination = ({ totalItems, totalPages }: GalleryPaginationProps) => {
  const { preferences, updatePreferences } = useLibraryPreferences();

  const currentPage = preferences.pagination.page;

  return (
    <div className="flex justify-between items-center mt-4 pt-4 flex-none">
      <div className="text-sm text-muted-foreground">
        {totalItems} items • Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updatePreferences({ pagination: { page: currentPage - 1 } })}
          isDisabled={currentPage <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updatePreferences({ pagination: { page: currentPage + 1 } })}
          isDisabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
