import React from "react";
import clsx from "clsx";

export interface HalftoneBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  color?: string; // dot color string e.g. "rgba(17,17,17,0.15)"
  dotSize?: number; // default 12
  className?: string;
  bg?: string;
}

export const HalftoneBackground: React.FC<HalftoneBackgroundProps> = ({
  children,
  color = "rgba(17,17,17,0.15)",
  dotSize = 12,
  className = "",
  bg = "bg-[#FDF6E3]",
  style,
  ...props
}) => {
  const halftoneStyle: React.CSSProperties = {
    backgroundImage: `radial-gradient(${color} 18%, transparent 19%)`,
    backgroundSize: `${dotSize}px ${dotSize}px`,
    ...style,
  };

  return (
    <div className={clsx("relative overflow-hidden", bg, className)} style={halftoneStyle} {...props}>
      {children}
    </div>
  );
};
