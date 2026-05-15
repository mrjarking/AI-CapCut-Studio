import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy, ExternalLink, Sparkles } from "lucide-react";

export default function ProjectsPage() {
  const [, navigate] = useLocation();
  const { data: projects, refetch } = trpc.projects.list.useQuery();

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("项目已删除"); },
    onError: (err) => toast.error(`删除失败: ${err.message}`),
  });

  const duplicateMutation = trpc.projects.duplicate.useMutation({
    onSuccess: (p) => { refetch(); toast.success("项目已复制"); if (p) navigate(`/projects/${p.id}/brief`); },
    onError: (err) => toast.error(`复制失败: ${err.message}`),
  });

  const getProjectHref = (p: NonNullable<typeof projects>[0]) => {
    if (p.status === "completed") return `/projects/${p.id}/preview`;
    if (p.finalVideoUrl) return `/projects/${p.id}/preview`;
    if (p.status === "stitching") return `/projects/${p.id}/stitch`;
    if (p.scenes.some((s) => s.status === "completed")) return `/projects/${p.id}/stitch`;
    if (p.status === "generating" || p.scenes.some((s) => ["submitted", "processing", "queued"].includes(s.status))) return `/projects/${p.id}/generation`;
    if (p.scenes.length > 0) return `/projects/${p.id}/generation`;
    if (p.brief) return `/projects/${p.id}/storyboard`;
    return `/projects/${p.id}/brief`;
  };

  const sorted = [...(projects ?? [])].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <AppShell title="历史项目">
      <div className="px-4 py-4 space-y-4">
        <Button
          onClick={() => navigate("/projects/new")}
          className="w-full btn-gradient text-white h-10 text-sm"
        >
          <Plus size={16} className="mr-1.5" />
          新建项目
        </Button>

        {sorted.length === 0 ? (
          <div className="glass-card p-8 text-center space-y-2">
            <Sparkles size={32} className="mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">暂无项目</p>
            <p className="text-xs text-muted-foreground/60">点击上方按钮创建第一个 AI 视频项目</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((p) => (
              <div key={p.id} className="glass-card p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[oklch(0.6_0.28_290/0.3)] to-[oklch(0.7_0.22_200/0.3)] flex items-center justify-center flex-shrink-0">
                    <Sparkles size={15} className="text-[oklch(0.7_0.22_200)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.artistName} · {p.durationSeconds}s · {p.aspectRatio}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(p.updatedAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                {/* Progress */}
                {p.scenes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-[oklch(0.6_0.28_290/0.1)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[oklch(0.6_0.28_290)] to-[oklch(0.7_0.22_200)] transition-all"
                        style={{ width: `${(p.scenes.filter((s) => s.status === "completed").length / p.scenes.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {p.scenes.filter((s) => s.status === "completed").length}/{p.scenes.length}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(getProjectHref(p))}
                    className="flex items-center gap-1 text-xs text-[oklch(0.6_0.28_290)] hover:opacity-80"
                  >
                    <ExternalLink size={12} />
                    继续编辑
                  </button>
                  <button
                    onClick={() => duplicateMutation.mutate({ id: p.id })}
                    disabled={duplicateMutation.isPending}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Copy size={12} />
                    复制
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("确定删除此项目？")) deleteMutation.mutate({ id: p.id });
                    }}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1 text-xs text-[oklch(0.65_0.25_25)] hover:opacity-80 ml-auto"
                  >
                    <Trash2 size={12} />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
