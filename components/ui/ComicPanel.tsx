import React from "react";
import clsx from "clsx";

export interface ComicPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  rotate?: number; // -2 to 2 degrees
  className?: string;
  shadow?: "normal" | "large" | "sm" | "none";
  bg?: string;
}

export const ComicPanel: React.FC<ComicPanelProps> = ({
  children,
  rotate = 0,
  className = "",
  shadow = "normal",
  bg = "bg-[#FDF6E3]",
  style,
  ...props
}) => {
  const rotateClass =
    rotate === -2
      ? "-rotate-2"
      : rotate === -1
      ? "-rotate-1"
      : rotate === 1
      ? "rotate-1"
      : rotate === 2
      ? "rotate-2"
      : "";

  const shadowClass =
    shadow === "large"
      ? "shadow-[8px_8px_0px_#111111]"
      : shadow === "sm"
      ? "shadow-[2px_2px_0px_#111111]"
      : shadow === "normal"
      ? "shadow-[4px_4px_0px_#111111]"
      : "";

  return (
    <div
      className={clsx(
        "border-[3px] border-[#111111] p-4 sm:p-6 transition-transform duration-200 relative",
        bg,
        shadowClass,
        rotateClass,
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};
