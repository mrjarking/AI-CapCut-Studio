import axios from "axios";
import type {
  GenerateVideoRequest,
  GenerateVideoResponse,
  VideoStatusResponse,
  VideoTaskStatus,
} from "../types/index.js";
import { getSettings } from "../services/settingsService.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractTaskId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const candidates = [
    d["taskId"], d["id"], d["task_id"],
    (d["data"] as Record<string, unknown>)?.["taskId"],
    (d["data"] as Record<string, unknown>)?.["id"],
    (d["data"] as Record<string, unknown>)?.["task_id"],
    (d["result"] as Record<string, unknown>)?.["taskId"],
  ];
  for (const c of candidates) {
    if (c && (typeof c === "string" || typeof c === "number")) return String(c);
  }
  return null;
}

function extractVideoUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const dd = (d["data"] as Record<string, unknown>) ?? {};
  const dr = (d["result"] as Record<string, unknown>) ?? {};
  const dv = Array.isArray(dd["videos"]) ? (dd["videos"][0] as Record<string, unknown>) : null;
  const dout = Array.isArray(dd["output"]) ? dd["output"][0] : null;

  // Handle nested data.data (bltcy.ai style response)
  const ddd = (dd["data"] as Record<string, unknown>) ?? {};

  const candidates = [
    d["videoUrl"], d["url"], d["video_url"],
    dd["videoUrl"], dd["video_url"], dd["url"],
    dd["resultUrl"], dd["result_url"],
    dd["downloadUrl"], dd["download_url"],
    // Nested data.data.url (bltcy.ai completed format)
    ddd["url"], ddd["video_url"], ddd["videoUrl"], ddd["download_url"],
    dv?.["url"], dout,
    dr["videoUrl"], dr["url"],
    // OpenAI-style: data[0].url
    Array.isArray(d["data"]) ? (d["data"][0] as Record<string, unknown>)?.["url"] : undefined,
    Array.isArray(d["data"]) ? (d["data"][0] as Record<string, unknown>)?.["video_url"] : undefined,
  ];
  for (const c of candidates) {
    if (c && typeof c === "string") return c;
  }
  return null;
}

function normalizeStatus(raw: string): VideoTaskStatus {
  const s = raw.toLowerCase();
  if (["pending", "queued", "not_start"].includes(s)) return "queued";
  if (s === "submitted") return "submitted";
  if (["processing", "running", "generating", "in_progress", "active"].includes(s)) return "processing";
  if (["success", "completed", "finished", "succeeded"].includes(s)) return "completed";
  if (["fail", "failed", "error", "failure"].includes(s)) return "failed";
  if (["cancelled", "canceled"].includes(s)) return "cancelled";
  return "processing";
}

// ─── Generate ─────────────────────────────────────────────────────────────────

export async function veo3Generate(req: GenerateVideoRequest): Promise<GenerateVideoResponse> {
  const settings = await getSettings();
  const { apiBaseUrl, apiToken, generateApiPath } = settings;

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  // Determine which API format to use
  // Priority: user-configured path > auto-detect
  const customPath = generateApiPath?.trim();

  // Try endpoints in order of preference
  const endpointsToTry: Array<{ url: string; body: Record<string, unknown> }> = [];

  if (customPath) {
    // User specified a custom path
    endpointsToTry.push({
      url: `${apiBaseUrl}${customPath}`,
      body: buildOpenAIStyleBody(req),
    });
  } else {
    // Auto-detect: try OpenAI-compatible first, then legacy Veo3 path
    endpointsToTry.push(
      {
        url: `${apiBaseUrl}/v1/video/generations`,
        body: buildOpenAIStyleBody(req),
      },
      {
        url: `${apiBaseUrl}/api/v1/veo/generate`,
        body: buildLegacyVeoBody(req),
      }
    );
  }

  let lastError = "";
  for (const ep of endpointsToTry) {
    try {
      const resp = await axios.post(ep.url, ep.body, { headers, timeout: 30000 });
      const taskId = extractTaskId(resp.data);

      if (!taskId) {
        lastError = "无法解析任务 ID，请检查 API 返回格式";
        continue;
      }

      return {
        taskId,
        provider: req.provider,
        status: "submitted",
        sceneId: req.sceneId,
        projectId: req.projectId,
        raw: resp.data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // If 404 (wrong path), try next endpoint
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        lastError = `路径不存在 (404): ${ep.url}`;
        continue;
      }
      // Other errors (auth, server error) - return immediately with error
      lastError = `API 请求失败: ${msg}`;
      if (axios.isAxiosError(err) && err.response?.data) {
        const errData = err.response.data as Record<string, unknown>;
        const errMsg = (errData["error"] as Record<string, unknown>)?.["message"] ?? errData["message"];
        if (errMsg) lastError = `API 错误: ${errMsg}`;
      }
      break;
    }
  }

  return {
    taskId: "",
    provider: req.provider,
    status: "failed",
    sceneId: req.sceneId,
    projectId: req.projectId,
    errorMessage: lastError || "生成请求失败",
  };
}

function buildOpenAIStyleBody(req: GenerateVideoRequest): Record<string, unknown> {
  return {
    prompt: req.prompt,
    model: req.model ?? "veo3",
    aspect_ratio: req.aspectRatio,
    duration: req.durationSeconds,
    negative_prompt: req.negativePrompt,
    seed: req.seed,
    watermark: req.watermark,
    generate_audio: req.generateAudio,
  };
}

function buildLegacyVeoBody(req: GenerateVideoRequest): Record<string, unknown> {
  return {
    prompt: req.prompt,
    imageUrls: req.imageUrls ?? [],
    model: req.model ?? "veo3",
    watermark: req.watermark ?? "CisuMusic",
    callBackUrl: req.callBackUrl ?? "",
    aspectRatio: req.aspectRatio,
    seeds: req.seed ?? Math.floor(Math.random() * 999999),
    generateAudio: req.generateAudio ?? true,
    negativePrompt: req.negativePrompt,
  };
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function veo3GetStatus(taskId: string, model?: string): Promise<VideoStatusResponse> {
  const settings = await getSettings();
  const { apiBaseUrl, apiToken, statusApiPath, defaultModel } = settings;

  // Use provided model or fall back to settings default
  const modelName = model || defaultModel || "";

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  const customPath = statusApiPath?.trim();

  // Build list of status endpoints to try
  const endpointsToTry: Array<{ method: "get" | "post"; url: string; data?: unknown }> = [];

  if (customPath) {
    const url = `${apiBaseUrl}${customPath.replace("{taskId}", taskId)}`;
    endpointsToTry.push({ method: "get", url });
  } else {
    // Try with model query param first (new-api style: needs model to route)
    const modelParam = modelName ? `?model=${encodeURIComponent(modelName)}` : "";
    endpointsToTry.push(
      // new-api style: GET with model query param
      { method: "get", url: `${apiBaseUrl}/v1/video/generations/${taskId}${modelParam}` },
      // OpenAI-compatible style without model param
      { method: "get", url: `${apiBaseUrl}/v1/video/generations/${taskId}` },
      // Legacy Veo3 paths
      { method: "get", url: `${apiBaseUrl}/api/v1/veo/record-info?taskId=${taskId}` },
      { method: "get", url: `${apiBaseUrl}/api/v1/veo/status/${taskId}` },
      { method: "get", url: `${apiBaseUrl}/api/v1/veo/task/${taskId}` },
      { method: "post", url: `${apiBaseUrl}/api/v1/veo/query`, data: { taskId } }
    );
  }

  for (const ep of endpointsToTry) {
    try {
      let resp;
      if (ep.method === "get") {
        resp = await axios.get(ep.url, { headers, timeout: 15000 });
      } else {
        resp = await axios.post(ep.url, ep.data, { headers, timeout: 15000 });
      }

      const d = resp.data as Record<string, unknown>;
      const videoUrl = extractVideoUrl(resp.data) ?? undefined;

      // Extract status from various response shapes
      // bltcy.ai returns: { data: { status: "SUCCESS", data: { status: "completed", url: "..." } } }
      const outerData = (d["data"] as Record<string, unknown>) ?? {};
      const innerData = (outerData["data"] as Record<string, unknown>) ?? {};

      // Prefer inner status (OpenAI-style) over outer status
      const rawStatus = String(
        innerData["status"] ??
        outerData["status"] ??
        d["status"] ??
        "processing"
      );
      const status = normalizeStatus(rawStatus);

      // Extract progress from various locations
      const rawProgress =
        innerData["progress"] ??
        outerData["progress"] ??
        d["progress"];
      const progress = typeof rawProgress === "number"
        ? rawProgress
        : typeof rawProgress === "string"
        ? (rawProgress.endsWith("%") ? parseInt(rawProgress) : parseInt(rawProgress)) || undefined
        : undefined;

      return {
        taskId,
        provider: "veo3",
        status,
        videoUrl,
        progress,
        raw: resp.data,
      };
    } catch {
      // try next endpoint
    }
  }

  // All endpoints failed - this is common with new-api tokens that only have 'generate' permission
  // Return 'processing' so the frontend keeps polling
  console.warn(`[veo3GetStatus] All status endpoints failed for task ${taskId}. ` +
    `This may be a token permission issue (token needs 'video_query' permission in new-api). ` +
    `Task will remain in 'processing' state until status can be queried.`);
  return {
    taskId,
    provider: "veo3",
    status: "processing",
    errorMessage: undefined, // Don't show error - keep polling silently
  };
}
