/**
 * AI Configuration for Tiered Free/Pro Architecture
 * 
 * Two-tier AI system:
 * - Gemini Flash 2.0: FREE tier for all users (Free: 50/month, Pro: unlimited fast)
 * - Claude Sonnet 4.5: PRO tier for advanced reasoning (Pro only)
 * 
 * Legacy models (deprecated but still available):
 * - Scout (Groq Llama 4): Being replaced by Gemini
 * - GPT-5: Optional for math-heavy queries
 * - Opus 4.1: Enterprise only
 */

// Model cost table (USD per 1K tokens)
// Based on provider pricing as of January 2026
export const MODEL_COST_TABLE = {
  // Gemini Flash 2.0 (Google) - FREE TIER
  // Free for 2M tokens/day, perfect for Free users
  'gemini-2.0-flash': {
    input: 0,   // FREE
    output: 0,  // FREE
  },
  'gemini-1.5-flash': {
    input: 0,
    output: 0,
  },

  // Claude Sonnet 4.5 (Anthropic) - PRO TIER
  // ~$1.35 per 100 queries, excellent for reasoning
  'claude-sonnet-4-5': {
    input: 0.003,    // $3 per 1M input tokens
    output: 0.015,   // $15 per 1M output tokens
  },
  'claude-sonnet-4-5-20250929': {
    input: 0.003,
    output: 0.015,
  },

  // Legacy: GPT-5 (OpenAI) - DEPRECATED
  'gpt-5': {
    input: 0.00125,  // $1.25 per 1M input tokens
    output: 0.01,    // $10 per 1M output tokens
  },

  // Legacy: Scout models (Groq Llama 4) - DEPRECATED
  'meta-llama/llama-4-scout-17b-16e-instruct': {
    input: 0.00011,  // $0.11 per 1M tokens
    output: 0.00034, // $0.34 per 1M tokens
  },

  // Legacy: Claude Opus 4.1 - ENTERPRISE ONLY
  'claude-opus-4-1': {
    input: 0.015,    // $15 per 1M input tokens
    output: 0.075,   // $75 per 1M output tokens
  },

  // Fallback - Sonnet 3.5 (still supported)
  'claude-3-5-sonnet-20241022': {
    input: 0.003,
    output: 0.015,
  },
} as const;

export type ModelId = keyof typeof MODEL_COST_TABLE;

export interface AIConfig {
  // Scout model config (Groq)
  scout: {
    provider: 'groq';
    model: string;
    apiKey: string;
    maxTokens: number;
    temperature: number;
  };

  // Reasoning model config (Anthropic)
  reasoning: {
    provider: 'anthropic';
    model: string;
    apiKey: string;
    baseURL: string;
    maxTokens: number;
    temperature: number;
  };

  // Feature flags
  reasoningEnabled: boolean;

  // Cost estimation helper
  estimateCost: (modelId: ModelId, tokensIn: number, tokensOut: number) => number;
}

/**
 * Load AI configuration from environment variables
 */
export function loadAIConfig(): AIConfig {
  // Scout config (Groq Llama 4)
  const scoutModel = process.env.AI_SCOUT_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
  const scoutApiKey = process.env.GROQ_API_KEY || '';

  // Reasoning config (Anthropic via Replit AI Integrations)
  // Use Claude Sonnet 4.5 for Pro tier (current available model - January 2026)
  const reasoningModel = process.env.AI_REASON_MODEL || 'claude-sonnet-4-5-20250929';
  const reasoningApiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || '';
  const reasoningBaseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || 'https://api.anthropic.com';



  // Shared config
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '8192', 10);
  const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
  const reasoningEnabled = process.env.AI_REASONING_ENABLED === 'true';

  return {
    scout: {
      provider: 'groq',
      model: scoutModel,
      apiKey: scoutApiKey,
      maxTokens,
      temperature,
    },
    reasoning: {
      provider: 'anthropic',
      model: reasoningModel,
      apiKey: reasoningApiKey,
      baseURL: reasoningBaseURL,
      maxTokens,
      temperature,
    },
    reasoningEnabled,
    estimateCost: (modelId: ModelId, tokensIn: number, tokensOut: number): number => {
      const costs = MODEL_COST_TABLE[modelId];
      if (!costs) {
        console.warn(`Unknown model ID: ${modelId}, returning 0 cost`);
        return 0;
      }

      // Convert tokens to cost (table is per 1K tokens)
      const inputCost = (tokensIn / 1000) * costs.input;
      const outputCost = (tokensOut / 1000) * costs.output;

      return inputCost + outputCost;
    },
  };
}

// Singleton instance
let cachedConfig: AIConfig | null = null;

/**
 * Get the AI configuration (cached)
 */
export function getAIConfig(): AIConfig {
  if (!cachedConfig) {
    cachedConfig = loadAIConfig();
  }
  return cachedConfig;
}

/**
 * Validate that required config is present
 */
export function validateAIConfig(config: AIConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Scout validation
  if (!config.scout.apiKey) {
    errors.push('Missing GROQ_API_KEY for Scout model');
  }

  // Reasoning validation (only if enabled)
  if (config.reasoningEnabled) {
    if (!config.reasoning.apiKey) {
      errors.push('Missing AI_INTEGRATIONS_ANTHROPIC_API_KEY for Reasoning model');
    }
    if (!config.reasoning.baseURL) {
      errors.push('Missing AI_INTEGRATIONS_ANTHROPIC_BASE_URL for Reasoning model');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
