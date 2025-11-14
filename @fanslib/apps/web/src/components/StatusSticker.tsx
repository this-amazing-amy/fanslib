import { Check, Clock, Edit2Icon } from "lucide-react";
import { cn } from "~/lib/cn";
import { Sticker } from "./ui/Sticker";

type StatusStickerProps = {
  variant?: "inverted" | "default";
  status: "posted" | "scheduled" | "draft";
  className?: string;
};

export const StatusSticker = ({ status, className, variant = "default" }: StatusStickerProps) => {
  return (
    <Sticker
      className={cn(
        {
          "text-green-400 border-green-400": status === "posted" && variant === "default",
          "text-blue-400 border-blue-400": status === "scheduled" && variant === "default",
          "text-gray-400 border-gray-400": status === "draft" && variant === "default",
          "text-white bg-green-400 border-green-400": status === "posted" && variant === "inverted",
          "text-white bg-blue-400 border-blue-400":
            status === "scheduled" && variant === "inverted",
          "text-white bg-gray-400 border-gray-400": status === "draft" && variant === "inverted",
        },
        className
      )}
    >
      {status === "posted" && <Check className="h-2.5 w-2.5" />}
      {status === "scheduled" && <Clock className="h-2.5 w-2.5" />}
      {status === "draft" && <Edit2Icon className="h-2.5 w-2.5" />}
    </Sticker>
  );
};

