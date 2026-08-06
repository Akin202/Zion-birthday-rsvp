import React from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const COLORS = ["#E23636", "#1B4C9B", "#FFD700", "#FF4081", "#00AEEF", "#111111"];

export const ConfettiBurst: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return null;
  }

  // Generate 30 deterministic particles with random directions/rotations
  const particles = Array.from({ length: 32 }).map((_, i) => {
    const color = COLORS[i % COLORS.length];
    const angle = (i / 32) * 360;
    const distance = 80 + (i % 5) * 25; // 80px - 180px
    const size = 8 + (i % 3) * 4; // 8px - 16px
    const rotation = (i * 45) % 360;
    const isSquare = i % 2 === 0;

    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * distance;
    const ty = Math.sin(rad) * distance - 20; // slight upward lift

    return {
      id: i,
      color,
      tx,
      ty,
      size,
      rotation,
      isSquare,
      delay: (i % 4) * 0.05,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-20">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute border-2 border-[#111111] animate-confetti-pop opacity-0"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.isSquare ? "2px" : "50%",
            transform: `rotate(${p.rotation}deg)`,
            // Custom CSS properties for particle animation trajectory
            ["--tx" as any]: `${p.tx}px`,
            ["--ty" as any]: `${p.ty}px`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiPop {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(0.3) rotate(0deg);
          }
          70% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(1.1) rotate(360deg);
          }
        }
        .animate-confetti-pop {
          animation: confettiPop 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
