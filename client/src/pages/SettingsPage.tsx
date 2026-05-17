import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Shield, Wifi, Zap, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";

type VideoProvider = "veo3" | "google_veo" | "seedance";

const DEFAULT_MODEL_BY_PROVIDER: Record<VideoProvider, string> = {
  google_veo: "veo-3.1-fast-generate-preview",
  veo3: "veo3.1-fast",
  seedance: "seedance-1-0-pro",
};

const PROVIDER_OPTIONS: Array<{ id: VideoProvider; label: string; hint: string; icon: typeof Wifi }> = [
  { id: "google_veo", label: "Google Veo", hint: "默认视频模型", icon: Zap },
  { id: "veo3", label: "OpenAI API", hint: "兼容接口", icon: Wifi },
  { id: "seedance", label: "Seedance", hint: "兼容接口", icon: Zap },
];

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();
  const [showToken, setShowToken] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState({
    apiBaseUrl: "",
    apiToken: "",
    mockMode: false,
    apiProvider: "google_veo" as VideoProvider,
    defaultModel: DEFAULT_MODEL_BY_PROVIDER.google_veo,
    watermark: "CisuMusic",
    generateApiPath: "",
    statusApiPath: "",
    // LLM
    llmProvider: "forge" as "forge" | "openai" | "google" | "custom",
    llmBaseUrl: "",
    llmToken: "",
    llmModel: "gemini-1.5-flash",
  });
  const [modelOptions, setModelOptions] = useState<string[]>([DEFAULT_MODEL_BY_PROVIDER.google_veo]);
  const [modelMessage, setModelMessage] = useState("");

  useEffect(() => {
    if (settings) {
      const visibleProvider = settings.apiProvider === "mock" ? "google_veo" : settings.apiProvider as VideoProvider;
      setForm({
        apiBaseUrl: settings.apiBaseUrl,
        apiToken: "",
        mockMode: false,
        apiProvider: visibleProvider,
        defaultModel: settings.defaultModel === "mock" ? DEFAULT_MODEL_BY_PROVIDER[visibleProvider] : settings.defaultModel,
        watermark: settings.watermark,
        generateApiPath: settings.generateApiPath ?? "",
        statusApiPath: settings.statusApiPath ?? "",
        llmProvider: (settings as any).llmProvider ?? "forge",
        llmBaseUrl: (settings as any).llmBaseUrl ?? "",
        llmToken: "",
        llmModel: (settings as any).llmModel ?? "gemini-1.5-flash",
      });
    }
  }, [settings]);

  const listModelsMutation = trpc.settings.listModels.useMutation({
    onSuccess: (res) => {
      const models = res.models ?? [];
      setModelOptions(models.length ? models : [DEFAULT_MODEL_BY_PROVIDER[form.apiProvider]]);
      setModelMessage(res.message ?? (models.length ? "模型列表已更新" : "未拉取到模型，已保留推荐默认值"));
      if (models.length && !models.includes(form.defaultModel)) {
        setForm((f) => ({ ...f, defaultModel: models[0] }));
      }
    },
    onError: (err) => {
      setModelOptions([DEFAULT_MODEL_BY_PROVIDER[form.apiProvider]]);
      setModelMessage(`模型列表拉取失败：${err.message}`);
    },
  });

  useEffect(() => {
    const hasToken = !!form.apiToken || !!(settings?.maskedToken && settings.maskedToken !== "***");
    const needsBaseUrl = form.apiProvider !== "google_veo";
    if (!hasToken || (needsBaseUrl && !form.apiBaseUrl.trim())) {
      setModelOptions([DEFAULT_MODEL_BY_PROVIDER[form.apiProvider]]);
      setModelMessage(hasToken ? "填写 API Base URL 后自动拉取模型列表" : "填写 API Token 后自动拉取模型列表");
      return;
    }

    const timer = window.setTimeout(() => {
      listModelsMutation.mutate({
        apiProvider: form.apiProvider,
        apiBaseUrl: form.apiBaseUrl,
        apiToken: form.apiToken,
      });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [form.apiProvider, form.apiBaseUrl, form.apiToken, settings?.maskedToken]);

  const selectProvider = (provider: VideoProvider) => {
    setForm((f) => ({
      ...f,
      mockMode: false,
      apiProvider: provider,
      apiBaseUrl: provider === "google_veo" ? "" : f.apiBaseUrl,
      defaultModel: DEFAULT_MODEL_BY_PROVIDER[provider],
    }));
    setModelOptions([DEFAULT_MODEL_BY_PROVIDER[provider]]);
    setModelMessage("");
  };

  const saveMutation = trpc.settings.save.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      refetch();
      toast.success("设置已保存");
    },
    onError: (err) => {
      // Show detailed error to help debug "don't match" issues
      const msg = err.message || String(err);
      toast.error(`保存失败: ${msg}`, { duration: 8000 });
      console.error('[SettingsPage] save error:', err);
    },
  });

  const testMutation = trpc.settings.testConnection.useMutation({
    onSuccess: (res) => {
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    },
  });

  const clearMutation = trpc.settings.clear.useMutation({
    onSuccess: () => {
      toast.success("设置已清除");
      navigate("/setup");
    },
  });

  const handleSave = () => {
    // Use typed object to avoid tRPC type mismatch
    const payload: {
      apiBaseUrl?: string;
      apiToken?: string;
      apiProvider?: "veo3" | "google_veo" | "seedance";
      defaultModel?: string;
      mockMode?: boolean;
      watermark?: string;
      generateApiPath?: string;
      statusApiPath?: string;
      llmProvider?: "forge" | "openai" | "google" | "custom";
      llmBaseUrl?: string;
      llmToken?: string;
      llmModel?: string;
    } = {
      apiBaseUrl: form.apiBaseUrl,
      mockMode: false,
      apiProvider: form.apiProvider,
      defaultModel: form.defaultModel,
      watermark: form.watermark,
      generateApiPath: form.generateApiPath,
      statusApiPath: form.statusApiPath,
      llmProvider: form.llmProvider,
      llmBaseUrl: form.llmBaseUrl,
      llmModel: form.llmModel,
    } as any;
    if (form.apiToken) payload.apiToken = form.apiToken;
    if (form.llmToken) payload.llmToken = form.llmToken;
    saveMutation.mutate(payload);
  };

  return (
    <AppShell title="系统设置">
      <div className="px-4 py-4 space-y-5">
        {/* Current Status */}
        <div className="glass-card p-4 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">当前状态</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[oklch(0.7_0.2_145)]" />
            <span className="text-sm">Real API · {settings?.apiProvider === "mock" ? "google_veo" : settings?.apiProvider}</span>
          </div>
          {settings?.apiBaseUrl && (
            <p className="text-xs text-muted-foreground">Base URL: {settings.apiBaseUrl}</p>
          )}
          {settings?.maskedToken && settings.maskedToken !== "***" && (
            <p className="text-xs text-muted-foreground font-mono">Token: {settings.maskedToken}</p>
          )}
          {settings?.defaultModel && (
            <p className="text-xs text-muted-foreground">模型: {settings.defaultModel}</p>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">运行模式</h3>
          <div className="flex gap-3">
            {PROVIDER_OPTIONS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => selectProvider(provider.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  form.apiProvider === provider.id
                    ? "border-[oklch(0.7_0.22_200/0.6)] bg-[oklch(0.7_0.22_200/0.1)] text-[oklch(0.7_0.22_200)]"
                    : "border-border text-muted-foreground"
                }`}
              >
                <provider.icon size={16} />
                <span className="text-xs font-medium">{provider.label}</span>
                <span className="text-[10px] opacity-70">{provider.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* API Config */}
        {(
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">API 配置</h3>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">API Base URL</label>
              <Input
                placeholder={form.apiProvider === "google_veo" ? "https://generativelanguage.googleapis.com (Auto)" : form.apiProvider === "seedance" ? "https://ark.cn-beijing.volces.com/api" : "https://api.example.com"}
                value={form.apiBaseUrl}
                disabled={form.apiProvider === "google_veo"}
                onChange={(e) => setForm((f) => ({ ...f, apiBaseUrl: e.target.value }))}
                className="text-sm"
              />
              {form.apiProvider === "google_veo" && (
                <p className="text-[10px] text-[oklch(0.78_0.18_85)]">
                  Google Veo 模式下自动使用官方端点，无需填写 Base URL
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield size={11} />
                新 API Token（留空则不修改）
              </label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="sk-... （留空则保持原 Token）"
                  value={form.apiToken}
                  onChange={(e) => setForm((f) => ({ ...f, apiToken: e.target.value }))}
                  className="text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">模型名称</label>
              <select
                value={form.defaultModel}
                onChange={(e) => setForm((f) => ({ ...f, defaultModel: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg text-sm bg-[oklch(0.1_0.01_285)] border border-border outline-none focus:border-[oklch(0.6_0.28_290/0.5)]"
              >
                {modelOptions.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">
                {listModelsMutation.isPending ? "正在拉取模型列表..." : modelMessage || "设置 URL 和 Token 后自动拉取模型列表"}
              </p>
            </div>

            {/* Advanced API Paths */}
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <span className="flex items-center gap-1.5">
                <Info size={12} />
                高级：自定义 API 路径
              </span>
              {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showAdvanced && (
              <div className="space-y-3 rounded-xl bg-[oklch(0.6_0.28_290/0.04)] border border-[oklch(0.6_0.28_290/0.1)] p-3">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  留空则自动探测（优先尝试 <code className="font-mono">/v1/video/generations</code>，再尝试 <code className="font-mono">/api/v1/veo/generate</code>）
                </p>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">生成接口路径</label>
                  <Input
                    placeholder="/v1/video/generations"
                    value={form.generateApiPath}
                    onChange={(e) => setForm((f) => ({ ...f, generateApiPath: e.target.value }))}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">状态查询路径（用 {"{taskId}"} 占位）</label>
                  <Input
                    placeholder="/v1/video/generations/{taskId}"
                    value={form.statusApiPath}
                    onChange={(e) => setForm((f) => ({ ...f, statusApiPath: e.target.value }))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* LLM Config */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">文字生成 (LLM) 配置</h3>
          
          <div className="flex gap-2 mb-3">
            {[
              { id: "forge", label: "系统默认", icon: Shield },
              { id: "google", label: "Google", icon: Zap },
              { id: "openai", label: "OpenAI", icon: Wifi },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, llmProvider: p.id as any }))}
                className={`flex-1 py-2 px-1 rounded-lg border text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
                  form.llmProvider === p.id 
                    ? "border-[oklch(0.6_0.28_290/0.6)] bg-[oklch(0.6_0.28_290/0.1)] text-[oklch(0.6_0.28_290)]" 
                    : "border-border text-muted-foreground"
                }`}
              >
                <p.icon size={10} />
                {p.label}
              </button>
            ))}
          </div>

          {form.llmProvider !== "forge" && (
            <div className="space-y-3 p-3 rounded-xl bg-[oklch(0.6_0.28_290/0.03)] border border-[oklch(0.6_0.28_290/0.1)]">
              {form.llmProvider !== "google" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">API Base URL</label>
                  <Input
                    placeholder="https://api.openai.com"
                    value={form.llmBaseUrl}
                    onChange={(e) => setForm(f => ({ ...f, llmBaseUrl: e.target.value }))}
                    className="text-xs h-8"
                  />
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">API Token {form.llmProvider === "google" && "(Gemini Key)"}</label>
                <Input
                  type="password"
                  placeholder="留空则不修改"
                  value={form.llmToken}
                  onChange={(e) => setForm(f => ({ ...f, llmToken: e.target.value }))}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">模型名称</label>
                <Input
                  placeholder="gemini-1.5-flash"
                  value={form.llmModel}
                  onChange={(e) => setForm(f => ({ ...f, llmModel: e.target.value }))}
                  className="text-xs h-8"
                />
              </div>
            </div>
          )}

          {form.llmProvider === "forge" && (
            <p className="text-[10px] text-muted-foreground italic px-1">
              使用系统内置的 Forge 引擎生成文案（需配置 BUILT_IN_FORGE_API_KEY）
            </p>
          )}
        </div>

        {/* Watermark */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">水印</h3>
          <Input
            placeholder="CisuMusic"
            value={form.watermark}
            onChange={(e) => setForm((f) => ({ ...f, watermark: e.target.value }))}
            className="text-sm"
          />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="w-full border-border"
          >
            {testMutation.isPending ? "测试中..." : "测试 API 连接"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full btn-gradient text-white"
          >
            {saveMutation.isPending ? "保存中..." : "保存设置"}
          </Button>
          <button
            onClick={() => {
              if (confirm("确定清除所有设置？")) clearMutation.mutate();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[oklch(0.65_0.25_25)] hover:opacity-80 transition-opacity"
          >
            <Trash2 size={13} />
            清除所有设置
          </button>
        </div>

        {/* Security Note */}
        <div className="glass-card p-3 bg-[oklch(0.6_0.28_290/0.05)]">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-[oklch(0.6_0.28_290)] font-medium">安全说明：</span>
            API Token 仅保存在服务器本地文件，前端只展示脱敏版本，不会传输到任何第三方服务。
          </p>
        </div>
      </div>
    </AppShell>
  );
}
