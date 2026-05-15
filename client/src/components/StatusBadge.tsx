import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/types";
import type { VideoTaskStatus } from "@/types";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-[oklch(0.55_0.015_285/0.15)] text-[oklch(0.55_0.015_285)] border-[oklch(0.55_0.015_285/0.3)]",
  pending: "bg-[oklch(0.78_0.18_85/0.15)] text-[oklch(0.78_0.18_85)] border-[oklch(0.78_0.18_85/0.3)]",
  queued: "bg-[oklch(0.78_0.18_85/0.15)] text-[oklch(0.78_0.18_85)] border-[oklch(0.78_0.18_85/0.3)]",
  submitted: "bg-[oklch(0.7_0.22_200/0.15)] text-[oklch(0.7_0.22_200)] border-[oklch(0.7_0.22_200/0.3)]",
  processing: "bg-[oklch(0.6_0.28_290/0.15)] text-[oklch(0.6_0.28_290)] border-[oklch(0.6_0.28_290/0.3)]",
  completed: "bg-[oklch(0.7_0.2_145/0.15)] text-[oklch(0.7_0.2_145)] border-[oklch(0.7_0.2_145/0.3)]",
  failed: "bg-[oklch(0.65_0.25_25/0.15)] text-[oklch(0.65_0.25_25)] border-[oklch(0.65_0.25_25/0.3)]",
  cancelled: "bg-[oklch(0.55_0.015_285/0.15)] text-[oklch(0.55_0.015_285)] border-[oklch(0.55_0.015_285/0.3)]",
  draft: "bg-[oklch(0.55_0.015_285/0.15)] text-[oklch(0.55_0.015_285)] border-[oklch(0.55_0.015_285/0.3)]",
  briefing: "bg-[oklch(0.78_0.18_85/0.15)] text-[oklch(0.78_0.18_85)] border-[oklch(0.78_0.18_85/0.3)]",
  storyboard: "bg-[oklch(0.7_0.22_200/0.15)] text-[oklch(0.7_0.22_200)] border-[oklch(0.7_0.22_200/0.3)]",
  generating: "bg-[oklch(0.6_0.28_290/0.15)] text-[oklch(0.6_0.28_290)] border-[oklch(0.6_0.28_290/0.3)]",
  stitching: "bg-[oklch(0.72_0.25_340/0.15)] text-[oklch(0.72_0.25_340)] border-[oklch(0.72_0.25_340/0.3)]",
};

const PULSE_STATUSES = new Set(["processing", "submitted", "queued", "generating", "stitching"]);

export default function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? STATUS_COLORS.idle;
  const label = STATUS_LABELS[status] ?? status;
  const isPulsing = PULSE_STATUSES.has(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        colorClass,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full bg-current",
            isPulsing && "animate-pulse"
          )}
        />
      )}
      {label}
    </span>
  );
}
