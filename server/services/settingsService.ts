import { readJson, writeJson } from "../storage/jsonStorage.js";
import type { AppSettings } from "../types/index.js";

const SETTINGS_FILE = "settings.local.json";

const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: "",
  apiToken: "",
  apiProvider: "mock",
  defaultModel: "mock",
  mockMode: true,
  watermark: "CisuMusic",
  generateAudio: true,
  seed: null,
  maxRetries: 3,
  pollIntervalMs: 5000,
  maxSceneDurationSeconds: 8,
  isConfigured: false,
};

export async function getSettings(): Promise<AppSettings> {
  return readJson<AppSettings>(SETTINGS_FILE, DEFAULT_SETTINGS);
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated: AppSettings = {
    ...current,
    ...partial,
    isConfigured: !!(partial.apiBaseUrl ?? current.apiBaseUrl) || (partial.mockMode ?? current.mockMode),
  };
  await writeJson(SETTINGS_FILE, updated);
  return updated;
}

export async function clearSettings(): Promise<void> {
  await writeJson(SETTINGS_FILE, DEFAULT_SETTINGS);
}

/** Mask token for safe display: sk-abc***xYz9 */
export function maskToken(token: string): string {
  if (!token || token.length < 8) return "***";
  const prefix = token.slice(0, 6);
  const suffix = token.slice(-4);
  return `${prefix}***${suffix}`;
}

export async function getPublicSettings(): Promise<Omit<AppSettings, "apiToken"> & { maskedToken: string }> {
  const s = await getSettings();
  const { apiToken, ...rest } = s;
  return { ...rest, maskedToken: maskToken(apiToken) };
}
