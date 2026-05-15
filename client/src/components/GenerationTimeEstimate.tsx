import { cn } from "@/lib/utils";
import { formatDuration, formatElapsed } from "@/hooks/useGenerationTimer";
import { Clock, Timer, CheckCircle2 } from "lucide-react";

interface GenerationTimeEstimateProps {
  polling: boolean;
  completedCount: number;
  totalCount: number;
  overallElapsedSeconds: number;
  overallEstimatedRemainingSeconds: number;
  overallProgress: number;
  isMock: boolean;
  className?: string;
}

export default function GenerationTimeEstimate({
  polling,
  completedCount,
  totalCount,
  overallElapsedSeconds,
  overallEstimatedRemainingSeconds,
  overallProgress,
  isMock,
  className,
}: GenerationTimeEstimateProps) {
  const allDone = completedCount === totalCount && totalCount > 0;
  const hasStarted = overallElapsedSeconds > 0 || polling;

  if (!hasStarted && completedCount === 0) return null;

  return (
    <div
      className={cn(
        "glass-card px-4 py-3 flex items-center gap-4",
        allDone && "border-[oklch(0.7_0.2_145/0.3)] bg-[oklch(0.7_0.2_145/0.04)]",
        className
      )}
    >
      {/* Animated clock icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          allDone
            ? "bg-[oklch(0.7_0.2_145/0.15)]"
            : polling
            ? "bg-[oklch(0.6_0.28_290/0.15)]"
            : "bg-[oklch(0.55_0.015_285/0.1)]"
        )}
      >
        {allDone ? (
          <CheckCircle2 size={16} className="text-[oklch(0.7_0.2_145)]" />
        ) : polling ? (
          <Timer
            size={16}
            className="text-[oklch(0.6_0.28_290)]"
            style={{ animation: "spin 4s linear infinite" }}
          />
        ) : (
          <Clock size={16} className="text-muted-foreground" />
        )}
      </div>

      {/* Time info */}
      <div className="flex-1 min-w-0">
        {allDone ? (
          <div>
            <p className="text-sm font-semibold text-[oklch(0.7_0.2_145)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              全部生成完成
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              共用时 {formatElapsed(overallElapsedSeconds)} · {completedCount} 个镜头
            </p>
          </div>
        ) : polling ? (
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                预计还需
              </p>
              <CountdownDisplay seconds={overallEstimatedRemainingSeconds} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              已用时 {formatElapsed(overallElapsedSeconds)}
              {isMock ? " · Mock 模式" : " · Real API"}
              {!isMock && overallEstimatedRemainingSeconds > 60 && (
                <span className="text-[oklch(0.78_0.18_85)]"> · 实际时间因队列而异</span>
              )}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-muted-foreground">等待生成</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isMock ? "Mock 模式约 8 秒/镜头" : "Real API 约 1-5 分钟/镜头"}
            </p>
          </div>
        )}
      </div>

      {/* Circular mini progress */}
      {(polling || allDone) && totalCount > 0 && (
        <MiniCircularProgress value={overallProgress} done={allDone} />
      )}
    </div>
  );
}

// ── Countdown display with animated digits ─────────────────────────────────

function CountdownDisplay({ seconds }: { seconds: number }) {
  const text = formatDuration(seconds);
  const isUrgent = seconds > 0 && seconds <= 10;

  return (
    <span
      className={cn(
        "text-base font-bold tabular-nums transition-colors duration-500",
        isUrgent
          ? "text-[oklch(0.7_0.2_145)]"
          : "text-[oklch(0.6_0.28_290)]"
      )}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {text}
    </span>
  );
}

// ── Mini circular progress ─────────────────────────────────────────────────

function MiniCircularProgress({ value, done }: { value: number; done: boolean }) {
  const size = 36;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(100, value) / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id="teg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={done ? "oklch(0.7 0.2 145)" : "oklch(0.6 0.28 290)"} />
            <stop offset="100%" stopColor={done ? "oklch(0.75 0.18 160)" : "oklch(0.7 0.22 200)"} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={done ? "oklch(0.7 0.2 145 / 0.15)" : "oklch(0.6 0.28 290 / 0.15)"}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#teg-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.23, 1, 0.32, 1)" }}
        />
      </svg>
      {/* Center percentage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[9px] font-bold"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: done ? "oklch(0.7 0.2 145)" : "oklch(0.6 0.28 290)",
          }}
        >
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}
