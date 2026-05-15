import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Sparkles, Edit3, ChevronDown, ChevronUp } from "lucide-react";
import type { VideoBrief } from "@/types";

export default function BriefPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: project, refetch } = trpc.projects.get.useQuery({ id });
  const [editingBrief, setEditingBrief] = useState<VideoBrief | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const generateMutation = trpc.projects.generateBrief.useMutation({
    onSuccess: (brief) => {
      setEditingBrief(brief);
      refetch();
      toast.success("策划案已生成");
    },
    onError: (err) => toast.error(`生成失败: ${err.message}`),
  });

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => navigate(`/projects/${id}/storyboard`),
    onError: (err) => toast.error(`保存失败: ${err.message}`),
  });

  const brief = editingBrief ?? project?.brief;

  const handleNext = () => {
    if (!brief) { toast.error("请先生成策划案"); return; }
    if (editingBrief) {
      updateMutation.mutate({ id, updates: { brief: editingBrief } });
    } else {
      navigate(`/projects/${id}/storyboard`);
    }
  };

  const toggleSection = (key: string) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  return (
    <AppShell title="视频策划案" backHref={`/projects/${id}/assets`} showNav={false}>
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
              {generateMutation.isPending ? "AI 正在生成策划案..." : brief ? "重新生成策划案" : "生成视频策划案"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {generateMutation.isPending ? "请稍候，AI 正在分析项目信息..." : "基于艺人知识库和项目配置自动生成"}
            </p>
          </div>
        </button>

        {/* Brief Content */}
        {brief && (
          <div className="space-y-3">
            <BriefField
              label="视频标题"
              value={brief.title}
              expanded={expanded["title"]}
              onToggle={() => toggleSection("title")}
              onEdit={(v) => setEditingBrief((b) => b ? { ...b, title: v } : null)}
            />
            <BriefArrayField
              label="核心卖点"
              values={brief.coreSellingPoints}
              expanded={expanded["selling"]}
              onToggle={() => toggleSection("selling")}
            />
            <BriefField
              label="目标受众"
              value={brief.targetAudience}
              expanded={expanded["audience"]}
              onToggle={() => toggleSection("audience")}
              onEdit={(v) => setEditingBrief((b) => b ? { ...b, targetAudience: v } : null)}
            />
            <BriefArrayField
              label="情绪关键词"
              values={brief.emotionKeywords}
              expanded={expanded["emotion"]}
              onToggle={() => toggleSection("emotion")}
            />
            <BriefField
              label="故事线"
              value={brief.storyline}
              expanded={expanded["story"]}
              onToggle={() => toggleSection("story")}
              multiline
              onEdit={(v) => setEditingBrief((b) => b ? { ...b, storyline: v } : null)}
            />
            <BriefField
              label="视频结构"
              value={brief.videoStructure}
              expanded={expanded["structure"]}
              onToggle={() => toggleSection("structure")}
              onEdit={(v) => setEditingBrief((b) => b ? { ...b, videoStructure: v } : null)}
            />
            <BriefField
              label="字幕风格"
              value={brief.subtitleStyle}
              expanded={expanded["subtitle"]}
              onToggle={() => toggleSection("subtitle")}
              onEdit={(v) => setEditingBrief((b) => b ? { ...b, subtitleStyle: v } : null)}
            />
            <BriefField
              label="配音风格"
              value={brief.voiceoverStyle}
              expanded={expanded["voice"]}
              onToggle={() => toggleSection("voice")}
              onEdit={(v) => setEditingBrief((b) => b ? { ...b, voiceoverStyle: v } : null)}
            />
            <BriefField
              label="音乐建议"
              value={brief.musicSuggestion}
              expanded={expanded["music"]}
              onToggle={() => toggleSection("music")}
              onEdit={(v) => setEditingBrief((b) => b ? { ...b, musicSuggestion: v } : null)}
            />
            <BriefField
              label="社交媒体建议"
              value={brief.socialMediaTips}
              expanded={expanded["social"]}
              onToggle={() => toggleSection("social")}
              multiline
              onEdit={(v) => setEditingBrief((b) => b ? { ...b, socialMediaTips: v } : null)}
            />
            <BriefField
              label="CTA 建议"
              value={brief.ctaSuggestion}
              expanded={expanded["cta"]}
              onToggle={() => toggleSection("cta")}
              onEdit={(v) => setEditingBrief((b) => b ? { ...b, ctaSuggestion: v } : null)}
            />
          </div>
        )}

        {brief && (
          <div className="pb-4">
            <Button
              onClick={handleNext}
              disabled={updateMutation.isPending}
              className="w-full btn-gradient text-white h-12 text-sm font-semibold"
            >
              {updateMutation.isPending ? "保存中..." : "下一步：生成分镜脚本"}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function BriefField({
  label,
  value,
  expanded,
  onToggle,
  multiline,
  onEdit,
}: {
  label: string;
  value: string;
  expanded?: boolean;
  onToggle: () => void;
  multiline?: boolean;
  onEdit?: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(value);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/50">
          {editing ? (
            <div className="mt-2 space-y-2">
              {multiline ? (
                <textarea
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  className="w-full text-sm bg-transparent resize-none outline-none min-h-[80px]"
                  rows={4}
                />
              ) : (
                <input
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  className="w-full text-sm bg-transparent outline-none"
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { onEdit?.(editVal); setEditing(false); }}
                  className="text-xs text-[oklch(0.7_0.2_145)] font-medium"
                >
                  保存
                </button>
                <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground">取消</button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-start gap-2">
              <p className="flex-1 text-sm text-foreground/80 leading-relaxed">{value}</p>
              {onEdit && (
                <button onClick={() => { setEditVal(value); setEditing(true); }} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                  <Edit3 size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefArrayField({
  label,
  values,
  expanded,
  onToggle,
}: {
  label: string;
  values: string[];
  expanded?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/50 mt-0">
          <div className="flex flex-wrap gap-1.5 mt-2">
            {values.map((v, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-[oklch(0.6_0.28_290/0.1)] text-[oklch(0.6_0.28_290)] border border-[oklch(0.6_0.28_290/0.2)]">
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
