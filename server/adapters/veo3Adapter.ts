import axios from "axios";
import type {
  GenerateVideoRequest,
  GenerateVideoResponse,
  VideoStatusResponse,
  VideoTaskStatus,
} from "../types/index.js";
import { getSettings } from "../services/settingsService.js";

function extractTaskId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  const candidates = [
    d["taskId"],
    d["id"],
    d["task_id"],
    (d["data"] as Record<string, unknown>)?.["taskId"],
    (d["data"] as Record<string, unknown>)?.["id"],
    (d["data"] as Record<string, unknown>)?.["task_id"],
    (d["result"] as Record<string, unknown>)?.["taskId"],
  ];

  for (const c of candidates) {
    if (c && typeof c === "string") return c;
    if (c && typeof c === "number") return String(c);
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

  const candidates = [
    d["videoUrl"],
    d["url"],
    dd["videoUrl"],
    dd["video_url"],
    dd["url"],
    dd["resultUrl"],
    dd["result_url"],
    dd["downloadUrl"],
    dd["download_url"],
    dv?.["url"],
    dout,
    dr["videoUrl"],
    dr["url"],
  ];

  for (const c of candidates) {
    if (c && typeof c === "string") return c;
  }
  return null;
}

function normalizeStatus(raw: string): VideoTaskStatus {
  const s = raw.toLowerCase();
  if (["pending", "queued"].includes(s)) return "queued";
  if (s === "submitted") return "submitted";
  if (["processing", "running", "generating"].includes(s)) return "processing";
  if (["success", "completed", "finished"].includes(s)) return "completed";
  if (["fail", "failed", "error"].includes(s)) return "failed";
  if (["cancelled", "canceled"].includes(s)) return "cancelled";
  return "processing";
}

export async function veo3Generate(req: GenerateVideoRequest): Promise<GenerateVideoResponse> {
  const settings = await getSettings();
  const { apiBaseUrl, apiToken } = settings;

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  const body = {
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

  try {
    const resp = await axios.post(`${apiBaseUrl}/api/v1/veo/generate`, body, { headers, timeout: 30000 });
    const taskId = extractTaskId(resp.data);

    if (!taskId) {
      return {
        taskId: "",
        provider: "veo3",
        status: "failed",
        sceneId: req.sceneId,
        projectId: req.projectId,
        errorMessage: "无法解析任务 ID，请检查 API 返回格式",
        raw: resp.data,
      };
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
    return {
      taskId: "",
      provider: "veo3",
      status: "failed",
      sceneId: req.sceneId,
      projectId: req.projectId,
      errorMessage: `API 请求失败: ${msg}`,
    };
  }
}

export async function veo3GetStatus(taskId: string): Promise<VideoStatusResponse> {
  const settings = await getSettings();
  const { apiBaseUrl, apiToken } = settings;

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  const endpoints = [
    { method: "get", url: `${apiBaseUrl}/api/v1/veo/record-info?taskId=${taskId}` },
    { method: "get", url: `${apiBaseUrl}/api/v1/veo/status/${taskId}` },
    { method: "get", url: `${apiBaseUrl}/api/v1/veo/task/${taskId}` },
    { method: "post", url: `${apiBaseUrl}/api/v1/veo/query`, data: { taskId } },
  ];

  for (const ep of endpoints) {
    try {
      let resp;
      if (ep.method === "get") {
        resp = await axios.get(ep.url, { headers, timeout: 15000 });
      } else {
        resp = await axios.post(ep.url, (ep as { data: unknown }).data, { headers, timeout: 15000 });
      }

      const d = resp.data as Record<string, unknown>;
      const rawStatus = String(
        d["status"] ??
        (d["data"] as Record<string, unknown>)?.["status"] ??
        "processing"
      );
      const status = normalizeStatus(rawStatus);
      const videoUrl = extractVideoUrl(resp.data) ?? undefined;

      return {
        taskId,
        provider: "veo3",
        status,
        videoUrl,
        progress: typeof d["progress"] === "number" ? d["progress"] : undefined,
        raw: resp.data,
      };
    } catch {
      // try next endpoint
    }
  }

  return {
    taskId,
    provider: "veo3",
    status: "processing",
    errorMessage: "状态查询失败，稍后可重试",
  };
}
