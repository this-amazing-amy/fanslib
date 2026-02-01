import { CheckCircle2, FileX } from "lucide-react";
import type { AssignMediaResponse, AssignMediaResponseSchema } from '@fanslib/server/schemas';

type AssignmentResultsProps = {
  result: AssignMediaResponse;
};

export const AssignmentResults = ({ result }: AssignmentResultsProps) => {
  const draftsWithoutMedia = result.unfilled.filter((slot) => slot.reason === "no_eligible_media").length;

  return (
    <div className="p-4">
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center p-3 bg-green-100 dark:bg-green-900/20 rounded-lg flex-1 max-w-xs">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mb-1" />
          <div className="text-sm font-semibold text-green-700 dark:text-green-300 text-center">
            {result.created} drafts created
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex-1 max-w-xs">
          <FileX className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-1" />
          <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 text-center">
            {draftsWithoutMedia} drafts without media
          </div>
        </div>
      </div>
    </div>
  );
};
