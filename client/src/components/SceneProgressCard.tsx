import { useState } from "react";
import { cn } from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Play,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import type { Scene } from "@/types";
import type { SceneTimerInfo } from "@/hooks/useGenerationTimer";
import SceneTimer from "./SceneTimer";

interface SceneProgressCardProps {
  scene: Scene;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onGenerate: () => void;
  generating: boolean;
  timerInfo?: SceneTimerInfo;
}

const STATUS_CONFIG = {
  idle: {
    icon: <Clock size={14} />,
    bg: "oklch(0.55 0.015 285 / 0.1)",
    border: "oklch(0.55 0.015 285 / 0.2)",
    text: "oklch(0.55 0.015 285)",
    glow: false,
  },
  pending: {
    icon: <Clock size={14} />,
    bg: "oklch(0.78 0.18 85 / 0.1)",
    border: "oklch(0.78 0.18 85 / 0.25)",
    text: "oklch(0.78 0.18 85)",
    glow: false,
  },
  queued: {
    icon: <Clock size={14} />,
    bg: "oklch(0.78 0.18 85 / 0.1)",
    border: "oklch(0.78 0.18 85 / 0.25)",
    text: "oklch(0.78 0.18 85)",
    glow: false,
  },
  submitted: {
    icon: <Loader2 size={14} className="animate-spin" />,
    bg: "oklch(0.7 0.22 200 / 0.1)",
    border: "oklch(0.7 0.22 200 / 0.3)",
    text: "oklch(0.7 0.22 200)",
    glow: true,
  },
  processing: {
    icon: <Loader2 size={14} className="animate-spin" />,
    bg: "oklch(0.6 0.28 290 / 0.1)",
    border: "oklch(0.6 0.28 290 / 0.4)",
    text: "oklch(0.6 0.28 290)",
    glow: true,
  },
  completed: {
    icon: <CheckCircle2 size={14} />,
    bg: "oklch(0.7 0.2 145 / 0.1)",
    border: "oklch(0.7 0.2 145 / 0.3)",
    text: "oklch(0.7 0.2 145)",
    glow: false,
  },
  failed: {
    icon: <XCircle size={14} />,
    bg: "oklch(0.65 0.25 25 / 0.1)",
    border: "oklch(0.65 0.25 25 / 0.3)",
    text: "oklch(0.65 0.25 25)",
    glow: false,
  },
  cancelled: {
    icon: <XCircle size={14} />,
    bg: "oklch(0.55 0.015 285 / 0.1)",
    border: "oklch(0.55 0.015 285 / 0.2)",
    text: "oklch(0.55 0.015 285)",
    glow: false,
  },
};

export default function SceneProgressCard({
  scene,
  index,
  expanded,
  onToggle,
  onGenerate,
  generating,
  timerInfo,
}: SceneProgressCardProps) {
  const config = STATUS_CONFIG[scene.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.idle;
  const isActive = ["submitted", "processing", "queued"].includes(scene.status);
  const isCompleted = scene.status === "completed";
  const isFailed = scene.status === "failed";

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300 overflow-hidden",
        "bg-[oklch(1_0_0/0.03)]"
      )}
      style={{
        borderColor: config.border,
        boxShadow: config.glow
          ? `0 0 16px ${config.text.replace(")", " / 0.12)").replace("oklch(", "oklch(")}, inset 0 0 16px ${config.text.replace(")", " / 0.04)").replace("oklch(", "oklch(")}`
          : undefined,
        animationDelay: `${index * 40}ms`,
      }}
    >
      <button onClick={onToggle} className="w-full p-3 text-left">
        <div className="flex items-center gap-3">
          {/* Status icon badge */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative"
            style={{ background: config.bg, color: config.text }}
          >
            {config.icon}
            {/* Pulse ring for active states */}
            {isActive && (
              <span
                className="absolute inset-0 rounded-lg animate-ping opacity-30"
                style={{ background: config.text }}
              />
            )}
          </div>

          {/* Scene info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-bold font-mono opacity-50"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {String(scene.order).padStart(2, "0")}
              </span>
              <p className="text-sm font-medium truncate">{scene.goal}</p>
            </div>
            {/* Sub-info row */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {scene.startTime}s–{scene.endTime}s
              </span>
              {scene.taskId && (
                <span
                  className="text-[10px] font-mono text-muted-foreground/60 truncate max-w-[100px]"
                  title={scene.taskId}
                >
                  {scene.taskId.slice(0, 12)}…
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <StatusBadge status={scene.status} showDot />
          {expanded ? (
            <ChevronUp size={13} className="text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />
          )}
        </div>

        {/* Timer progress bar (replaces old indeterminate bar) */}
        {timerInfo && (isActive || isCompleted) ? (
          <SceneTimer timerInfo={timerInfo} status={scene.status} className="mt-2.5" />
        ) : (
          <>
            {/* Fallback indeterminate bar when no timer */}
            {isActive && (
              <div className="mt-2.5 h-0.5 rounded-full overflow-hidden bg-[oklch(0.6_0.28_290/0.15)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${config.text}, oklch(0.7 0.22 200))`,
                    animation: "indeterminate 1.8s ease-in-out infinite",
                    backgroundSize: "200% 100%",
                  }}
                />
              </div>
            )}
            {isCompleted && (
              <div className="mt-2 h-0.5 rounded-full bg-gradient-to-r from-[oklch(0.7_0.2_145)] to-[oklch(0.7_0.22_200)]" />
            )}
          </>
        )}
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div
          className="border-t px-3 pb-3 pt-2.5 space-y-2.5"
          style={{ borderColor: config.border }}
        >
          {/* Task ID */}
          {scene.taskId && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Task ID
              </p>
              <p className="text-[11px] font-mono text-foreground/60 break-all leading-relaxed">
                {scene.taskId}
              </p>
            </div>
          )}

          {/* Video preview */}
          {scene.videoUrl && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                视频预览
              </p>
              <video
                src={scene.videoUrl}
                controls
                className="w-full rounded-lg max-h-44 bg-black"
                playsInline
              />
            </div>
          )}

          {/* Error message */}
          {scene.errorMessage && (
            <div className="rounded-lg bg-[oklch(0.65_0.25_25/0.08)] border border-[oklch(0.65_0.25_25/0.2)] px-3 py-2">
              <p className="text-[11px] text-[oklch(0.65_0.25_25)] leading-relaxed">
                {scene.errorMessage}
              </p>
            </div>
          )}

          {/* Prompt preview */}
          {scene.prompt && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                AI Prompt
              </p>
              <p className="text-[10px] font-mono text-foreground/50 leading-relaxed line-clamp-2 bg-[oklch(0.1_0.01_285)] rounded-lg px-2 py-1.5">
                {scene.prompt}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-0.5">
            {(scene.status === "idle" || scene.status === "failed") && (
              <button
                onClick={onGenerate}
                disabled={generating}
                className="flex items-center gap-1.5 text-xs font-medium disabled:opacity-40 transition-opacity"
                style={{ color: config.text }}
              >
                {isFailed ? (
                  <RefreshCw size={12} />
                ) : (
                  <Play size={12} />
                )}
                {isFailed ? "失败重试" : "单独生成"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
