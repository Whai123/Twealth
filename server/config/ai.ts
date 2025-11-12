/**
 * AI Configuration for Hybrid Scout + Reasoning Architecture
 * 
 * Three-tier AI system:
 * - Scout 4 (Llama 4): Fast queries for Free/Pro/Enterprise (90-95% of traffic)
 * - Sonnet 3.5: CFO-level analysis for Pro/Enterprise (5-10% of traffic)
 * - Opus 4.1: Advanced CFO analysis for Enterprise only (2-5% of traffic)
 * 
 * Using Replit AI Integrations for Anthropic (no API key needed, billed to credits)
 */

// Model cost table (USD per 1K tokens)
// Based on provider pricing as of November 2025
export const MODEL_COST_TABLE = {
  // Scout models (Groq Llama 4)
  'meta-llama/llama-4-scout-17b-16e-instruct': {
    input: 0.00011,  // $0.11 per 1M tokens
    output: 0.00034, // $0.34 per 1M tokens
  },
  
  // Reasoning models (Anthropic via Replit AI Integrations)
  // Enterprise tier - Opus 4.1 (most powerful, released Aug 2025)
  'claude-opus-4-1-20250805': {
    input: 0.015,    // $15 per 1M input tokens
    output: 0.075,   // $75 per 1M output tokens
  },
  'claude-opus-4-1': {
    input: 0.015,
    output: 0.075,
  },
  
  // Pro tier - Sonnet 4.5 (best coding model, released Sep 2025)
  'claude-sonnet-4-5-20250929': {
    input: 0.003,    // $3 per 1M input tokens
    output: 0.015,   // $15 per 1M output tokens
  },
  'claude-sonnet-4-5': {
    input: 0.003,
    output: 0.015,
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
  // Default to Sonnet 4.5 for Pro tier, Opus 4.1 available for Enterprise
  const reasoningModel = process.env.AI_REASON_MODEL || 'claude-sonnet-4-5';
  const reasoningApiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || '';
  const reasoningBaseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || '';
  
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
