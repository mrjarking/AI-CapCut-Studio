import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Download, Copy, FileJson, FileText, Subtitles, Package } from "lucide-react";

export default function PreviewExportPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = trpc.projects.get.useQuery({ id });
  const { data: storyboardMd } = trpc.export.storyboardMarkdown.useQuery({ projectId: id });
  const { data: promptsJson } = trpc.export.promptsJson.useQuery({ projectId: id });
  const { data: srtContent } = trpc.export.srtSubtitles.useQuery({ projectId: id });
  const { data: publishCopy } = trpc.export.publishCopy.useQuery({ projectId: id });

  const downloadText = (content: string, filename: string, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label}已复制`));
  };

  return (
    <AppShell title="预览与导出" backHref={`/projects/${id}/stitch`} showNav={false}>
      <div className="px-4 py-4 space-y-5">
        {/* Final Video */}
        {project?.finalVideoUrl ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>最终视频</h2>
            <video
              src={project.finalVideoUrl}
              controls
              className="w-full rounded-xl bg-black max-h-[55vh]"
              playsInline
            />
            <a
              href={project.finalVideoUrl}
              download="final.mp4"
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl btn-gradient text-white text-sm font-semibold"
            >
              <Download size={16} />
              下载最终视频 MP4
            </a>
          </div>
        ) : (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-muted-foreground">暂无最终视频，请先完成视频拼接</p>
          </div>
        )}

        {/* Export Options */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>导出资源</h2>
          <div className="space-y-2">
            {/* Project JSON */}
            <ExportItem
              icon={<FileJson size={16} />}
              title="项目 JSON"
              description="完整项目数据，可用于备份和恢复"
              onDownload={() => {
                if (project) downloadText(JSON.stringify(project, null, 2), `${project.name}.json`, "application/json");
              }}
            />

            {/* Storyboard Markdown */}
            <ExportItem
              icon={<FileText size={16} />}
              title="分镜脚本 Markdown"
              description="包含所有镜头信息和 Prompt"
              onDownload={() => {
                if (storyboardMd) downloadText(storyboardMd, `${project?.name ?? "storyboard"}.md`);
              }}
            />

            {/* Prompts JSON */}
            <ExportItem
              icon={<Package size={16} />}
              title="AI Prompt 包 JSON"
              description="所有镜头的英文 Prompt 和参数"
              onDownload={() => {
                if (promptsJson) downloadText(JSON.stringify(promptsJson, null, 2), `${project?.name ?? "prompts"}_prompts.json`, "application/json");
              }}
            />

            {/* SRT Subtitles */}
            <ExportItem
              icon={<Subtitles size={16} />}
              title="SRT 字幕文件"
              description="标准 SRT 格式字幕，可导入剪辑软件"
              onDownload={() => {
                if (srtContent) downloadText(srtContent, `${project?.name ?? "subtitles"}.srt`);
              }}
            />
          </div>
        </div>

        {/* Publish Copy */}
        {publishCopy && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>发布文案</h2>
            <div className="glass-card p-4 space-y-3">
              <pre className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">{publishCopy}</pre>
              <button
                onClick={() => copyToClipboard(publishCopy, "发布文案")}
                className="flex items-center gap-1.5 text-xs text-[oklch(0.6_0.28_290)] hover:opacity-80"
              >
                <Copy size={12} />
                复制文案
              </button>
            </div>
          </div>
        )}

        {/* Recommended Platforms */}
        {project && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>推荐发布平台</h2>
            <div className="flex flex-wrap gap-2">
              {project.targetPlatforms.map((p) => (
                <span
                  key={p}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[oklch(0.7_0.22_200/0.1)] text-[oklch(0.7_0.22_200)] border border-[oklch(0.7_0.22_200/0.2)]"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ExportItem({
  icon,
  title,
  description,
  onDownload,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onDownload: () => void;
}) {
  return (
    <button
      onClick={onDownload}
      className="w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
    >
      <div className="w-9 h-9 rounded-xl bg-[oklch(0.6_0.28_290/0.1)] flex items-center justify-center flex-shrink-0 text-[oklch(0.6_0.28_290)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Download size={14} className="text-muted-foreground flex-shrink-0" />
    </button>
  );
}
