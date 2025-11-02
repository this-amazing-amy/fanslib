import type { CaptionSnippet } from "../../snippet";

export type CreateSnippetRequest = {
  name: string;
  content: string;
  channelId?: string;
};

export type CreateSnippetResponse = CaptionSnippet;

