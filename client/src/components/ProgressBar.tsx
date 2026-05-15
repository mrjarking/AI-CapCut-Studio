import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "gradient" | "pink";
}

export default function ProgressBar({ value, className, showLabel = false, variant = "gradient" }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const trackBg = {
    default: "bg-[oklch(0.6_0.28_290/0.15)]",
    gradient: "bg-[oklch(0.6_0.28_290/0.15)]",
    pink: "bg-[oklch(0.72_0.25_340/0.15)]",
  }[variant];

  const barBg = {
    default: "bg-[oklch(0.6_0.28_290)]",
    gradient: "bg-gradient-to-r from-[oklch(0.6_0.28_290)] to-[oklch(0.7_0.22_200)]",
    pink: "bg-gradient-to-r from-[oklch(0.72_0.25_340)] to-[oklch(0.6_0.28_290)]",
  }[variant];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 h-1.5 rounded-full overflow-hidden", trackBg)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", barBg)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-mono w-8 text-right">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
