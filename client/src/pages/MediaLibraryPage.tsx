import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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

export default function MediaLibraryPage() {
  const { data: assets } = trpc.media.assets.useQuery();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const filtered = assets?.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.tags.some((t) => t.includes(search));
    const matchType = filterType === "all" || a.type === filterType;
    return matchSearch && matchType;
  }) ?? [];

  const selectedDetail = assets?.find((a) => a.id === selectedAsset);

  return (
    <AppShell title="素材库">
      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索素材名称或标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>

        {/* Upload Button (Mock) */}
        <button
          onClick={() => toast.info("素材上传功能即将推出")}
          className="w-full glass-card p-3 flex items-center gap-3 border-dashed hover:bg-white/[0.02] transition-colors"
        >
          <Upload size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">上传素材（即将推出）</span>
        </button>

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

        <p className="text-xs text-muted-foreground">{filtered.length} 个素材</p>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((asset) => (
            <button
              key={asset.id}
              onClick={() => setSelectedAsset(asset.id === selectedAsset ? null : asset.id)}
              className={`glass-card overflow-hidden text-left transition-all ${
                selectedAsset === asset.id ? "border-[oklch(0.6_0.28_290/0.5)]" : "border-border"
              }`}
            >
              <div className="aspect-square bg-[oklch(0.12_0.012_285)]">
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{asset.name}</p>
                <p className="text-[10px] text-muted-foreground">{TYPE_LABELS[asset.type] ?? asset.type}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {asset.tags.slice(0, 2).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-[oklch(0.6_0.28_290/0.08)] text-[oklch(0.6_0.28_290)]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        {selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedAsset(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-[430px] bg-[oklch(0.12_0.012_285)] border-t border-border rounded-t-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{selectedDetail.name}</h3>
                <button onClick={() => setSelectedAsset(null)} className="text-muted-foreground">✕</button>
              </div>
              <img src={selectedDetail.url} alt={selectedDetail.name} className="w-full rounded-xl max-h-48 object-cover" />
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">类型：{TYPE_LABELS[selectedDetail.type] ?? selectedDetail.type}</p>
                {selectedDetail.description && <p className="text-xs text-foreground/70">{selectedDetail.description}</p>}
                <p className="text-xs text-muted-foreground">授权状态：{selectedDetail.licensed ? "✓ 已授权" : "✗ 未授权"}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedDetail.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-[oklch(0.6_0.28_290/0.1)] text-[oklch(0.6_0.28_290)] border border-[oklch(0.6_0.28_290/0.2)]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
