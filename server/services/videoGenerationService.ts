import { readJson, writeJson } from "../storage/jsonStorage.js";
import { getSettings } from "./settingsService.js";
import { mockGenerate, mockGetStatus } from "../adapters/mockVideoAdapter.js";
import { veo3Generate, veo3GetStatus } from "../adapters/veo3Adapter.js";
import { updateScene } from "./projectService.js";
import type {
  GenerateVideoRequest,
  GenerateVideoResponse,
  VideoStatusResponse,
  VideoTask,
} from "../types/index.js";

const TASKS_FILE = "tasks.json";

export async function getAllTasks(): Promise<VideoTask[]> {
  return readJson<VideoTask[]>(TASKS_FILE, []);
}

async function saveTask(task: VideoTask): Promise<void> {
  const tasks = await getAllTasks();
  const idx = tasks.findIndex((t) => t.taskId === task.taskId);
  if (idx === -1) {
    tasks.push(task);
  } else {
    tasks[idx] = task;
  }
  await writeJson(TASKS_FILE, tasks);
}

export async function generateVideo(req: GenerateVideoRequest): Promise<GenerateVideoResponse> {
  const settings = await getSettings();
  let result: GenerateVideoResponse;

  if (settings.mockMode || req.provider === "mock") {
    result = await mockGenerate(req);
  } else {
    result = await veo3Generate(req);
  }

  if (result.taskId) {
    const task: VideoTask = {
      taskId: result.taskId,
      projectId: req.projectId,
      sceneId: req.sceneId,
      provider: result.provider,
      status: result.status,
      videoUrl: result.videoUrl,
      errorMessage: result.errorMessage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 0,
    };
    await saveTask(task);

    // Update scene status
    await updateScene(req.projectId, req.sceneId, {
      status: result.status,
      taskId: result.taskId,
      errorMessage: result.errorMessage,
    });
  }

  return result;
}

export async function getVideoStatus(taskId: string): Promise<VideoStatusResponse> {
  const settings = await getSettings();
  const tasks = await getAllTasks();
  const task = tasks.find((t) => t.taskId === taskId);

  let result: VideoStatusResponse;

  if (settings.mockMode || taskId.startsWith("mock_")) {
    result = await mockGetStatus(taskId);
  } else {
    result = await veo3GetStatus(taskId);
  }

  // Update task record
  if (task) {
    const updated: VideoTask = {
      ...task,
      status: result.status,
      videoUrl: result.videoUrl ?? task.videoUrl,
      errorMessage: result.errorMessage,
      updatedAt: Date.now(),
    };
    await saveTask(updated);

    // Sync scene status
    if (task.projectId && task.sceneId) {
      await updateScene(task.projectId, task.sceneId, {
        status: result.status,
        videoUrl: result.videoUrl ?? task.videoUrl,
        errorMessage: result.errorMessage,
      });
    }
  }

  return result;
}

export async function generateBatch(
  projectId: string,
  scenes: Array<{ sceneId: string; prompt: string; negativePrompt?: string; durationSeconds: number; aspectRatio?: "9:16" | "16:9" | "1:1" }>
): Promise<GenerateVideoResponse[]> {
  const settings = await getSettings();
  const results: GenerateVideoResponse[] = [];

  for (const scene of scenes) {
    const req: GenerateVideoRequest = {
      provider: settings.mockMode ? "mock" : settings.apiProvider,
      projectId,
      sceneId: scene.sceneId,
      prompt: scene.prompt,
      negativePrompt: scene.negativePrompt,
      aspectRatio: scene.aspectRatio ?? "9:16",
      durationSeconds: scene.durationSeconds,
      model: settings.defaultModel,
      watermark: settings.watermark,
      generateAudio: settings.generateAudio,
      seed: settings.seed ?? undefined,
    };

    const result = await generateVideo(req);
    results.push(result);
  }

  return results;
}
