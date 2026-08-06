import React from "react";
import clsx from "clsx";

export interface ToggleOption<T> {
  label: string;
  value: T;
  color?: string; // custom active color
  icon?: React.ReactNode;
}

export interface ToggleChoiceProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: ToggleOption<T>[];
  label?: string;
  className?: string;
}

export function ToggleChoice<T extends string | boolean | number>({
  value,
  onChange,
  options,
  label,
  className = "",
}: ToggleChoiceProps<T>) {
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {label && (
        <label className="font-display text-lg uppercase tracking-wider text-[#111111]">
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(opt.value)}
              className={clsx(
                "min-h-[52px] px-4 py-3 border-[3px] border-[#111111] font-display text-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 select-none",
                isSelected
                  ? opt.color || "bg-[#FFD700] text-[#111111] shadow-[4px_4px_0px_#111111] -translate-y-1"
                  : "bg-white text-[#111111] opacity-80 shadow-[2px_2px_0px_#111111] hover:opacity-100 hover:shadow-[3px_3px_0px_#111111]"
              )}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
