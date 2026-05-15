import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Scissors, ArrowUp, ArrowDown, Play, Download } from "lucide-react";

export default function StitchPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: project, refetch } = trpc.projects.get.useQuery({ id });
  const [stitching, setStitching] = useState(false);
  const [finalVideoUrl, setFinalVideoUrl] = useState(project?.finalVideoUrl ?? "");

  const stitchMutation = trpc.video.stitch.useMutation({
    onSuccess: (result) => {
      setStitching(false);
      if (result.status === "completed" && result.finalVideoUrl) {
        setFinalVideoUrl(result.finalVideoUrl);
        toast.success("视频拼接完成！");
        // Save to project
        setFinalVideoUrlMutation.mutate({ projectId: id, finalVideoUrl: result.finalVideoUrl });
      } else {
        toast.error(result.errorMessage ?? "拼接失败");
      }
    },
    onError: (err) => {
      setStitching(false);
      toast.error(`拼接失败: ${err.message}`);
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
      // Preserve existing order, add new ones at end
      const existing = prev.filter((id) => ids.includes(id));
      const newIds = ids.filter((id) => !prev.includes(id));
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
    if (completedScenes.length === 0) { toast.error("没有已完成的视频片段"); return; }
    setStitching(true);

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

  return (
    <AppShell title="视频拼接" backHref={`/projects/${id}/generation`} showNav={false}>
      <div className="px-4 py-4 space-y-4">
        {/* Info */}
        <div className="glass-card p-3">
          <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {completedScenes.length} 个片段可拼接
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            拖动调整顺序，点击开始拼接
          </p>
        </div>

        {/* Scene Order */}
        {orderedScenes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">片段顺序</p>
            {orderedScenes.map((scene, idx) => scene && (
              <div key={scene.id} className="glass-card p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[oklch(0.7_0.2_145/0.3)] to-[oklch(0.7_0.22_200/0.3)] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[oklch(0.7_0.2_145)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{scene.goal}</p>
                  <p className="text-xs text-muted-foreground">{scene.startTime}s – {scene.endTime}s</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveScene(scene.id, "up")}
                    disabled={idx === 0}
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => moveScene(scene.id, "down")}
                    disabled={idx === orderedScenes.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stitch Button */}
        {!finalVideoUrl && (
          <Button
            onClick={handleStitch}
            disabled={stitching || completedScenes.length === 0}
            className="w-full btn-gradient text-white h-12 text-sm font-semibold"
          >
            <Scissors size={16} className="mr-2" />
            {stitching ? "拼接中，请稍候..." : "开始拼接最终视频"}
          </Button>
        )}

        {stitching && (
          <div className="glass-card p-4 text-center space-y-2">
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="soundwave-bar h-8"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">正在下载片段并使用 FFmpeg 拼接...</p>
          </div>
        )}

        {/* Final Video */}
        {finalVideoUrl && (
          <div className="space-y-3">
            <div className="glass-card p-3 bg-[oklch(0.7_0.2_145/0.05)] border-[oklch(0.7_0.2_145/0.2)]">
              <p className="text-xs text-[oklch(0.7_0.2_145)] font-medium mb-1">✓ 拼接完成</p>
            </div>
            <video
              src={finalVideoUrl}
              controls
              className="w-full rounded-xl bg-black max-h-[50vh]"
              playsInline
            />
            <div className="flex gap-3">
              <a
                href={finalVideoUrl}
                download="final.mp4"
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl btn-gradient text-white text-sm font-medium"
              >
                <Download size={14} />
                下载视频
              </a>
              <Button
                variant="outline"
                onClick={() => navigate(`/projects/${id}/preview`)}
                className="flex-1 border-border text-sm"
              >
                <Play size={14} className="mr-1.5" />
                预览与导出
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
