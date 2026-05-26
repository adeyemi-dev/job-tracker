"use client";

import { useEffect, useMemo } from "react";

const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#8b5cf6","#f97316","#14b8a6","#facc15"];

interface Particle {
  id: number;
  x: number;
  color: string;
  w: number;
  h: number;
  duration: number;
  delay: number;
  endRotation: number;
  isCircle: boolean;
}

interface Props {
  onDone: () => void;
}

export function ConfettiCelebration({ onDone }: Props) {
  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      w: 6 + Math.random() * 8,
      h: 5 + Math.random() * 7,
      duration: 2.5 + Math.random() * 2,
      delay: Math.random() * 0.9,
      endRotation: (Math.floor(Math.random() * 4) + 1) * 360 * (Math.random() > 0.5 ? 1 : -1),
      isCircle: Math.random() > 0.55,
    })),
  []);

  // Remove after all particles have landed
  useEffect(() => {
    const timer = setTimeout(onDone, 4500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{`
        @keyframes jt-confetti-fall {
          0%   { transform: translateY(-16px) rotate(0deg); opacity: 1; }
          75%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(var(--end-rot)); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 0,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : "2px",
            "--end-rot": `${p.endRotation}deg`,
            animation: `jt-confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(0.4,0,0.8,1) forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
