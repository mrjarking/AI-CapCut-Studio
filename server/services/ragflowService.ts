import axios from "axios";
import type { Artist, KnowledgeModule, Project } from "../types/index.js";
import { MOCK_ARTISTS } from "./mockDataService.js";

const RAGFLOW_BASE_URL = process.env.RAGFLOW_BASE_URL ?? "https://kb.nestar.pro/api/v1";
const RAGFLOW_API_KEY =
  process.env.RAGFLOW_API_KEY ?? "ragflow-FM_4KIxbMAitMm1q3IY2ZgC4etp6iylfDI_VacWsLf0";

const KNOWLEDGE_QUERIES = [
  { id: "profile", name: "艺人介绍", question: "艺人介绍 基础资料 成员 背景 音乐风格" },
  { id: "works", name: "作品资料", question: "代表作品 最新专辑 单曲 MV 音乐作品 风格" },
  { id: "social", name: "社交媒体资讯", question: "社交媒体 最新动态 Instagram TikTok YouTube Facebook 粉丝互动" },
  { id: "events", name: "活动与演出", question: "近期活动 演出 巡演 发布会 平台活动 粉丝活动" },
  { id: "assets", name: "图片素材", question: "图片素材 宣传照 演出照片 海报 视觉素材 官方图片" },
] as const;

interface RagDataset {
  id: string;
  name: string;
  description?: string;
  document_count?: number;
  chunk_count?: number;
}

interface RagChunk {
  content?: string;
  similarity?: number;
  document_id?: string;
}

let artistsCache: Artist[] | null = null;

function headers() {
  return {
    Authorization: `Bearer ${RAGFLOW_API_KEY}`,
    "Content-Type": "application/json",
  };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

async function listDatasets(): Promise<RagDataset[]> {
  const resp = await axios.get(`${RAGFLOW_BASE_URL}/datasets`, {
    headers: headers(),
    params: { page: 1, page_size: 100 },
    timeout: 15000,
  });
  return Array.isArray(resp.data?.data) ? resp.data.data : [];
}

function matchDatasetForArtist(datasets: RagDataset[], artist: Artist): RagDataset | undefined {
  const tokens = [artist.id, artist.name, artist.name.replace(/\s+/g, "-")].map(normalizeText);
  return datasets.find((dataset) => {
    const name = normalizeText(dataset.name);
    return tokens.some((token) => token && name.includes(token));
  });
}

async function retrieve(datasetId: string, question: string): Promise<RagChunk[]> {
  const resp = await axios.post(
    `${RAGFLOW_BASE_URL}/retrieval`,
    {
      dataset_ids: [datasetId],
      question,
      top_k: 5,
      similarity_threshold: 0.2,
      vector_similarity_weight: 0.7,
    },
    { headers: headers(), timeout: 20000 }
  );
  return Array.isArray(resp.data?.data?.chunks) ? resp.data.data.chunks : [];
}

function chunksToContent(chunks: RagChunk[]) {
  return chunks
    .map((chunk) => chunk.content?.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join("\n\n");
}

async function loadArtistsWithRagKnowledge(): Promise<Artist[]> {
  try {
    const datasets = await listDatasets();
    return await Promise.all(
      MOCK_ARTISTS.map(async (artist) => {
        const dataset = matchDatasetForArtist(datasets, artist);
        if (!dataset) return artist;

        const ragModules: KnowledgeModule[] = await Promise.all(
          KNOWLEDGE_QUERIES.map(async (query) => {
            const chunks = await retrieve(dataset.id, `${artist.name} ${query.question}`);
            return {
              id: `${artist.id}_rag_${query.id}`,
              name: query.name,
              description: `${dataset.name} · ${chunks.length || dataset.chunk_count || 0} 条相关资料`,
              content: chunksToContent(chunks) || dataset.description || `${artist.name} 的 ${query.name} 知识库资料`,
            };
          })
        );

        return {
          ...artist,
          knowledgeModules: [...ragModules, ...artist.knowledgeModules.filter((m) => m.id.endsWith("_risk"))],
        };
      })
    );
  } catch (err) {
    console.warn("[RAGFlow] Failed to load knowledge, using local fallback:", err instanceof Error ? err.message : err);
    return MOCK_ARTISTS;
  }
}

export async function getArtistsWithRagKnowledge(): Promise<Artist[]> {
  if (artistsCache) return artistsCache;

  const loadPromise = loadArtistsWithRagKnowledge().then((artists) => {
    artistsCache = artists;
    return artists;
  });

  return Promise.race([
    loadPromise,
    new Promise<Artist[]>((resolve) => {
      setTimeout(() => resolve(MOCK_ARTISTS), 2500);
    }),
  ]);
}

export async function getProjectKnowledgeContext(project: Project): Promise<string> {
  const artists = await getArtistsWithRagKnowledge();
  const artist = artists.find((item) => item.id === project.artistId);
  if (!artist) return "";

  const selected = artist.knowledgeModules.filter((module) =>
    project.selectedKnowledgeModules.includes(module.id)
  );
  const modules = selected.length ? selected : artist.knowledgeModules.slice(0, 5);

  return modules
    .map((module) => `【${module.name}】\n${module.content}`)
    .join("\n\n")
    .slice(0, 8000);
}
