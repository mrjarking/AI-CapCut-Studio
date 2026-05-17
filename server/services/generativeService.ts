import { invokeLLM } from "../_core/llm.js";
import type { Project, VideoBrief, Scene } from "../types/index.js";
import { v4 as uuidv4 } from "uuid";
import { getProjectKnowledgeContext } from "./ragflowService.js";

const SCENE_COUNT_MAP: Record<number, { min: number; max: number; duration: number }> = {
  30: { min: 4, max: 6, duration: 7 },
  60: { min: 8, max: 10, duration: 7 },
  90: { min: 12, max: 15, duration: 7 },
  120: { min: 16, max: 20, duration: 7 },
};

export async function generateBriefWithLLM(project: Project): Promise<VideoBrief> {
  const knowledgeContext = await getProjectKnowledgeContext(project);
  const prompt = `你是一名专业的音乐视频策划专家。请根据以下项目信息生成一份视频策划案，必须以 JSON 格式返回。

项目信息：
- 艺人：${project.artistName}
- 视频目标：${project.goal}
- 视频时长：${project.durationSeconds}秒
- 目标平台：${project.targetPlatforms.join(", ")}
- 视频风格：${project.style}
- 目标语言：${project.targetLanguage}

艺人知识库初始资料：
${knowledgeContext || "暂无外部知识库资料，请基于项目配置生成。"}

请生成包含以下字段的 JSON：
{
  "title": "视频标题",
  "coreSellingPoints": ["卖点1", "卖点2", "卖点3"],
  "targetAudience": "目标受众描述",
  "emotionKeywords": ["情绪词1", "情绪词2", "情绪词3"],
  "storyline": "故事线描述",
  "videoStructure": "视频结构说明",
  "subtitleStyle": "字幕风格",
  "voiceoverStyle": "配音风格",
  "musicSuggestion": "音乐建议",
  "socialMediaTips": "社交媒体发布建议",
  "ctaSuggestion": "CTA 建议"
}`;

  try {
    const resp = await invokeLLM({
      messages: [
        { role: "system", content: "你是专业的音乐视频策划专家，必须返回有效的 JSON。" },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_brief",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              coreSellingPoints: { type: "array", items: { type: "string" } },
              targetAudience: { type: "string" },
              emotionKeywords: { type: "array", items: { type: "string" } },
              storyline: { type: "string" },
              videoStructure: { type: "string" },
              subtitleStyle: { type: "string" },
              voiceoverStyle: { type: "string" },
              musicSuggestion: { type: "string" },
              socialMediaTips: { type: "string" },
              ctaSuggestion: { type: "string" },
            },
            required: ["title", "coreSellingPoints", "targetAudience", "emotionKeywords", "storyline", "videoStructure", "subtitleStyle", "voiceoverStyle", "musicSuggestion", "socialMediaTips", "ctaSuggestion"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = resp.choices?.[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as VideoBrief;
    }
  } catch (err) {
    console.error("[GenerativeService] Brief generation failed:", err);
  }

  // Fallback
  return {
    title: `${project.artistName} - ${project.durationSeconds}秒宣发视频`,
    coreSellingPoints: ["艺人魅力展示", "音乐作品推广", "粉丝互动增强"],
    targetAudience: "18-35岁音乐爱好者，关注 K-pop 和亚洲流行音乐的年轻用户",
    emotionKeywords: ["激情", "期待", "共鸣", "震撼"],
    storyline: "从艺人登场到高潮展示，通过视觉冲击和情感共鸣吸引观众",
    videoStructure: "开场吸引 → 内容展示 → 情感高潮 → CTA 引导",
    subtitleStyle: "霓虹渐变字幕，中英双语",
    voiceoverStyle: "充满活力的年轻声音，节奏感强",
    musicSuggestion: "使用艺人代表作作为背景音乐",
    socialMediaTips: "发布时间选择晚上8-10点，配合话题标签 #CisuMusic",
    ctaSuggestion: "关注艺人 | 点击链接了解更多",
  };
}

export async function generateScenesWithLLM(project: Project, brief: VideoBrief): Promise<Scene[]> {
  const config = SCENE_COUNT_MAP[project.durationSeconds] ?? { min: 8, max: 10, duration: 7 };
  const sceneCount = Math.floor((config.min + config.max) / 2);
  const knowledgeContext = await getProjectKnowledgeContext(project);

  const prompt = `你是专业的 AI 视频分镜脚本编写专家。请根据以下信息生成 ${sceneCount} 个分镜，必须以 JSON 数组格式返回。

项目信息：
- 艺人：${project.artistName}
- 视频标题：${brief.title}
- 故事线：${brief.storyline}
- 视频结构：${brief.videoStructure}
- 视频风格：${project.style}
- 视频比例：${project.aspectRatio}
- 每个镜头时长：约 ${config.duration} 秒

艺人知识库初始资料：
${knowledgeContext || "暂无外部知识库资料，请基于项目配置和策划案生成。"}

每个分镜必须包含：
- order: 镜头序号（从1开始）
- goal: 镜头目标
- visualDescription: 画面描述（中文）
- prompt: 英文 AI Video Prompt（必须包含 Subject, Scene, Action, Camera Language, Visual Style, Brand Elements, Output Requirements）
- negativePrompt: 英文 Negative Prompt
- subtitleText: 字幕文案
- voiceoverText: 配音文案
- musicSuggestion: 音乐/音效建议

Prompt 示例格式：
"A cinematic vertical 9:16 [style] shot of [artist] [action], [scene description], camera [camera movement], [visual style], [brand elements], high quality, social media ready, 30fps, clean composition."

Negative Prompt 固定使用：
"low quality, distorted face, extra fingers, unreadable text, wrong logo, watermark, flickering, unstable character identity, overexposed, bad anatomy, broken hands, duplicated face, messy background, random text, deformed body."

请返回 JSON 数组，每个元素包含上述字段。`;

  try {
    const resp = await invokeLLM({
      messages: [
        { role: "system", content: "你是专业的 AI 视频分镜脚本编写专家，必须返回有效的 JSON 数组。" },
        { role: "user", content: prompt },
      ],
    });

    const content = resp.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
      const arr = Array.isArray(parsed) ? parsed : parsed.scenes ?? [];

      return arr.map((s: Record<string, unknown>, idx: number) => ({
        id: uuidv4(),
        order: (s["order"] as number) ?? idx + 1,
        startTime: idx * config.duration,
        endTime: (idx + 1) * config.duration,
        goal: String(s["goal"] ?? ""),
        visualDescription: String(s["visualDescription"] ?? ""),
        prompt: String(s["prompt"] ?? ""),
        negativePrompt: String(s["negativePrompt"] ?? "low quality, distorted face, extra fingers, unreadable text, wrong logo, watermark, flickering, unstable character identity, overexposed, bad anatomy, broken hands, duplicated face, messy background, random text, deformed body."),
        subtitleText: String(s["subtitleText"] ?? ""),
        voiceoverText: String(s["voiceoverText"] ?? ""),
        musicSuggestion: String(s["musicSuggestion"] ?? ""),
        assetsUsed: [],
        recommendedModel: "veo3",
        status: "idle" as const,
        retryCount: 0,
      }));
    }
  } catch (err) {
    console.error("[GenerativeService] Scene generation failed:", err);
  }

  // Fallback scenes
  return generateFallbackScenes(project, brief, sceneCount, config.duration);
}

function generateFallbackScenes(project: Project, brief: VideoBrief, count: number, duration: number): Scene[] {
  const scenes: Scene[] = [];
  const artistKeywords = project.artistName === "2Z" ? "Korean fashion rock band 2Z, high fashion styling, neon stage" :
    project.artistName === "MINH" ? "Vietnamese pop artist MINH, cinematic mood, emotional performance" :
    project.artistName === "Nghịch" ? "Vietnamese punk rock band Nghịch, raw energy, rebellious style" :
    "Vietnamese indie pop artist Vũ Thanh Vân, poetic mood, soft cinematic";

  const sceneTemplates = [
    { goal: "开场吸引", visual: "艺人在霓虹灯舞台上登场，光效炫目", action: "walking through a futuristic digital stage", camera: "slow push-in from wide shot to medium shot" },
    { goal: "艺人魅力展示", visual: "艺人特写镜头，展现个人魅力", action: "performing with intense emotion, looking directly at camera", camera: "dramatic close-up, slow motion" },
    { goal: "音乐氛围渲染", visual: "音乐可视化效果，音浪与光效融合", action: "surrounded by music visualization particles and light trails", camera: "360-degree orbit shot" },
    { goal: "故事情节推进", visual: "场景切换，展现艺人故事", action: "moving through different environments", camera: "tracking shot following the artist" },
    { goal: "情感高潮", visual: "情感爆发时刻，视觉冲击最强", action: "delivering the emotional peak of the performance", camera: "extreme close-up to wide shot reveal" },
    { goal: "品牌植入", visual: "CisuMusic 品牌元素自然融入", action: "CisuMusic logo and platform elements integrated into the scene", camera: "product reveal shot" },
    { goal: "粉丝互动", visual: "粉丝应援画面，群体能量", action: "fans represented as glowing particles and light beams", camera: "aerial wide shot" },
    { goal: "CTA 引导", visual: "结尾 CTA 画面，引导关注", action: "final pose with CTA overlay elements", camera: "slow zoom out to reveal full scene" },
  ];

  for (let i = 0; i < count; i++) {
    const template = sceneTemplates[i % sceneTemplates.length];
    scenes.push({
      id: uuidv4(),
      order: i + 1,
      startTime: i * duration,
      endTime: (i + 1) * duration,
      goal: template.goal,
      visualDescription: `镜头 ${i + 1}：${template.visual}`,
      prompt: `A cinematic vertical 9:16 ${project.style.replace(/_/g, " ")} shot of ${artistKeywords}, ${template.action}, ${template.camera}, neon light trails reacting to music, CisuMusic Web3 music platform mood, high quality, social media ready, 30fps, clean composition.`,
      negativePrompt: "low quality, distorted face, extra fingers, unreadable text, wrong logo, watermark, flickering, unstable character identity, overexposed, bad anatomy, broken hands, duplicated face, messy background, random text, deformed body.",
      subtitleText: brief.coreSellingPoints[i % brief.coreSellingPoints.length] ?? "",
      voiceoverText: `${brief.title} - ${template.goal}`,
      musicSuggestion: brief.musicSuggestion,
      assetsUsed: [],
      recommendedModel: "veo3",
      status: "idle",
      retryCount: 0,
    });
  }

  return scenes;
}
