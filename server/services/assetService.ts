import { readJson, writeJson } from "../storage/jsonStorage.js";
import type { MediaAsset } from "../types/index.js";
import { MOCK_ASSETS } from "./mockDataService.js";

const UPLOADED_ASSETS_FILE = "uploaded_assets.json";

export async function getAllAssets(): Promise<MediaAsset[]> {
  const uploaded = await readJson<MediaAsset[]>(UPLOADED_ASSETS_FILE, []);
  return [...uploaded, ...MOCK_ASSETS];
}

export async function addUploadedAsset(asset: MediaAsset): Promise<MediaAsset> {
  const uploaded = await readJson<MediaAsset[]>(UPLOADED_ASSETS_FILE, []);
  const next = [asset, ...uploaded.filter((item) => item.id !== asset.id)];
  await writeJson(UPLOADED_ASSETS_FILE, next);
  return asset;
}
