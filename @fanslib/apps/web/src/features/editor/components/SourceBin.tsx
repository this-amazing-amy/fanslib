import { useShootQuery } from "~/lib/queries/shoots";
import { useEditorStore } from "~/stores/editorStore";

type SourceMedia = {
  id: string;
  name: string;
  category: "library" | "footage";
  note: string | null;
};

type SourceBinProps = {
  shootId: string;
};

export const SourceBin = ({ shootId }: SourceBinProps) => {
  const { data: shoot } = useShootQuery({ id: shootId });
  const selectedSourceId = useEditorStore((s) => s.selectedSourceId);
  const selectSource = useEditorStore((s) => s.selectSource);

  if (!shoot) return null;

  const allMedia = (shoot as { media?: SourceMedia[] }).media ?? [];
  const libraryMedia = allMedia.filter((m) => m.category !== "footage");
  const footageMedia = allMedia.filter((m) => m.category === "footage");

  const handleClick = (mediaId: string) => {
    selectSource(selectedSourceId === mediaId ? null : mediaId);
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-3" data-testid="source-bin">
      {libraryMedia.length > 0 && (
        <section>
          <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
            Media
          </h3>
          <ul className="flex flex-col gap-1">
            {libraryMedia.map((media) => (
              <SourceItem
                key={media.id}
                media={media}
                isSelected={selectedSourceId === media.id}
                onClick={() => handleClick(media.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {footageMedia.length > 0 && (
        <section>
          <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
            Footage
          </h3>
          <ul className="flex flex-col gap-1">
            {footageMedia.map((media) => (
              <SourceItem
                key={media.id}
                media={media}
                isSelected={selectedSourceId === media.id}
                onClick={() => handleClick(media.id)}
                showBadge
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

type SourceItemProps = {
  media: SourceMedia;
  isSelected: boolean;
  onClick: () => void;
  showBadge?: boolean;
};

const SourceItem = ({ media, isSelected, onClick, showBadge }: SourceItemProps) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-2 rounded-md p-2 text-left text-sm transition-colors ${
        isSelected
          ? "bg-accent text-accent-foreground ring-ring ring-1"
          : "hover:bg-muted"
      }`}
    >
      <img
        src={`/api/media/${media.id}/thumbnail`}
        alt={media.name}
        className="h-10 w-14 flex-shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{media.name}</span>
          {showBadge && (
            <span className="bg-muted text-muted-foreground flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium">
              Footage
            </span>
          )}
        </div>
        {media.note && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{media.note}</p>
        )}
      </div>
    </button>
  </li>
);
