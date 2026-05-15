import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import GenerationProgressPanel from "@/components/GenerationProgressPanel";
import SceneProgressCard from "@/components/SceneProgressCard";
import CompletionCelebration from "@/components/CompletionCelebration";
import { Button } from "@/components/ui/button";
import { Play, Pause, RefreshCw, ArrowRight } from "lucide-react";
import { useGenerationTimer } from "@/hooks/useGenerationTimer";
import GenerationTimeEstimate from "@/components/GenerationTimeEstimate";
import type { Scene } from "@/types";

export default function GenerationPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: project, refetch } = trpc.projects.get.useQuery({ id });
  const { data: settings } = trpc.settings.get.useQuery();
  const [polling, setPolling] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Use refs to avoid stale closures in the polling interval
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const projectIdRef = useRef(id);
  const pollingRef = useRef(false);
  const utils = trpc.useUtils();

  // Keep refs in sync
  projectIdRef.current = id;
  pollingRef.current = polling;

  // ── Timer hook ─────────────────────────────────────────────────────────────
  const scenes = [...(project?.scenes ?? [])].sort((a, b) => a.order - b.order);
  const isMock = settings?.mockMode ?? true;

  const timerState = useGenerationTimer(scenes, polling, isMock);

  // ── Core polling function (uses refs, not closures) ──────────────────────
  const runPoll = useCallback(async () => {
    if (!pollingRef.current) return;

    try {
      // Fetch latest project data directly (avoids stale closure)
      const latestProject = await utils.projects.get.fetch({ id: projectIdRef.current });
      if (!latestProject) return;

      const activeTasks = latestProject.scenes.filter(
        (s) => s.taskId && ["submitted", "processing", "queued"].includes(s.status)
      );

      if (activeTasks.length === 0) {
        // No more active tasks — stop polling and refresh UI
        setPolling(false);
        refetch();
        return;
      }

      // Query status for each active task
      for (const scene of activeTasks) {
        if (!scene.taskId) continue;
        try {
          await utils.video.getStatus.fetch({ taskId: scene.taskId });
        } catch {
          // ignore individual failures, keep polling
        }
      }

      // Refresh the project data in the UI
      refetch();
    } catch {
      // Network error — keep polling, will retry next interval
    }
  }, [utils, refetch]);

  // ── Start / stop polling ──────────────────────────────────────────────────
  useEffect(() => {
    if (!polling) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const pollInterval = settings?.pollIntervalMs ?? 5000;

    // Small delay to let the generate mutation's refetch complete first
    const startTimeout = setTimeout(async () => {
      await runPoll();
      if (pollingRef.current) {
        pollRef.current = setInterval(runPoll, pollInterval);
      }
    }, 1500);

    return () => {
      clearTimeout(startTimeout);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling, settings?.pollIntervalMs]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const generateBatchMutation = trpc.video.generateBatch.useMutation({
    onSuccess: async (results) => {
      const failed = results.filter((r) => r.status === "failed" || !r.taskId);
      const succeeded = results.filter((r) => r.status !== "failed" && !!r.taskId);

      if (failed.length > 0 && succeeded.length === 0) {
        // All failed — show first error message
        const firstErr = failed[0]?.errorMessage || "生成请求全部失败，请检查模型名称和 API 配置";
        toast.error(firstErr, { duration: 8000 });
        await refetch();
        return;
      } else if (failed.length > 0) {
        toast.warning(`${failed.length} 个镜头提交失败，${succeeded.length} 个已提交生成`);
      } else {
        toast.success("所有镜头已提交，开始轮询状态");
      }
      await refetch();
      if (succeeded.length > 0) setPolling(true);
    },
    onError: (err) => toast.error(`批量生成失败: ${err.message}`),
  });

  const generateSingleMutation = trpc.video.generate.useMutation({
    onSuccess: async (result) => {
      if (result.status === "failed" || !result.taskId) {
        // Generation failed at API level — show error and do NOT start polling
        const errMsg = result.errorMessage || "生成请求失败，请检查模型名称和 API 配置";
        toast.error(errMsg, { duration: 6000 });
        await refetch(); // refresh to show failed status on the scene card
        return;
      }
      toast.success("镜头已提交生成");
      await refetch();
      setPolling(true);
    },
    onError: (err) => toast.error(`提交失败: ${err.message}`),
  });

  // ── Derived state ──────────────────────────────────────────────────────────
  const completedCount = scenes.filter((s) => s.status === "completed").length;
  const failedCount = scenes.filter((s) => s.status === "failed").length;
  const processingCount = scenes.filter((s) =>
    ["submitted", "processing", "queued"].includes(s.status)
  ).length;
  const idleCount = scenes.filter((s) => s.status === "idle" || s.status === "pending").length;
  const totalCount = scenes.length;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGenerateAll = () => {
    if (!project) return;
    const scenesToGenerate = scenes.filter(
      (s) => s.status === "idle" || s.status === "failed"
    );
    if (scenesToGenerate.length === 0) {
      toast.info("所有镜头已生成或正在生成中");
      return;
    }

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppShell title="生成任务队列" backHref={`/projects/${id}/model-settings`} showNav={false}>
      <div className="px-4 py-4 space-y-4">
        {/* ── Progress Overview Panel (with timer) ── */}
        <GenerationProgressPanel
          totalCount={totalCount}
          completedCount={completedCount}
          processingCount={processingCount}
          failedCount={failedCount}
          idleCount={idleCount}
          polling={polling}
          mockMode={isMock}
          pollIntervalMs={settings?.pollIntervalMs ?? 5000}
          overallElapsedSeconds={timerState.overallElapsedSeconds}
          overallEstimatedRemainingSeconds={timerState.overallEstimatedRemainingSeconds}
          overallProgress={timerState.overallProgress}
        />

        {/* ── Control Buttons ── */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateAll}
            disabled={
              generateBatchMutation.isPending ||
              generateSingleMutation.isPending ||
              (allCompleted && failedCount === 0)
            }
            className="flex-1 btn-gradient text-white text-sm h-10"
          >
            <Play size={14} className="mr-1.5" />
            {generateBatchMutation.isPending
              ? "提交中…"
              : failedCount > 0
              ? `重试 ${failedCount} 个失败镜头`
              : "生成全部镜头"}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setPolling((v) => !v)}
            className="border-border w-10 h-10 flex-shrink-0"
            title={polling ? "暂停轮询" : "恢复轮询"}
          >
            {polling ? <Pause size={14} /> : <Play size={14} />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="border-border w-10 h-10 flex-shrink-0"
            title="手动刷新"
          >
            <RefreshCw size={14} />
          </Button>
        </div>

        {/* ── Time Estimate (standalone component) ── */}
        <GenerationTimeEstimate
          polling={polling}
          completedCount={completedCount}
          totalCount={totalCount}
          overallElapsedSeconds={timerState.overallElapsedSeconds}
          overallEstimatedRemainingSeconds={timerState.overallEstimatedRemainingSeconds}
          overallProgress={timerState.overallProgress}
          isMock={isMock}
        />

        {/* Real API queue tip */}
        {!isMock && processingCount > 0 && (
          <div className="rounded-xl bg-[oklch(0.78_0.18_85/0.06)] border border-[oklch(0.78_0.18_85/0.2)] px-3 py-2">
            <p className="text-[10px] text-[oklch(0.78_0.18_85)] leading-relaxed">
              <span className="font-semibold">提示：</span>Real API 生成通常需要 1-5 分钟。若长时间停留在排队状态，可能是服务商队列繁忙，请耐心等待或切换至 Mock Mode 演示。
            </p>
          </div>
        )}

        {/* ── Scene Cards (with per-scene timer) ── */}
        {scenes.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-0.5">
              镜头列表 · {scenes.length} 个
            </p>
            {scenes.map((scene, idx) => (
              <SceneProgressCard
                key={scene.id}
                scene={scene}
                index={idx}
                expanded={expandedId === scene.id}
                onToggle={() =>
                  setExpandedId(expandedId === scene.id ? null : scene.id)
                }
                onGenerate={() => handleGenerateSingle(scene)}
                generating={generateSingleMutation.isPending}
                timerInfo={timerState.sceneTimers[scene.id]}
              />
            ))}
          </div>
        )}

        {/* ── Next Step CTA ── */}
        {allCompleted && (
          <div className="pb-4 space-y-3">
            <CompletionCelebration
              title="所有镜头已生成完成！"
              description={`${completedCount} 个镜头全部生成成功，共用时 ${
                timerState.overallElapsedSeconds > 0
                  ? timerState.overallElapsedSeconds < 60
                    ? `${timerState.overallElapsedSeconds} 秒`
                    : `${Math.floor(timerState.overallElapsedSeconds / 60)} 分 ${timerState.overallElapsedSeconds % 60} 秒`
                  : "若干时间"
              }`}
              variant="green"
            />
            <Button
              onClick={() => navigate(`/projects/${id}/stitch`)}
              className="w-full btn-gradient text-white h-12 text-sm font-semibold"
            >
              进入视频拼接
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
