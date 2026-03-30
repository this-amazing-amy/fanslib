import { createFileRoute, useParams } from "@tanstack/react-router";
import { EditorLayout } from "~/features/editor/components/EditorLayout";

const ExistingEditRoute = () => {
  const { mediaId, editId } = useParams({ from: "/library/$mediaId/edit/$editId" });
  return <EditorLayout mediaId={mediaId} editId={editId} />;
};

export const Route = createFileRoute("/library/$mediaId/edit/$editId")({
  component: ExistingEditRoute,
});
