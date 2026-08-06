import React, { useState } from "react";
import { SpiderMaskIcon } from "./SpiderMaskIcon";

export interface SwingingSpiderProps {
  className?: string;
}

export const SwingingSpider: React.FC<SwingingSpiderProps> = ({ className = "" }) => {
  const [flipped, setFlipped] = useState(false);
  const [soundText, setSoundText] = useState<string | null>(null);

  const handleClick = () => {
    setFlipped(true);
    const sounds = ["THWIP!", "ZIP!", "GO ZION!", "WEB SLING!", "BOOM!"];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    setSoundText(randomSound);

    setTimeout(() => {
      setFlipped(false);
      setSoundText(null);
    }, 1200);
  };

  return (
    <div className={`relative flex flex-col items-center pointer-events-auto ${className}`}>
      {/* Web Thread Line from top */}
      <div className="w-[3px] bg-white border-l border-r border-[#111111] h-16 sm:h-24 animate-pulse origin-top" />

      {/* Spider-Man Hanging Pose Container */}
      <div
        onClick={handleClick}
        className={`cursor-pointer transition-transform duration-500 transform hover:scale-110 active:scale-95 ${
          flipped ? "rotate-[360deg] scale-125" : "hover:rotate-6"
        }`}
        title="Click Spidey for a Web Shot!"
      >
        {/* Comic Sound Callout Bubble when clicked */}
        {soundText && (
          <div className="absolute -top-10 -right-16 bg-[#FFD700] text-[#111111] font-display text-base sm:text-lg px-3 py-1 border-2 border-[#111111] shadow-[3px_3px_0px_#111111] animate-bounce z-30 uppercase whitespace-nowrap -rotate-6">
            ⚡ {soundText} ⚡
          </div>
        )}

        {/* Upside Down Spidey Mask Badge */}
        <div className="relative rotate-180 bg-[#E62429] p-2 border-[3px] border-[#111111] rounded-full shadow-[4px_4px_0px_#111111] flex items-center justify-center">
          <SpiderMaskIcon size={44} glow />
        </div>
      </div>
    </div>
  );
};
