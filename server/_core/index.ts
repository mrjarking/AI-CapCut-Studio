import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import fs from "fs-extra";
import ffmpeg from "fluent-ffmpeg";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { oauthRouter } from "./oauth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve public dir relative to project root (2 levels up from server/_core)
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const MOCK_DIR = path.join(PUBLIC_DIR, "mock");

// Use system ffmpeg
ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

async function generateMockVideos() {
  await fs.ensureDir(MOCK_DIR);

  const colors = [
    { name: "mock_001", color: "0x1a0a2e" },
    { name: "mock_002", color: "0x16213e" },
    { name: "mock_003", color: "0x0f3460" },
    { name: "mock_004", color: "0x533483" },
    { name: "mock_005", color: "0xe94560" },
  ];

  for (const c of colors) {
    const outPath = path.join(MOCK_DIR, `${c.name}.mp4`);
    if (await fs.pathExists(outPath)) continue;

    await new Promise<void>((resolve) => {
      ffmpeg()
        .input(`color=c=${c.color}:size=720x1280:rate=30`)
        .inputFormat("lavfi")
        .duration(7)
        .videoCodec("libx264")
        .outputOptions(["-pix_fmt", "yuv420p", "-t", "7"])
        .output(outPath)
        .on("end", () => resolve())
        .on("error", () => resolve())
        .run();
    });
  }
  console.log("[MockVideos] Mock video segments ready");
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Ensure directories exist
  await fs.ensureDir(path.join(PUBLIC_DIR, "generated"));
  await fs.ensureDir(path.join(PUBLIC_DIR, "stitched"));
  await fs.ensureDir(path.join(PUBLIC_DIR, "uploads"));
  await fs.ensureDir(MOCK_DIR);

  // Static file serving for generated/stitched/mock videos
  app.use("/static", express.static(PUBLIC_DIR));

  // OAuth routes
  app.use("/api/oauth", oauthRouter);

  // tRPC middleware
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Serve Vite frontend in production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(PROJECT_ROOT, "dist/public");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const port = parseInt(process.env.PORT ?? "3001");
  server.listen(port, () => {
    console.log(`[Server] Backend running on http://localhost:${port}`);
    console.log(`[Server] tRPC available at http://localhost:${port}/api/trpc`);
    console.log(`[Server] Static files at http://localhost:${port}/static`);
  });

  // Generate mock videos in background
  generateMockVideos().catch(console.error);
}

startServer().catch(console.error);
