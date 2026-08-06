import React from "react";
import clsx from "clsx";

export interface SpeechBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tailPosition?:
    | "bottom-left"
    | "bottom-right"
    | "bottom-center"
    | "top-left"
    | "top-right"
    | "top-center"
    | "left"
    | "right";
  bg?: string;
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  children,
  tailPosition = "bottom-left",
  bg = "bg-[#FDF6E3]",
  className = "",
  ...props
}) => {
  return (
    <div
      className={clsx(
        "relative border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] p-4 sm:p-6 rounded-2xl",
        bg,
        className
      )}
      {...props}
    >
      {children}
      {tailPosition === "bottom-left" && (
        <div className="absolute -bottom-4 left-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-[#111111] after:content-[''] after:absolute after:-top-[19px] after:-left-[9px] after:w-0 after:h-0 after:border-l-[9px] after:border-l-transparent after:border-r-[9px] after:border-r-transparent after:border-t-[13px] after:border-t-[#FDF6E3]" />
      )}
      {tailPosition === "bottom-right" && (
        <div className="absolute -bottom-4 right-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-[#111111] after:content-[''] after:absolute after:-top-[19px] after:-left-[9px] after:w-0 after:h-0 after:border-l-[9px] after:border-l-transparent after:border-r-[9px] after:border-r-transparent after:border-t-[13px] after:border-t-[#FDF6E3]" />
      )}
      {tailPosition === "bottom-center" && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-[#111111] after:content-[''] after:absolute after:-top-[19px] after:-left-[9px] after:w-0 after:h-0 after:border-l-[9px] after:border-l-transparent after:border-r-[9px] after:border-r-transparent after:border-t-[13px] after:border-t-[#FDF6E3]" />
      )}
      {tailPosition === "top-left" && (
        <div className="absolute -top-4 left-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-[#111111] after:content-[''] after:absolute after:top-[3px] after:-left-[9px] after:w-0 after:h-0 after:border-l-[9px] after:border-l-transparent after:border-r-[9px] after:border-r-transparent after:border-b-[13px] after:border-b-[#FDF6E3]" />
      )}
      {tailPosition === "top-right" && (
        <div className="absolute -top-4 right-6 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-[#111111] after:content-[''] after:absolute after:top-[3px] after:-left-[9px] after:w-0 after:h-0 after:border-l-[9px] after:border-l-transparent after:border-r-[9px] after:border-r-transparent after:border-b-[13px] after:border-b-[#FDF6E3]" />
      )}
      {tailPosition === "top-center" && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-[#111111] after:content-[''] after:absolute after:top-[3px] after:-left-[9px] after:w-0 after:h-0 after:border-l-[9px] after:border-l-transparent after:border-r-[9px] after:border-r-transparent after:border-b-[13px] after:border-b-[#FDF6E3]" />
      )}
    </div>
  );
};
