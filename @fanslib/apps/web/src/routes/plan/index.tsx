import { createFileRoute } from "@tanstack/react-router";
import { PostPreferencesProvider } from "~/contexts/PostPreferencesContext";
import { PlanPage } from "~/features/posts/components/PlanPage";

const PlanRoute = () => (
  <PostPreferencesProvider>
    <PlanPage />
  </PostPreferencesProvider>
);

export const Route = createFileRoute("/plan/")({
  component: PlanRoute,
});
