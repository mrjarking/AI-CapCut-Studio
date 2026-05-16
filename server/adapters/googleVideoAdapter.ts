import axios from "axios";
import type {
  GenerateVideoRequest,
  GenerateVideoResponse,
  VideoStatusResponse,
  VideoTaskStatus,
} from "../types/index.js";
import { getSettings } from "../services/settingsService.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalizes Google's duration requirements.
 * Veo 3.1-fast currently only accepts 4 or 8.
 */
function normalizeDuration(seconds: number): number {
  if (seconds <= 4) return 4;
  return 8;
}

function normalizeStatus(done: boolean, error?: any): VideoTaskStatus {
  if (error) return "failed";
  if (done) return "completed";
  return "processing";
}

// ─── Generate ─────────────────────────────────────────────────────────────────

export async function googleVeoGenerate(req: GenerateVideoRequest): Promise<GenerateVideoResponse> {
  const settings = await getSettings();
  const apiToken = settings.apiToken;
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  const modelId = req.model || "veo-3.1-fast-generate-preview";

  const url = `${baseUrl}/models/${modelId}:predictLongRunning`;

  const body = {
    instances: [
      {
        prompt: req.prompt,
      },
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: req.aspectRatio || "16:9",
      durationSeconds: normalizeDuration(req.durationSeconds),
    },
  };

  try {
    const resp = await axios.post(url, body, {
      headers: {
        "x-goog-api-key": apiToken,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    const operationName = resp.data.name;
    if (!operationName) {
      throw new Error("Failed to get operation name from Google API");
    }

    return {
      taskId: operationName,
      provider: "google_veo",
      status: "submitted",
      sceneId: req.sceneId,
      projectId: req.projectId,
      raw: resp.data,
    };
  } catch (err: any) {
    let errorMessage = "Google Veo 生成请求失败";
    if (axios.isAxiosError(err) && err.response?.data) {
      errorMessage = err.response.data.error?.message || JSON.stringify(err.response.data);
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    return {
      taskId: "",
      provider: "google_veo",
      status: "failed",
      sceneId: req.sceneId,
      projectId: req.projectId,
      errorMessage,
    };
  }
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function googleVeoGetStatus(taskId: string): Promise<VideoStatusResponse> {
  const settings = await getSettings();
  const apiToken = settings.apiToken;
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  // taskId for Google is the full operation name: models/.../operations/...
  const url = `${baseUrl}/${taskId}`;

  try {
    const resp = await axios.get(url, {
      headers: {
        "x-goog-api-key": apiToken,
      },
      timeout: 15000,
    });

    const data = resp.data;
    const done = !!data.done;
    const error = data.error;
    const status = normalizeStatus(done, error);

    let videoUrl: string | undefined;
    if (done && !error) {
      // Robust path extraction: Google's LRO response structure can vary slightly
      const samples = data.response?.generatedSamples || data.response?.generateVideoResponse?.generatedSamples;
      const sample = samples?.[0];
      
      if (sample?.video?.uri) {
        videoUrl = sample.video.uri;
        
        // Append API Key for direct browser access
        if (videoUrl && apiToken) {
          const separator = videoUrl.includes("?") ? "&" : "?";
          videoUrl = `${videoUrl}${separator}key=${apiToken}`;
        }
      }
    }

    return {
      taskId,
      provider: "google_veo",
      status,
      videoUrl,
      errorMessage: error ? error.message : undefined,
      raw: data,
    };
  } catch (err: any) {
    return {
      taskId,
      provider: "google_veo",
      status: "processing", // Assume still processing on transient errors
      errorMessage: "查询 Google API 状态失败",
    };
  }
}
