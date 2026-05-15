import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Trash2, Edit3, Copy } from "lucide-react";
import type { Scene } from "@/types";

export default function StoryboardPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: project, refetch } = trpc.projects.get.useQuery({ id });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  const generateMutation = trpc.projects.generateScenes.useMutation({
    onSuccess: () => { refetch(); toast.success("分镜脚本已生成"); },
    onError: (err) => toast.error(`生成失败: ${err.message}`),
  });

  const updateSceneMutation = trpc.projects.updateScene.useMutation({
    onSuccess: () => { refetch(); setEditingScene(null); toast.success("已保存"); },
    onError: (err) => toast.error(`保存失败: ${err.message}`),
  });

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => refetch(),
  });

  const scenes = project?.scenes ?? [];

  const moveScene = (sceneId: string, direction: "up" | "down") => {
    const sorted = [...scenes].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === sceneId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const newScenes = [...sorted];
    [newScenes[idx], newScenes[swapIdx]] = [newScenes[swapIdx], newScenes[idx]];
    const reordered = newScenes.map((s, i) => ({ ...s, order: i + 1 }));
    updateProjectMutation.mutate({ id, updates: { scenes: reordered } });
  };

  const deleteScene = (sceneId: string) => {
    const newScenes = scenes.filter((s) => s.id !== sceneId).map((s, i) => ({ ...s, order: i + 1 }));
    updateProjectMutation.mutate({ id, updates: { scenes: newScenes } });
  };

  return (
    <AppShell title="分镜脚本" backHref={`/projects/${id}/brief`} showNav={false}>
      <div className="px-4 py-4 space-y-4">
        {/* Generate Button */}
        <button
          onClick={() => generateMutation.mutate({ projectId: id })}
          disabled={generateMutation.isPending}
          className="w-full glass-card neon-border p-4 flex items-center gap-3 hover:bg-[oklch(0.6_0.28_290/0.05)] transition-colors"
        >
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-[oklch(0.6_0.28_290)] to-[oklch(0.7_0.22_200)] flex items-center justify-center flex-shrink-0 ${generateMutation.isPending ? "animate-pulse" : ""}`}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {generateMutation.isPending ? "AI 正在生成分镜..." : scenes.length > 0 ? "重新生成分镜" : "生成分镜脚本"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {scenes.length > 0 ? `当前 ${scenes.length} 个镜头` : "自动拆分镜头并生成英文 Prompt"}
            </p>
          </div>
        </button>

        {/* Scene List */}
        {scenes.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{scenes.length} 个镜头 · 总时长约 {scenes.reduce((s, sc) => s + (sc.endTime - sc.startTime), 0)}s</p>
            {[...scenes].sort((a, b) => a.order - b.order).map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                expanded={expandedId === scene.id}
                onToggle={() => setExpandedId(expandedId === scene.id ? null : scene.id)}
                onMoveUp={() => moveScene(scene.id, "up")}
                onMoveDown={() => moveScene(scene.id, "down")}
                onDelete={() => deleteScene(scene.id)}
                onEdit={() => setEditingScene(scene)}
              />
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingScene && (
          <SceneEditModal
            scene={editingScene}
            onSave={(updates) => updateSceneMutation.mutate({ projectId: id, sceneId: editingScene.id, updates })}
            onClose={() => setEditingScene(null)}
            saving={updateSceneMutation.isPending}
          />
        )}

        {scenes.length > 0 && (
          <div className="pb-4">
            <Button
              onClick={() => navigate(`/projects/${id}/model-settings`)}
              className="w-full btn-gradient text-white h-12 text-sm font-semibold"
            >
              下一步：模型配置
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SceneCard({
  scene,
  expanded,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
  onEdit,
}: {
  scene: Scene;
  expanded: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <button onClick={onToggle} className="w-full p-3 text-left">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[oklch(0.6_0.28_290/0.3)] to-[oklch(0.7_0.22_200/0.3)] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[oklch(0.7_0.22_200)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {String(scene.order).padStart(2, "0")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{scene.goal}</p>
            <p className="text-xs text-muted-foreground">{scene.startTime}s – {scene.endTime}s</p>
          </div>
          <StatusBadge status={scene.status} />
          {expanded ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 p-3 space-y-3">
          <InfoRow label="画面描述" value={scene.visualDescription} />
          <InfoRow label="字幕文案" value={scene.subtitleText} />
          <InfoRow label="配音文案" value={scene.voiceoverText} />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">AI Prompt</p>
            <p className="text-xs text-foreground/70 font-mono bg-[oklch(0.1_0.01_285)] rounded-lg p-2 leading-relaxed line-clamp-3">
              {scene.prompt}
            </p>
          </div>
          {scene.taskId && (
            <InfoRow label="Task ID" value={scene.taskId} mono />
          )}
          {scene.videoUrl && (
            <InfoRow label="视频 URL" value={scene.videoUrl} />
          )}
          {scene.errorMessage && (
            <p className="text-xs text-[oklch(0.65_0.25_25)] bg-[oklch(0.65_0.25_25/0.1)] rounded-lg p-2">
              {scene.errorMessage}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onEdit} className="flex items-center gap-1 text-xs text-[oklch(0.6_0.28_290)] hover:opacity-80">
              <Edit3 size={12} /> 编辑
            </button>
            <button onClick={onMoveUp} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowUp size={12} /> 上移
            </button>
            <button onClick={onMoveDown} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowDown size={12} /> 下移
            </button>
            <button onClick={onDelete} className="flex items-center gap-1 text-xs text-[oklch(0.65_0.25_25)] hover:opacity-80 ml-auto">
              <Trash2 size={12} /> 删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-xs text-foreground/80 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function SceneEditModal({
  scene,
  onSave,
  onClose,
  saving,
}: {
  scene: Scene;
  onSave: (updates: Partial<Scene>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    goal: scene.goal,
    visualDescription: scene.visualDescription,
    prompt: scene.prompt,
    negativePrompt: scene.negativePrompt,
    subtitleText: scene.subtitleText,
    voiceoverText: scene.voiceoverText,
    musicSuggestion: scene.musicSuggestion,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-[oklch(0.12_0.012_285)] border-t border-border rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            编辑镜头 {scene.order}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {(["goal", "visualDescription", "subtitleText", "voiceoverText", "musicSuggestion"] as const).map((field) => (
          <div key={field} className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {{ goal: "镜头目标", visualDescription: "画面描述", subtitleText: "字幕文案", voiceoverText: "配音文案", musicSuggestion: "音乐建议" }[field]}
            </label>
            <input
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="w-full text-sm bg-[oklch(0.1_0.01_285)] rounded-lg px-3 py-2 outline-none border border-border focus:border-[oklch(0.6_0.28_290/0.5)]"
            />
          </div>
        ))}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Prompt</label>
          <textarea
            value={form.prompt}
            onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
            rows={4}
            className="w-full text-xs font-mono bg-[oklch(0.1_0.01_285)] rounded-lg px-3 py-2 outline-none border border-border focus:border-[oklch(0.6_0.28_290/0.5)] resize-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Negative Prompt</label>
          <textarea
            value={form.negativePrompt}
            onChange={(e) => setForm((f) => ({ ...f, negativePrompt: e.target.value }))}
            rows={2}
            className="w-full text-xs font-mono bg-[oklch(0.1_0.01_285)] rounded-lg px-3 py-2 outline-none border border-border focus:border-[oklch(0.6_0.28_290/0.5)] resize-none"
          />
        </div>
        <Button
          onClick={() => onSave(form)}
          disabled={saving}
          className="w-full btn-gradient text-white"
        >
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}
