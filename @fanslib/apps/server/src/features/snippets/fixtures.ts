import type { CaptionSnippet } from "@fanslib/types";
import { getTestDataSource } from "../../lib/db.test";
import type { Channel } from "../channels/entity";
import { CaptionSnippet as CaptionSnippetEntity } from "./entity";

export type CaptionSnippetFixture = Omit<CaptionSnippet, "createdAt" | "updatedAt">;

export const CAPTION_SNIPPET_FIXTURES: CaptionSnippetFixture[] = [
  {
    id: "snippet-1",
    name: "Welcome Message",
    content: "Welcome to my channel! Thanks for your support!",
  },
  {
    id: "snippet-2",
    name: "Global Greeting",
    content: "Hello everyone!",
  },
  {
    id: "snippet-3",
    name: "Channel Specific",
    content: "This is specific to channel 1",
    channelId: "channel-1",
  },
];

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

