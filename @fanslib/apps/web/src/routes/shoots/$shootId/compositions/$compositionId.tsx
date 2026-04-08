import { createFileRoute } from "@tanstack/react-router";
import { CompositionEditor } from "~/features/editor/components/CompositionEditor";

const CompositionEditorRoute = () => {
  const { shootId, compositionId } = Route.useParams();
  return <CompositionEditor shootId={shootId} compositionId={compositionId} />;
};

export const Route = createFileRoute("/shoots/$shootId/compositions/$compositionId")({
  component: CompositionEditorRoute,
});
