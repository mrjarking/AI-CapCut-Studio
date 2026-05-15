import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import StitchProgressPanel from "@/components/StitchProgressPanel";
import CompletionCelebration from "@/components/CompletionCelebration";
import { Button } from "@/components/ui/button";
import {
  Scissors,
  ArrowUp,
  ArrowDown,
  Play,
  Download,
  ArrowRight,
  Film,
} from "lucide-react";

export default function StitchPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: project, refetch } = trpc.projects.get.useQuery({ id });
  const [stitching, setStitching] = useState(false);
  const [stitchError, setStitchError] = useState<string | undefined>();
  const [finalVideoUrl, setFinalVideoUrl] = useState(project?.finalVideoUrl ?? "");

  const stitchMutation = trpc.video.stitch.useMutation({
    onSuccess: (result) => {
      setStitching(false);
      if (result.status === "completed" && result.finalVideoUrl) {
        setFinalVideoUrl(result.finalVideoUrl);
        setStitchError(undefined);
        toast.success("视频拼接完成！");
        setFinalVideoUrlMutation.mutate({
          projectId: id,
          finalVideoUrl: result.finalVideoUrl,
        });
      } else {
        const errMsg = result.errorMessage ?? "拼接失败，请重试";
        setStitchError(errMsg);
        toast.error(errMsg);
      }
    },
    onError: (err) => {
      setStitching(false);
      const errMsg = `拼接失败: ${err.message}`;
      setStitchError(errMsg);
      toast.error(errMsg);
    },
  });

  const setFinalVideoUrlMutation = trpc.projects.setFinalVideo.useMutation({
    onSuccess: () => refetch(),
  });

  const completedScenes = [...(project?.scenes ?? [])]
    .filter((s) => s.status === "completed" && s.videoUrl)
    .sort((a, b) => a.order - b.order);

  const [sceneOrder, setSceneOrder] = useState<string[]>([]);

  // Sync sceneOrder when completedScenes changes
  useEffect(() => {
    setSceneOrder((prev) => {
      const ids = completedScenes.map((s) => s.id);
      const existing = prev.filter((sid) => ids.includes(sid));
      const newIds = ids.filter((sid) => !prev.includes(sid));
      return [...existing, ...newIds];
    });
  }, [completedScenes.length]);

  const moveScene = (sceneId: string, direction: "up" | "down") => {
    const idx = sceneOrder.indexOf(sceneId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sceneOrder.length - 1) return;
    const newOrder = [...sceneOrder];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setSceneOrder(newOrder);
  };

  const handleStitch = () => {
    if (completedScenes.length === 0) {
      toast.error("没有已完成的视频片段");
      return;
    }
    setStitching(true);
    setStitchError(undefined);

    const orderedScenes = sceneOrder
      .map((sid, idx) => {
        const scene = completedScenes.find((s) => s.id === sid);
        if (!scene || !scene.videoUrl) return null;
        return { sceneId: scene.id, videoUrl: scene.videoUrl, order: idx + 1 };
      })
      .filter(Boolean) as { sceneId: string; videoUrl: string; order: number }[];

    stitchMutation.mutate({
      projectId: id,
      sceneVideoUrls: orderedScenes,
      outputFileName: "final.mp4",
    });
  };

  const orderedScenes = sceneOrder
    .map((sid) => completedScenes.find((s) => s.id === sid))
    .filter(Boolean);

  const showProgress = stitching || (stitchError !== undefined && !finalVideoUrl);
  const showComplete = !!finalVideoUrl;

  return (
    <AppShell title="视频拼接" backHref={`/projects/${id}/generation`} showNav={false}>
      <div className="px-4 py-4 space-y-4">

        {/* ── Info header ── */}
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[oklch(0.72_0.25_340/0.2)] to-[oklch(0.6_0.28_290/0.2)] flex items-center justify-center flex-shrink-0">
            <Film size={16} className="text-[oklch(0.72_0.25_340)]" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {completedScenes.length} 个片段可拼接
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              调整顺序后点击开始拼接，FFmpeg 将自动合并所有片段
            </p>
          </div>
        </div>

        {/* ── Stitch Progress Panel (shown while stitching or on error) ── */}
        {showProgress && (
          <StitchProgressPanel
            stitching={stitching}
            segmentCount={completedScenes.length}
            error={stitchError}
          />
        )}

        {/* ── Completed Video ── */}
        {showComplete && (
          <div className="space-y-3 completion-pop">
            <CompletionCelebration
              title="最终视频已生成！"
              description={`${completedScenes.length} 个片段已成功拼接为完整视频`}
              variant="green"
            />

            {/* Video player */}
            <video
              src={finalVideoUrl}
              controls
              className="w-full rounded-xl bg-black max-h-[52vh] shadow-lg"
              playsInline
              style={{
                boxShadow: "0 0 32px oklch(0.6 0.28 290 / 0.15)",
              }}
            />

            {/* Action buttons */}
            <div className="flex gap-3">
              <a
                href={finalVideoUrl}
                download="final.mp4"
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl btn-gradient text-white text-sm font-medium"
              >
                <Download size={15} />
                下载视频
              </a>
              <Button
                variant="outline"
                onClick={() => navigate(`/projects/${id}/preview`)}
                className="flex-1 border-border text-sm h-11"
              >
                <Play size={14} className="mr-1.5" />
                预览与导出
              </Button>
            </div>

            <Button
              onClick={() => navigate(`/projects/${id}/preview`)}
              className="w-full btn-gradient text-white h-11 text-sm font-semibold"
            >
              进入预览导出页
              <ArrowRight size={15} className="ml-2" />
            </Button>
          </div>
        )}

        {/* ── Scene Order List (hidden while stitching or completed) ── */}
        {!stitching && !showComplete && orderedScenes.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              片段顺序 · 可调整
            </p>
            {orderedScenes.map((scene, idx) =>
              scene ? (
                <div
                  key={scene.id}
                  className="glass-card p-3 flex items-center gap-3 step-slide-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Order badge */}
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[oklch(0.7_0.2_145/0.25)] to-[oklch(0.7_0.22_200/0.25)] flex items-center justify-center flex-shrink-0">
                    <span
                      className="text-xs font-bold text-[oklch(0.7_0.2_145)]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Scene info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{scene.goal}</p>
                    <p className="text-xs text-muted-foreground">
                      {scene.startTime}s – {scene.endTime}s
                    </p>
                  </div>

                  {/* Reorder buttons */}
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => moveScene(scene.id, "up")}
                      disabled={idx === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-25 transition-all"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => moveScene(scene.id, "down")}
                      disabled={idx === orderedScenes.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-25 transition-all"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* ── Stitch Button ── */}
        {!finalVideoUrl && !stitching && (
          <div className="pb-4">
            <Button
              onClick={handleStitch}
              disabled={completedScenes.length === 0}
              className="w-full btn-gradient text-white h-12 text-sm font-semibold"
            >
              <Scissors size={16} className="mr-2" />
              {stitchError ? "重新拼接" : "开始拼接最终视频"}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
