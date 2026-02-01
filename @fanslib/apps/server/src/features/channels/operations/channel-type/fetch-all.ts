import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelType, ChannelTypeSchema } from "../../entity";

export const FetchChannelTypesResponseSchema = z.array(ChannelTypeSchema);

export const fetchChannelTypes = async (): Promise<ChannelType[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ChannelType);
  return repository.find();
};
