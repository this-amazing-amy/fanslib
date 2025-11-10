import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelType, ChannelTypeSchema } from "../../entity";

export const FetchChannelTypesResponseSchema = t.Array(ChannelTypeSchema);

export const fetchChannelTypes = async (): Promise<ChannelType[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ChannelType);
  return repository.find();
};

