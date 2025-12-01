import { CheckCircle, Timer } from "lucide-react";
import { usePostFrequencyStatus } from "~/hooks/usePostFrequencyStatus";
import { cn } from "~/lib/cn";
import { POST_STATUS_COLORS } from "~/lib/colors";

type PostFrequencyStatusProps = {
  lastPostDate?: string | null;
  maxPostFrequencyHours?: number | null;
};

export const PostFrequencyStatus = ({
  lastPostDate,
  maxPostFrequencyHours = 24,
}: PostFrequencyStatusProps) => {
  const { canPost, timeLeft } = usePostFrequencyStatus(lastPostDate, maxPostFrequencyHours ?? undefined);
  const postedColors = POST_STATUS_COLORS.posted;
  const scheduledColors = POST_STATUS_COLORS.scheduled;

  return (
    <div className="flex items-center gap-2">
      {canPost ? (
        <CheckCircle
          className="h-4 w-4"
          style={{ color: postedColors.foreground }}
        />
      ) : (
        <div className="flex items-center gap-1">
          <Timer
            className="h-4 w-4"
            style={{ color: scheduledColors.foreground }}
          />
          <span
            className={cn("text-sm", !timeLeft && "text-base-content/60")}
            style={timeLeft ? { color: scheduledColors.foreground } : undefined}
          >
            {timeLeft || 'Calculating...'}
          </span>
        </div>
      )}
    </div>
  );
};
