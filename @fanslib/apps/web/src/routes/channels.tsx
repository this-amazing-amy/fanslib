import { createFileRoute } from "@tanstack/react-router";
import { Channels } from "~/features/channels/components/Channels";

export const Route = createFileRoute("/channels")({
  component: Channels,
});
