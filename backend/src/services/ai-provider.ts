import { env } from '../config/env';

export interface AiResult {
  visible_text: string;
  invisible_injections: Record<string, string>;
  invisible_keywords: string[];
  match_score: number;
}

export interface AiProvider {
  extractJobRequirements(fullText: string, title: string): Promise<{ requirements: string[]; keywords: string[] }>;
  analyzeJobMatchAndRewrite(cvText: string, jobRequirements: string[], jobKeywords: string[], jobTitle?: string): Promise<AiResult>;
}

let cachedProvider: AiProvider | null = null;

export async function getAiProvider(): Promise<AiProvider> {
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerName = env.AI_PROVIDER;

  switch (providerName) {
    case 'deepseek': {
      const { DeepSeekService } = await import('./deepseek.service');
      cachedProvider = DeepSeekService;
      break;
    }
    case 'openai-compatible': {
      const { OpenAICompatibleService } = await import('./openai-compatible.service');
      cachedProvider = OpenAICompatibleService;
      break;
    }
    case 'gemini':
    default: {
      const { GeminiService } = await import('./gemini.service');
      cachedProvider = GeminiService;
      break;
    }
  }

  return cachedProvider;
}
