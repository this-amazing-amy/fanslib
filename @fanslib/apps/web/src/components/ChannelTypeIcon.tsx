import type { SVGProps } from "react";
import { CHANNEL_TYPES, type ChannelTypeId } from "~/lib/channel-types";
import { cn } from "~/lib/cn";
import {
    BlueSkyIcon,
    Clips4SaleIcon,
    FanslyIcon,
    InstagramIcon,
    ManyVidsIcon,
    OnlyFansIcon,
    RedditIcon,
    RedGifsIcon,
    XIcon,
} from "./icons";

const CHANNEL_ICONS: Record<string, React.ComponentType<SVGProps<SVGSVGElement>>> = {
  onlyfans: OnlyFansIcon,
  fansly: FanslyIcon,
  manyvids: ManyVidsIcon,
  instagram: InstagramIcon,
  bluesky: BlueSkyIcon,
  x: XIcon,
  reddit: RedditIcon,
  clips4sale: Clips4SaleIcon,
  redgifs: RedGifsIcon,
};

export type ChannelTypeIconProps = {
  typeId: ChannelTypeId;
  color?: string;
  className?: string;
};

export const ChannelTypeIcon = ({ typeId, color, className }: ChannelTypeIconProps) => {
  // Safety check for undefined typeId
  if (!typeId) {
    return null;
  }
  
  const channelType = CHANNEL_TYPES[typeId];
  
  // Safety check for missing channel type
  if (!channelType) {
    return null;
  }
  
  const Icon = CHANNEL_ICONS[channelType.id];

  if (!Icon) {
    return null;
  }

  return (
    <div className={cn("w-8 h-8", className)} style={{ color: color ?? channelType.color }}>
      <Icon className="w-full h-full" />
    </div>
  );
};

