import type { UpdateSnippetRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { CaptionSnippet } from "../../entity";

export const updateSnippet = async (
  id: string,
  data: UpdateSnippetRequest
): Promise<CaptionSnippet> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);

  const snippet = await repo.findOneOrFail({ where: { id } });

  if (data.name && data.name !== snippet.name) {
    const existing = await repo.findOne({
      where: {
        name: data.name,
        channelId: data.channelId ?? snippet.channelId,
      },
    });

    if (existing && existing.id !== id) {
      throw new Error(
        data.channelId !== undefined
          ? "A snippet with this name already exists for this channel"
          : "A global snippet with this name already exists"
      );
    }
  }

  Object.assign(snippet, data);
  return repo.save(snippet);
};

