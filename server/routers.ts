import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getPublicSettings,
  getSettings,
  saveSettings,
  clearSettings,
} from "./services/settingsService.js";
import {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  duplicateProject,
  updateProjectBrief,
  updateProjectScenes,
  updateScene,
} from "./services/projectService.js";
import {
  generateVideo,
  getVideoStatus,
  generateBatch,
  getAllTasks,
} from "./services/videoGenerationService.js";
import { stitchVideos } from "./services/stitchService.js";
import { MOCK_ARTISTS, MOCK_ASSETS, MOCK_TEMPLATES } from "./services/mockDataService.js";
import { generateBriefWithLLM, generateScenesWithLLM } from "./services/generativeService.js";
import axios from "axios";

// ─── Settings Router ──────────────────────────────────────────────────────────

const settingsRouter = router({
  get: publicProcedure.query(async () => {
    return getPublicSettings();
  }),

  save: publicProcedure
    .input(
      z.object({
        apiBaseUrl: z.string().optional(),
        apiToken: z.string().optional(),
        apiProvider: z.enum(["veo3", "google_veo", "mock"]).optional(),
        defaultModel: z.string().optional(),
        mockMode: z.boolean().optional(),
        watermark: z.string().optional(),
        generateAudio: z.boolean().optional(),
        seed: z.number().nullable().optional(),
        maxRetries: z.number().optional(),
        pollIntervalMs: z.number().optional(),
        maxSceneDurationSeconds: z.number().optional(),
        generateApiPath: z.string().optional(),
        statusApiPath: z.string().optional(),
        llmProvider: z.enum(["forge", "openai", "google", "custom"]).optional(),
        llmBaseUrl: z.string().optional(),
        llmToken: z.string().optional(),
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updated = await saveSettings(input);
      const { apiToken: _, ...rest } = updated;
      return { ...rest, maskedToken: "" };
    }),

  testConnection: publicProcedure.mutation(async () => {
    const settings = await getSettings();
    if (settings.mockMode) {
      return { success: true, message: "Mock Mode 连接成功" };
    }
    if (!settings.apiBaseUrl || !settings.apiToken) {
      return { success: false, message: "API Base URL 或 Token 未配置" };
    }
    try {
      await axios.get(`${settings.apiBaseUrl}/api/v1/veo/health`, {
        headers: { Authorization: `Bearer ${settings.apiToken}` },
        timeout: 10000,
      });
      return { success: true, message: "API 连接成功" };
    } catch {
      try {
        await axios.get(`${settings.apiBaseUrl}/`, {
          headers: { Authorization: `Bearer ${settings.apiToken}` },
          timeout: 10000,
        });
        return { success: true, message: "API 服务可达" };
      } catch (err2: unknown) {
        const msg = err2 instanceof Error ? err2.message : String(err2);
        return { success: false, message: `连接失败: ${msg}` };
      }
    }
  }),

  clear: publicProcedure.mutation(async () => {
    await clearSettings();
    return { success: true };
  }),
});

// ─── Projects Router ──────────────────────────────────────────────────────────

const projectsRouter = router({
  list: publicProcedure.query(async () => {
    return getAllProjects();
  }),

  get: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return getProject(input.id);
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        userRole: z.enum(["operator", "fan_operator", "content_editor"]),
        artistId: z.string(),
        artistName: z.string(),
        goal: z.enum(["new_song", "concert_promo", "artist_intro", "fan_interaction", "backstage", "app_promo", "web3_nft", "virtual_ip"]),
        durationSeconds: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120)]),
        aspectRatio: z.enum(["9:16", "16:9", "1:1"]),
        targetPlatforms: z.array(z.string()),
        targetLanguage: z.enum(["zh", "en", "ko", "ja", "vi", "zh_en"]),
        style: z.enum(["cyber_music", "kpop_mv", "documentary", "fan_support", "cinematic", "vertical_drama", "metaverse_stage", "street_fashion"]),
        selectedKnowledgeModules: z.array(z.string()),
        selectedAssets: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      return createProject(input as Parameters<typeof createProject>[0]);
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), updates: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ input }) => {
      return updateProject(input.id, input.updates as Parameters<typeof updateProject>[1]);
    }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    return deleteProject(input.id);
  }),

  duplicate: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    return duplicateProject(input.id);
  }),

  generateBrief: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      const project = await getProject(input.projectId);
      if (!project) throw new Error("项目不存在");
      const brief = await generateBriefWithLLM(project);
      await updateProjectBrief(input.projectId, brief);
      return brief;
    }),

  generateScenes: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      const project = await getProject(input.projectId);
      if (!project) throw new Error("项目不存在");
      if (!project.brief) throw new Error("请先生成视频策划案");
      const scenes = await generateScenesWithLLM(project, project.brief);
      await updateProjectScenes(input.projectId, scenes);
      return scenes;
    }),

  updateScene: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        sceneId: z.string(),
        updates: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      return updateScene(input.projectId, input.sceneId, input.updates as Parameters<typeof updateScene>[2]);
    }),

  setFinalVideo: publicProcedure
    .input(z.object({ projectId: z.string(), finalVideoUrl: z.string() }))
    .mutation(async ({ input }) => {
      return updateProject(input.projectId, {
        finalVideoUrl: input.finalVideoUrl,
        status: "completed",
      });
    }),
});

// ─── Video Router ─────────────────────────────────────────────────────────────

const videoRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        provider: z.enum(["veo3", "veo3_fast", "google_veo", "mock"]),
        projectId: z.string(),
        sceneId: z.string(),
        prompt: z.string(),
        negativePrompt: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
        aspectRatio: z.enum(["9:16", "16:9", "1:1"]),
        durationSeconds: z.number(),
        model: z.string().optional(),
        watermark: z.string().optional(),
        generateAudio: z.boolean().optional(),
        seed: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return generateVideo(input as Parameters<typeof generateVideo>[0]);
    }),

    generateBatch: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        scenes: z.array(
          z.object({
            sceneId: z.string(),
            prompt: z.string(),
            negativePrompt: z.string().optional(),
            durationSeconds: z.number(),
            aspectRatio: z.enum(["9:16", "16:9", "1:1"]).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return generateBatch(input.projectId, input.scenes);
    }),

  getStatus: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      return getVideoStatus(input.taskId);
    }),

  stitch: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        sceneVideoUrls: z.array(
          z.object({
            sceneId: z.string(),
            videoUrl: z.string(),
            order: z.number(),
          })
        ),
        outputFileName: z.string().optional(),
        options: z
          .object({
            resolution: z.enum(["720p", "1080p"]).optional(),
            aspectRatio: z.enum(["9:16", "16:9", "1:1"]).optional(),
            addIntro: z.boolean().optional(),
            addOutro: z.boolean().optional(),
            addWatermark: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      return stitchVideos(input);
    }),

  tasks: publicProcedure.query(async () => {
    return getAllTasks();
  }),
});

// ─── Media Router ─────────────────────────────────────────────────────────────

const mediaRouter = router({
  artists: publicProcedure.query(() => MOCK_ARTISTS),
  assets: publicProcedure.query(() => MOCK_ASSETS),
  templates: publicProcedure.query(() => MOCK_TEMPLATES),
});

// ─── Export Router ────────────────────────────────────────────────────────────

const exportRouter = router({
  projectJson: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return getProject(input.projectId);
    }),

  storyboardMarkdown: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const project = await getProject(input.projectId);
      if (!project) return "";

      const lines = [
        `# ${project.name} — 分镜脚本`,
        ``,
        `**艺人**：${project.artistName}  `,
        `**时长**：${project.durationSeconds}秒  `,
        `**风格**：${project.style}  `,
        `**生成时间**：${new Date(project.createdAt).toLocaleString("zh-CN")}`,
        ``,
        `---`,
        ``,
      ];

      for (const scene of project.scenes) {
        lines.push(`## 镜头 ${scene.order}（${scene.startTime}s - ${scene.endTime}s）`);
        lines.push(`**目标**：${scene.goal}`);
        lines.push(`**画面**：${scene.visualDescription}`);
        lines.push(`**字幕**：${scene.subtitleText}`);
        lines.push(`**配音**：${scene.voiceoverText}`);
        lines.push(`**音乐**：${scene.musicSuggestion}`);
        lines.push(`**状态**：${scene.status}`);
        if (scene.taskId) lines.push(`**TaskID**：\`${scene.taskId}\``);
        if (scene.videoUrl) lines.push(`**视频URL**：${scene.videoUrl}`);
        lines.push(``, `### Prompt`, `\`\`\``, scene.prompt, `\`\`\``, ``);
        lines.push(`### Negative Prompt`, `\`\`\``, scene.negativePrompt, `\`\`\``, ``, `---`, ``);
      }

      return lines.join("\n");
    }),

  promptsJson: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const project = await getProject(input.projectId);
      if (!project) return [];
      return project.scenes.map((s) => ({
        sceneId: s.id,
        order: s.order,
        prompt: s.prompt,
        negativePrompt: s.negativePrompt,
        durationSeconds: s.endTime - s.startTime,
        model: s.recommendedModel,
      }));
    }),

  srtSubtitles: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const project = await getProject(input.projectId);
      if (!project) return "";

      const lines: string[] = [];
      for (const scene of project.scenes) {
        if (!scene.subtitleText) continue;
        const start = formatSrtTime(scene.startTime);
        const end = formatSrtTime(scene.endTime);
        lines.push(`${scene.order}`);
        lines.push(`${start} --> ${end}`);
        lines.push(scene.subtitleText);
        lines.push("");
      }
      return lines.join("\n");
    }),

  publishCopy: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const project = await getProject(input.projectId);
      if (!project) return "";
      const brief = project.brief;
      return [
        `🎵 ${brief?.title ?? project.name}`,
        ``,
        brief?.storyline ?? "",
        ``,
        `✨ ${(brief?.coreSellingPoints ?? []).join(" | ")}`,
        ``,
        `👉 ${brief?.ctaSuggestion ?? "关注我们获取更多精彩内容"}`,
        ``,
        `#CisuMusic #${project.artistName.replace(/\s/g, "")} #AI视频`,
      ].join("\n");
    }),
});

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  settings: settingsRouter,
  projects: projectsRouter,
  video: videoRouter,
  media: mediaRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
