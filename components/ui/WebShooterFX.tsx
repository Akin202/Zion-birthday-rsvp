import React, { useState, useEffect, useCallback } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Volume2, VolumeX, Sparkles } from "lucide-react";

interface WebShot {
  id: number;
  x: number;
  y: number;
  sound: string;
  originX: number;
  originY: number;
}

const SOUND_EFFECTS = ["THWIP!", "ZIP!", "WEB-SLING!", "BOOM!", "SPIDER-SENSE!", "THWIP!"];

export const WebShooterFX: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [shots, setShots] = useState<WebShot[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Play synthesized "Thwip!" sound effect using Web Audio API
  const playThwipAudio = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Quick noise + frequency sweep for "thwip" whip sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      // Ignore audio policy restrictions
    }
  }, [soundEnabled]);

  const triggerShotAt = useCallback(
    (x: number, y: number) => {
      const newId = Date.now() + Math.random();
      const randomSound = SOUND_EFFECTS[Math.floor(Math.random() * SOUND_EFFECTS.length)];
      
      // Origin point: bottom center or bottom corners
      const originX = x < window.innerWidth / 2 ? 20 : window.innerWidth - 20;
      const originY = window.innerHeight;

      const newShot: WebShot = {
        id: newId,
        x,
        y,
        sound: randomSound,
        originX,
        originY,
      };

      setShots((prev) => [...prev.slice(-5), newShot]);
      playThwipAudio();

      setTimeout(() => {
        setShots((prev) => prev.filter((s) => s.id !== newId));
      }, 1000);
    },
    [playThwipAudio]
  );

  // Handle global click to shoot web
  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleGlobalClick = (e: MouseEvent) => {
      // Don't trigger if clicked directly on an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("button") ||
        target.closest("a")
      ) {
        return;
      }
      triggerShotAt(e.clientX, e.clientY);
    };

    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [triggerShotAt, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <>
      {/* Floating Sound & Manual Web Shooter Toggle Widget */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => triggerShotAt(window.innerWidth / 2, window.innerHeight / 3)}
          className="bg-[#E62429] text-white font-display text-sm sm:text-base px-3 py-2 border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] hover:bg-[#c91c21] transition-transform active:translate-y-1 flex items-center gap-1.5 cursor-pointer uppercase"
        >
          <Sparkles className="w-4 h-4 text-[#FFD700]" />
          <span>THWIP WEB!</span>
        </button>

        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="bg-[#111111] text-[#FFD700] p-2 sm:p-2.5 border-[2px] border-[#FFD700] shadow-[2px_2px_0px_#E62429] hover:scale-105 transition-transform cursor-pointer"
          title={soundEnabled ? "Mute Web Audio" : "Enable Web Audio"}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-[#FFD700]" />
          ) : (
            <VolumeX className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      {/* Render Active Web Shots Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {shots.map((shot) => {
          return (
            <div key={shot.id} className="absolute inset-0">
              {/* SVG Web Thread Line */}
              <svg className="absolute inset-0 w-full h-full">
                <line
                  x1={shot.originX}
                  y1={shot.originY}
                  x2={shot.x}
                  y2={shot.y}
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeDasharray="6 2"
                  className="animate-pulse"
                />
                <line
                  x1={shot.originX}
                  y1={shot.originY}
                  x2={shot.x}
                  y2={shot.y}
                  stroke="#111111"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Spiderweb Target Splatter SVG at Click Point */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-ping opacity-80"
                style={{ left: shot.x, top: shot.y }}
              >
                <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                  <path d="M50 0 L50 100 M0 50 L100 50 M15 15 L85 85 M15 85 L85 15" stroke="#FFFFFF" strokeWidth="3" />
                  <circle cx="50" cy="50" r="15" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
                  <circle cx="50" cy="50" r="35" stroke="#FFFFFF" strokeWidth="2" fill="none" />
                  <circle cx="50" cy="50" r="8" fill="#E62429" />
                </svg>
              </div>

              {/* Comic Sound Effect Pop Badge */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-full font-display text-xl sm:text-2xl text-[#111111] bg-[#FFD700] border-[3px] border-[#111111] shadow-[4px_4px_0px_#E62429] px-4 py-1 -rotate-6 animate-bounce uppercase tracking-widest z-50 whitespace-nowrap"
                style={{ left: shot.x, top: shot.y - 10 }}
              >
                ⚡ {shot.sound} ⚡
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
