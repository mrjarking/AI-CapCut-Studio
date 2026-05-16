import axios from "axios";
import { ENV } from "./env.js";
import { getSettings } from "../services/settingsService.js";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMOptions {
  messages: Message[];
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: Record<string, unknown>;
    };
  };
  max_tokens?: number;
  temperature?: number;
  model?: string;
}

interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function invokeLLM(options: LLMOptions): Promise<LLMResponse> {
  const settings = await getSettings();
  let baseUrl: string;
  let apiKey: string;
  let model: string;

  if (settings.llmProvider === "forge" || !settings.llmToken) {
    // Fallback to environment variables (built-in Forge)
    baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
    apiKey = ENV.forgeApiKey;
    model = options.model ?? "gpt-4o-mini"; // Forge default
    
    if (!apiKey) {
      console.warn("[LLM] BUILT_IN_FORGE_API_KEY is missing. AI text generation might fail.");
    }
  } else {
    // Use user-configured LLM
    baseUrl = settings.llmBaseUrl.replace(/\/+$/, "");
    apiKey = settings.llmToken;
    model = settings.llmModel || options.model || "gpt-4o-mini";

    // Special handling for Google Gemini OpenAI endpoint
    if (settings.llmProvider === "google" && !baseUrl) {
      baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
    }
  }

  const payload: Record<string, unknown> = {
    model: model,
    messages: options.messages,
    max_tokens: options.max_tokens ?? 2000,
    temperature: options.temperature ?? 0.7,
  };

  if (options.response_format) {
    payload.response_format = options.response_format;
  }

  try {
    const resp = await axios.post<LLMResponse>(
      `${baseUrl}/v1/chat/completions`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    return resp.data;
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`[LLM] Request failed (${baseUrl}):`, msg);
    throw new Error(`AI生成失败: ${msg}`);
  }
}
