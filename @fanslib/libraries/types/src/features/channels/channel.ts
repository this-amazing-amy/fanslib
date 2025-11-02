import type { Hashtag } from "../hashtags/hashtag";
import type { MediaFilters } from "../library/types";

export type ChannelType = {
  id: string;
  name: string;
  color?: string;
};

export type Channel = {
  id: string;
  name: string;
  description?: string;
  typeId: string;
  eligibleMediaFilter?: MediaFilters;
};

export type ChannelWithoutRelations = Omit<Channel, "type">;

export type ChannelTypeSelect = Pick<ChannelType, "id" | "name" | "color">;

export type ChannelDefaultHashtagSelect = Pick<Hashtag, "id" | "name">;

