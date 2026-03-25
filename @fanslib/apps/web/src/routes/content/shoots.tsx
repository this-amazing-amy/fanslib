import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * @deprecated The shoots list page has been removed. Shoots are now accessed
 * via the library page sidebar. This redirect preserves backward compatibility
 * for existing bookmarks.
 */
export const Route = createFileRoute("/content/shoots")({
  beforeLoad: () => {
    throw redirect({ to: "/content/library/media" });
  },
});
