import fs from "fs-extra";
import ffmpegStatic from "ffmpeg-static";

let cachedFfmpegPath: string | null | undefined;

export function resolveFfmpegPath(): string | null {
  if (cachedFfmpegPath) return cachedFfmpegPath;

  const candidates = [
    process.env.FFMPEG_PATH,
    ffmpegStatic || undefined,
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
  ].filter(Boolean) as string[];

  cachedFfmpegPath = candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
  return cachedFfmpegPath;
}

export function requireFfmpegPath(): string {
  const ffmpegPath = resolveFfmpegPath();
  if (!ffmpegPath) {
    throw new Error("未找到 FFmpeg 可执行文件。请安装 FFmpeg，或设置 FFMPEG_PATH 指向 ffmpeg 二进制文件。");
  }
  return ffmpegPath;
}
