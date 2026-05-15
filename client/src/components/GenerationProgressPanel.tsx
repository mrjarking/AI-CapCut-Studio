import { cn } from "@/lib/utils";
import CircularProgress from "./CircularProgress";
import { CheckCircle2, XCircle, Loader2, Clock, Zap, Send, Eye, Scissors } from "lucide-react";

interface GenerationProgressPanelProps {
  totalCount: number;
  completedCount: number;
  processingCount: number;
  failedCount: number;
  idleCount: number;
  polling: boolean;
  mockMode: boolean;
  pollIntervalMs: number;
  className?: string;
}

export default function GenerationProgressPanel({
  totalCount,
  completedCount,
  processingCount,
  failedCount,
  idleCount,
  polling,
  mockMode,
  pollIntervalMs,
  className,
}: GenerationProgressPanelProps) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;
  const hasFailures = failedCount > 0;

  const variant = allCompleted ? "success" : hasFailures && processingCount === 0 ? "error" : "default";

  const statusLabel = allCompleted
    ? "全部完成"
    : processingCount > 0
    ? "生成中"
    : idleCount > 0
    ? "等待开始"
    : "处理中";

  return (
    <div className={cn("glass-card p-5", className)}>
      {/* Top row: circular progress + stats */}
      <div className="flex items-center gap-5">
        {/* Circular progress ring */}
        <div className="flex-shrink-0">
          <CircularProgress
            value={progress}
            size={88}
            strokeWidth={7}
            variant={variant}
            label={
              <div className="text-center">
                <span
                  className="text-xl font-bold"
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
                  {progress}%
                </span>
              </div>
            }
          />
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2.5">
          <div>
            <p
              className="text-sm font-semibold leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {completedCount} / {totalCount} 镜头完成
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              {mockMode ? (
                <>
                  <Zap size={10} className="text-[oklch(0.78_0.18_85)]" />
                  Mock Mode
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.7_0.2_145)] inline-block" />
                  Real API
                </>
              )}
              {polling && (
                <span className="text-[oklch(0.6_0.28_290)] flex items-center gap-1">
                  · 轮询中 {pollIntervalMs / 1000}s
                </span>
              )}
            </p>
          </div>

          {/* Mini stat chips */}
          <div className="flex flex-wrap gap-1.5">
            {completedCount > 0 && (
              <StatChip
                icon={<CheckCircle2 size={10} />}
                label={`${completedCount} 完成`}
                color="oklch(0.7 0.2 145)"
              />
            )}
            {processingCount > 0 && (
              <StatChip
                icon={<Loader2 size={10} className="animate-spin" />}
                label={`${processingCount} 生成中`}
                color="oklch(0.6 0.28 290)"
                pulse
              />
            )}
            {idleCount > 0 && (
              <StatChip
                icon={<Clock size={10} />}
                label={`${idleCount} 待生成`}
                color="oklch(0.55 0.015 285)"
              />
            )}
            {failedCount > 0 && (
              <StatChip
                icon={<XCircle size={10} />}
                label={`${failedCount} 失败`}
                color="oklch(0.65 0.25 25)"
              />
            )}
          </div>
        </div>
      </div>

      {/* Progress track bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>进度</span>
          <span className="font-mono">{statusLabel}</span>
        </div>
        <SegmentedProgressBar
          total={totalCount}
          completed={completedCount}
          processing={processingCount}
          failed={failedCount}
        />
      </div>

      {/* ── Workflow step list ── */}
      <WorkflowSteps
        totalCount={totalCount}
        completedCount={completedCount}
        processingCount={processingCount}
        failedCount={failedCount}
        polling={polling}
        allCompleted={allCompleted}
      />

      {/* Polling indicator */}
      {polling && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-[oklch(0.6_0.28_290)]"
                style={{
                  height: "12px",
                  animation: "soundwave 1s ease-in-out infinite",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          <span className="text-[10px] text-[oklch(0.6_0.28_290)]">
            自动轮询中，每 {pollIntervalMs / 1000} 秒更新一次状态
          </span>
        </div>
      )}

      {/* All completed celebration */}
      {allCompleted && (
        <div className="mt-3 rounded-xl bg-[oklch(0.7_0.2_145/0.08)] border border-[oklch(0.7_0.2_145/0.25)] p-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[oklch(0.7_0.2_145)] flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[oklch(0.7_0.2_145)]">所有镜头已生成完成！</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">可以进入下一步进行视频拼接</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({
  icon,
  label,
  color,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
        pulse && "animate-pulse"
      )}
      style={{
        color,
        borderColor: `${color.replace(")", " / 0.3)").replace("oklch(", "oklch(")}`,
        background: `${color.replace(")", " / 0.1)").replace("oklch(", "oklch(")}`,
      }}
    >
      {icon}
      {label}
    </span>
  );
}

// ─── Workflow Steps ─────────────────────────────────────────────────────────

function WorkflowSteps({
  totalCount,
  completedCount,
  processingCount,
  failedCount,
  polling,
  allCompleted,
}: {
  totalCount: number;
  completedCount: number;
  processingCount: number;
  failedCount: number;
  polling: boolean;
  allCompleted: boolean;
}) {
  const hasStarted = completedCount > 0 || processingCount > 0;
  const hasSubmitted = totalCount > 0 && (processingCount > 0 || completedCount > 0);

  type WFStatus = "idle" | "active" | "done" | "error";

  const steps: { label: string; sub: string; icon: React.ReactNode; status: WFStatus }[] = [
    {
      label: "提交生成任务",
      sub: `向 AI 服务提交 ${totalCount} 个镜头任务`,
      icon: <Send size={12} />,
      status: hasSubmitted ? "done" : totalCount > 0 ? "active" : "idle",
    },
    {
      label: "轮询生成状态",
      sub: processingCount > 0
        ? `${processingCount} 个镜头生成中…`
        : completedCount > 0
        ? `已完成 ${completedCount} / ${totalCount}`
        : "等待任务提交",
      icon: <Eye size={12} />,
      status: allCompleted
        ? "done"
        : polling
        ? "active"
        : hasSubmitted
        ? "active"
        : "idle",
    },
    {
      label: "全部镜头完成",
      sub: allCompleted
        ? `${completedCount} 个镜头生成成功`
        : failedCount > 0
        ? `${failedCount} 个镜头失败，可重试`
        : "等待所有镜头完成",
      icon: <Scissors size={12} />,
      status: allCompleted ? "done" : failedCount > 0 && processingCount === 0 ? "error" : "idle",
    },
  ];

  return (
    <div className="mt-4 border-t border-border/30 pt-3 space-y-0">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
        工作流步骤
      </p>
      {steps.map((step, idx) => {
        const isDone = step.status === "done";
        const isActive = step.status === "active";
        const isError = step.status === "error";
        const isIdle = step.status === "idle";
        const isLast = idx === steps.length - 1;

        const iconColor = isDone
          ? "oklch(0.7 0.2 145)"
          : isActive
          ? "oklch(0.6 0.28 290)"
          : isError
          ? "oklch(0.65 0.25 25)"
          : "oklch(0.4 0.01 285)";

        return (
          <div key={idx} className="flex gap-2.5">
            {/* Icon + connector */}
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: isDone
                    ? "oklch(0.7 0.2 145 / 0.12)"
                    : isActive
                    ? "oklch(0.6 0.28 290 / 0.12)"
                    : isError
                    ? "oklch(0.65 0.25 25 / 0.12)"
                    : "oklch(0.4 0.01 285 / 0.06)",
                  color: iconColor,
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={12} />
                ) : isActive ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : isError ? (
                  <XCircle size={12} />
                ) : (
                  step.icon
                )}
              </div>
              {!isLast && (
                <div
                  className="w-px flex-1 my-0.5 min-h-[12px] transition-all duration-500"
                  style={{
                    background: isDone
                      ? "oklch(0.7 0.2 145 / 0.35)"
                      : "oklch(0.4 0.01 285 / 0.15)",
                  }}
                />
              )}
            </div>
            {/* Text */}
            <div className={cn("pb-2.5 pt-0.5 flex-1", isLast && "pb-0")}>
              <p
                className="text-[11px] font-medium transition-colors duration-300"
                style={{ color: iconColor }}
              >
                {step.label}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{step.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SegmentedProgressBar({
  total,
  completed,
  processing,
  failed,
}: {
  total: number;
  completed: number;
  processing: number;
  failed: number;
}) {
  if (total === 0) return null;

  const completedPct = (completed / total) * 100;
  const processingPct = (processing / total) * 100;
  const failedPct = (failed / total) * 100;

  return (
    <div className="h-2 rounded-full overflow-hidden bg-[oklch(0.6_0.28_290/0.1)] flex">
      {/* Completed segment */}
      <div
        className="h-full bg-gradient-to-r from-[oklch(0.7_0.2_145)] to-[oklch(0.7_0.22_200)] transition-all duration-700 ease-out"
        style={{ width: `${completedPct}%` }}
      />
      {/* Processing segment */}
      <div
        className="h-full bg-gradient-to-r from-[oklch(0.6_0.28_290)] to-[oklch(0.65_0.25_290)] transition-all duration-700 ease-out relative overflow-hidden"
        style={{ width: `${processingPct}%` }}
      >
        {/* Shimmer effect on processing segment */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 0.3) 50%, transparent 100%)",
            animation: "shimmer 1.5s infinite",
            backgroundSize: "200% 100%",
          }}
        />
      </div>
      {/* Failed segment */}
      <div
        className="h-full bg-[oklch(0.65_0.25_25)] transition-all duration-700 ease-out"
        style={{ width: `${failedPct}%` }}
      />
    </div>
  );
}
