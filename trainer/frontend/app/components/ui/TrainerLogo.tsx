"use client";

interface TrainerLogoProps {
  size?: number;
  variant?: "full" | "icon";
  className?: string;
}

export function TrainerLogo({ size = 40, variant = "full", className = "" }: TrainerLogoProps) {
  if (variant === "icon") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Trainer"
      >
        <rect width="512" height="512" rx="96" fill="#0F0F1A" />
        <rect x="80" y="130" width="352" height="76" rx="38" fill="#6C63FF" />
        <rect x="218" y="130" width="76" height="282" rx="38" fill="#6C63FF" />
        <path d="M296 155 L230 272 L268 272 L204 380 L322 242 L278 242 Z" fill="#FFD700" />
      </svg>
    );
  }

  const iconSize = size;
  const totalWidth = iconSize + 8 + iconSize * 3.8;
  const totalHeight = iconSize;

  return (
    <svg
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Trainer"
    >
      {/* Icon mark */}
      <rect width={iconSize} height={iconSize} rx={iconSize * 0.188} fill="#0F0F1A" />
      <rect
        x={iconSize * 0.156}
        y={iconSize * 0.254}
        width={iconSize * 0.688}
        height={iconSize * 0.148}
        rx={iconSize * 0.074}
        fill="#6C63FF"
      />
      <rect
        x={iconSize * 0.426}
        y={iconSize * 0.254}
        width={iconSize * 0.148}
        height={iconSize * 0.55}
        rx={iconSize * 0.074}
        fill="#6C63FF"
      />
      <path
        d={`M${iconSize * 0.578} ${iconSize * 0.301} L${iconSize * 0.449} ${iconSize * 0.531} L${iconSize * 0.523} ${iconSize * 0.531} L${iconSize * 0.398} ${iconSize * 0.742} L${iconSize * 0.629} ${iconSize * 0.473} L${iconSize * 0.543} ${iconSize * 0.473} Z`}
        fill="#FFD700"
      />

      {/* Wordmark */}
      <text
        x={iconSize + 8}
        y={iconSize * 0.68}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize={iconSize * 0.48}
        fontWeight="700"
        fill="white"
        letterSpacing="-0.5"
      >
        T
      </text>
      <text
        x={iconSize + 8 + iconSize * 0.32}
        y={iconSize * 0.68}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize={iconSize * 0.48}
        fontWeight="300"
        fill="white"
        letterSpacing="-0.5"
      >
        RAINER
      </text>

      {/* Accent line */}
      <rect
        x={iconSize + 8}
        y={iconSize * 0.78}
        width={iconSize * 3.4}
        height={iconSize * 0.04}
        rx={iconSize * 0.02}
        fill="#6C63FF"
      />
    </svg>
  );
}
