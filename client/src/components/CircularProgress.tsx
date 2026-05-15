import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
}

const VARIANT_COLORS = {
  default: {
    track: "oklch(0.6 0.28 290 / 0.15)",
    fill: "url(#cgDefault)",
    text: "oklch(0.6 0.28 290)",
  },
  success: {
    track: "oklch(0.7 0.2 145 / 0.15)",
    fill: "url(#cgSuccess)",
    text: "oklch(0.7 0.2 145)",
  },
  warning: {
    track: "oklch(0.78 0.18 85 / 0.15)",
    fill: "url(#cgWarning)",
    text: "oklch(0.78 0.18 85)",
  },
  error: {
    track: "oklch(0.65 0.25 25 / 0.15)",
    fill: "url(#cgError)",
    text: "oklch(0.65 0.25 25)",
  },
};

export default function CircularProgress({
  value,
  size = 96,
  strokeWidth = 6,
  className,
  label,
  variant = "default",
}: CircularProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedValue / 100) * circumference;
  const colors = VARIANT_COLORS[variant];

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id="cgDefault" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.6 0.28 290)" />
            <stop offset="100%" stopColor="oklch(0.7 0.22 200)" />
          </linearGradient>
          <linearGradient id="cgSuccess" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.7 0.2 145)" />
            <stop offset="100%" stopColor="oklch(0.75 0.18 160)" />
          </linearGradient>
          <linearGradient id="cgWarning" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.78 0.18 85)" />
            <stop offset="100%" stopColor="oklch(0.72 0.2 65)" />
          </linearGradient>
          <linearGradient id="cgError" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.65 0.25 25)" />
            <stop offset="100%" stopColor="oklch(0.72 0.25 340)" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.track}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.fill}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
      </svg>
      {/* Center label */}
      {label !== undefined && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label}
        </div>
      )}
    </div>
  );
}
