"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle" | "ribbon";
}

const COLORS = [
  "#6C63FF", // indigo
  "#FFD700", // gold
  "#00D4AA", // success teal
  "#FF8C42", // warning
  "#FF4757", // danger
  "#7B73FF", // indigo hover
  "#ffffff",  // white
];

interface ConfettiProps {
  active: boolean;
  /** number of particles, default 80 */
  count?: number;
  /** origin y fraction (0=top, 1=bottom), default 0.35 */
  originY?: number;
}

export function Confetti({ active, count = 80, originY = 0.35 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | undefined>(undefined);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.offsetWidth || window.innerWidth;
    const H = canvas.offsetHeight || window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const originX = W / 2;
    const originYpx = H * originY;

    // Spawn particles
    particlesRef.current = Array.from({ length: count }, () => {
      const angle = (Math.random() * 240 - 120) * (Math.PI / 180); // -120° to +120°
      const speed = 4 + Math.random() * 8;
      return {
        x: originX + (Math.random() - 0.5) * 80,
        y: originYpx,
        vx: Math.sin(angle) * speed,
        vy: -Math.abs(Math.cos(angle)) * speed - 2,
        alpha: 1,
        size: 6 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape: (["rect", "circle", "ribbon"] as const)[
          Math.floor(Math.random() * 3)
        ],
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      let alive = false;
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.98; // air resistance
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.012;

        if (p.alpha <= 0) continue;
        alive = true;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "ribbon") {
          ctx.fillRect(-p.size / 2, -p.size / 8, p.size, p.size / 4);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }

        ctx.restore();
      }

      if (alive) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [active, count, originY]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
