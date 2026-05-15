import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import type { StitchRequest, StitchResponse } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "../../public");

// Use system ffmpeg
ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

async function downloadSegment(url: string, destPath: string): Promise<void> {
  if (url.startsWith("/static/")) {
    // Local static file
    const localPath = path.join(PUBLIC_DIR, url.replace("/static/", ""));
    if (await fs.pathExists(localPath)) {
      await fs.copy(localPath, destPath);
      return;
    }
    throw new Error(`Local file not found: ${localPath}`);
  }

  // Remote URL
  const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 60000 });
  await fs.writeFile(destPath, Buffer.from(resp.data));
}

function runFfmpegConcat(concatFile: string, outputFile: string, reencode = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(concatFile)
      .inputOptions(["-f", "concat", "-safe", "0"]);

    if (reencode) {
      cmd.videoCodec("libx264").audioCodec("aac").outputOptions(["-pix_fmt", "yuv420p"]);
    } else {
      cmd.outputOptions(["-c", "copy"]);
    }

    cmd
      .output(outputFile)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

export async function stitchVideos(req: StitchRequest): Promise<StitchResponse> {
  const { projectId, sceneVideoUrls, outputFileName = "final.mp4" } = req;

  const segmentsDir = path.join(PUBLIC_DIR, "generated", projectId, "segments");
  const stitchedDir = path.join(PUBLIC_DIR, "stitched", projectId);
  const outputPath = path.join(stitchedDir, outputFileName);
  const concatFilePath = path.join(segmentsDir, "concat.txt");

  await fs.ensureDir(segmentsDir);
  await fs.ensureDir(stitchedDir);

  // Sort by order
  const sorted = [...sceneVideoUrls].sort((a, b) => a.order - b.order);

  // Download all segments
  const localPaths: string[] = [];
  for (const seg of sorted) {
    const ext = path.extname(seg.videoUrl) || ".mp4";
    const destPath = path.join(segmentsDir, `segment_${String(seg.order).padStart(3, "0")}${ext}`);
    try {
      await downloadSegment(seg.videoUrl, destPath);
      localPaths.push(destPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        projectId,
        status: "failed",
        errorMessage: `下载片段 ${seg.sceneId} 失败: ${msg}`,
      };
    }
  }

  if (localPaths.length === 0) {
    return { projectId, status: "failed", errorMessage: "没有可拼接的片段" };
  }

  // Write concat file
  const concatContent = localPaths.map((p) => `file '${p}'`).join("\n");
  await fs.writeFile(concatFilePath, concatContent, "utf-8");

  // Try -c copy first, fallback to re-encode
  try {
    await runFfmpegConcat(concatFilePath, outputPath, false);
  } catch {
    try {
      await runFfmpegConcat(concatFilePath, outputPath, true);
    } catch (err2: unknown) {
      const msg = err2 instanceof Error ? err2.message : String(err2);
      return { projectId, status: "failed", errorMessage: `FFmpeg 拼接失败: ${msg}` };
    }
  }

  if (!(await fs.pathExists(outputPath))) {
    return { projectId, status: "failed", errorMessage: "拼接输出文件不存在" };
  }

  const finalVideoUrl = `/static/stitched/${projectId}/${outputFileName}`;

  return {
    projectId,
    status: "completed",
    finalVideoUrl,
    segments: localPaths,
    durationSeconds: sorted.reduce((sum, s) => sum + ((s as { duration?: number }).duration ?? 7), 0),
  };
}
