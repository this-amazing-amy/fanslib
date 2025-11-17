import { MediaSchema } from "@fanslib/server/schemas";

type Media = typeof MediaSchema.static;
import { Tag } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { MediaTagEditor } from "../../MediaTagEditor";

type TagAssignerProps = {
  selectedMedia: Media[];
  disabled?: boolean;
};

export const TagAssigner = ({ selectedMedia, disabled = false }: TagAssignerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };
  return (
    <PopoverTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        isDisabled={disabled || selectedMedia.length === 0}
      >
        <Tag className="h-4 w-4" />
        Add Tag
      </Button>
      <Popover className="w-[400px] p-4" placement="bottom start">
        <MediaTagEditor media={selectedMedia} className="max-h-[400px] overflow-y-auto" />
      </Popover>
    </PopoverTrigger>
  );
};
