import type { CaptionSnippet } from "./entity";

export type CaptionSnippetFixture = Omit<CaptionSnippet, "createdAt" | "updatedAt" | "channel">;

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
