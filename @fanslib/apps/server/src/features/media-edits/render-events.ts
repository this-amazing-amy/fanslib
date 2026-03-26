export type RenderStartedEvent = {
  type: "render-started";
  editId: string;
  totalFrames: number;
};

export type RenderProgressEvent = {
  type: "render-progress";
  editId: string;
  frame: number;
  percent: number;
};

export type RenderCompletedEvent = {
  type: "render-completed";
  editId: string;
  outputMediaId: string;
};

export type RenderFailedEvent = {
  type: "render-failed";
  editId: string;
  error: string;
};

export type RenderEvent =
  | RenderStartedEvent
  | RenderProgressEvent
  | RenderCompletedEvent
  | RenderFailedEvent;

type Listener = (event: RenderEvent) => void;

// eslint-disable-next-line functional/no-let
let listeners: Listener[] = [];

export const addRenderListener = (listener: Listener): (() => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

export const emitRenderEvent = (event: RenderEvent): void => {
  listeners.forEach((listener) => listener(event));
};
