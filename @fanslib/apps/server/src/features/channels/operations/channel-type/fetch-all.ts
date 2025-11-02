import { db } from "../../../../lib/db";
import { ChannelType } from "../../entity";

export const fetchChannelTypes = async (): Promise<ChannelType[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ChannelType);
  return repository.find();
};

