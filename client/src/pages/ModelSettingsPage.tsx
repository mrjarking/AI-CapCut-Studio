import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ModelSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: settings } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    defaultModel: settings?.defaultModel ?? "veo3.1-fast",
    watermark: settings?.watermark ?? "CisuMusic",
    generateAudio: settings?.generateAudio ?? true,
    seed: settings?.seed ?? null as number | null,
    maxRetries: settings?.maxRetries ?? 3,
    pollIntervalMs: settings?.pollIntervalMs ?? 5000,
    maxSceneDurationSeconds: settings?.maxSceneDurationSeconds ?? 8,
  });

  // Sync form when settings load (avoids stale defaults)
  useEffect(() => {
    if (settings) {
      setForm((f) => ({
        ...f,
        defaultModel: settings.defaultModel || "veo3.1-fast",
        watermark: settings.watermark,
        generateAudio: settings.generateAudio,
        seed: settings.seed,
        maxRetries: settings.maxRetries,
        pollIntervalMs: settings.pollIntervalMs,
        maxSceneDurationSeconds: settings.maxSceneDurationSeconds,
      }));
    }
  }, [settings?.defaultModel]);

  const saveMutation = trpc.settings.save.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("模型配置已保存");
      navigate(`/projects/${id}/generation`);
    },
    onError: (err) => toast.error(`保存失败: ${err.message}`),
  });

  const handleSave = () => {
    const updates: any = { ...form };
    
    // Auto-switch provider if user picks a Google-native model
    if (form.defaultModel.startsWith("veo-")) {
      updates.apiProvider = "google_veo";
    } else if (form.defaultModel === "mock") {
      updates.apiProvider = "mock";
    }

    saveMutation.mutate(updates);
  };

  const PRESET_MODELS = [
    { name: "doubao-seedance-2-0-720p", desc: "推荐 · Doubao Seedance 2.0 720p（relaydance.com）" },
    { name: "veo-3.1-fast-generate-preview", desc: "Google 原生 · 极速预览，适合快速迭代" },
    { name: "veo3.1-fast", desc: "Veo3.1 快速模式（bltcy.ai 等）" },
    { name: "veo3.1", desc: "Veo3.1 高质量模式" },
    { name: "veo3.1-pro", desc: "Veo3.1 专业级模式" },
    { name: "mock", desc: "免费（Mock 演示模式）" },
  ];
  // Note: veo3_fast is deprecated, use veo3.1-fast instead

  return (
    <AppShell title="模型配置" backHref={`/projects/${id}/storyboard`} showNav={false}>
      <div className="px-4 py-4 space-y-5">
        {/* Model */}
        <Section title="默认模型">
          <div className="space-y-2">
            {PRESET_MODELS.map((m) => (
              <button
                key={m.name}
                onClick={() => setForm((f) => ({ ...f, defaultModel: m.name }))}
                className={`w-full glass-card p-3 flex items-center justify-between text-left transition-all ${
                  form.defaultModel === m.name
                    ? "border-[oklch(0.6_0.28_290/0.5)] bg-[oklch(0.6_0.28_290/0.06)]"
                    : "border-border"
                }`}
              >
                <div>
                  <p className="text-sm font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  form.defaultModel === m.name ? "border-[oklch(0.6_0.28_290)]" : "border-border"
                }`}>
                  {form.defaultModel === m.name && <div className="w-2 h-2 rounded-full bg-[oklch(0.6_0.28_290)]" />}
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Watermark */}
        <Section title="水印">
          <div className="flex items-center gap-3">
            <input
              value={form.watermark}
              onChange={(e) => setForm((f) => ({ ...f, watermark: e.target.value }))}
              placeholder="CisuMusic"
              className="flex-1 h-9 px-3 rounded-lg text-sm bg-[oklch(0.1_0.01_285)] border border-border outline-none focus:border-[oklch(0.6_0.28_290/0.5)]"
            />
            <button
              onClick={() => setForm((f) => ({ ...f, watermark: f.watermark ? "" : "CisuMusic" }))}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {form.watermark ? "清除" : "恢复"}
            </button>
          </div>
        </Section>

        {/* Generate Audio */}
        <Section title="生成音频">
          <div className="flex items-center justify-between glass-card p-3">
            <div>
              <p className="text-sm font-medium">generateAudio</p>
              <p className="text-xs text-muted-foreground">视频片段是否包含 AI 生成音频</p>
            </div>
            <Switch
              checked={form.generateAudio}
              onCheckedChange={(v) => setForm((f) => ({ ...f, generateAudio: v }))}
            />
          </div>
        </Section>

        {/* Seed */}
        <Section title="随机种子">
          <div className="flex gap-3">
            <button
              onClick={() => setForm((f) => ({ ...f, seed: null }))}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                form.seed === null ? "border-[oklch(0.6_0.28_290/0.5)] bg-[oklch(0.6_0.28_290/0.08)] text-[oklch(0.6_0.28_290)]" : "border-border text-muted-foreground"
              }`}
            >
              随机
            </button>
            <button
              onClick={() => setForm((f) => ({ ...f, seed: 123456 }))}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                form.seed !== null ? "border-[oklch(0.6_0.28_290/0.5)] bg-[oklch(0.6_0.28_290/0.08)] text-[oklch(0.6_0.28_290)]" : "border-border text-muted-foreground"
              }`}
            >
              固定
            </button>
          </div>
          {form.seed !== null && (
            <input
              type="number"
              value={form.seed}
              onChange={(e) => setForm((f) => ({ ...f, seed: parseInt(e.target.value) || 0 }))}
              className="w-full h-9 px-3 rounded-lg text-sm bg-[oklch(0.1_0.01_285)] border border-border outline-none mt-2"
            />
          )}
        </Section>

        {/* Advanced */}
        <Section title="高级配置">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">失败重试次数</Label>
              <input
                type="number"
                min={0}
                max={10}
                value={form.maxRetries}
                onChange={(e) => setForm((f) => ({ ...f, maxRetries: parseInt(e.target.value) || 0 }))}
                className="w-16 h-7 px-2 rounded text-xs text-center bg-[oklch(0.1_0.01_285)] border border-border outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">轮询间隔（毫秒）</Label>
              <input
                type="number"
                min={1000}
                max={30000}
                step={1000}
                value={form.pollIntervalMs}
                onChange={(e) => setForm((f) => ({ ...f, pollIntervalMs: parseInt(e.target.value) || 5000 }))}
                className="w-20 h-7 px-2 rounded text-xs text-center bg-[oklch(0.1_0.01_285)] border border-border outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">单镜头最长秒数</Label>
              <input
                type="number"
                min={3}
                max={30}
                value={form.maxSceneDurationSeconds}
                onChange={(e) => setForm((f) => ({ ...f, maxSceneDurationSeconds: parseInt(e.target.value) || 8 }))}
                className="w-16 h-7 px-2 rounded text-xs text-center bg-[oklch(0.1_0.01_285)] border border-border outline-none"
              />
            </div>
          </div>
        </Section>

        {/* Cost Estimate */}
        <div className="glass-card p-3 bg-[oklch(0.78_0.18_85/0.05)] border-[oklch(0.78_0.18_85/0.2)]">
          <p className="text-xs font-medium text-[oklch(0.78_0.18_85)] mb-1">当前模型</p>
          <p className="text-xs text-muted-foreground">
            {form.defaultModel || "(未设置)"}
          </p>
        </div>

        <div className="pb-4">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full btn-gradient text-white h-12 text-sm font-semibold"
          >
            {saveMutation.isPending ? "保存中..." : "保存并开始生成"}
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
