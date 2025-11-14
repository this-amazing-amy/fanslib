import type { SVGProps } from "react";
import { CHANNEL_TYPES } from "@fanslib/server/constants";
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
} from "~/components/icons";
import { cn } from "~/lib/cn";

type ChannelTypeIconProps = {
  typeId: string;
  className?: string;
} & SVGProps<SVGSVGElement>;

const ICON_MAP: Record<string, (props: SVGProps<SVGSVGElement>) => JSX.Element> = {
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

export const ChannelTypeIcon = ({ typeId, className, ...props }: ChannelTypeIconProps) => {
  const Icon = ICON_MAP[typeId];
  const channelType = CHANNEL_TYPES[typeId as keyof typeof CHANNEL_TYPES];

  if (!Icon) return null;

  return (
    <Icon
      className={cn("w-5 h-5", className)}
      style={{ color: channelType?.color }}
      {...props}
    />
  );
};
