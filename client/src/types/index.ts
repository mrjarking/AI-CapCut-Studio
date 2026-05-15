// Re-export shared types for frontend use
export type AIProvider = "veo3" | "veo3_fast" | "mock";

export type VideoTaskStatus =
  | "queued"
  | "submitted"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "idle"
  | "pending";

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
  status: VideoTaskStatus;
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

export interface AppSettings {
  apiBaseUrl: string;
  maskedToken: string;
  apiProvider: "veo3" | "mock";
  defaultModel: string;
  mockMode: boolean;
  watermark: string;
  generateAudio: boolean;
  seed: number | null;
  maxRetries: number;
  pollIntervalMs: number;
  maxSceneDurationSeconds: number;
  isConfigured: boolean;
  generateApiPath: string;
  statusApiPath: string;
}

export const VIDEO_GOAL_LABELS: Record<VideoGoal, string> = {
  new_song: "新歌宣传",
  concert_promo: "演出预热",
  artist_intro: "艺人介绍",
  fan_interaction: "粉丝互动",
  backstage: "幕后故事",
  app_promo: "App 活动推广",
  web3_nft: "Web3 / NFT / Token 活动",
  virtual_ip: "虚拟 IP 出道预告",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  operator: "运营人员",
  fan_operator: "粉丝运营",
  content_editor: "高级内容编辑",
};

export const VIDEO_STYLE_LABELS: Record<VideoStyle, string> = {
  cyber_music: "赛博音乐",
  kpop_mv: "K-pop 宣传片",
  documentary: "纪录片花絮",
  fan_support: "粉丝应援",
  cinematic: "电影感预告",
  vertical_drama: "竖屏短剧",
  metaverse_stage: "元宇宙虚拟舞台",
  street_fashion: "潮流街头",
};

export const PLATFORM_LABELS: Record<TargetPlatform, string> = {
  tiktok: "TikTok",
  youtube_shorts: "YouTube Shorts",
  instagram_reels: "Instagram Reels",
  facebook_reels: "Facebook Reels",
  x: "X (Twitter)",
  xiaohongshu: "小红书",
  douyin: "抖音",
  shipinhao: "视频号",
};

export const LANGUAGE_LABELS: Record<TargetLanguage, string> = {
  zh: "中文",
  en: "英文",
  ko: "韩文",
  ja: "日文",
  vi: "越南文",
  zh_en: "中英双语",
};

export const STATUS_LABELS: Record<string, string> = {
  idle: "待生成",
  pending: "等待中",
  queued: "排队中",
  submitted: "已提交",
  processing: "生成中",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
};
