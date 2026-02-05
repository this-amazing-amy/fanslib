import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useState } from "react";
import { cn } from "~/lib/cn";
import {
    Badge as BaseBadge,
    type BadgeProps as BaseBadgeProps,
} from "./ui/Badge/Badge";

export type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = {
  label: string;
  icon?: ReactNode;
  backgroundColor: string;
  foregroundColor: string;
  borderColor?: string;
  borderStyle?: 'visible' | 'none';
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  size?: BadgeSize;
  /** When true, uses container queries to collapse in tight spaces. When false, always shows expanded. */
  responsive?: boolean;
  className?: string;
  onSelectionChange?: (nextSelected: boolean) => void;
  onClick?: (event: MouseEvent<HTMLSpanElement>) => void;
};

const mapSizeToBase = (size: BadgeSize | undefined): BaseBadgeProps["size"] => {
  if (size === "sm") return "sm";
  if (size === "lg") return "lg";
  return "md";
};

export const Badge = ({
  label,
  icon,
  backgroundColor,
  foregroundColor,
  borderColor,
  borderStyle = 'visible',
  selected = false,
  selectable = false,
  disabled = false,
  size = "md",
  responsive = true,
  className,
  onSelectionChange,
  onClick,
}: BadgeProps) => {
  const isInteractive = Boolean(onSelectionChange ?? onClick ?? selectable);
  const [isHovered, setIsHovered] = useState(false);

  const selectedBackgroundColor = backgroundColor;
  const unselectedBackgroundColor = `color-mix(in oklch, ${backgroundColor} 12%, transparent)`;

  const baseBackgroundColor = selected ? selectedBackgroundColor : unselectedBackgroundColor;
  const hoverBackgroundColor: string = selected
    ? selectedBackgroundColor
    : `color-mix(in oklch, ${selectedBackgroundColor} 50%, ${unselectedBackgroundColor} 50%)`;
  const effectiveBackgroundColor = isHovered ? hoverBackgroundColor : baseBackgroundColor;

  const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
    if (disabled) return;
    if (onSelectionChange) {
      onSelectionChange(!selected);
    }
    if (onClick) {
      onClick(event);
    }
  };

  const effectiveBorderColor = borderStyle === 'none' 
    ? effectiveBackgroundColor 
    : (borderColor ?? foregroundColor);

  const style: CSSProperties = {
    backgroundColor: effectiveBackgroundColor,
    borderColor: effectiveBorderColor,
    color: foregroundColor,
  };

  return (
    <BaseBadge
      size={mapSizeToBase(size)}
      className={cn(
        "rounded-full font-normal flex items-center",
        // Container query responsive behavior:
        // - responsive=true (default): collapsed by default, expands when container >= 200px
        // - responsive=false: always expanded
        label && responsive && "gap-0 justify-center w-5 h-5 @[200px]:gap-1.5 @[200px]:justify-start @[200px]:w-fit @[200px]:h-auto",
        label && !responsive && "gap-1.5 justify-start w-fit h-auto",
        "border",
        isInteractive && "cursor-pointer transition-colors",
        disabled && "opacity-30 cursor-not-allowed",
        className
      )}
      style={style}
      onClick={isInteractive ? (event) => handleClick(event) : undefined}
      onMouseEnter={isInteractive ? () => setIsHovered(true) : undefined}
      onMouseLeave={isInteractive ? () => setIsHovered(false) : undefined}
    >
      {icon ? <span className="flex items-center justify-center leading-none">{icon}</span> : null}
      {label && (
        <span className={cn(
          "whitespace-nowrap overflow-hidden text-ellipsis",
          responsive ? "hidden @[200px]:inline" : "inline"
        )}>
          {label}
        </span>
      )}
    </BaseBadge>
  );
};

