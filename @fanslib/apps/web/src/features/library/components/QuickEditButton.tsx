import { useNavigate } from "@tanstack/react-router";
import { Film, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  useCreateCompositionMutation,
  useUpdateCompositionMutation,
} from "~/lib/queries/compositions";

const DEFAULT_FPS = 30;

type QuickEditButtonProps = {
  media: {
    id: string;
    duration: number | null;
    shoots: { id: string; name: string }[];
  };
};

export const QuickEditButton = ({ media }: QuickEditButtonProps) => {
  const navigate = useNavigate();
  const createComposition = useCreateCompositionMutation();
  const updateComposition = useUpdateCompositionMutation();

  if (media.shoots.length === 0) return null;

  const isPending = createComposition.isPending || updateComposition.isPending;

  const handleClick = async () => {
    const shootId = media.shoots[0]!.id;
    const totalFrames = Math.round((media.duration ?? 0) * DEFAULT_FPS);

    const composition = await createComposition.mutateAsync({
      shootId,
      name: "Quick Edit",
    });

    await updateComposition.mutateAsync({
      id: composition.id,
      body: {
        segments: [
          {
            id: crypto.randomUUID(),
            sourceMediaId: media.id,
            sourceStartFrame: 0,
            sourceEndFrame: totalFrames,
          },
        ],
      },
    });

    navigate({
      to: "/shoots/$shootId/compositions/$compositionId",
      params: { shootId, compositionId: composition.id },
    });
  };

  return (
    <Button variant="ghost" size="sm" onPress={handleClick} isDisabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Film className="mr-2 h-4 w-4" />
      )}
      Quick Edit
    </Button>
  );
};
