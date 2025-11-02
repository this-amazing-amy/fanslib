import type { Channel, ChannelDefaultHashtagSelect, ChannelTypeSelect } from "../../channel";

export type UpdateChannelRequest = Partial<Omit<Channel, "id" | "type">>;

export type UpdateChannelResponse = (Channel & {
  type: ChannelTypeSelect;
  defaultHashtags?: ChannelDefaultHashtagSelect[];
}) | null;

