import type { SVGProps } from "react";

export type BurgerIconProps = SVGProps<SVGSVGElement> & {
  size?: "sm" | "md" | "lg";
};

export const BurgerIcon = ({ size = "md", className = "", ...props }: BurgerIconProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const classes = ["inline-block stroke-current", sizeClasses[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={classes}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
};
