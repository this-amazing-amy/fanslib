import { createFileRoute } from "@tanstack/react-router";
import { OrganizePage } from "~/features/library/components/OrganizePage/OrganizePage";

const OrganizePageContent = () => (
  <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
    <OrganizePage />
  </div>
);

export const Route = createFileRoute("/content/library/organize")({
  component: OrganizePageContent,
});
