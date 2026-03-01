import type { Media } from "@fanslib/server/schemas";
import { useEffect, useState } from "react";
import { useMediaSelectionSetup } from "~/hooks/useMediaSelectionSetup";

type ClientOnlyMediaSelectionSetupProps = {
  media: Media[] | Map<string, Media[]>;
};

const MediaSelectionSetupInner = ({ media }: ClientOnlyMediaSelectionSetupProps) => {
  useMediaSelectionSetup(media);
  return null;
};

export const ClientOnlyMediaSelectionSetup = ({ media }: ClientOnlyMediaSelectionSetupProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <MediaSelectionSetupInner media={media} />;
};
