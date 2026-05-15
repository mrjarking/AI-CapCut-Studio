import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");

export async function ensureDataDir() {
  await fs.ensureDir(DATA_DIR);
}

export async function readJson<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (await fs.pathExists(filePath)) {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as T;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function deleteJson(filename: string): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
  }
}
