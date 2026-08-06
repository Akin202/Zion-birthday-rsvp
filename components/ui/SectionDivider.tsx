import React from "react";
import clsx from "clsx";

export interface SectionDividerProps {
  color?: string; // fill color e.g. "#1B4C9B"
  flip?: boolean;
  className?: string;
  type?: "zigzag" | "torn";
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  color = "#FDF6E3",
  flip = false,
  className = "",
  type = "zigzag",
}) => {
  return (
    <div
      className={clsx(
        "w-full overflow-hidden leading-none relative z-10 pointer-events-none my-0",
        flip ? "rotate-180" : "",
        className
      )}
    >
      {type === "zigzag" && (
        <svg
          className="relative block w-full h-8 sm:h-12"
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 0 L30 30 L60 0 L90 30 L120 0 L150 30 L180 0 L210 30 L240 0 L270 30 L300 0 L330 30 L360 0 L390 30 L420 0 L450 30 L480 0 L510 30 L540 0 L570 30 L600 0 L630 30 L660 0 L690 30 L720 0 L750 30 L780 0 L810 30 L840 0 L870 30 L900 0 L930 30 L960 0 L990 30 L1020 0 L1050 30 L1080 0 L1110 30 L1140 0 L1170 30 L1200 0 L1200 40 L0 40 Z"
            fill={color}
            stroke="#111111"
            strokeWidth="3"
          />
        </svg>
      )}
      {type === "torn" && (
        <svg
          className="relative block w-full h-10 sm:h-14"
          viewBox="0 0 1200 50"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 10 Q100 45 250 15 Q400 35 600 10 Q800 40 1000 15 Q1100 25 1200 10 L1200 50 L0 50 Z"
            fill={color}
            stroke="#111111"
            strokeWidth="3"
          />
        </svg>
      )}
    </div>
  );
};
