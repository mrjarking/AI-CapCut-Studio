import { cn } from "@/lib/utils";
import { formatElapsed, formatDuration } from "@/hooks/useGenerationTimer";
import type { SceneTimerInfo } from "@/hooks/useGenerationTimer";

interface SceneTimerProps {
  timerInfo: SceneTimerInfo;
  status: string;
  className?: string;
}

export default function SceneTimer({ timerInfo, status, className }: SceneTimerProps) {
  const isActive = ["submitted", "processing", "queued"].includes(status);
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  if (!isActive && !isCompleted) return null;

  const { elapsedSeconds, estimatedRemainingSeconds, progress } = timerInfo;

  return (
    <div className={cn("space-y-1", className)}>
      {/* Progress bar */}
      <div className="h-0.5 rounded-full overflow-hidden bg-[oklch(0.6_0.28_290/0.1)]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            isCompleted
              ? "bg-gradient-to-r from-[oklch(0.7_0.2_145)] to-[oklch(0.7_0.22_200)]"
              : isFailed
              ? "bg-[oklch(0.65_0.25_25)]"
              : "bg-gradient-to-r from-[oklch(0.6_0.28_290)] to-[oklch(0.7_0.22_200)]"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time labels */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-muted-foreground/60">
          {isCompleted ? (
            <span className="text-[oklch(0.7_0.2_145)]">✓ {formatElapsed(elapsedSeconds)}</span>
          ) : (
            `已用 ${formatElapsed(elapsedSeconds)}`
          )}
        </span>
        {isActive && estimatedRemainingSeconds > 0 && (
          <span
            className="text-[9px] font-mono"
            style={{ color: "oklch(0.6 0.28 290)" }}
          >
            ~{formatDuration(estimatedRemainingSeconds)}
          </span>
        )}
        {isCompleted && (
          <span className="text-[9px] text-[oklch(0.7_0.2_145)] font-mono">完成</span>
        )}
      </div>
    </div>
  );
}
