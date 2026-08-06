import React from "react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { eventConfig } from "../config/event.config";
import { BurstBadge } from "./ui/BurstBadge";
import { HalftoneBackground } from "./ui/HalftoneBackground";
import { SpiderMaskIcon } from "./ui/SpiderMaskIcon";
import { SpiderEmblem } from "./ui/SpiderEmblem";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Flame, Star } from "lucide-react";

export const WhatToExpect: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const colors = [
    { bg: "#E62429", text: "#FFFFFF", rotate: -3 },
    { bg: "#FFD700", text: "#111111", rotate: 3 },
    { bg: "#114593", text: "#FFFFFF", rotate: -4 },
    { bg: "#00AEEF", text: "#FFFFFF", rotate: 2 },
    { bg: "#FF5722", text: "#FFFFFF", rotate: -2 },
    { bg: "#E62429", text: "#FFFFFF", rotate: 3 },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <HalftoneBackground
        bg="bg-[#0B0E14]"
        color="rgba(230, 36, 41, 0.25)"
        dotSize={16}
        className="py-16 sm:py-24 px-4 sm:px-8 border-b-[5px] border-[#111111] text-white relative overflow-hidden"
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 bg-[#FFD700] text-[#111111] font-display text-lg sm:text-2xl uppercase tracking-wider px-5 py-2 border-[3.5px] border-[#111111] shadow-[4px_4px_0px_#E62429] rotate-1 mb-4">
            <SpiderMaskIcon size={24} />
            <span>ACTION-PACKED SPIDER-VERSE PROGRAM</span>
            <Star className="w-5 h-5 text-[#E62429] fill-[#E62429]" />
          </div>

          <h2 className="font-display text-5xl sm:text-7xl uppercase tracking-wider text-white drop-shadow-[5px_5px_0px_#E62429] mb-4">
            WHAT TO EXPECT AT SPIDER HQ
          </h2>

          <p className="font-body text-xl sm:text-2xl text-[#FFD700] font-bold max-w-2xl mb-12 drop-shadow-[2px_2px_0px_#111111]">
            Non-stop web-slinging action, Spider-Man treats, and epic hero missions for every guest!
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
                  className="cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200"
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

          <div className="mt-12 inline-flex items-center gap-2 bg-[#111111] text-[#FFD700] px-4 py-2 border-2 border-[#FFD700] rounded-sm font-display text-sm tracking-wider uppercase">
            <SpiderEmblem size={20} color="#FFD700" />
            <span>SUIT UP • GET READY TO THWIP!</span>
          </div>
        </div>
      </HalftoneBackground>
    </LazyMotion>
  );
};

