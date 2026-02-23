import { createFileRoute } from "@tanstack/react-router";
import { Shoots } from "~/features/shoots/components/Shoots";

const ShootsPageContent = () => (
  <div className="flex h-full w-full flex-col overflow-hidden">
    <Shoots />
  </div>
);

export const Route = createFileRoute("/content/shoots")({
  component: ShootsPageContent,
});
