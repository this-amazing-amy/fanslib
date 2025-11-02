import type { CreateSnippetRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { CaptionSnippet } from "../../entity";

export const createSnippet = async (data: CreateSnippetRequest): Promise<CaptionSnippet> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);

  const existing = await repo.findOne({
    where: {
      name: data.name,
      channelId: data.channelId ?? undefined,
    },
  });

  if (existing) {
    throw new Error(
      data.channelId
        ? "A snippet with this name already exists for this channel"
        : "A global snippet with this name already exists"
    );
  }

  const snippet = repo.create(data);
  return repo.save(snippet);
};

