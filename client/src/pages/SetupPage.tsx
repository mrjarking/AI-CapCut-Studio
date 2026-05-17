import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, Zap, Shield, Wifi, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VideoProvider = "veo3" | "google_veo" | "seedance";

const DEFAULT_MODEL_BY_PROVIDER: Record<VideoProvider, string> = {
  google_veo: "veo-3.1-fast-generate-preview",
  veo3: "veo3.1-fast",
  seedance: "seedance-1-0-pro",
};

export default function SetupPage() {
  const [, navigate] = useLocation();
  const [showToken, setShowToken] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    apiBaseUrl: "",
    apiToken: "",
    apiProvider: "google_veo" as VideoProvider,
    defaultModel: DEFAULT_MODEL_BY_PROVIDER.google_veo,
    mockMode: false,
    generateApiPath: "",
    statusApiPath: "",
  });
  const [modelOptions, setModelOptions] = useState<string[]>([DEFAULT_MODEL_BY_PROVIDER.google_veo]);
  const [modelMessage, setModelMessage] = useState("填写 API Token 后自动拉取模型列表");

  const saveMutation = trpc.settings.save.useMutation({
    onSuccess: () => {
      toast.success("配置已保存");
      navigate("/");
    },
    onError: (err) => toast.error(`保存失败: ${err.message}`),
  });

  const testMutation = trpc.settings.testConnection.useMutation({
    onSuccess: (res) => {
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    },
    onError: (err) => toast.error(`测试失败: ${err.message}`),
  });

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
    const needsBaseUrl = form.apiProvider !== "google_veo";
    if (!form.apiToken || (needsBaseUrl && !form.apiBaseUrl.trim())) {
      setModelOptions([DEFAULT_MODEL_BY_PROVIDER[form.apiProvider]]);
      setModelMessage(form.apiToken ? "填写 API Base URL 后自动拉取模型列表" : "填写 API Token 后自动拉取模型列表");
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
  }, [form.apiProvider, form.apiBaseUrl, form.apiToken]);

  const handleSave = () => {
    if (form.apiProvider !== "google_veo" && !form.apiBaseUrl) {
      toast.error("Real API 模式下必须填写 API Base URL");
      return;
    }
    // Use typed object to avoid tRPC type mismatch
    saveMutation.mutate({
      apiBaseUrl: form.apiBaseUrl,
      apiToken: form.apiToken,
      apiProvider: form.apiProvider,
      defaultModel: form.defaultModel,
      mockMode: false,
      generateApiPath: form.generateApiPath,
      statusApiPath: form.statusApiPath,
    });
  };

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.15_0.02_290)_0%,oklch(0.08_0.015_285)_70%)] pointer-events-none" />

      <div className="w-full max-w-[430px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[oklch(0.6_0.28_290)] to-[oklch(0.7_0.22_200)] flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            CisuMusic AI
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Video Studio</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              初始化配置
            </h2>
            <p className="text-xs text-muted-foreground">配置 AI 视频 API，默认使用 Google Veo</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-3">
            {[
              { id: "google_veo" as const, label: "Google Veo", icon: Zap },
              { id: "veo3" as const, label: "OpenAI API", icon: Wifi },
              { id: "seedance" as const, label: "Seedance", icon: Zap },
            ].map((provider) => (
              <button
                key={provider.id}
                onClick={() => selectProvider(provider.id)}
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                  form.apiProvider === provider.id
                    ? "border-[oklch(0.7_0.22_200/0.6)] bg-[oklch(0.7_0.22_200/0.1)] text-[oklch(0.7_0.22_200)]"
                    : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                <provider.icon size={18} />
                <span className="text-xs font-medium">{provider.label}</span>
              </button>
            ))}
          </div>

          {/* API Fields */}
          {(
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">API Base URL</Label>
                <Input
                  placeholder={form.apiProvider === "google_veo" ? "https://generativelanguage.googleapis.com (Auto)" : form.apiProvider === "seedance" ? "https://ark.cn-beijing.volces.com/api" : "https://api.example.com"}
                  value={form.apiBaseUrl}
                  disabled={form.apiProvider === "google_veo"}
                  onChange={(e) => setForm((f) => ({ ...f, apiBaseUrl: e.target.value }))}
                  className="text-sm"
                />
                {form.apiProvider === "google_veo" && (
                  <p className="text-[10px] text-[oklch(0.78_0.18_85)]">Google Veo 模式下自动使用官方端点</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield size={11} />
                    API Token（仅在后端保存，前端不可见）
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="sk-..."
                    value={form.apiToken}
                    onChange={(e) => setForm((f) => ({ ...f, apiToken: e.target.value }))}
                    className="text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">默认模型名称</Label>
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
                  {listModelsMutation.isPending ? "正在拉取模型列表..." : modelMessage}
                </p>
              </div>

              {/* Advanced Settings */}
              <button
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Info size={12} />
                  高级：自定义 API 路径（可选）
                </span>
                {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showAdvanced && (
                <div className="space-y-3 rounded-xl bg-[oklch(0.6_0.28_290/0.04)] border border-[oklch(0.6_0.28_290/0.1)] p-3">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    如果 API 服务商使用非标准路径，可在此指定。留空则自动探测（优先尝试 <code className="font-mono">/v1/video/generations</code>）。
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">生成接口路径</Label>
                    <Input
                      placeholder="/v1/video/generations"
                      value={form.generateApiPath}
                      onChange={(e) => setForm((f) => ({ ...f, generateApiPath: e.target.value }))}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">状态查询路径（用 {"{taskId}"} 占位）</Label>
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

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="flex-1 border-border"
            >
              {testMutation.isPending ? "测试中..." : "测试连接"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="btn-gradient text-white flex-1"
            >
              {saveMutation.isPending ? "保存中..." : "保存并开始"}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          API Token 仅保存在服务器本地，不会上传到任何第三方
        </p>
      </div>
    </div>
  );
}
