import React from "react";
import clsx from "clsx";

export interface WebCornerProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  color?: string; // stroke color e.g. "#111111"
  size?: number; // width/height in px
  className?: string;
}

export const WebCorner: React.FC<WebCornerProps> = ({
  position = "top-left",
  color = "#111111",
  size = 120,
  className = "",
}) => {
  const positionClasses =
    position === "top-left"
      ? "top-0 left-0"
      : position === "top-right"
      ? "top-0 right-0 rotate-90"
      : position === "bottom-right"
      ? "bottom-0 right-0 rotate-180"
      : "bottom-0 left-0 -rotate-90";

  return (
    <div className={clsx("absolute pointer-events-none z-10 opacity-75", positionClasses, className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Abstract geometric radial web lines */}
        <path d="M0 0 L120 0 M0 0 L105 30 M0 0 L80 70 M0 0 L50 100 M0 0 L0 120" stroke={color} strokeWidth="3" />
        {/* Concentric geometric web arcs */}
        <path d="M25 0 Q25 25 0 25" stroke={color} strokeWidth="2.5" fill="none" />
        <path d="M50 0 Q50 50 0 50" stroke={color} strokeWidth="2.5" fill="none" />
        <path d="M75 0 Q75 75 0 75" stroke={color} strokeWidth="2.5" fill="none" />
        <path d="M100 0 Q100 100 0 100" stroke={color} strokeWidth="2.5" fill="none" />
        {/* Corner anchor node */}
        <circle cx="0" cy="0" r="6" fill={color} />
      </svg>
    </div>
  );
};
