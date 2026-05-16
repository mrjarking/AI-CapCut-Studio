// ─── AI Provider Types ───────────────────────────────────────────────────────

export type AIProvider = "veo3" | "veo3_fast" | "google_veo" | "mock";

export type VideoTaskStatus =
  | "queued"
  | "submitted"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface GenerateVideoRequest {
  provider: AIProvider;
  projectId: string;
  sceneId: string;
  prompt: string;
  negativePrompt?: string;
  imageUrls?: string[];
  aspectRatio: "9:16" | "16:9" | "1:1";
  durationSeconds: number;
  model?: string; // flexible model name, e.g. "veo3", "veo3_fast", "veo3.1-fast", "mock"
  resolution?: "720p" | "1080p";
  seed?: number;
  watermark?: string;
  generateAudio?: boolean;
  callBackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateVideoResponse {
  taskId: string;
  provider: AIProvider;
  status: VideoTaskStatus;
  sceneId: string;
  projectId: string;
  videoUrl?: string;
  previewUrl?: string;
  raw?: unknown;
  errorMessage?: string;
}

export interface VideoStatusResponse {
  taskId: string;
  provider: AIProvider;
  status: VideoTaskStatus;
  sceneId?: string;
  projectId?: string;
  progress?: number;
  videoUrl?: string;
  previewUrl?: string;
  errorMessage?: string;
  raw?: unknown;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  apiBaseUrl: string;
  apiToken: string;
  apiProvider: "veo3" | "mock";
  defaultModel: string; // flexible model name, e.g. "veo3", "veo3_fast", "veo3.1-fast", "mock"
  mockMode: boolean;
  watermark: string;
  generateAudio: boolean;
  seed: number | null;
  maxRetries: number;
  pollIntervalMs: number;
  maxSceneDurationSeconds: number;
  isConfigured: boolean;
  // Custom API paths (leave empty to use defaults)
  generateApiPath: string; // e.g. "/v1/video/generations" or "/api/v1/veo/generate"
  statusApiPath: string;   // e.g. "/v1/video/generations/{taskId}" or "/api/v1/veo/record-info"
  
  // LLM (Text Generation) Settings
  llmProvider: "forge" | "openai" | "google" | "custom";
  llmBaseUrl: string;
  llmToken: string;
  llmModel: string;
}

// ─── Project & Scene ─────────────────────────────────────────────────────────

export type VideoGoal =
  | "new_song"
  | "concert_promo"
  | "artist_intro"
  | "fan_interaction"
  | "backstage"
  | "app_promo"
  | "web3_nft"
  | "virtual_ip";

export type UserRole = "operator" | "fan_operator" | "content_editor";

export type VideoStyle =
  | "cyber_music"
  | "kpop_mv"
  | "documentary"
  | "fan_support"
  | "cinematic"
  | "vertical_drama"
  | "metaverse_stage"
  | "street_fashion";

export type TargetPlatform =
  | "tiktok"
  | "youtube_shorts"
  | "instagram_reels"
  | "facebook_reels"
  | "x"
  | "xiaohongshu"
  | "douyin"
  | "shipinhao";

export type TargetLanguage = "zh" | "en" | "ko" | "ja" | "vi" | "zh_en";

export type AspectRatio = "9:16" | "16:9" | "1:1";

export type VideoDuration = 30 | 60 | 90 | 120;

export interface Scene {
  id: string;
  order: number;
  startTime: number;
  endTime: number;
  goal: string;
  visualDescription: string;
  prompt: string;
  negativePrompt: string;
  subtitleText: string;
  voiceoverText: string;
  musicSuggestion: string;
  assetsUsed: string[];
  recommendedModel: string;
  status: VideoTaskStatus | "idle" | "pending";
  taskId?: string;
  videoUrl?: string;
  previewUrl?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface VideoBrief {
  title: string;
  coreSellingPoints: string[];
  targetAudience: string;
  emotionKeywords: string[];
  storyline: string;
  videoStructure: string;
  subtitleStyle: string;
  voiceoverStyle: string;
  musicSuggestion: string;
  socialMediaTips: string;
  ctaSuggestion: string;
}

export interface Project {
  id: string;
  name: string;
  userRole: UserRole;
  artistId: string;
  artistName: string;
  goal: VideoGoal;
  durationSeconds: VideoDuration;
  aspectRatio: AspectRatio;
  targetPlatforms: TargetPlatform[];
  targetLanguage: TargetLanguage;
  style: VideoStyle;
  selectedKnowledgeModules: string[];
  selectedAssets: string[];
  brief?: VideoBrief;
  scenes: Scene[];
  finalVideoUrl?: string;
  finalVideoDuration?: number;
  status: "draft" | "briefing" | "storyboard" | "generating" | "stitching" | "completed";
  createdAt: number;
  updatedAt: number;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface VideoTask {
  taskId: string;
  projectId: string;
  sceneId: string;
  provider: AIProvider;
  status: VideoTaskStatus;
  videoUrl?: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  model?: string; // model name used for generation (needed for new-api status routing)
}

// ─── Stitch ──────────────────────────────────────────────────────────────────

export interface StitchRequest {
  projectId: string;
  sceneVideoUrls: Array<{
    sceneId: string;
    videoUrl: string;
    order: number;
  }>;
  outputFileName?: string;
  options?: {
    resolution?: "720p" | "1080p";
    aspectRatio?: AspectRatio;
    addIntro?: boolean;
    addOutro?: boolean;
    addWatermark?: boolean;
  };
}

export interface StitchResponse {
  projectId: string;
  status: "completed" | "failed";
  finalVideoUrl?: string;
  segments?: string[];
  durationSeconds?: number;
  errorMessage?: string;
}

// ─── Artist & Assets ─────────────────────────────────────────────────────────

export interface Artist {
  id: string;
  name: string;
  country: string;
  type: string;
  fanName?: string;
  operationFocus: string[];
  keywords: string[];
  knowledgeModules: KnowledgeModule[];
}

export interface KnowledgeModule {
  id: string;
  name: string;
  description: string;
  content: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type:
    | "artist_photo"
    | "performance_photo"
    | "platform_logo"
    | "app_screenshot"
    | "fan_screenshot"
    | "social_screenshot"
    | "virtual_ip"
    | "bgm"
    | "sfx"
    | "video_clip";
  url: string;
  tags: string[];
  artistId?: string;
  licensed: boolean;
  description?: string;
}

// ─── Template ────────────────────────────────────────────────────────────────

export interface VideoTemplate {
  templateId: string;
  name: string;
  description: string;
  suitableRoles: UserRole[];
  suitableGoals: VideoGoal[];
  recommendedDuration: VideoDuration;
  recommendedPlatforms: TargetPlatform[];
  defaultStyle: VideoStyle;
  defaultStructure: string;
  defaultCTA: string;
  defaultPromptStyle: string;
}
