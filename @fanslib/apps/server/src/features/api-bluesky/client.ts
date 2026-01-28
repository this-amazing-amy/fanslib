import { BskyAgent } from "@atproto/api";
import { loadSettings } from "../settings/operations/setting/load";

type SessionCache = {
  agent: BskyAgent;
  expiresAt: number;
};

const sessionCache = { value: null as SessionCache | null };

const SESSION_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

const getOrCreateAgent = async (): Promise<BskyAgent> => {
  const now = Date.now();

  if (sessionCache.value && sessionCache.value.expiresAt > now) {
    return sessionCache.value.agent;
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

  sessionCache.value = {
    agent,
    expiresAt,
  };

  return agent;
};

export const getBlueskyAgent = async (): Promise<BskyAgent> => {
  try {
    return await getOrCreateAgent();
  } catch (error) {
    sessionCache.value = null;
    throw error;
  }
};

export const clearSessionCache = (): void => {
  sessionCache.value = null;
};
