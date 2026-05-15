import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import CircularProgress from "./CircularProgress";
import {
  Download,
  Scissors,
  CheckCircle2,
  Loader2,
  Film,
  Sparkles,
} from "lucide-react";

interface StitchStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: StitchStep[] = [
  {
    id: "download",
    label: "下载片段",
    description: "从服务器获取所有视频片段",
    icon: <Download size={14} />,
  },
  {
    id: "transcode",
    label: "准备转码",
    description: "生成 FFmpeg concat 文件",
    icon: <Film size={14} />,
  },
  {
    id: "stitch",
    label: "FFmpeg 拼接",
    description: "合并所有片段为完整视频",
    icon: <Scissors size={14} />,
  },
  {
    id: "done",
    label: "拼接完成",
    description: "最终视频已就绪",
    icon: <Sparkles size={14} />,
  },
];

type StepStatus = "idle" | "active" | "done" | "error";

interface StitchProgressPanelProps {
  stitching: boolean;
  segmentCount: number;
  error?: string;
  className?: string;
}

export default function StitchProgressPanel({
  stitching,
  segmentCount,
  error,
  className,
}: StitchProgressPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  // Simulate step progression while stitching
  useEffect(() => {
    if (!stitching) {
      if (!error) {
        // Completed
        setCurrentStep(STEPS.length - 1);
        setStepProgress(100);
        setOverallProgress(100);
      }
      return;
    }

    setCurrentStep(0);
    setStepProgress(0);
    setOverallProgress(0);

    // Step 0: Download (0–25%)
    const t0 = setTimeout(() => {
      setCurrentStep(0);
      setStepProgress(0);
    }, 100);

    const downloadDuration = Math.max(1500, segmentCount * 600);
    let downloadTick = 0;
    const downloadInterval = setInterval(() => {
      downloadTick += 1;
      const pct = Math.min(100, (downloadTick / (downloadDuration / 120)) * 100);
      setStepProgress(pct);
      setOverallProgress(pct * 0.25);
      if (pct >= 100) clearInterval(downloadInterval);
    }, 120);

    // Step 1: Transcode prep (25–50%)
    const t1 = setTimeout(() => {
      clearInterval(downloadInterval);
      setCurrentStep(1);
      setStepProgress(0);
      let tick = 0;
      const interval = setInterval(() => {
        tick += 1;
        const pct = Math.min(100, tick * 8);
        setStepProgress(pct);
        setOverallProgress(25 + pct * 0.25);
        if (pct >= 100) clearInterval(interval);
      }, 80);
    }, downloadDuration + 200);

    // Step 2: FFmpeg stitch (50–95%)
    const ffmpegDuration = Math.max(2000, segmentCount * 800);
    const t2 = setTimeout(() => {
      setCurrentStep(2);
      setStepProgress(0);
      let tick = 0;
      const interval = setInterval(() => {
        tick += 1;
        const pct = Math.min(95, (tick / (ffmpegDuration / 150)) * 100);
        setStepProgress(pct);
        setOverallProgress(50 + pct * 0.45);
        if (pct >= 95) clearInterval(interval);
      }, 150);
    }, downloadDuration + 1500);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(downloadInterval);
    };
  }, [stitching, segmentCount, error]);

  const getStepStatus = (stepIdx: number): StepStatus => {
    if (error && stepIdx === currentStep) return "error";
    if (!stitching && overallProgress === 100) return "done";
    if (stepIdx < currentStep) return "done";
    if (stepIdx === currentStep) return stitching ? "active" : "idle";
    return "idle";
  };

  const variant =
    error ? "error" : overallProgress === 100 ? "success" : "default";

  return (
    <div className={cn("glass-card overflow-hidden", className)}>
      {/* Header with circular progress */}
      <div className="p-5 flex items-center gap-5">
        <CircularProgress
          value={overallProgress}
          size={80}
          strokeWidth={6}
          variant={variant}
          label={
            <div className="text-center">
              <span
                className="text-lg font-bold"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color:
                    variant === "success"
                      ? "oklch(0.7 0.2 145)"
                      : variant === "error"
                      ? "oklch(0.65 0.25 25)"
                      : "oklch(0.6 0.28 290)",
                }}
              >
                {Math.round(overallProgress)}%
              </span>
            </div>
          }
        />

        <div className="flex-1">
          <p
            className="text-sm font-semibold"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {error
              ? "拼接失败"
              : overallProgress === 100
              ? "拼接完成！"
              : stitching
              ? STEPS[currentStep]?.label ?? "处理中…"
              : "准备拼接"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {error
              ? error
              : overallProgress === 100
              ? `${segmentCount} 个片段已合并为最终视频`
              : stitching
              ? STEPS[currentStep]?.description ?? ""
              : `共 ${segmentCount} 个片段待拼接`}
          </p>

          {/* Current step progress bar */}
          {stitching && (
            <div className="mt-2 h-1 rounded-full overflow-hidden bg-[oklch(0.6_0.28_290/0.12)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[oklch(0.6_0.28_290)] to-[oklch(0.7_0.22_200)] transition-all duration-300 ease-out"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Step list */}
      <div className="border-t border-border/40 px-5 py-3 space-y-0">
        {STEPS.map((step, idx) => {
          const status = getStepStatus(idx);
          return (
            <StepRow
              key={step.id}
              step={step}
              status={status}
              isLast={idx === STEPS.length - 1}
              animDelay={idx * 60}
            />
          );
        })}
      </div>

      {/* Soundwave animation while stitching */}
      {stitching && (
        <div className="px-5 pb-4 pt-1 flex items-center gap-3">
          <div className="flex gap-0.5 items-end h-5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-[oklch(0.6_0.28_290)] to-[oklch(0.7_0.22_200)]"
                style={{
                  height: `${8 + Math.sin(i * 0.9) * 8}px`,
                  animation: "soundwave 1.1s ease-in-out infinite",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            FFmpeg 正在处理中，请勿关闭页面…
          </p>
        </div>
      )}
    </div>
  );
}

function StepRow({
  step,
  status,
  isLast,
  animDelay,
}: {
  step: StitchStep;
  status: StepStatus;
  isLast: boolean;
  animDelay: number;
}) {
  const isDone = status === "done";
  const isActive = status === "active";
  const isError = status === "error";
  const isIdle = status === "idle";

  const iconColor = isDone
    ? "oklch(0.7 0.2 145)"
    : isActive
    ? "oklch(0.6 0.28 290)"
    : isError
    ? "oklch(0.65 0.25 25)"
    : "oklch(0.4 0.01 285)";

  const connectorColor = isDone
    ? "oklch(0.7 0.2 145 / 0.4)"
    : "oklch(0.4 0.01 285 / 0.2)";

  return (
    <div
      className="flex gap-3 step-slide-in"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Icon column */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
            isActive && "ring-2 ring-offset-1 ring-offset-background"
          )}
          style={{
            background: isDone
              ? "oklch(0.7 0.2 145 / 0.15)"
              : isActive
              ? "oklch(0.6 0.28 290 / 0.15)"
              : isError
              ? "oklch(0.65 0.25 25 / 0.15)"
              : "oklch(0.4 0.01 285 / 0.08)",
            color: iconColor,
            // ring color handled via Tailwind class above
          }}
        >
          {isDone ? (
            <CheckCircle2 size={14} />
          ) : isActive ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isError ? (
            <span className="text-xs font-bold">✕</span>
          ) : (
            step.icon
          )}
        </div>
        {/* Connector line */}
        {!isLast && (
          <div
            className="w-px flex-1 my-0.5 min-h-[16px] transition-all duration-500"
            style={{ background: connectorColor }}
          />
        )}
      </div>

      {/* Text column */}
      <div className={cn("pb-3 pt-0.5 flex-1", isLast && "pb-0")}>
        <p
          className={cn(
            "text-xs font-medium transition-colors duration-300",
            isDone
              ? "text-[oklch(0.7_0.2_145)]"
              : isActive
              ? "text-foreground"
              : isError
              ? "text-[oklch(0.65_0.25_25)]"
              : "text-muted-foreground"
          )}
        >
          {step.label}
        </p>
        <p
          className={cn(
            "text-[10px] mt-0.5 transition-colors duration-300",
            isActive ? "text-muted-foreground" : "text-muted-foreground/50"
          )}
        >
          {step.description}
        </p>
      </div>
    </div>
  );
}
