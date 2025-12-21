import { X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { cn } from "~/lib/cn";
import { StatusFilterDropdown } from "./StatusFilterDropdown";
import { ChannelFilterDropdown } from "./ChannelFilterDropdown";
import type { PostFilterItem } from "./PostFiltersContext";

type PostFilterItemRendererProps = {
  item: PostFilterItem;
  onChange: (item: PostFilterItem) => void;
  onRemove: () => void;
};

export const PostFilterItemRenderer = ({
  item,
  onChange,
  onRemove,
}: PostFilterItemRendererProps) => {
  const renderContent = () => {
    switch (item.type) {
      case "search":
        return (
          <Input
            value={item.value}
            onChange={(value) => onChange({ type: "search", value })}
            placeholder="Search posts..."
            className="min-w-[200px]"
          />
        );

      case "status":
        return (
          <StatusFilterDropdown
            value={item.value}
            onChange={(value) => onChange({ type: "status", value })}
          />
        );

      case "channel":
        return (
          <ChannelFilterDropdown
            value={item.value}
            onChange={(value) => onChange({ type: "channel", value })}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="group relative flex items-center gap-1">
      {renderContent()}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 flex-shrink-0 rounded-full bg-base-100 hover:bg-error hover:text-error-content",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all",
          "border-0 hover:border-0 focus:border-0",
          "ring-0 hover:ring-0 focus:ring-0",
          "absolute top-1/2 -translate-y-1/2 left-[150px]"
        )}
        onPress={onRemove}
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

