import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  VIDEO_GOAL_LABELS,
  USER_ROLE_LABELS,
  VIDEO_STYLE_LABELS,
  PLATFORM_LABELS,
  LANGUAGE_LABELS,
  type VideoGoal,
  type UserRole,
  type VideoStyle,
  type TargetPlatform,
  type TargetLanguage,
  type VideoDuration,
  type AspectRatio,
} from "@/types";

const GOALS = Object.entries(VIDEO_GOAL_LABELS) as [VideoGoal, string][];
const ROLES = Object.entries(USER_ROLE_LABELS) as [UserRole, string][];
const STYLES = Object.entries(VIDEO_STYLE_LABELS) as [VideoStyle, string][];
const PLATFORMS = Object.entries(PLATFORM_LABELS) as [TargetPlatform, string][];
const LANGUAGES = Object.entries(LANGUAGE_LABELS) as [TargetLanguage, string][];
const DURATIONS: VideoDuration[] = [30, 60, 90, 120];
const RATIOS: AspectRatio[] = ["9:16", "16:9", "1:1"];

export default function NewProjectPage() {
  const [, navigate] = useLocation();
  const { data: artists, isLoading: artistsLoading } = trpc.media.artists.useQuery();

  const [form, setForm] = useState({
    name: "",
    userRole: "operator" as UserRole,
    artistId: "",
    artistName: "",
    goal: "new_song" as VideoGoal,
    durationSeconds: 60 as VideoDuration,
    aspectRatio: "9:16" as AspectRatio,
    targetPlatforms: ["tiktok"] as TargetPlatform[],
    targetLanguage: "zh" as TargetLanguage,
    style: "cyber_music" as VideoStyle,
    selectedKnowledgeModules: [] as string[],
    selectedAssets: [] as string[],
  });

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      toast.success("项目已创建");
      navigate(`/projects/${project.id}/knowledge`);
    },
    onError: (err) => toast.error(`创建失败: ${err.message}`),
  });

  const togglePlatform = (p: TargetPlatform) => {
    setForm((f) => ({
      ...f,
      targetPlatforms: f.targetPlatforms.includes(p)
        ? f.targetPlatforms.filter((x) => x !== p)
        : [...f.targetPlatforms, p],
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("请输入项目名称"); return; }
    if (!form.artistId) { toast.error("请选择艺人"); return; }
    if (form.targetPlatforms.length === 0) { toast.error("请选择至少一个目标平台"); return; }
    createMutation.mutate(form);
  };

  return (
    <AppShell title="新建项目" backHref="/" showNav={false}>
      <div className="px-4 py-4 space-y-6">
        {/* Project Name */}
        <Section title="项目名称">
          <Input
            placeholder="例如：2Z 新歌宣传视频"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="text-sm"
          />
        </Section>

        {/* User Role */}
        <Section title="用户角色">
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(([value, label]) => (
              <OptionChip
                key={value}
                selected={form.userRole === value}
                onClick={() => setForm((f) => ({ ...f, userRole: value }))}
              >
                {label}
              </OptionChip>
            ))}
          </div>
        </Section>

        {/* Artist */}
        <Section title="选择艺人">
          <div className="grid grid-cols-2 gap-2">
            {artistsLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-3 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-1.5 w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))
            ) : artists && artists.length > 0 ? (
              artists.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setForm((f) => ({ ...f, artistId: a.id, artistName: a.name }))}
                  className={`glass-card p-3 text-left transition-all duration-200 ${
                    form.artistId === a.id
                      ? "border-[oklch(0.6_0.28_290/0.6)] bg-[oklch(0.6_0.28_290/0.08)]"
                      : "border-border hover:bg-white/[0.02]"
                  }`}
                >
                  <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{a.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.country} · {a.type}</p>
                </button>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 text-sm text-muted-foreground">
                暂无艺人数据，请检查后端服务
              </div>
            )}
          </div>
        </Section>

        {/* Goal */}
        <Section title="视频目标">
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map(([value, label]) => (
              <OptionChip
                key={value}
                selected={form.goal === value}
                onClick={() => setForm((f) => ({ ...f, goal: value }))}
              >
                {label}
              </OptionChip>
            ))}
          </div>
        </Section>

        {/* Duration */}
        <Section title="视频时长">
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <OptionChip
                key={d}
                selected={form.durationSeconds === d}
                onClick={() => setForm((f) => ({ ...f, durationSeconds: d }))}
              >
                {d}s
              </OptionChip>
            ))}
          </div>
        </Section>

        {/* Aspect Ratio */}
        <Section title="视频比例">
          <div className="grid grid-cols-3 gap-2">
            {RATIOS.map((r) => (
              <OptionChip
                key={r}
                selected={form.aspectRatio === r}
                onClick={() => setForm((f) => ({ ...f, aspectRatio: r }))}
              >
                {r}
              </OptionChip>
            ))}
          </div>
        </Section>

        {/* Target Platforms */}
        <Section title="目标平台（可多选）">
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(([value, label]) => (
              <OptionChip
                key={value}
                selected={form.targetPlatforms.includes(value)}
                onClick={() => togglePlatform(value)}
                multi
              >
                {label}
              </OptionChip>
            ))}
          </div>
        </Section>

        {/* Language */}
        <Section title="目标语言">
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map(([value, label]) => (
              <OptionChip
                key={value}
                selected={form.targetLanguage === value}
                onClick={() => setForm((f) => ({ ...f, targetLanguage: value }))}
              >
                {label}
              </OptionChip>
            ))}
          </div>
        </Section>

        {/* Style */}
        <Section title="视频风格">
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map(([value, label]) => (
              <OptionChip
                key={value}
                selected={form.style === value}
                onClick={() => setForm((f) => ({ ...f, style: value }))}
              >
                {label}
              </OptionChip>
            ))}
          </div>
        </Section>

        {/* Submit */}
        <div className="pb-4">
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="w-full btn-gradient text-white h-12 text-sm font-semibold"
          >
            {createMutation.isPending ? "创建中..." : "下一步：选择知识库"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function OptionChip({
  children,
  selected,
  onClick,
  multi,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 text-center ${
        selected
          ? multi
            ? "border-[oklch(0.7_0.22_200/0.6)] bg-[oklch(0.7_0.22_200/0.1)] text-[oklch(0.7_0.22_200)]"
            : "border-[oklch(0.6_0.28_290/0.6)] bg-[oklch(0.6_0.28_290/0.1)] text-[oklch(0.6_0.28_290)]"
          : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
