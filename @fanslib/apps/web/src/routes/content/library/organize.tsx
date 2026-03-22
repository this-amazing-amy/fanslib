import { createFileRoute } from "@tanstack/react-router";
import { OrganizePage } from "~/features/library/components/OrganizePage/OrganizePage";

const OrganizePageContent = () => (
  <div className="relative flex h-full w-full flex-col overflow-auto">
    <OrganizePage />
  </div>
);

export const Route = createFileRoute("/content/library/organize")({
  component: OrganizePageContent,
});
