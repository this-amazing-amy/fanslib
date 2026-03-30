import { createFileRoute, useParams } from "@tanstack/react-router";
import { EditorLayout } from "~/features/editor/components/EditorLayout";

const NewEditRoute = () => {
  const { mediaId } = useParams({ from: "/library/$mediaId/edit/" });
  return <EditorLayout mediaId={mediaId} />;
};

export const Route = createFileRoute("/library/$mediaId/edit/")({
  component: NewEditRoute,
});
