import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { Zap, Plus, FolderOpen, Image, Settings, ChevronRight, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: templates } = trpc.media.templates.useQuery();
  // Prefetch artists so NewProjectPage and KnowledgePage load instantly
  trpc.media.artists.useQuery();

  useEffect(() => {
    if (!isLoading && settings && !settings.isConfigured) {
      navigate("/setup");
    }
  }, [settings, isLoading, navigate]);

  const recentProjects = projects?.slice(-3).reverse() ?? [];

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4 space-y-6">
        {/* Hero */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.6_0.28_290)] to-[oklch(0.7_0.22_200)] flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">CisuMusic</span>
          </div>
          <h1 className="text-2xl font-bold gradient-text leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            AI Video Studio
          </h1>
          <p className="text-xs text-muted-foreground">一键生成音乐宣发短视频</p>
        </div>

        {/* API Status */}
        {settings && (
          <div className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[oklch(0.7_0.2_145)]" />
              <span className="text-xs text-muted-foreground">
                Real API · {settings.apiProvider === "mock" ? "google_veo" : settings.apiProvider}
              </span>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="text-xs text-[oklch(0.6_0.28_290)] hover:opacity-80 transition-opacity"
            >
              配置
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/projects/new")}
            className="glass-card neon-border p-4 flex flex-col gap-3 text-left hover:bg-[oklch(0.6_0.28_290/0.05)] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[oklch(0.6_0.28_290)] to-[oklch(0.7_0.22_200)] flex items-center justify-center">
              <Plus size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>新建项目</p>
              <p className="text-xs text-muted-foreground mt-0.5">开始创作 AI 视频</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/projects")}
            className="glass-card p-4 flex flex-col gap-3 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.7_0.22_200/0.15)] flex items-center justify-center">
              <FolderOpen size={18} className="text-[oklch(0.7_0.22_200)]" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>历史项目</p>
              <p className="text-xs text-muted-foreground mt-0.5">{projects?.length ?? 0} 个项目</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/media")}
            className="glass-card p-4 flex flex-col gap-3 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.72_0.25_340/0.15)] flex items-center justify-center">
              <Image size={18} className="text-[oklch(0.72_0.25_340)]" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>素材库</p>
              <p className="text-xs text-muted-foreground mt-0.5">管理创作素材</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="glass-card p-4 flex flex-col gap-3 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.78_0.18_85/0.15)] flex items-center justify-center">
              <Settings size={18} className="text-[oklch(0.78_0.18_85)]" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>系统设置</p>
              <p className="text-xs text-muted-foreground mt-0.5">API 与模型配置</p>
            </div>
          </button>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>最近项目</h2>
              <button onClick={() => navigate("/projects")} className="text-xs text-[oklch(0.6_0.28_290)] flex items-center gap-0.5">
                全部 <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {recentProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.status === "completed") navigate(`/projects/${p.id}/preview`);
                    else if (p.status === "stitching" || p.scenes.some((s) => s.status === "completed")) navigate(`/projects/${p.id}/stitch`);
                    else if (p.status === "generating" || p.scenes.length > 0) navigate(`/projects/${p.id}/generation`);
                    else if (p.brief) navigate(`/projects/${p.id}/storyboard`);
                    else navigate(`/projects/${p.id}/brief`);
                  }}
                  className="w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.6_0.28_290/0.3)] to-[oklch(0.7_0.22_200/0.3)] flex items-center justify-center flex-shrink-0">
                    <Sparkles size={14} className="text-[oklch(0.7_0.22_200)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.artistName} · {p.durationSeconds}s</p>
                  </div>
                  <StatusBadge status={p.status} showDot />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Templates */}
        {templates && templates.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>推荐模板</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
              {templates.slice(0, 5).map((t) => (
                <button
                  key={t.templateId}
                  onClick={() => navigate("/projects/new")}
                  className="glass-card p-3 flex-shrink-0 w-36 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[oklch(0.72_0.25_340/0.3)] to-[oklch(0.6_0.28_290/0.3)] flex items-center justify-center mb-2">
                    <Sparkles size={13} className="text-[oklch(0.72_0.25_340)]" />
                  </div>
                  <p className="text-xs font-medium leading-tight">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
