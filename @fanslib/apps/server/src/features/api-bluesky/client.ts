import { BskyAgent } from "@atproto/api";
import { loadSettings } from "../settings/operations/setting/load";

type SessionCache = {
  agent: BskyAgent;
  expiresAt: number;
};

let sessionCache: SessionCache | null = null;

const SESSION_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

const getOrCreateAgent = async (): Promise<BskyAgent> => {
  const now = Date.now();

  if (sessionCache && sessionCache.expiresAt > now) {
    return sessionCache.agent;
  }

  const settings = await loadSettings();

  if (!settings.blueskyUsername || !settings.blueskyAppPassword) {
    throw new Error("Bluesky credentials not configured. Please set blueskyUsername and blueskyAppPassword in settings.");
  }

  const agent = new BskyAgent({
    service: "https://bsky.social",
  });

  await agent.login({
    identifier: settings.blueskyUsername,
    password: settings.blueskyAppPassword,
  });

  const expiresAt = now + (120 * 60 * 1000) - SESSION_EXPIRY_BUFFER_MS;

  sessionCache = {
    agent,
    expiresAt,
  };

  return agent;
};

export const getBlueskyAgent = async (): Promise<BskyAgent> => {
  try {
    return await getOrCreateAgent();
  } catch (error) {
    sessionCache = null;
    throw error;
  }
};

export const clearSessionCache = (): void => {
  sessionCache = null;
};
