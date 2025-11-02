import type { MediaFilters } from "../../../library/types";
import type {
  Channel,
  ChannelDefaultHashtagSelect,
  ChannelTypeSelect,
} from "../../channel";

export type CreateChannelRequest = {
  name: string;
  typeId: string;
  description?: string;
  eligibleMediaFilter?: MediaFilters;
};

export type CreateChannelResponse = Channel & {
  type: ChannelTypeSelect;
  defaultHashtags?: ChannelDefaultHashtagSelect[];
};

