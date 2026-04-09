import { Settings2 } from "lucide-react";
import { useEditorStore } from "~/stores/editorStore";
import { isCaptionOperation } from "../../utils/caption-layout";
import { isCropOperation } from "../../utils/crop-operation";
import { isWatermarkOp } from "./watermark-properties";
import { isBlurOp, isPixelateOp, isEmojiOp, isZoomOp } from "./helpers";
import { CaptionProperties } from "./caption-properties";
import { CropProperties } from "./crop-properties";
import { WatermarkProperties } from "./watermark-properties";
import { BlurProperties } from "./blur-properties";
import { PixelateProperties } from "./pixelate-properties";
import { EmojiProperties } from "./emoji-properties";
import { ZoomProperties } from "./zoom-properties";

export const PropertiesPanel = () => {
  const operations = useEditorStore((s) => s.operations);
  const selectedId = useEditorStore((s) => s.selectedOperationId);
  const selectedTransitionSegmentId = useEditorStore((s) => s.selectedTransitionSegmentId);

  const selectedOp =
    selectedId !== null
      ? (operations as Array<{ id?: string }>).find((o) => o.id === selectedId)
      : undefined;

  // Hide when a transition is selected (TransitionProperties handles that)
  if (selectedTransitionSegmentId) return null;

  if (!selectedOp || selectedId === null) {
    return (
      <div className="w-72 border-l border-base-300 bg-base-200/30 p-4 flex flex-col items-center justify-center text-base-content/40">
        <Settings2 className="h-8 w-8 mb-2" />
        <p className="text-sm text-center">Select an operation to edit its properties</p>
      </div>
    );
  }

  const op = selectedOp;
  const selectedIndex = (operations as Array<{ id?: string }>).findIndex(
    (o) => o.id === selectedId,
  );

  return (
    <div className="w-72 border-l border-base-300 bg-base-200/30 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-3 capitalize">
        {String((op as Record<string, unknown>).type ?? "Properties")}
      </h3>

      {isWatermarkOp(op) ? (
        <WatermarkProperties op={op} opId={selectedId} />
      ) : isCropOperation(op) ? (
        <CropProperties op={op} opId={selectedId} index={selectedIndex} />
      ) : isCaptionOperation(op) ? (
        <CaptionProperties op={op} opId={selectedId} />
      ) : isBlurOp(op) ? (
        <BlurProperties op={op} opId={selectedId} />
      ) : isPixelateOp(op) ? (
        <PixelateProperties op={op} opId={selectedId} />
      ) : isEmojiOp(op) ? (
        <EmojiProperties op={op} opId={selectedId} />
      ) : isZoomOp(op) ? (
        <ZoomProperties op={op} opId={selectedId} />
      ) : (
        <div className="space-y-3 text-sm">
          {Object.entries(op as Record<string, unknown>)
            .filter(([key]) => key !== "type")
            .map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-base-content/60 capitalize">{key}</span>
                <span className="font-mono text-xs">{String(value)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
