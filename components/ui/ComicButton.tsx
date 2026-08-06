import React from "react";
import clsx from "clsx";

export interface ComicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

export const ComicButton = React.forwardRef<HTMLButtonElement, ComicButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      className = "",
      onClick,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const variantClasses =
      variant === "primary"
        ? "bg-[#E23636] text-white hover:bg-[#c92d2d]"
        : variant === "secondary"
        ? "bg-[#1B4C9B] text-white hover:bg-[#153e80]"
        : variant === "accent"
        ? "bg-[#FFD700] text-[#111111] hover:bg-[#e6c200]"
        : "bg-[#FF4081] text-white hover:bg-[#e0336f]";

    const sizeClasses =
      size === "sm"
        ? "text-base py-2 px-4 min-h-[48px]"
        : size === "lg"
        ? "text-2xl sm:text-3xl py-4 px-8 min-h-[60px]"
        : "text-xl sm:text-2xl py-3 px-6 min-h-[52px]";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={clsx(
          "font-display uppercase tracking-wider border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] transition-all duration-150 flex items-center justify-center text-center cursor-pointer select-none active:translate-x-[4px] active:translate-y-[4px] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111111] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[4px_4px_0px_#111111]",
          variantClasses,
          sizeClasses,
          fullWidth ? "w-full" : "inline-flex",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ComicButton.displayName = "ComicButton";
