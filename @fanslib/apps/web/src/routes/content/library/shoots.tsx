import { createFileRoute } from "@tanstack/react-router";
import { Shoots } from "~/features/shoots/components/Shoots";

const LibraryShootsPageContent = () => (
	<div className="relative flex h-full w-full flex-col overflow-hidden">
		<Shoots />
	</div>
);

export const Route = createFileRoute("/content/library/shoots")({
	component: LibraryShootsPageContent,
});

