import { v4 as uuidv4 } from "uuid";
import { readJson, writeJson } from "../storage/jsonStorage.js";
import type { Project, Scene, VideoBrief } from "../types/index.js";

const PROJECTS_FILE = "projects.json";

export async function getAllProjects(): Promise<Project[]> {
  return readJson<Project[]>(PROJECTS_FILE, []);
}

export async function getProject(id: string): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find((p) => p.id === id) ?? null;
}

export async function createProject(data: Omit<Project, "id" | "createdAt" | "updatedAt" | "scenes" | "status">): Promise<Project> {
  const projects = await getAllProjects();
  const now = Date.now();
  const project: Project = {
    ...data,
    id: uuidv4(),
    scenes: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  projects.push(project);
  await writeJson(PROJECTS_FILE, projects);
  return project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const projects = await getAllProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: Date.now() };
  await writeJson(PROJECTS_FILE, projects);
  return projects[idx];
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await getAllProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  await writeJson(PROJECTS_FILE, filtered);
  return true;
}

export async function duplicateProject(id: string): Promise<Project | null> {
  const original = await getProject(id);
  if (!original) return null;
  const now = Date.now();
  const copy: Project = {
    ...original,
    id: uuidv4(),
    name: `${original.name} (副本)`,
    status: "draft",
    finalVideoUrl: undefined,
    scenes: original.scenes.map((s) => ({
      ...s,
      id: uuidv4(),
      status: "idle" as const,
      taskId: undefined,
      videoUrl: undefined,
      errorMessage: undefined,
      retryCount: 0,
    })),
    createdAt: now,
    updatedAt: now,
  };
  const projects = await getAllProjects();
  projects.push(copy);
  await writeJson(PROJECTS_FILE, projects);
  return copy;
}

export async function updateProjectBrief(id: string, brief: VideoBrief): Promise<Project | null> {
  return updateProject(id, { brief, status: "briefing" });
}

export async function updateProjectScenes(id: string, scenes: Scene[]): Promise<Project | null> {
  return updateProject(id, { scenes, status: "storyboard" });
}

export async function updateScene(projectId: string, sceneId: string, updates: Partial<Scene>): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  const scenes = project.scenes.map((s) =>
    s.id === sceneId ? { ...s, ...updates } : s
  );
  return updateProject(projectId, { scenes });
}
