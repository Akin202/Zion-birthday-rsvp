import React from "react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { eventConfig } from "../config/event.config";
import { WebCorner } from "./ui/WebCorner";
import { BurstBadge } from "./ui/BurstBadge";
import { ComicButton } from "./ui/ComicButton";
import { SpiderMaskIcon } from "./ui/SpiderMaskIcon";
import { SpiderEmblem } from "./ui/SpiderEmblem";
import { SpiderSenseAlert } from "./ui/SpiderSenseAlert";
import { SwingingSpider } from "./ui/SwingingSpider";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Calendar, Clock, Sparkles, Zap } from "lucide-react";

export const Hero: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const handleRsvpScroll = () => {
    const rsvpElement = document.getElementById("rsvp");
    if (rsvpElement) {
      rsvpElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <section className="relative min-h-screen w-full bg-gradient-to-b from-[#114593] via-[#154785] to-[#0B0E14] text-white flex flex-col justify-between overflow-hidden px-4 sm:px-8 py-8 sm:py-12 border-b-[5px] border-[#111111]">
        {/* Halftone Overlay */}
        <div className="absolute inset-0 bg-halftone-white pointer-events-none opacity-25 z-0" />

        {/* Decorative Spider Web Corners */}
        <WebCorner position="top-left" color="#FFD700" size={150} />
        <WebCorner position="top-right" color="#E62429" size={150} />
        <WebCorner position="bottom-left" color="#E62429" size={140} />
        <WebCorner position="bottom-right" color="#FFD700" size={140} />

        {/* Hanging Swinging Spider-Man Widget in top right */}
        <div className="absolute top-0 right-12 sm:right-24 z-30">
          <SwingingSpider />
        </div>

        {/* Background Celebrant Photo at 15% opacity */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-15">
          <img
            src={eventConfig.celebrant.photoUrl}
            alt={eventConfig.celebrant.fullName}
            className="w-full h-full object-cover grayscale contrast-150"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Header Bar */}
        <div className="relative z-20 w-full max-w-5xl mx-auto flex items-center justify-between pt-2">
          <div className="inline-flex items-center gap-2 bg-[#111111] text-[#FFD700] border-2 border-[#FFD700] px-3.5 py-1.5 font-display text-sm sm:text-base tracking-wider uppercase shadow-[3px_3px_0px_#E62429]">
            <SpiderMaskIcon size={22} glow={false} />
            <span>ZION'S SPIDER-VERSE EDITION</span>
          </div>

          <div className="font-display text-xs sm:text-sm uppercase text-[#FFD700] bg-[#111111]/90 px-3 py-1.5 border border-[#FFD700]/50 rounded-sm flex items-center gap-1.5 shadow-[2px_2px_0px_#114593]">
            <Zap className="w-4 h-4 text-[#E62429] fill-[#E62429]" />
            <span>ISSUE #7 • SPECIAL RELEASE</span>
          </div>
        </div>

        {/* Main Hero Content Container */}
        <div className="relative z-20 w-full max-w-4xl mx-auto my-auto flex flex-col items-center text-center py-6 sm:py-10">
          {/* Welcome Eyebrow Speech Bubble with Spider-Sense Alert */}
          <m.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: -20 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <SpiderSenseAlert>
              <div className="bg-[#FFD700] text-[#111111] font-display text-lg sm:text-2xl uppercase tracking-wider border-[3.5px] border-[#111111] shadow-[5px_5px_0px_#E62429] px-6 py-2.5 inline-flex items-center gap-2 -rotate-2">
                <SpiderEmblem size={24} color="#111111" />
                <span>{eventConfig.copy.welcomeHeadline}</span>
                <Sparkles className="w-5 h-5 text-[#E62429]" />
              </div>
            </SpiderSenseAlert>
          </m.div>

          {/* Staggered Main Headline - 3 Lines */}
          <m.h1
            initial={shouldReduceMotion ? {} : { scale: 0.8, rotate: -2, opacity: 0 }}
            animate={shouldReduceMotion ? {} : { scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="font-display text-4xl sm:text-7xl md:text-8xl uppercase tracking-wider text-white leading-[0.9] my-3 text-shadow-hero drop-shadow-[6px_6px_0px_#111111] flex flex-col items-center gap-1"
          >
            <span className="block">Zion's 7th Birthday</span>
            <span className="block text-[#FFD700]">Spider-Verse</span>
            <span className="block">Celebration</span>
          </m.h1>

          <p className="font-body text-xl sm:text-2xl font-bold text-[#FFD700] max-w-2xl mt-1 mb-4 drop-shadow-[2px_2px_0px_#111111]">
            {eventConfig.copy.welcomeSubtext}
          </p>

          {/* Burst Badge */}
          <m.div
            initial={shouldReduceMotion ? {} : { scale: 0, rotate: 15 }}
            animate={shouldReduceMotion ? {} : { scale: 1, rotate: -3 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.5 }}
            className="my-3"
          >
            <BurstBadge
              text={`🕷️ ${eventConfig.celebrant.name} IS TURNING ${eventConfig.celebrant.age}! 🕷️`}
              color="#E62429"
              textColor="#FFFFFF"
              size="lg"
              rotate={-3}
            />
          </m.div>

          {/* Event Date & Time Banner */}
          <m.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="mt-4 mb-8 bg-[#FDF6E3] text-[#111111] border-[3.5px] border-[#111111] shadow-[7px_7px_0px_#111111] p-4 sm:p-5 max-w-lg w-full font-body text-base sm:text-lg rotate-1 relative"
          >
            {/* Top spider emblem badge on banner */}
            <div className="absolute -top-4 -left-4 bg-[#111111] text-[#FFD700] p-1.5 border-2 border-[#FFD700] rounded-full shadow-[2px_2px_0px_#E62429]">
              <SpiderMaskIcon size={24} />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2 font-bold text-[#E62429]">
                <Calendar className="w-5 h-5 stroke-[2.5]" />
                <span>{eventConfig.event.dateDisplay}</span>
              </div>
              <div className="hidden sm:block text-slate-400">•</div>
              <div className="flex items-center gap-2 font-bold text-[#114593]">
                <Clock className="w-5 h-5 stroke-[2.5]" />
                <span>{eventConfig.event.timeDisplay}</span>
              </div>
            </div>
          </m.div>

          {/* Primary Call to Action Button */}
          <m.div
            initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <ComicButton
              onClick={handleRsvpScroll}
              variant="accent"
              size="lg"
              className="px-10 py-5 text-2xl sm:text-3xl shadow-[7px_7px_0px_#E62429] hover:shadow-[3px_3px_0px_#E62429] gap-3"
            >
              <span>🕷️ SLING YOUR RSVP NOW 🚀</span>
            </ComicButton>
          </m.div>
        </div>

        {/* City Skyline Silhouette at Bottom with Web Thread lines */}
        <div className="relative z-10 w-full mt-auto pt-6">
          <svg
            className="w-full h-20 sm:h-28 text-[#0B0E14] fill-current"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 120 L0 80 L30 80 L30 50 L60 50 L60 90 L90 90 L90 40 L120 40 L120 95 L150 95 L150 20 L200 20 L200 90 L240 90 L240 60 L280 60 L280 100 L320 100 L320 30 L370 30 L370 85 L410 85 L410 10 L470 10 L470 90 L520 90 L520 45 L580 45 L580 100 L620 100 L620 25 L680 25 L680 85 L730 85 L730 50 L780 50 L780 95 L830 95 L830 15 L890 15 L890 90 L940 90 L940 40 L1000 40 L1000 85 L1060 85 L1060 30 L1120 30 L1120 90 L1200 90 L1200 120 Z" />
            {/* Spiderweb Thread connecting across rooftops */}
            <path d="M150 20 Q310 -10 470 10" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 2" fill="none" opacity="0.4" />
            <path d="M620 25 Q755 -5 890 15" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 2" fill="none" opacity="0.4" />
          </svg>
        </div>
      </section>
    </LazyMotion>
  );
};

