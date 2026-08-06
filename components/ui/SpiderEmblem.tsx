import React from "react";
import clsx from "clsx";

export interface SpiderEmblemProps {
  className?: string;
  size?: number;
  color?: string; // fill color e.g. "#111111" or "#E62429"
}

export const SpiderEmblem: React.FC<SpiderEmblemProps> = ({
  className = "",
  size = 36,
  color = "#111111",
}) => {
  return (
    <div className={clsx("inline-flex items-center justify-center select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[1.5px_1.5px_0px_#111111]"
      >
        {/* Head */}
        <circle cx="50" cy="30" r="8" fill={color} stroke="#111111" strokeWidth="2" />
        {/* Abdomen / Body */}
        <ellipse cx="50" cy="58" rx="12" ry="20" fill={color} stroke="#111111" strokeWidth="2" />

        {/* Top Legs Left */}
        <path d="M48 28 C30 10 15 15 8 28" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M48 32 C25 22 12 30 5 45" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Top Legs Right */}
        <path d="M52 28 C70 10 85 15 92 28" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M52 32 C75 22 88 30 95 45" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Bottom Legs Left */}
        <path d="M48 55 C22 55 10 70 8 92" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M48 62 C28 68 18 80 15 98" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Bottom Legs Right */}
        <path d="M52 55 C78 55 90 70 92 92" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M52 62 C72 68 82 80 85 98" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
};
