import { loadFanslyCredentials } from "./load";

const HOURS_24 = 24 * 60 * 60 * 1000;
const HOURS_72 = 72 * 60 * 60 * 1000;

export type CredentialStatus = "green" | "yellow" | "red";

export type CredentialStatusResponse = {
  status: CredentialStatus;
  stale: boolean;
  lastUpdated: number | null;
};

export const getCredentialStatus = async (): Promise<CredentialStatusResponse> => {
  const data = await loadFanslyCredentials();

  if (!data) {
    return { status: "red", stale: false, lastUpdated: null };
  }

  if (data.stale) {
    return { status: "red", stale: true, lastUpdated: data.lastUpdated };
  }

  if (!data.lastUpdated) {
    return { status: "red", stale: false, lastUpdated: null };
  }

  const age = Date.now() - data.lastUpdated;

  if (age > HOURS_72) {
    return { status: "red", stale: false, lastUpdated: data.lastUpdated };
  }

  if (age > HOURS_24) {
    return { status: "yellow", stale: false, lastUpdated: data.lastUpdated };
  }

  return { status: "green", stale: false, lastUpdated: data.lastUpdated };
};
