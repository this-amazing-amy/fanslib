import type { ShootSummarySchema } from "@fanslib/server/schemas";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCallback } from "react";
import { Button } from "~/components/ui/Button";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { ShootDetailDateInput } from "~/features/shoots/components/shoot-detail/ShootDetailDateInput";
import { ShootDetailMediaGrid } from "~/features/shoots/components/shoot-detail/ShootDetailMediaGrid";
import { ShootDetailTitleInput } from "~/features/shoots/components/shoot-detail/ShootDetailTitleInput";
import { ShootPosts } from "~/features/shoots/components/shoot-detail/ShootPosts";
import { useShootQuery } from "~/lib/queries/shoots";

type ShootSummary = typeof ShootSummarySchema.static;

const ShootDetailRoute = () => {
  const { shootId } = Route.useParams();
  const navigate = useNavigate();
  const { data: shoot, isLoading, error } = useShootQuery({ id: shootId });

  const goBack = useCallback(() => {
    if (typeof window === "undefined") {
      navigate({ to: "/shoots" });
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    navigate({ to: "/shoots" });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !shoot) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-2xl font-semibold">Shoot not found</h1>
        <Button onClick={goBack}>Back</Button>
      </div>
    );
  }

  const normalizedShoot: ShootSummary = shoot as ShootSummary;

  return (
    <MediaDragProvider>
      <div className="overflow-y-auto">
        <div className="max-w-[1280px] px-8 mx-auto pt-8 pb-12">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="outline" size="sm" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <ShootDetailTitleInput shoot={normalizedShoot} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
            <div className="flex flex-col gap-4">
              <ShootDetailDateInput shoot={normalizedShoot} />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Media</h2>
            {normalizedShoot.media && normalizedShoot.media.length > 0 ? (
              <ShootDetailMediaGrid medias={normalizedShoot.media} />
            ) : (
              <div className="text-muted-foreground">No media in this shoot</div>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Posts with media from this shoot</h2>
            <ShootPosts shootId={normalizedShoot.id} />
          </div>
        </div>
      </div>
    </MediaDragProvider>
  );
};

export const Route = createFileRoute("/shoots/$shootId")({
  component: ShootDetailRoute,
});

