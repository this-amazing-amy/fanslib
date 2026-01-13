import { readFile } from "fs/promises";
import type { BlobRef } from "@atproto/api";
import { getBlueskyAgent } from "../client";
import { resolveMediaPath } from "../../library/path-utils";
import type { Media } from "../../library/entity";

const VIDEO_SERVICE_URL = "https://video.bsky.app";
const VIDEO_PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;
const POLLING_INTERVAL_MS = 2000;
const SERVICE_AUTH_EXPIRY_SECONDS = 30 * 60;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type VideoJobStatus = {
  jobId: string;
  did: string;
  state: string;
  progress?: number;
  blob?: BlobRef;
  error?: string;
  message?: string;
};

const getServiceAuthToken = async (): Promise<{ token: string; userDid: string }> => {
  const agent = await getBlueskyAgent();
  
  // Get the user's DID from the session
  const userDid = agent.session?.did;
  if (!userDid) {
    throw new Error("No authenticated session - cannot get user DID");
  }

  // Get the PDS URL from the agent's session to derive the PDS DID
  // The PDS DID is used as the audience for the service auth token
  const pdsUrl = agent.pdsUrl?.toString() ?? "https://bsky.social";
  const pdsDid = `did:web:${new URL(pdsUrl).hostname}`;

  const response = await agent.com.atproto.server.getServiceAuth({
    aud: pdsDid,
    exp: Math.floor(Date.now() / 1000) + SERVICE_AUTH_EXPIRY_SECONDS,
    lxm: "com.atproto.repo.uploadBlob",
  });

  return { token: response.data.token, userDid };
};

const uploadVideoToService = async (fileBuffer: Buffer, mimeType: string, serviceToken: string, userDid: string): Promise<VideoJobStatus> => {
  const url = new URL(`${VIDEO_SERVICE_URL}/xrpc/app.bsky.video.uploadVideo`);
  url.searchParams.set("did", userDid);
  url.searchParams.set("name", `video_${Date.now()}.mp4`);
  
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceToken}`,
      "Content-Type": mimeType,
      "Content-Length": fileBuffer.length.toString(),
    },
    body: new Uint8Array(fileBuffer),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Video upload failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json() as { jobStatus: VideoJobStatus };
  return data.jobStatus;
};

const getJobStatus = async (jobId: string, serviceToken: string): Promise<VideoJobStatus> => {
  const response = await fetch(`${VIDEO_SERVICE_URL}/xrpc/app.bsky.video.getJobStatus?jobId=${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${serviceToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get job status: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json() as { jobStatus: VideoJobStatus };
  return data.jobStatus;
};

const waitForVideoProcessing = async (jobId: string, serviceToken: string): Promise<BlobRef> => {
  const startTime = Date.now();

  // eslint-disable-next-line functional/no-loop-statements
  while (Date.now() - startTime < VIDEO_PROCESSING_TIMEOUT_MS) {
    const status = await getJobStatus(jobId, serviceToken);

    if (status.state === "JOB_STATE_COMPLETED" && status.blob) {
      return status.blob;
    }

    if (status.state === "JOB_STATE_FAILED") {
      throw new Error(`Video processing failed: ${status.error ?? status.message ?? "Unknown error"}`);
    }

    await sleep(POLLING_INTERVAL_MS);
  }

  throw new Error("Video processing timed out");
};

const getMimeType = (filePath: string): string => {
  const ext = filePath.toLowerCase().split(".").pop();
  const mimeTypes: Record<string, string> = {
    "mp4": "video/mp4",
    "mov": "video/quicktime",
    "webm": "video/webm",
    "mpeg": "video/mpeg",
  };
  return mimeTypes[ext ?? ""] ?? "video/mp4";
};

export const uploadVideo = async (media: Media): Promise<BlobRef> => {
  const filePath = resolveMediaPath(media.relativePath);
  const fileBuffer = await readFile(filePath);
  const mimeType = getMimeType(filePath);

  const { token: serviceToken, userDid } = await getServiceAuthToken();
  const jobStatus = await uploadVideoToService(fileBuffer, mimeType, serviceToken, userDid);

  if (jobStatus.state === "JOB_STATE_COMPLETED" && jobStatus.blob) {
    return jobStatus.blob;
  }

  if (!jobStatus.jobId) {
    throw new Error("Video upload did not return a job ID");
  }

  return waitForVideoProcessing(jobStatus.jobId, serviceToken);
};
