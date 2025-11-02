import type { CaptionSnippet } from "../../snippet";

export type UpdateSnippetRequest = {
  name?: string;
  content?: string;
  channelId?: string;
};

export type UpdateSnippetResponse = CaptionSnippet;

