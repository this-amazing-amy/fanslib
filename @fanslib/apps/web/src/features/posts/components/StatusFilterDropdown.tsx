import type { PostStatus } from '@fanslib/server/schemas';
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { cn } from "~/lib/cn";
import { StatusBadge } from "~/components/StatusBadge";


const STATUS_OPTIONS: PostStatus[] = ["draft", "ready", "scheduled", "posted"];

type StatusFilterDropdownProps = {
  value?: PostStatus[];
  onChange: (statuses: PostStatus[]) => void;
};

export const StatusFilterDropdown = ({ value = [], onChange }: StatusFilterDropdownProps) => {

  const handleToggleStatus = (status: PostStatus) => {
    if (value.includes(status)) {
      onChange(value.filter((s) => s !== status));
    } else {
      onChange([...value, status]);
    }
  };

  const selectedStatuses = value;

  return (
    <DropdownMenuTrigger>
      <Button
        variant="outline"
        className="w-full justify-between min-w-[200px]"
      >
        {selectedStatuses.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {selectedStatuses.map((status) => (
              <StatusBadge
                key={status}
                size="sm"
                status={status}
                selected={true}
                selectable={false}
                responsive={false}
              />
            ))}
          </div>
        ) : (
          <span className="text-base-content">Select statuses...</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <DropdownMenuPopover placement="bottom start" className="w-[min(300px,100vw-32px)]">
        <DropdownMenu onAction={(key) => handleToggleStatus(key as PostStatus)}>
          {STATUS_OPTIONS.map((status) => (
                <DropdownMenuItem key={status} id={status} className="flex items-center gap-2">
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value.includes(status) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <StatusBadge
                    size="md"
                    status={status}
                    selected={value.includes(status)}
                    selectable={false}
                    responsive={false}
                  />
                </DropdownMenuItem>
              ))}
        </DropdownMenu>
      </DropdownMenuPopover>
    </DropdownMenuTrigger>
  );
};
