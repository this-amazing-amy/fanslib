import { getTestDataSource } from "../../lib/test-db";
import type { Channel } from "../channels/entity";
import { CaptionSnippet as CaptionSnippetEntity } from "./entity";
import { CAPTION_SNIPPET_FIXTURES } from "./fixtures-data";

export { CAPTION_SNIPPET_FIXTURES } from "./fixtures-data";

export const seedSnippetFixtures = async (channels: Channel[]) => {
  const dataSource = getTestDataSource();
  const snippetRepo = dataSource.getRepository(CaptionSnippetEntity);

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of CAPTION_SNIPPET_FIXTURES) {
    const existing = await snippetRepo.findOne({ where: { id: fixture.id } });
    if (!existing) {
      const channel = fixture.channelId
        ? channels.find((c) => c.id === fixture.channelId)
        : undefined;

      const snippet = snippetRepo.create({
        id: fixture.id,
        name: fixture.name,
        content: fixture.content,
        channelId: fixture.channelId,
        channel,
      });
      await snippetRepo.save(snippet);
    }
  }

  return await snippetRepo.find({
    relations: { channel: true },
  });
};

