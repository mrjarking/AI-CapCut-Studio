import axios from "axios";
import { ENV } from "./env.js";

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
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const apiKey = ENV.forgeApiKey;

  if (!apiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  const payload: Record<string, unknown> = {
    messages: options.messages,
    max_tokens: options.max_tokens ?? 2000,
    temperature: options.temperature ?? 0.7,
  };

  if (options.response_format) {
    payload.response_format = options.response_format;
  }

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
}
