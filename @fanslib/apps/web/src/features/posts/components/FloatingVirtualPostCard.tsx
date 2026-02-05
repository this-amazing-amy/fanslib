import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Camera } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { StatusIcon } from "~/components/StatusIcon";
import { usePrefersReducedMotion } from "~/hooks/usePrefersReducedMotion";
import type { VirtualPost } from "~/lib/virtual-posts";
import { useInlinePickerActions, useInlinePickerState } from "../contexts/InlinePickerContext";

type FloatingVirtualPostCardProps = {
  calendarContainerRef?: React.RefObject<HTMLDivElement | null>;
};

export const FloatingVirtualPostCard = ({ calendarContainerRef }: FloatingVirtualPostCardProps) => {
  const { state } = useInlinePickerState();
  const { clearFloatingPost } = useInlinePickerActions();
  const { floatingPost } = state;
  const prefersReducedMotion = usePrefersReducedMotion();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && floatingPost) {
        clearFloatingPost();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [floatingPost, clearFloatingPost]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      clearFloatingPost();
    }
  };

  if (!floatingPost) return null;

  const { virtualPost, initialBounds } = floatingPost;
  const calendarContainer = calendarContainerRef?.current;
  
  // Calculate calendar center for target position
  const calendarBounds = calendarContainer?.getBoundingClientRect();
  const targetX = calendarBounds 
    ? calendarBounds.left + calendarBounds.width / 2 
    : window.innerWidth / 2;
  const targetY = calendarBounds 
    ? calendarBounds.top + calendarBounds.height / 2 
    : window.innerHeight / 2;

  // Calculate scaled dimensions
  const scaleFactor = 2;
  const targetWidth = initialBounds.width * scaleFactor;
  const targetHeight = initialBounds.height * scaleFactor;

  // Render backdrop into the calendar container, card fixed on viewport
  const backdropContent = (
    <motion.div
      ref={backdropRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      onClick={handleBackdropClick}
      className="absolute inset-0 bg-black/20 z-40 rounded-lg"
    />
  );
  
  return (
    <AnimatePresence>
      {floatingPost && (
        <>
          {/* Backdrop - rendered into calendar container */}
          {calendarContainer && createPortal(backdropContent, calendarContainer)}
          
          {/* Floating card - fixed positioning on viewport */}
          <motion.div
            initial={prefersReducedMotion ? {
              left: targetX,
              top: targetY,
              width: targetWidth,
              height: targetHeight,
            } : {
              left: initialBounds.left + initialBounds.width / 2,
              top: initialBounds.top + initialBounds.height / 2,
              width: initialBounds.width,
              height: initialBounds.height,
            }}
            animate={{
              left: targetX,
              top: targetY,
              width: targetWidth,
              height: targetHeight,
            }}
            exit={prefersReducedMotion ? undefined : {
              left: initialBounds.left + initialBounds.width / 2,
              top: initialBounds.top + initialBounds.height / 2,
              width: initialBounds.width,
              height: initialBounds.height,
            }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 500,
              mass: 0.8,
              duration: prefersReducedMotion ? 0 : undefined,
            }}
            style={{
              position: 'fixed',
              translateX: '-50%',
              translateY: '-50%',
            }}
            className="z-50 @container"
          >
            <FloatingCardContent virtualPost={virtualPost} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

type FloatingCardContentProps = {
  virtualPost: VirtualPost;
};

const FloatingCardContent = ({ virtualPost }: FloatingCardContentProps) => {
  const time = format(new Date(virtualPost.date), "HH:mm");
  const channelTypeId = virtualPost.channel.type?.id ?? virtualPost.channel.typeId ?? 'onlyfans';

  return (
    <div className="h-full group flex flex-col relative p-2 @[150px]:p-2.5 @[180px]:p-3 rounded-xl bg-base-100 border shadow-2xl">
      {/* Media Section */}
      <div className="relative mb-1 @[150px]:mb-1.5 overflow-hidden rounded-xl">
        <div className="w-full aspect-square rounded-md border-2 border-dashed border-base-300 bg-base-200/30 flex flex-col items-center justify-center gap-2">
          <Camera className="w-8 h-8 text-base-content/20" />
          <span className="text-[10px] text-base-content/30 font-medium">No media</span>
        </div>
      </div>

      {/* Badges Row */}
      <div className="@container flex flex-row gap-0.5 @[150px]:gap-1 mb-1 @[150px]:mb-1.5">
        <ChannelBadge
          name={virtualPost.channel.name ?? ""}
          typeId={channelTypeId}
          size="sm"
          selected
          borderStyle="none"
          className="justify-center"
        />

        {virtualPost.schedule && (
          <ContentScheduleBadge
            name={virtualPost.schedule.name}
            emoji={virtualPost.schedule.emoji}
            color={virtualPost.schedule.color}
            size="sm"
            selected
            borderStyle="none"
            className="justify-center"
          />
        )}
      </div>

      {/* Metadata Row: Status + Time */}
      <div className="flex items-center justify-between mb-0.5 @[150px]:mb-1">
        <StatusIcon status="draft" />
        <div className="text-sm @[180px]:text-base font-bold text-base-content">{time}</div>
      </div>
    </div>
  );
};
