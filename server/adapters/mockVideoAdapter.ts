import { v4 as uuidv4 } from "uuid";
import type {
  GenerateVideoRequest,
  GenerateVideoResponse,
  VideoStatusResponse,
} from "../types/index.js";
import { readJson, writeJson } from "../storage/jsonStorage.js";

interface MockTask {
  taskId: string;
  sceneId: string;
  projectId: string;
  startedAt: number;
  delayMs: number;
  videoUrl: string;
}

const MOCK_TASKS_FILE = "mock_tasks.json";

// Predefined mock video URLs (solid color test videos generated at startup)
const MOCK_VIDEO_URLS = [
  "/static/mock/mock_001.mp4",
  "/static/mock/mock_002.mp4",
  "/static/mock/mock_003.mp4",
  "/static/mock/mock_004.mp4",
  "/static/mock/mock_005.mp4",
];

function pickMockVideo(sceneId: string): string {
  const idx = sceneId.charCodeAt(sceneId.length - 1) % MOCK_VIDEO_URLS.length;
  return MOCK_VIDEO_URLS[idx];
}

export async function mockGenerate(req: GenerateVideoRequest): Promise<GenerateVideoResponse> {
  const taskId = `mock_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
  const delayMs = 5000 + Math.random() * 3000; // 5-8 seconds

  const tasks = await readJson<MockTask[]>(MOCK_TASKS_FILE, []);
  tasks.push({
    taskId,
    sceneId: req.sceneId,
    projectId: req.projectId,
    startedAt: Date.now(),
    delayMs,
    videoUrl: pickMockVideo(req.sceneId),
  });
  await writeJson(MOCK_TASKS_FILE, tasks);

  return {
    taskId,
    provider: "mock",
    status: "submitted",
    sceneId: req.sceneId,
    projectId: req.projectId,
  };
}

export async function mockGetStatus(taskId: string): Promise<VideoStatusResponse> {
  const tasks = await readJson<MockTask[]>(MOCK_TASKS_FILE, []);
  const task = tasks.find((t) => t.taskId === taskId);

  if (!task) {
    return {
      taskId,
      provider: "mock",
      status: "failed",
      errorMessage: "Mock task not found",
    };
  }

  const elapsed = Date.now() - task.startedAt;

  if (elapsed < task.delayMs * 0.3) {
    return { taskId, provider: "mock", status: "queued", sceneId: task.sceneId, projectId: task.projectId };
  } else if (elapsed < task.delayMs * 0.7) {
    return {
      taskId,
      provider: "mock",
      status: "processing",
      sceneId: task.sceneId,
      projectId: task.projectId,
      progress: Math.round((elapsed / task.delayMs) * 100),
    };
  } else if (elapsed >= task.delayMs) {
    return {
      taskId,
      provider: "mock",
      status: "completed",
      sceneId: task.sceneId,
      projectId: task.projectId,
      videoUrl: task.videoUrl,
      progress: 100,
    };
  } else {
    return {
      taskId,
      provider: "mock",
      status: "processing",
      sceneId: task.sceneId,
      projectId: task.projectId,
      progress: Math.round((elapsed / task.delayMs) * 100),
    };
  }
}
