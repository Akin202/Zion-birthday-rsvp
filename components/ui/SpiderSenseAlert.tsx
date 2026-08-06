import React from "react";
import clsx from "clsx";

export interface SpiderSenseAlertProps {
  children?: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const SpiderSenseAlert: React.FC<SpiderSenseAlertProps> = ({
  children,
  active = true,
  className = "",
}) => {
  return (
    <div className={clsx("relative inline-block", className)}>
      {active && (
        <>
          {/* Top / Left / Right Spider-Sense Radiating Wavy Lines SVG */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-[280px] pointer-events-none z-20 flex justify-between px-2">
            <svg
              className="w-12 h-8 text-[#FFD700] animate-bounce opacity-90"
              viewBox="0 0 50 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            >
              <path d="M5 25 Q15 5 25 15 T45 5" />
            </svg>
            <svg
              className="w-12 h-8 text-[#FF5722] animate-bounce opacity-90 delay-100"
              viewBox="0 0 50 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            >
              <path d="M5 5 Q15 25 25 15 T45 25" />
            </svg>
          </div>

          {/* Electric Pulse Halo */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#FFD700] via-[#FF5722] to-[#E62429] rounded-lg opacity-40 blur-sm animate-pulse pointer-events-none z-0" />
        </>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
};
