"use client";

const BG_IMAGES = {
  default: "/images/gym-bg-1.jpeg",
  alt: "/images/gym-bg-2.jpeg",
  auth: "/images/gym-bg-auth.jpeg",
} as const;

const OVERLAY_OPACITY = {
  default: 0.87,
  alt: 0.85,
  auth: 0.82,
} as const;

interface GymBackgroundProps {
  variant?: keyof typeof BG_IMAGES;
}

export function GymBackground({ variant = "default" }: GymBackgroundProps) {
  const img = BG_IMAGES[variant];
  const opacity = OVERLAY_OPACITY[variant];

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10"
      style={{
        backgroundImage: `linear-gradient(rgba(10,10,15,${opacity}),rgba(10,10,15,${opacity})),url(${img})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
