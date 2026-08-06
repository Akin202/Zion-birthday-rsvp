import React from "react";
import clsx from "clsx";

export interface BurstBadgeProps {
  text: string;
  color?: string; // hex or color string
  textColor?: string;
  className?: string;
  rotate?: number;
  size?: "sm" | "md" | "lg";
}

export const BurstBadge: React.FC<BurstBadgeProps> = ({
  text,
  color = "#FFD700",
  textColor = "#111111",
  className = "",
  rotate = -3,
  size = "md",
}) => {
  const rotateClass =
    rotate === -3
      ? "-rotate-3"
      : rotate === 3
      ? "rotate-3"
      : rotate === -6
      ? "-rotate-6"
      : rotate === 6
      ? "rotate-6"
      : "";

  const sizeClasses =
    size === "sm"
      ? "text-sm px-4 py-2 min-w-[120px]"
      : size === "lg"
      ? "text-xl sm:text-2xl px-8 py-4 min-w-[200px]"
      : "text-base sm:text-lg px-6 py-3 min-w-[160px]";

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center font-display uppercase tracking-wider text-center drop-shadow-[3px_3px_0px_#111111] transition-transform duration-200 hover:scale-105",
        rotateClass,
        className
      )}
    >
      <svg
        className="absolute inset-0 w-full h-full overflow-visible"
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          points="10,40 25,12 50,22 75,5 100,20 125,5 150,22 175,12 190,40 180,60 155,75 125,65 100,78 75,65 45,75 20,60"
          fill={color}
          stroke="#111111"
          strokeWidth="3.5"
          strokeLinejoin="miter"
        />
      </svg>
      <span
        className={clsx(
          "relative z-10 font-display text-center leading-none select-none",
          sizeClasses
        )}
        style={{ color: textColor }}
      >
        {text}
      </span>
    </div>
  );
};
