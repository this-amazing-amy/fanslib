import { Folder } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Tooltip } from '~/components/ui/Tooltip';
import { useCompanionAvailable } from '~/hooks/useCompanionAvailable';
import { useSettingsQuery } from '~/lib/queries/settings';
import { revealInFinder } from '~/lib/companion-bridge';

type RevealInFinderButtonProps = {
  relativePath: string;
  className?: string;
};

export const RevealInFinderButton = ({
  relativePath,
  className,
}: RevealInFinderButtonProps) => {
  const { data: isAvailable } = useCompanionAvailable();
  const { data: settings } = useSettingsQuery();
  const [isRevealing, setIsRevealing] = useState(false);

  if (!isAvailable) {
    return null;
  }

  if (!settings?.libraryPath) {
    return null;
  }

  const handleReveal = async () => {
    try {
      setIsRevealing(true);
      const fullPath = `${settings?.libraryPath}${settings?.libraryPath?.endsWith('/') ? '' : '/'}${relativePath}`;
      await revealInFinder(fullPath);
    } catch (error) {
      console.error('Failed to reveal in finder:', error);
    } finally {
      setIsRevealing(false);
    }
  };

  return (
    <Tooltip content="Reveal in Finder" openDelayMs={0}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleReveal}
        isDisabled={isRevealing}
        className={className}
      >
        <Folder className="h-4 w-4" />
      </Button>
    </Tooltip>
  );
};

