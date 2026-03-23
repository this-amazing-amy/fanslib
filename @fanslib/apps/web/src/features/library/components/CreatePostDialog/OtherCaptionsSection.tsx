import { ChevronDown, ChevronUp } from "lucide-react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { Button } from "~/components/ui/Button";
import { ScrollArea } from "~/components/ui/ScrollArea";

type OtherCaption = {
  caption?: string | null;
  channel?: { id?: string; name?: string; typeId?: string } | null;
};

type OtherCaptionsSectionProps = {
  otherCaptions: OtherCaption[];
  isOpen: boolean;
  onToggle: () => void;
  onUseCaption: (caption: string) => void;
};

export const OtherCaptionsSection = ({
  otherCaptions,
  isOpen,
  onToggle,
  onUseCaption,
}: OtherCaptionsSectionProps) => {
  if (otherCaptions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="flex w-full items-center justify-between p-2 text-sm font-medium"
        onPress={onToggle}
      >
        Captions from other posts using this media
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {isOpen && (
        <ScrollArea className="h-[200px] rounded-md border p-2">
          <div className="space-y-2">
            {otherCaptions.map((otherCaption) =>
              !otherCaption?.caption ? null : (
                <div
                  key={otherCaption.channel?.id ?? otherCaption.caption}
                  className="group relative min-h-8 flex flex-col rounded-md border p-2"
                >
                  <ChannelBadge
                    className="self-start"
                    name={otherCaption.channel?.name ?? ""}
                    typeId={otherCaption.channel?.typeId ?? ""}
                  />
                  <p className="text-sm pt-2">{otherCaption.caption}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1 opacity-0 group-hover:opacity-100"
                    onPress={() => onUseCaption(otherCaption.caption ?? "")}
                  >
                    Use
                  </Button>
                </div>
              ),
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
