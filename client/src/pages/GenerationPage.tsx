import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import ProgressBar from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Play, Pause, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import type { Scene } from "@/types";

export default function GenerationPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: project, refetch } = trpc.projects.get.useQuery({ id });
  const { data: settings } = trpc.settings.get.useQuery();
  const [polling, setPolling] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utils = trpc.useUtils();

  const generateBatchMutation = trpc.video.generateBatch.useMutation({
    onSuccess: (results) => {
      const failed = results.filter((r) => r.status === "failed");
      if (failed.length > 0) toast.error(`${failed.length} 个镜头提交失败`);
      else toast.success("所有镜头已提交生成");
      refetch();
      setPolling(true);
    },
    onError: (err) => toast.error(`批量生成失败: ${err.message}`),
  });

  const generateSingleMutation = trpc.video.generate.useMutation({
    onSuccess: () => { refetch(); toast.success("镜头已提交"); },
    onError: (err) => toast.error(`提交失败: ${err.message}`),
  });

  const getStatusQuery = trpc.video.getStatus.useQuery(
    { taskId: "" },
    { enabled: false }
  );

  // Polling
  useEffect(() => {
    if (!polling || !project) return;

    const pollInterval = settings?.pollIntervalMs ?? 5000;

    const poll = async () => {
      const activeTasks = project.scenes.filter(
        (s) => s.taskId && ["submitted", "processing", "queued"].includes(s.status)
      );

      if (activeTasks.length === 0) {
        setPolling(false);
        refetch();
        return;
      }

      for (const scene of activeTasks) {
        if (!scene.taskId) continue;
        try {
          await utils.video.getStatus.fetch({ taskId: scene.taskId });
        } catch {
          // ignore
        }
      }
      refetch();
    };

    pollRef.current = setInterval(poll, pollInterval);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [polling, project, settings?.pollIntervalMs]);

  const scenes = [...(project?.scenes ?? [])].sort((a, b) => a.order - b.order);
  const completedCount = scenes.filter((s) => s.status === "completed").length;
  const failedCount = scenes.filter((s) => s.status === "failed").length;
  const processingCount = scenes.filter((s) => ["submitted", "processing", "queued"].includes(s.status)).length;
  const totalCount = scenes.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  const handleGenerateAll = () => {
    if (!project) return;
    const scenesToGenerate = scenes.filter((s) => s.status === "idle" || s.status === "failed");
    if (scenesToGenerate.length === 0) { toast.info("所有镜头已生成或正在生成"); return; }

    generateBatchMutation.mutate({
      projectId: id,
      scenes: scenesToGenerate.map((s) => ({
        sceneId: s.id,
        prompt: s.prompt,
        negativePrompt: s.negativePrompt,
        durationSeconds: s.endTime - s.startTime,
        aspectRatio: (project?.aspectRatio ?? "9:16") as "9:16" | "16:9" | "1:1",
      })),
    });
  };

  const handleGenerateSingle = (scene: Scene) => {
    if (!settings) return;
    generateSingleMutation.mutate({
      provider: settings.mockMode ? "mock" : settings.apiProvider,
      projectId: id,
      sceneId: scene.id,
      prompt: scene.prompt,
      negativePrompt: scene.negativePrompt,
      aspectRatio: project?.aspectRatio ?? "9:16",
      durationSeconds: scene.endTime - scene.startTime,
      model: settings.defaultModel,
      watermark: settings.watermark,
      generateAudio: settings.generateAudio,
      seed: settings.seed ?? undefined,
    });
  };

  return (
    <AppShell title="生成任务队列" backHref={`/projects/${id}/model-settings`} showNav={false}>
      <div className="px-4 py-4 space-y-4">
        {/* Progress Overview */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {completedCount} / {totalCount} 镜头完成
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {processingCount > 0 && `${processingCount} 个生成中 · `}
                {failedCount > 0 && `${failedCount} 个失败 · `}
                {settings?.mockMode ? "Mock Mode" : "Real API"}
              </p>
            </div>
            <span className="text-2xl font-bold gradient-text" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} showLabel={false} />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateAll}
            disabled={generateBatchMutation.isPending || allCompleted}
            className="flex-1 btn-gradient text-white text-sm"
          >
            <Play size={14} className="mr-1.5" />
            {generateBatchMutation.isPending ? "提交中..." : "生成全部镜头"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPolling((v) => !v)}
            className="border-border w-10 h-10"
            title={polling ? "暂停轮询" : "继续轮询"}
          >
            {polling ? <Pause size={14} /> : <Play size={14} />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="border-border w-10 h-10"
            title="刷新状态"
          >
            <RefreshCw size={14} />
          </Button>
        </div>

        {polling && (
          <div className="flex items-center gap-2 text-xs text-[oklch(0.6_0.28_290)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.6_0.28_290)] animate-pulse" />
            自动轮询中（每 {(settings?.pollIntervalMs ?? 5000) / 1000}s）
          </div>
        )}

        {/* Scene Cards */}
        <div className="space-y-2">
          {scenes.map((scene) => (
            <SceneGenerationCard
              key={scene.id}
              scene={scene}
              expanded={expandedId === scene.id}
              onToggle={() => setExpandedId(expandedId === scene.id ? null : scene.id)}
              onGenerate={() => handleGenerateSingle(scene)}
              generating={generateSingleMutation.isPending}
            />
          ))}
        </div>

        {/* Next Step */}
        {allCompleted && (
          <div className="pb-4">
            <div className="glass-card p-3 bg-[oklch(0.7_0.2_145/0.05)] border-[oklch(0.7_0.2_145/0.2)] mb-3">
              <p className="text-xs text-[oklch(0.7_0.2_145)] font-medium">✓ 所有镜头生成完成！</p>
            </div>
            <Button
              onClick={() => navigate(`/projects/${id}/stitch`)}
              className="w-full btn-gradient text-white h-12 text-sm font-semibold"
            >
              进入视频拼接
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SceneGenerationCard({
  scene,
  expanded,
  onToggle,
  onGenerate,
  generating,
}: {
  scene: Scene;
  expanded: boolean;
  onToggle: () => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  const isActive = ["submitted", "processing", "queued"].includes(scene.status);

  return (
    <div className={`glass-card overflow-hidden transition-all ${isActive ? "border-[oklch(0.6_0.28_290/0.3)]" : ""}`}>
      <button onClick={onToggle} className="w-full p-3 text-left">
        <div className="flex items-center gap-3">
          {/* Scene number with status indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.6_0.28_290/0.2)] to-[oklch(0.7_0.22_200/0.2)] flex items-center justify-center">
              <span className="text-xs font-bold text-[oklch(0.7_0.22_200)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {String(scene.order).padStart(2, "0")}
              </span>
            </div>
            {isActive && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[oklch(0.6_0.28_290)] animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{scene.goal}</p>
            {scene.taskId && (
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {scene.taskId.slice(0, 20)}...
              </p>
            )}
          </div>
          <StatusBadge status={scene.status} />
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 p-3 space-y-3">
          {scene.taskId && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Task ID</p>
              <p className="text-xs font-mono text-foreground/70 break-all">{scene.taskId}</p>
            </div>
          )}
          {scene.videoUrl && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">视频预览</p>
              <video
                src={scene.videoUrl}
                controls
                className="w-full rounded-lg max-h-48 bg-black"
                playsInline
              />
            </div>
          )}
          {scene.errorMessage && (
            <p className="text-xs text-[oklch(0.65_0.25_25)] bg-[oklch(0.65_0.25_25/0.1)] rounded-lg p-2">
              {scene.errorMessage}
            </p>
          )}
          <div className="flex gap-2">
            {(scene.status === "idle" || scene.status === "failed") && (
              <button
                onClick={onGenerate}
                disabled={generating}
                className="flex items-center gap-1 text-xs text-[oklch(0.6_0.28_290)] hover:opacity-80 disabled:opacity-50"
              >
                <Play size={12} />
                {scene.status === "failed" ? "重试" : "单独生成"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
