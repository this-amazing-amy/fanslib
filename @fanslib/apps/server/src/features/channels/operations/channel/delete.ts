import { db } from "../../../../lib/db";
import { Channel } from "../../entity";

export const deleteChannel = async (id: string): Promise<void> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);
  await repository.delete({ id });
};

