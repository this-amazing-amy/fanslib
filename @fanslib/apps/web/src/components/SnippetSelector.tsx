import { FileText, Globe } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/Tooltip";
import { useGlobalSnippetsQuery, useSnippetsByChannelQuery } from "~/lib/queries/snippets";

type SnippetSelectorProps = {
  channelId?: string;
  caption: string;
  onCaptionChange: (caption: string) => void;
  textareaRef?: RefObject<HTMLTextAreaElement>;
  className?: string;
};

const toast = () => {};

export const SnippetSelector = ({
  channelId,
  caption = "",
  onCaptionChange,
  textareaRef,
  className,
}: SnippetSelectorProps) => {
  const { data: globalSnippets = [] } = useGlobalSnippetsQuery();
  const { data: channelSnippets = [] } = useSnippetsByChannelQuery({
    channelId: channelId ?? ""
  });

  const allSnippets = [...globalSnippets, ...channelSnippets];

  const insertSnippet = (snippetContent: string) => {
    if (!textareaRef?.current) {
      const prefix = caption && !caption.endsWith("\n") ? "\n\n" : "";
      const newCaption = `${caption}${prefix}${snippetContent}`;
      onCaptionChange(newCaption);
      toast();
      return;
    }

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart ?? caption.length;

    const before = caption.slice(0, cursorPos);
    const after = caption.slice(cursorPos);

    const prefix = before && !before.endsWith("\n") && before.length > 0 ? "\n\n" : "";
    const suffix = after && !after.startsWith("\n") && after.length > 0 ? "\n\n" : "";

    const newCaption = `${before}${prefix}${snippetContent}${suffix}${after}`;
    onCaptionChange(newCaption);

    setTimeout(() => {
      const newCursorPos = before.length + prefix.length + snippetContent.length + suffix.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);

    toast();
  };

  if (allSnippets.length === 0) return null;

  const globalSnippetsList = allSnippets.filter((s) => !s.channel);
  const channelSnippetsList = allSnippets.filter((s) => s.channel);

  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={className}>
              <FileText className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">Insert caption snippet</TooltipContent>

        <DropdownMenuContent align="end" className="w-64">
          {globalSnippetsList.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                Global Snippets
              </DropdownMenuLabel>
              {globalSnippetsList.map((snippet) => (
                <DropdownMenuItem
                  key={snippet.id}
                  onClick={() => insertSnippet(snippet.content)}
                  className="flex flex-col items-start gap-1 cursor-pointer"
                >
                  <div className="font-medium">{snippet.name}</div>
                  <div className="text-xs text-muted-foreground truncate w-full">
                    {snippet.content.length > 50
                      ? `${snippet.content.slice(0, 50)}...`
                      : snippet.content}
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {channelSnippetsList.length > 0 && globalSnippetsList.length > 0 && <DropdownMenuSeparator />}

          {channelSnippetsList.length > 0 && (
            <>
              <DropdownMenuLabel>Channel Snippets</DropdownMenuLabel>
              {channelSnippetsList.map((snippet) => (
                <DropdownMenuItem
                  key={snippet.id}
                  onClick={() => insertSnippet(snippet.content)}
                  className="flex flex-col items-start gap-1 cursor-pointer"
                >
                  <div className="font-medium">{snippet.name}</div>
                  <div className="text-xs text-muted-foreground truncate w-full">
                    {snippet.content.length > 50
                      ? `${snippet.content.slice(0, 50)}...`
                      : snippet.content}
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </Tooltip>
  );
};
