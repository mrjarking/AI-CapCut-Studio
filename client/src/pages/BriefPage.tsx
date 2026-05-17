import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Sparkles, Edit3, ChevronDown, ChevronUp, LayoutTemplate } from "lucide-react";
import type { Project, VideoBrief } from "@/types";

const DEFAULT_BRIEF_TEMPLATES: Array<{ id: string; name: string; brief: VideoBrief }> = [
  {
    id: "launch",
    name: "新歌发布宣发",
    brief: {
      title: "新歌上线高能预告",
      coreSellingPoints: ["新作品核心旋律", "艺人视觉记忆点", "平台首发福利"],
      targetAudience: "关注亚洲流行音乐、短视频音乐趋势和艺人动态的年轻用户",
      emotionKeywords: ["期待", "心动", "高能", "分享欲"],
      storyline: "用一个强钩子的开场制造悬念，随后展示艺人状态、作品氛围和平台入口，最后用明确 CTA 引导收听。",
      videoStructure: "3 秒 Hook → 艺人/作品亮点 → 情绪高潮 → CisuMusic CTA",
      subtitleStyle: "短句大字，关键词霓虹高亮，适合竖屏快速扫读",
      voiceoverStyle: "年轻、有节奏、带一点发布倒计时的兴奋感",
      musicSuggestion: "优先使用新歌副歌或最强 hook 段落",
      socialMediaTips: "发布时配合倒计时、评论区置顶试听入口和艺人话题标签",
      ctaSuggestion: "立即在 CisuMusic 收听完整版",
    },
  },
  {
    id: "artist-story",
    name: "艺人故事向",
    brief: {
      title: "一分钟认识这位艺人",
      coreSellingPoints: ["艺人背景", "音乐态度", "代表作品"],
      targetAudience: "第一次接触该艺人的泛音乐用户和潜在粉丝",
      emotionKeywords: ["真实", "共鸣", "记住", "靠近"],
      storyline: "从一个能代表艺人的瞬间切入，逐步展开成长、作品与粉丝连接，形成可被转发的艺人名片。",
      videoStructure: "人物瞬间 → 背景介绍 → 作品与态度 → 粉丝连接 → 关注 CTA",
      subtitleStyle: "纪录片式短句，重点信息用品牌色强调",
      voiceoverStyle: "温暖、可信、像朋友介绍一位值得认识的音乐人",
      musicSuggestion: "使用艺人代表作品的氛围段落做底",
      socialMediaTips: "适合小红书、YouTube Shorts、视频号等需要信息密度的平台",
      ctaSuggestion: "关注艺人，收藏这份音乐人档案",
    },
  },
  {
    id: "event",
    name: "活动/演出推广",
    brief: {
      title: "活动倒计时宣传片",
      coreSellingPoints: ["活动时间节点", "现场氛围", "参与福利"],
      targetAudience: "已关注艺人的粉丝、城市本地音乐用户和活动潜在参与者",
      emotionKeywords: ["倒计时", "现场感", "参与", "热烈"],
      storyline: "用倒计时建立紧迫感，穿插艺人和现场素材，展示福利与参与方式，推动预约或购票。",
      videoStructure: "倒计时 Hook → 现场能量 → 福利信息 → 参与路径 → CTA",
      subtitleStyle: "信息型字幕，时间地点福利必须清晰",
      voiceoverStyle: "直接、兴奋、有活动广播感",
      musicSuggestion: "节奏明确的现场或鼓点音乐",
      socialMediaTips: "发布后 24 小时内配合评论区答疑和二次提醒",
      ctaSuggestion: "立即预约，不错过现场",
    },
  },
];

function historyBriefTemplates(projects: Project[] | undefined, currentId: string) {
  return (projects ?? [])
    .filter((project) => project.id !== currentId && project.brief)
    .slice(-6)
    .reverse()
    .map((project) => ({
      id: `history-${project.id}`,
      name: `历史：${project.name}`,
      brief: project.brief as VideoBrief,
    }));
}

export default function BriefPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: project, refetch } = trpc.projects.get.useQuery({ id });
  const { data: projects } = trpc.projects.list.useQuery();
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
  const templates = [...DEFAULT_BRIEF_TEMPLATES, ...historyBriefTemplates(projects, id)];

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

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <LayoutTemplate size={14} className="text-[oklch(0.6_0.28_290)]" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">策划案模板参考</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setEditingBrief(template.brief);
                  toast.success("已套用策划案模板");
                }}
                className="w-48 flex-shrink-0 glass-card p-3 text-left border-border hover:bg-white/[0.02]"
              >
                <p className="text-xs font-semibold truncate">{template.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{template.brief.storyline}</p>
              </button>
            ))}
          </div>
        </div>

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
