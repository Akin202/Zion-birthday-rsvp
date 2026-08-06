import React from "react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { eventConfig } from "../config/event.config";
import { BurstBadge } from "./ui/BurstBadge";
import { HalftoneBackground } from "./ui/HalftoneBackground";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Flame, Star } from "lucide-react";

export const WhatToExpect: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const colors = [
    { bg: "#FF4081", text: "#FFFFFF", rotate: -3 },
    { bg: "#FFD700", text: "#111111", rotate: 3 },
    { bg: "#00AEEF", text: "#FFFFFF", rotate: -4 },
    { bg: "#E23636", text: "#FFFFFF", rotate: 2 },
    { bg: "#1B4C9B", text: "#FFFFFF", rotate: -2 },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <HalftoneBackground
        bg="bg-[#111111]"
        color="rgba(255, 215, 0, 0.2)"
        dotSize={16}
        className="py-16 sm:py-24 px-4 sm:px-8 border-b-[4px] border-[#111111] text-white"
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Header */}
          <div className="inline-flex items-center gap-2 bg-[#FFD700] text-[#111111] font-display text-lg sm:text-2xl uppercase tracking-wider px-5 py-2 border-[3px] border-[#111111] shadow-[4px_4px_0px_#FF4081] rotate-1 mb-4">
            <Flame className="w-5 h-5 text-[#E23636] fill-[#E23636]" />
            <span>ACTION-PACKED PROGRAM</span>
            <Star className="w-5 h-5 text-[#E23636] fill-[#E23636]" />
          </div>

          <h2 className="font-display text-5xl sm:text-7xl uppercase tracking-wider text-white drop-shadow-[4px_4px_0px_#E23636] mb-4">
            WHAT TO EXPECT
          </h2>

          <p className="font-body text-xl sm:text-2xl text-[#FFD700] font-bold max-w-2xl mb-12">
            Non-stop action, delicious treats, and epic fun for every hero!
          </p>

          {/* Activities Badges Grid */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 max-w-4xl">
            {eventConfig.activities.map((activity, idx) => {
              const colorTheme = colors[idx % colors.length];
              return (
                <m.div
                  key={activity}
                  initial={
                    shouldReduceMotion
                      ? {}
                      : { scale: 0, rotate: colorTheme.rotate * 3, opacity: 0 }
                  }
                  whileInView={
                    shouldReduceMotion
                      ? {}
                      : { scale: 1, rotate: colorTheme.rotate, opacity: 1 }
                  }
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                    delay: idx * 0.12,
                  }}
                  className="cursor-pointer hover:scale-110 transition-transform duration-200"
                >
                  <BurstBadge
                    text={activity}
                    color={colorTheme.bg}
                    textColor={colorTheme.text}
                    size="lg"
                    rotate={colorTheme.rotate}
                  />
                </m.div>
              );
            })}
          </div>
        </div>
      </HalftoneBackground>
    </LazyMotion>
  );
};
