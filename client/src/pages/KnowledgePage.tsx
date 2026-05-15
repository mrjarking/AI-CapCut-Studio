import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";

export default function KnowledgePage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: project } = trpc.projects.get.useQuery({ id });
  const { data: artists, isLoading: artistsLoading } = trpc.media.artists.useQuery();

  const [selected, setSelected] = useState<string[]>(project?.selectedKnowledgeModules ?? []);

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => navigate(`/projects/${id}/assets`),
    onError: (err) => toast.error(`更新失败: ${err.message}`),
  });

  const artist = artists?.find((a) => a.id === project?.artistId);

  const toggleModule = (moduleId: string) => {
    setSelected((prev) =>
      prev.includes(moduleId) ? prev.filter((x) => x !== moduleId) : [...prev, moduleId]
    );
  };

  const selectAll = () => setSelected(artist?.knowledgeModules.map((m) => m.id) ?? []);
  const clearAll = () => setSelected([]);

  const handleNext = () => {
    updateMutation.mutate({ id, updates: { selectedKnowledgeModules: selected } });
  };

  return (
    <AppShell
      title="选择知识库"
      backHref={`/projects/new`}
      showNav={false}
      actions={
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs text-[oklch(0.6_0.28_290)]">全选</button>
          <button onClick={clearAll} className="text-xs text-muted-foreground">清空</button>
        </div>
      }
    >
      <div className="px-4 py-4 space-y-4">
        {/* Artist Info */}
        {artist && (
          <div className="glass-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[oklch(0.6_0.28_290/0.3)] to-[oklch(0.7_0.22_200/0.3)] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold gradient-text" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {artist.name.slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{artist.name}</p>
                <p className="text-xs text-muted-foreground">{artist.country} · {artist.type}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {artist.keywords.slice(0, 4).map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded-full text-[10px] bg-[oklch(0.6_0.28_290/0.1)] text-[oklch(0.6_0.28_290)] border border-[oklch(0.6_0.28_290/0.2)]">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Modules */}
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            已选 {selected.length} / {artist?.knowledgeModules.length ?? 0} 个模块
          </p>
          <div className="space-y-2">
            {artistsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-4 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-2 w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              ))
            ) : !artist ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <p>未找到对应艺人的知识库</p>
                <p className="text-xs mt-1">artistId: {project?.artistId || '未设置'}</p>
              </div>
            ) : artist.knowledgeModules.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">该艺人暂无知识库模块</div>
            ) : null}
            {artist?.knowledgeModules.map((module) => {
              const isSelected = selected.includes(module.id);
              return (
                <button
                  key={module.id}
                  onClick={() => toggleModule(module.id)}
                  className={`w-full glass-card p-4 text-left transition-all duration-150 ${
                    isSelected
                      ? "border-[oklch(0.6_0.28_290/0.5)] bg-[oklch(0.6_0.28_290/0.06)]"
                      : "border-border hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 ${isSelected ? "text-[oklch(0.6_0.28_290)]" : "text-muted-foreground"}`}>
                      {isSelected ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{module.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{module.description}</p>
                      {isSelected && (
                        <p className="text-xs text-foreground/60 mt-2 line-clamp-2">{module.content}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-4">
          <Button
            onClick={handleNext}
            disabled={updateMutation.isPending || selected.length === 0}
            className="w-full btn-gradient text-white h-12 text-sm font-semibold"
          >
            {updateMutation.isPending ? "保存中..." : `下一步：选择素材（${selected.length} 个模块）`}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
