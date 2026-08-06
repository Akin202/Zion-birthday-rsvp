import React from "react";
import clsx from "clsx";

export interface SpiderMaskIconProps {
  className?: string;
  size?: number; // width in px
  glow?: boolean;
}

export const SpiderMaskIcon: React.FC<SpiderMaskIconProps> = ({
  className = "",
  size = 48,
  glow = true,
}) => {
  return (
    <div className={clsx("relative inline-block select-none pointer-events-none", className)}>
      <svg
        width={size}
        height={size * 1.15}
        viewBox="0 0 100 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[2px_2px_0px_#111111]"
      >
        {/* Spider Mask Outer Contour */}
        <path
          d="M50 5 C25 5 5 30 5 65 C5 95 35 110 50 112 C65 110 95 95 95 65 C95 30 75 5 50 5 Z"
          fill="#E62429"
          stroke="#111111"
          strokeWidth="4"
        />

        {/* Mask Webbing Overlay Lines */}
        {/* Vertical center web line */}
        <path d="M50 5 L50 112" stroke="#111111" strokeWidth="2.5" opacity="0.8" />
        {/* Radial webbing diagonals */}
        <path d="M50 35 L12 20" stroke="#111111" strokeWidth="2" opacity="0.7" />
        <path d="M50 35 L88 20" stroke="#111111" strokeWidth="2" opacity="0.7" />
        <path d="M50 65 L8 75" stroke="#111111" strokeWidth="2" opacity="0.7" />
        <path d="M50 65 L92 75" stroke="#111111" strokeWidth="2" opacity="0.7" />
        <path d="M50 90 L22 105" stroke="#111111" strokeWidth="2" opacity="0.7" />
        <path d="M50 90 L78 105" stroke="#111111" strokeWidth="2" opacity="0.7" />

        {/* Concentric Web Arcs */}
        <path d="M30 20 Q50 30 70 20" stroke="#111111" strokeWidth="2" fill="none" opacity="0.7" />
        <path d="M20 40 Q50 55 80 40" stroke="#111111" strokeWidth="2" fill="none" opacity="0.7" />
        <path d="M15 70 Q50 85 85 70" stroke="#111111" strokeWidth="2" fill="none" opacity="0.7" />

        {/* Left Eye Black Border */}
        <path
          d="M18 42 C28 35 44 48 44 58 C44 68 22 72 16 62 C12 55 12 46 18 42 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="2"
        />
        {/* Left Eye White Lens */}
        <path
          d="M21 45 C28 40 40 50 40 57 C40 64 24 67 19 60 C16 54 16 48 21 45 Z"
          fill="#FFFFFF"
          className={glow ? "animate-pulse" : ""}
        />

        {/* Right Eye Black Border */}
        <path
          d="M82 42 C72 35 56 48 56 58 C56 68 78 72 84 62 C88 55 88 46 82 42 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="2"
        />
        {/* Right Eye White Lens */}
        <path
          d="M79 45 C72 40 60 50 60 57 C60 64 76 67 81 60 C84 54 84 48 79 45 Z"
          fill="#FFFFFF"
          className={glow ? "animate-pulse" : ""}
        />
      </svg>
    </div>
  );
};
