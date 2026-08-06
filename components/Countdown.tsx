import React, { useEffect, useState } from "react";
import { eventConfig } from "../config/event.config";
import { ComicPanel } from "./ui/ComicPanel";
import { SpiderMaskIcon } from "./ui/SpiderMaskIcon";
import { SpiderEmblem } from "./ui/SpiderEmblem";
import { Timer, Zap } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const Countdown: React.FC = () => {
  const targetDateStr = eventConfig.event.date;

  const calculateTimeLeft = (): TimeLeft => {
    const difference = +new Date(targetDateStr) - +new Date();
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isPast: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDateStr]);

  return (
    <section className="relative py-12 sm:py-16 px-4 bg-[#FDF6E3] bg-halftone-red border-b-[5px] border-[#111111] overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
        {/* Section Heading Banner */}
        <div className="inline-flex items-center gap-2.5 bg-[#E62429] text-white font-display text-2xl sm:text-3xl uppercase tracking-wider px-6 py-2.5 border-[3.5px] border-[#111111] shadow-[5px_5px_0px_#111111] -rotate-1 mb-8">
          <SpiderMaskIcon size={28} />
          <span>COUNTDOWN TO SPIDER-HQ PARTY</span>
          <Zap className="w-6 h-6 fill-[#FFD700] text-[#111111]" />
        </div>

        {/* Fixed Height Container */}
        <div className="w-full min-h-[180px] sm:min-h-[200px] flex items-center justify-center">
          {!mounted ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] animate-pulse" />
              ))}
            </div>
          ) : timeLeft.isPast ? (
            <div className="bg-[#FFD700] border-[4px] border-[#111111] shadow-[6px_6px_0px_#111111] p-6 sm:p-8 text-center rotate-1">
              <h3 className="font-display text-4xl sm:text-6xl uppercase text-[#E62429] drop-shadow-[2px_2px_0px_#111111]">
                🎉 THE SPIDER-HQ PARTY HAS STARTED! 🎉
              </h3>
              <p className="font-body text-xl text-[#111111] mt-2 font-bold">
                Join us right now at {eventConfig.event.venueName}!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl">
              <ComicPanel rotate={-1} bg="bg-white" className="text-center p-4 hover:scale-105 transition-transform duration-200">
                <div className="font-display text-5xl sm:text-6xl text-[#E62429] leading-none mb-1">
                  {String(timeLeft.days).padStart(2, "0")}
                </div>
                <div className="font-display text-base sm:text-lg uppercase tracking-wider text-[#111111] bg-[#FFD700] border border-[#111111] py-0.5 px-3.5 inline-flex items-center gap-1">
                  <SpiderEmblem size={14} color="#111111" />
                  <span>DAYS</span>
                </div>
              </ComicPanel>

              <ComicPanel rotate={1} bg="bg-white" className="text-center p-4 hover:scale-105 transition-transform duration-200">
                <div className="font-display text-5xl sm:text-6xl text-[#114593] leading-none mb-1">
                  {String(timeLeft.hours).padStart(2, "0")}
                </div>
                <div className="font-display text-base sm:text-lg uppercase tracking-wider text-white bg-[#114593] border border-[#111111] py-0.5 px-3.5 inline-flex items-center gap-1">
                  <span>HOURS</span>
                </div>
              </ComicPanel>

              <ComicPanel rotate={-2} bg="bg-white" className="text-center p-4 hover:scale-105 transition-transform duration-200">
                <div className="font-display text-5xl sm:text-6xl text-[#00AEEF] leading-none mb-1">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </div>
                <div className="font-display text-base sm:text-lg uppercase tracking-wider text-[#111111] bg-[#FFD700] border border-[#111111] py-0.5 px-3.5 inline-flex items-center gap-1">
                  <span>MINUTES</span>
                </div>
              </ComicPanel>

              <ComicPanel rotate={2} bg="bg-white" className="text-center p-4 hover:scale-105 transition-transform duration-200">
                <div className="font-display text-5xl sm:text-6xl text-[#E62429] leading-none mb-1">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </div>
                <div className="font-display text-base sm:text-lg uppercase tracking-wider text-white bg-[#E62429] border border-[#111111] py-0.5 px-3.5 inline-flex items-center gap-1">
                  <span>SECONDS</span>
                </div>
              </ComicPanel>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

