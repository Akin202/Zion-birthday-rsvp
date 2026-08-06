import React from "react";
import clsx from "clsx";
import { Plus, Minus } from "lucide-react";

export interface StepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 10,
  label,
  className = "",
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="font-display text-lg uppercase tracking-wider text-[#111111]">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label={`Decrement ${label || "value"}`}
          className="w-12 h-12 min-w-[48px] min-h-[48px] bg-[#E23636] text-white font-display text-2xl border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Minus className="w-6 h-6 stroke-[3]" />
        </button>

        <div className="min-w-[60px] h-12 min-h-[48px] bg-white border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center px-3 font-display text-2xl text-[#111111]">
          {value}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label={`Increment ${label || "value"}`}
          className="w-12 h-12 min-w-[48px] min-h-[48px] bg-[#00AEEF] text-white font-display text-2xl border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
