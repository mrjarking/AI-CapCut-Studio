import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, Zap, Shield, Wifi, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupPage() {
  const [, navigate] = useLocation();
  const [showToken, setShowToken] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    apiBaseUrl: "",
    apiToken: "",
    apiProvider: "mock" as "veo3" | "mock",
    defaultModel: "mock",
    mockMode: true,
    generateApiPath: "",
    statusApiPath: "",
  });

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

  const handleSave = () => {
    if (!form.mockMode && !form.apiBaseUrl) {
      toast.error("Real API 模式下必须填写 API Base URL");
      return;
    }
    // Use typed object to avoid tRPC type mismatch
    saveMutation.mutate({
      apiBaseUrl: form.apiBaseUrl,
      apiToken: form.apiToken,
      apiProvider: form.apiProvider,
      defaultModel: form.defaultModel,
      mockMode: form.mockMode,
      generateApiPath: form.generateApiPath,
      statusApiPath: form.statusApiPath,
    });
  };

  const handleMockMode = () => {
    const newMock = !form.mockMode;
    setForm((f) => ({
      ...f,
      mockMode: newMock,
      apiProvider: newMock ? "mock" : "veo3",
      defaultModel: newMock ? "mock" : "veo3",
    }));
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
            <p className="text-xs text-muted-foreground">配置 AI 视频 API 或使用 Mock Mode 演示</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-3">
            <button
              onClick={() => !form.mockMode && handleMockMode()}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                form.mockMode
                  ? "border-[oklch(0.6_0.28_290/0.6)] bg-[oklch(0.6_0.28_290/0.1)] text-[oklch(0.6_0.28_290)]"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              <Zap size={18} />
              <span className="text-xs font-medium">Mock Mode</span>
              <span className="text-[10px] opacity-70">演示用</span>
            </button>
            <button
              onClick={() => form.mockMode && handleMockMode()}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                !form.mockMode
                  ? "border-[oklch(0.7_0.22_200/0.6)] bg-[oklch(0.7_0.22_200/0.1)] text-[oklch(0.7_0.22_200)]"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              <Wifi size={18} />
              <span className="text-xs font-medium">Real API</span>
              <span className="text-[10px] opacity-70">真实生成</span>
            </button>
          </div>

          {/* API Fields */}
          {!form.mockMode && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">API Base URL</Label>
                <Input
                  placeholder="https://api.example.com"
                  value={form.apiBaseUrl}
                  onChange={(e) => setForm((f) => ({ ...f, apiBaseUrl: e.target.value }))}
                  className="text-sm"
                />
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
                <Input
                  placeholder="例如: veo3, veo3_fast, veo3.1-fast"
                  value={form.defaultModel === "mock" ? "" : form.defaultModel}
                  onChange={(e) => setForm((f) => ({ ...f, defaultModel: e.target.value || "veo3" }))}
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  填写 API 服务商支持的模型名称，不同服务商可能不同
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

          {form.mockMode && (
            <div className="rounded-xl bg-[oklch(0.6_0.28_290/0.08)] border border-[oklch(0.6_0.28_290/0.2)] p-4">
              <p className="text-xs text-[oklch(0.6_0.28_290)] font-medium mb-1">Mock Mode 已启用</p>
              <p className="text-xs text-muted-foreground">
                无需真实 API，可完整演示创建项目、生成分镜、模拟视频生成和 FFmpeg 拼接全流程。
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {!form.mockMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending}
                className="flex-1 border-border"
              >
                {testMutation.isPending ? "测试中..." : "测试连接"}
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className={`btn-gradient text-white ${form.mockMode ? "w-full" : "flex-1"}`}
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
