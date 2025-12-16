import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useState } from "react";
import {
  Badge as BaseBadge,
  type BadgeProps as BaseBadgeProps,
} from "./ui/Badge/Badge";
import { cn } from "~/lib/cn";

export type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = {
  label: string;
  icon?: ReactNode;
  backgroundColor: string;
  foregroundColor: string;
  borderColor?: string;
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  size?: BadgeSize;
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
  selected = false,
  selectable = false,
  disabled = false,
  size = "md",
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

  const style: CSSProperties = {
    backgroundColor: effectiveBackgroundColor,
    borderColor: borderColor ?? foregroundColor,
    color: foregroundColor,
  };

  return (
    <BaseBadge
      size={mapSizeToBase(size)}
      className={cn(
        "rounded-full font-normal flex items-center gap-1.5",
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
      {icon}
      <span>{label}</span>
    </BaseBadge>
  );
};

