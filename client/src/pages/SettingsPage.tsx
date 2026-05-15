import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Shield, Wifi, Zap, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();
  const [showToken, setShowToken] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState({
    apiBaseUrl: "",
    apiToken: "",
    mockMode: true,
    apiProvider: "mock" as "veo3" | "mock",
    defaultModel: "mock",
    watermark: "CisuMusic",
    generateApiPath: "",
    statusApiPath: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        apiBaseUrl: settings.apiBaseUrl,
        apiToken: "",
        mockMode: settings.mockMode,
        apiProvider: settings.apiProvider,
        defaultModel: settings.defaultModel,
        watermark: settings.watermark,
        generateApiPath: settings.generateApiPath ?? "",
        statusApiPath: settings.statusApiPath ?? "",
      });
    }
  }, [settings]);

  const saveMutation = trpc.settings.save.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      refetch();
      toast.success("设置已保存");
    },
    onError: (err) => toast.error(`保存失败: ${err.message}`),
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
    const payload: Record<string, unknown> = {
      apiBaseUrl: form.apiBaseUrl,
      mockMode: form.mockMode,
      apiProvider: form.apiProvider,
      defaultModel: form.defaultModel,
      watermark: form.watermark,
      generateApiPath: form.generateApiPath,
      statusApiPath: form.statusApiPath,
    };
    if (form.apiToken) payload.apiToken = form.apiToken;
    saveMutation.mutate(payload);
  };

  return (
    <AppShell title="系统设置">
      <div className="px-4 py-4 space-y-5">
        {/* Current Status */}
        <div className="glass-card p-4 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">当前状态</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${settings?.mockMode ? "bg-[oklch(0.78_0.18_85)] animate-pulse" : "bg-[oklch(0.7_0.2_145)]"}`} />
            <span className="text-sm">{settings?.mockMode ? "Mock Mode（演示）" : `Real API · ${settings?.apiProvider}`}</span>
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
            <button
              onClick={() => setForm((f) => ({ ...f, mockMode: true, apiProvider: "mock", defaultModel: "mock" }))}
              className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                form.mockMode
                  ? "border-[oklch(0.6_0.28_290/0.6)] bg-[oklch(0.6_0.28_290/0.1)] text-[oklch(0.6_0.28_290)]"
                  : "border-border text-muted-foreground"
              }`}
            >
              <Zap size={16} />
              <span className="text-xs font-medium">Mock Mode</span>
            </button>
            <button
              onClick={() => setForm((f) => ({ ...f, mockMode: false, apiProvider: "veo3" }))}
              className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                !form.mockMode
                  ? "border-[oklch(0.7_0.22_200/0.6)] bg-[oklch(0.7_0.22_200/0.1)] text-[oklch(0.7_0.22_200)]"
                  : "border-border text-muted-foreground"
              }`}
            >
              <Wifi size={16} />
              <span className="text-xs font-medium">Real API</span>
            </button>
          </div>
        </div>

        {/* API Config */}
        {!form.mockMode && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">API 配置</h3>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">API Base URL</label>
              <Input
                placeholder="https://api.example.com"
                value={form.apiBaseUrl}
                onChange={(e) => setForm((f) => ({ ...f, apiBaseUrl: e.target.value }))}
                className="text-sm"
              />
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
              <Input
                placeholder="例如: veo3, veo3_fast, veo3.1-fast"
                value={form.defaultModel === "mock" ? "" : form.defaultModel}
                onChange={(e) => setForm((f) => ({ ...f, defaultModel: e.target.value || "veo3" }))}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                填写 API 服务商支持的具体模型名称
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
          {!form.mockMode && (
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="w-full border-border"
            >
              {testMutation.isPending ? "测试中..." : "测试 API 连接"}
            </Button>
          )}
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
