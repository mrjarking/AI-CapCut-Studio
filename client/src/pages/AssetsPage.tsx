import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const TYPE_LABELS: Record<string, string> = {
  artist_photo: "艺人照片",
  performance_photo: "演出照片",
  platform_logo: "平台 Logo",
  app_screenshot: "App 截图",
  fan_screenshot: "粉丝截图",
  social_screenshot: "社媒截图",
  virtual_ip: "虚拟 IP",
  bgm: "背景音乐",
  sfx: "音效",
  video_clip: "视频片段",
};

export default function AssetsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: assets } = trpc.media.assets.useQuery();
  const { data: project } = trpc.projects.get.useQuery({ id });

  const [selected, setSelected] = useState<string[]>(project?.selectedAssets ?? []);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => navigate(`/projects/${id}/brief`),
    onError: (err) => toast.error(`更新失败: ${err.message}`),
  });

  const filtered = assets?.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.tags.some((t) => t.includes(search));
    const matchType = filterType === "all" || a.type === filterType;
    return matchSearch && matchType;
  }) ?? [];

  const toggleAsset = (assetId: string) => {
    setSelected((prev) => prev.includes(assetId) ? prev.filter((x) => x !== assetId) : [...prev, assetId]);
  };

  return (
    <AppShell title="选择素材" backHref={`/projects/${id}/knowledge`} showNav={false}>
      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索素材..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {["all", ...Object.keys(TYPE_LABELS)].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterType === t
                  ? "border-[oklch(0.6_0.28_290/0.6)] bg-[oklch(0.6_0.28_290/0.1)] text-[oklch(0.6_0.28_290)]"
                  : "border-border text-muted-foreground"
              }`}
            >
              {t === "all" ? "全部" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">已选 {selected.length} 个素材</p>

        {/* Asset Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((asset) => {
            const isSelected = selected.includes(asset.id);
            return (
              <button
                key={asset.id}
                onClick={() => toggleAsset(asset.id)}
                className={`glass-card overflow-hidden text-left transition-all duration-150 ${
                  isSelected ? "border-[oklch(0.6_0.28_290/0.5)]" : "border-border"
                }`}
              >
                <div className="relative aspect-square bg-[oklch(0.12_0.012_285)]">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[oklch(0.6_0.28_290/0.3)] flex items-center justify-center">
                      <CheckCircle2 size={24} className="text-white" />
                    </div>
                  )}
                  {!asset.licensed && (
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] bg-[oklch(0.65_0.25_25/0.8)] text-white">
                      未授权
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{asset.name}</p>
                  <p className="text-[10px] text-muted-foreground">{TYPE_LABELS[asset.type] ?? asset.type}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pb-4">
          <Button
            onClick={() => updateMutation.mutate({ id, updates: { selectedAssets: selected } })}
            disabled={updateMutation.isPending}
            className="w-full btn-gradient text-white h-12 text-sm font-semibold"
          >
            {updateMutation.isPending ? "保存中..." : "下一步：生成视频策划案"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
