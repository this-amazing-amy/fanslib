import type { Key } from "@react-types/shared";
import { format } from "date-fns";
import { ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";

type CaptionItemHeaderProps = {
  postId: string;
  date: string | Date;
  channel: { name: string; id: string; typeId: string; type?: { id: string } } | undefined;
  channelName: string;
  schedule: { name: string; emoji: string | null; color: string | null } | null | undefined;
  onExpand: () => void;
  onMenuAction: (key: Key) => void;
};

export const CaptionItemHeader = ({
  postId,
  date,
  channel,
  channelName,
  schedule,
  onExpand,
  onMenuAction,
}: CaptionItemHeaderProps) => (
  <>
    <div className="absolute top-3 right-3 flex items-center gap-2">
      <Link
        to="/posts/$postId"
        params={{ postId }}
        className="text-base-content/60 hover:text-base-content transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="w-4 h-4" />
      </Link>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-base-content/60 hover:text-base-content hover:bg-base-200"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
        <DropdownMenuPopover placement="bottom end" className="w-48">
          <DropdownMenu onAction={onMenuAction}>
            <DropdownMenuItem
              id="delete"
              className="flex items-center gap-2 text-sm font-medium text-destructive"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete Post
            </DropdownMenuItem>
          </DropdownMenu>
        </DropdownMenuPopover>
      </DropdownMenuTrigger>
    </div>
    <button
      type="button"
      onClick={onExpand}
      className="w-full text-left px-4 py-3 flex items-center gap-3"
    >
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold">
            {format(new Date(date), "EEE, MMM d")}
          </span>
          <span className="text-sm font-medium text-base-content/60">
            {format(new Date(date), "HH:mm")}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {schedule && (
            <ContentScheduleBadge
              name={schedule.name}
              emoji={schedule.emoji}
              color={schedule.color}
              size="sm"
              borderStyle="none"
              responsive={false}
            />
          )}
          {channel && (
            <ChannelBadge
              name={channelName}
              typeId={channel.type?.id ?? channel.typeId}
              size="sm"
              borderStyle="none"
              responsive={false}
            />
          )}
        </div>
      </div>
    </button>
  </>
);
