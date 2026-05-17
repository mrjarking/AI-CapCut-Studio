import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import fs from "fs-extra";
import ffmpeg from "fluent-ffmpeg";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { oauthRouter } from "./oauth.js";
import { addUploadedAsset } from "../services/assetService.js";
import { resolveFfmpegPath } from "./ffmpegPath.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve public dir relative to project root (2 levels up from server/_core)
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const MOCK_DIR = path.join(PUBLIC_DIR, "mock");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");

const ffmpegPath = resolveFfmpegPath();
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

async function generateMockVideos() {
  if (!ffmpegPath) {
    console.warn("[MockVideos] FFmpeg is not available; skipping mock video generation");
    return;
  }
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
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || ".jpg";
        cb(null, `${Date.now()}-${uuidv4()}${ext}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      cb(null, file.mimetype.startsWith("image/"));
    },
    limits: { fileSize: 12 * 1024 * 1024 },
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Ensure directories exist
  await fs.ensureDir(path.join(PUBLIC_DIR, "generated"));
  await fs.ensureDir(path.join(PUBLIC_DIR, "stitched"));
  await fs.ensureDir(UPLOAD_DIR);
  await fs.ensureDir(MOCK_DIR);

  // Static file serving for generated/stitched/mock videos
  app.use("/static", express.static(PUBLIC_DIR));

  // OAuth routes
  app.use("/api/oauth", oauthRouter);

  app.post("/api/uploads/images", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Missing image file" });
        return;
      }

      const asset = await addUploadedAsset({
        id: `upload_${uuidv4()}`,
        name: String(req.body.name || req.file.originalname),
        type: "artist_photo",
        url: `/static/uploads/${req.file.filename}`,
        tags: String(req.body.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        artistId: req.body.artistId ? String(req.body.artistId) : undefined,
        licensed: true,
        description: String(req.body.description || "运营上传图片素材"),
      });

      res.json({ asset });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

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
    // IMPORTANT: Exclude /api/* from the SPA fallback to prevent tRPC/OAuth
    // requests from being served the HTML index page (which causes
    // "Unexpected token '<', DOCTYPE..." JSON parse errors on the client).
    app.get(/^(?!\/api\/).*/, (_req, res) => {
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
