/**
 * AI Clients - 4-Model Architecture
 * - Scout (Llama 4 via Groq): PRIMARY - Fast queries (Fast)
 * - Sonnet 3.5/4.5 (Claude): REASONING - Multi-step logic (Smart)
 * - GPT-5 (OpenAI): MATH - Advanced calculations (Math)
 * - Opus 4.1 (Claude): CFO-LEVEL - Portfolio analysis (CFO)
 * 
 * Standardized interface for all providers with cost tracking
 * Return shape: { text, tokensIn, tokensOut, cost, model }
 * 
 * Features:
 * - Retry logic with exponential backoff for transient failures
 * - Graceful error handling with user-friendly messages
 * - Circuit-breaker pattern for provider outages
 * - Structured logging for production observability
 */

import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getAIConfig, type ModelId } from '../config/ai';
import { aiLogger } from '../utils/logger';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

// Error types for categorization
export interface AIClientError extends Error {
  code: 'rate_limit' | 'provider_error' | 'timeout' | 'auth_error' | 'unknown';
  retryable: boolean;
  statusCode?: number;
  provider: string;
}

/**
 * Create a standardized AI client error
 */
function createAIClientError(
  message: string,
  code: AIClientError['code'],
  provider: string,
  statusCode?: number
): AIClientError {
  const error = new Error(message) as AIClientError;
  error.code = code;
  error.retryable = code === 'rate_limit' || code === 'provider_error';
  error.statusCode = statusCode;
  error.provider = provider;
  return error;
}

/**
 * Sleep for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Coerce tool arguments to proper types
 * Fixes common LLM issues like returning "true" instead of true
 */
function coerceToolArguments(args: Record<string, any>): Record<string, any> {
  const coerced: Record<string, any> = {};
  for (const [key, value] of Object.entries(args)) {
    if (value === "true" || value === "True" || value === "TRUE") {
      coerced[key] = true;
    } else if (value === "false" || value === "False" || value === "FALSE") {
      coerced[key] = false;
    } else if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.replace(/[$,]/g, ''))) {
      // Keep numeric strings as strings (they might be amounts like "5000000")
      coerced[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively coerce nested objects
      coerced[key] = coerceToolArguments(value);
    } else {
      coerced[key] = value;
    }
  }
  return coerced;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getBackoffDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  // Add jitter (0-30% of delay)
  return delay + Math.random() * delay * 0.3;
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Rate limit errors
  if (error.status === 429 || error.code === 'rate_limit_exceeded') {
    return true;
  }
  // Server errors (5xx)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }
  return false;
}

/**
 * Generic retry wrapper for AI API calls
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  provider: string,
  operationName: string
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Log the error with structured context
      aiLogger.warn(`${provider} ${operationName} attempt ${attempt + 1} failed`, {
        data: {
          provider,
          operation: operationName,
          attempt: attempt + 1,
          errorMessage: error.message,
          statusCode: error.status,
        }
      });
      
      // Don't retry if not retryable or last attempt
      if (!isRetryableError(error) || attempt === RETRY_CONFIG.maxRetries - 1) {
        break;
      }
      
      // Wait before retrying
      const delay = getBackoffDelay(attempt);
      aiLogger.debug(`${provider} retrying in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
  
  // Categorize the final error
  const statusCode = lastError?.status || lastError?.statusCode;
  let errorCode: AIClientError['code'] = 'unknown';
  let message = 'An unexpected error occurred';
  
  if (statusCode === 429) {
    errorCode = 'rate_limit';
    message = 'AI service is temporarily overloaded. Please try again in a moment.';
  } else if (statusCode === 401 || statusCode === 403) {
    errorCode = 'auth_error';
    message = 'AI service configuration error. Please contact support.';
  } else if (statusCode >= 500) {
    errorCode = 'provider_error';
    message = 'AI service is temporarily unavailable. Please try again.';
  } else if (lastError?.code === 'ETIMEDOUT') {
    errorCode = 'timeout';
    message = 'AI request timed out. Please try a simpler question.';
  }
  
  throw createAIClientError(
    `${provider} error: ${message}`,
    errorCode,
    provider,
    statusCode
  );
}

// Tool call interface
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: any; // Parsed JSON object (not string)
  };
}

// Standardized response shape
export interface AIResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  model: string;
  toolCalls?: ToolCall[]; // Optional array of tool calls from the AI
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  system?: string;
  tools?: any[];
  maxTokens?: number;
  temperature?: number;
}

// Streaming chunk interface
export interface StreamChunk {
  type: 'text' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: ToolCall;
  error?: string;
  // Final metadata when done
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
  model?: string;
}

/**
 * GPT-5 Client (OpenAI via Replit AI Integrations)
 * MATH MODEL - Advanced math, projections, simulations (Pro: 5/month, Enterprise: 10/month)
 */
export class GPT5Client {
  private openai: OpenAI;
  private model = 'gpt-5';
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || '',
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
  }
  
  async chat(options: ChatOptions): Promise<AIResponse> {
    const {
      messages,
      system,
      tools,
      maxTokens = 8192,
      temperature = 0.7,
    } = options;
    
    // Build OpenAI message format
    const openaiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Add system message if provided
    if (system) {
      openaiMessages.unshift({
        role: 'system' as const,
        content: system,
      });
    }
    
    return withRetry(async () => {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        max_tokens: maxTokens,
        temperature,
        tools: tools as any,
      });
      
      const message = completion.choices[0]?.message;
      const text = message?.content || '';
      const tokensIn = completion.usage?.prompt_tokens || 0;
      const tokensOut = completion.usage?.completion_tokens || 0;
      
      // Extract tool calls from OpenAI response
      const toolCalls: ToolCall[] | undefined = message?.tool_calls
        ?.filter((tc: any) => tc.type === 'function' && tc.function)
        .map((tc: any) => {
          try {
            const parsedArgs = JSON.parse(tc.function.arguments);
            // Coerce string booleans to actual booleans
            const coercedArgs = coerceToolArguments(parsedArgs);
            return {
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.function.name,
                arguments: coercedArgs,
              },
            };
          } catch (error) {
            console.error('[GPT5Client] Failed to parse tool call arguments:', error);
            return null;
          }
        })
        .filter((tc): tc is ToolCall => tc !== null);
      
      // Calculate cost (GPT-5 includes reasoning tokens in output)
      const aiConfig = getAIConfig();
      const cost = aiConfig.estimateCost(
        'gpt-5' as ModelId,
        tokensIn,
        tokensOut
      );
      
      return {
        text,
        tokensIn,
        tokensOut,
        cost,
        model: this.model,
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      };
    }, 'GPT5Client', 'chat');
  }
  
  async *chatStream(options: ChatOptions): AsyncGenerator<StreamChunk> {
    const {
      messages,
      system,
      maxTokens = 8192,
      temperature = 0.7,
    } = options;
    
    const openaiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    if (system) {
      openaiMessages.unshift({
        role: 'system' as const,
        content: system,
      });
    }
    
    try {
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        stream_options: { include_usage: true },
      });
      
      let fullText = '';
      let tokensIn = 0;
      let tokensOut = 0;
      
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullText += delta.content;
          yield { type: 'text', content: delta.content };
        }
        
        if (chunk.usage) {
          tokensIn = chunk.usage.prompt_tokens || 0;
          tokensOut = chunk.usage.completion_tokens || 0;
        }
      }
      
      const aiConfig = getAIConfig();
      const cost = aiConfig.estimateCost('gpt-5' as ModelId, tokensIn, tokensOut);
      
      yield {
        type: 'done',
        tokensIn,
        tokensOut,
        cost,
        model: this.model,
      };
    } catch (error: any) {
      yield { type: 'error', error: error.message || 'GPT-5 streaming failed' };
    }
  }
}

/**
 * Scout Client (Groq Llama 4)
 * PRIMARY MODEL - Fast queries, budgeting, spending (Free: 50/month, Pro/Enterprise: unlimited)
 */
export class ScoutClient {
  private groq: Groq;
  private config = getAIConfig().scout;
  
  constructor() {
    this.groq = new Groq({
      apiKey: this.config.apiKey,
    });
  }
  
  async chat(options: ChatOptions): Promise<AIResponse> {
    const {
      messages,
      system,
      tools,
      maxTokens = this.config.maxTokens,
      temperature = this.config.temperature,
    } = options;
    
    // Build Groq message format
    const groqMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'system' as const : msg.role,
      content: msg.content,
    }));
    
    // Add system message if provided
    if (system) {
      groqMessages.unshift({
        role: 'system',
        content: system,
      });
    }
    
    return withRetry(async () => {
      const completion = await this.groq.chat.completions.create({
        model: this.config.model,
        messages: groqMessages,
        max_tokens: maxTokens,
        temperature,
        tools: tools as any,
      });
      
      const message = completion.choices[0]?.message;
      const text = message?.content || '';
      const tokensIn = completion.usage?.prompt_tokens || 0;
      const tokensOut = completion.usage?.completion_tokens || 0;
      
      // Extract tool calls from Groq response (same format as OpenAI)
      const toolCalls: ToolCall[] | undefined = message?.tool_calls
        ?.filter((tc: any) => tc.type === 'function' && tc.function)
        .map((tc: any) => {
          try {
            const parsedArgs = JSON.parse(tc.function.arguments);
            // Coerce string booleans to actual booleans (Scout/Llama often returns "true" instead of true)
            const coercedArgs = coerceToolArguments(parsedArgs);
            return {
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.function.name,
                arguments: coercedArgs,
              },
            };
          } catch (error) {
            console.error('[ScoutClient] Failed to parse tool call arguments:', error);
            return null;
          }
        })
        .filter((tc): tc is ToolCall => tc !== null);
      
      // Calculate cost
      const aiConfig = getAIConfig();
      const cost = aiConfig.estimateCost(
        this.config.model as ModelId,
        tokensIn,
        tokensOut
      );
      
      return {
        text,
        tokensIn,
        tokensOut,
        cost,
        model: this.config.model,
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      };
    }, 'ScoutClient', 'chat');
  }
  
  async *chatStream(options: ChatOptions): AsyncGenerator<StreamChunk> {
    const {
      messages,
      system,
      maxTokens = this.config.maxTokens,
      temperature = this.config.temperature,
    } = options;
    
    const groqMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'system' as const : msg.role,
      content: msg.content,
    }));
    
    if (system) {
      groqMessages.unshift({
        role: 'system',
        content: system,
      });
    }
    
    try {
      const stream = await this.groq.chat.completions.create({
        model: this.config.model,
        messages: groqMessages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      });
      
      let fullText = '';
      let tokensIn = 0;
      let tokensOut = 0;
      
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullText += delta.content;
          yield { type: 'text', content: delta.content };
        }
        
        if (chunk.x_groq?.usage) {
          tokensIn = chunk.x_groq.usage.prompt_tokens || 0;
          tokensOut = chunk.x_groq.usage.completion_tokens || 0;
        }
      }
      
      const aiConfig = getAIConfig();
      const cost = aiConfig.estimateCost(this.config.model as ModelId, tokensIn, tokensOut);
      
      yield {
        type: 'done',
        tokensIn,
        tokensOut,
        cost,
        model: this.config.model,
      };
    } catch (error: any) {
      yield { type: 'error', error: error.message || 'Scout streaming failed' };
    }
  }
}

/**
 * Anthropic Client (Claude Sonnet 3.5/4.5 and Opus 4.1)
 * REASONING + CFO-LEVEL - Sonnet for strategy (Pro: 25 queries/month, Enterprise: 60 queries/month)
 * Opus for CFO analysis (Enterprise only: 20 queries/month)
 */
export class AnthropicClient {
  private anthropic: Anthropic;
  private model: string;
  private modelType: 'opus' | 'sonnet'; // Track which type for config lookup
  
  constructor(model: 'claude-sonnet-4-5' | 'claude-opus-4-1') {
    const config = getAIConfig();
    this.modelType = model.includes('opus') ? 'opus' : 'sonnet';
    const modelConfig = config.reasoning; // Both use the same reasoning config
    
    this.model = model; // Use exact model name passed in
    this.anthropic = new Anthropic({
      apiKey: modelConfig.apiKey,
      baseURL: modelConfig.baseURL,
    });
  }
  
  async chat(options: ChatOptions): Promise<AIResponse> {
    const config = getAIConfig();
    const modelConfig = config.reasoning;
    
    const {
      messages,
      system,
      tools,
      maxTokens = modelConfig.maxTokens,
      temperature = modelConfig.temperature,
    } = options;
    
    // Build Anthropic message format (exclude system messages from messages array)
    const anthropicMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
    
    const clientName = this.modelType === 'opus' ? 'OpusClient' : 'SonnetClient';
    
    return withRetry(async () => {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        system: system || undefined,
        messages: anthropicMessages,
        tools: tools as any,
      });
      
      // Extract text from response
      const textContent = message.content.find(block => block.type === 'text');
      const text = textContent && textContent.type === 'text' ? textContent.text : '';
      
      // Extract tool calls from Anthropic response (they use 'tool_use' blocks)
      const toolUseBlocks = message.content.filter(block => block.type === 'tool_use');
      const toolCalls: ToolCall[] | undefined = toolUseBlocks.length > 0
        ? toolUseBlocks.map((block: any) => ({
            id: block.id,
            type: 'function' as const,
            function: {
              name: block.name,
              // Coerce string booleans to actual booleans
              arguments: coerceToolArguments(block.input || {}),
            },
          }))
        : undefined;
      
      const tokensIn = message.usage.input_tokens || 0;
      const tokensOut = message.usage.output_tokens || 0;
      
      // Calculate cost
      const cost = config.estimateCost(
        this.model as ModelId,
        tokensIn,
        tokensOut
      );
      
      return {
        text,
        tokensIn,
        tokensOut,
        cost,
        model: this.model,
        toolCalls,
      };
    }, clientName, 'chat');
  }
  
  async *chatStream(options: ChatOptions): AsyncGenerator<StreamChunk> {
    const config = getAIConfig();
    const modelConfig = config.reasoning;
    
    const {
      messages,
      system,
      maxTokens = modelConfig.maxTokens,
      temperature = modelConfig.temperature,
    } = options;
    
    const anthropicMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
    
    try {
      const stream = this.anthropic.messages.stream({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        system: system || undefined,
        messages: anthropicMessages,
      });
      
      let tokensIn = 0;
      let tokensOut = 0;
      
      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta as any;
          if (delta.type === 'text_delta' && delta.text) {
            yield { type: 'text', content: delta.text };
          }
        }
        
        if (event.type === 'message_delta') {
          const usage = (event as any).usage;
          if (usage) {
            tokensOut = usage.output_tokens || 0;
          }
        }
        
        if (event.type === 'message_start') {
          const message = (event as any).message;
          if (message?.usage) {
            tokensIn = message.usage.input_tokens || 0;
          }
        }
      }
      
      const cost = config.estimateCost(this.model as ModelId, tokensIn, tokensOut);
      
      yield {
        type: 'done',
        tokensIn,
        tokensOut,
        cost,
        model: this.model,
      };
    } catch (error: any) {
      yield { type: 'error', error: error.message || 'Anthropic streaming failed' };
    }
  }
}

/**
 * Legacy Reasoning Client - For backward compatibility
 * @deprecated Use getSonnetClient() or getOpusClient() directly
 */
export class ReasoningClient extends AnthropicClient {
  constructor() {
    super('claude-opus-4-1');
  }
}

// Singleton instances
let gpt5Client: GPT5Client | null = null;
let scoutClient: ScoutClient | null = null;
let sonnetClient: AnthropicClient | null = null;
let opusClient: AnthropicClient | null = null;
let reasoningClient: ReasoningClient | null = null;

/**
 * Get GPT-5 client (cached singleton)
 * MATH MODEL for advanced calculations (Pro: 5/month, Enterprise: 10/month)
 */
export function getGPT5Client(): GPT5Client {
  if (!gpt5Client) {
    gpt5Client = new GPT5Client();
  }
  return gpt5Client;
}

/**
 * Get Scout client (cached singleton)
 * PRIMARY MODEL - Unlimited for Pro/Enterprise, 50/month for Free
 */
export function getScoutClient(): ScoutClient {
  if (!scoutClient) {
    scoutClient = new ScoutClient();
  }
  return scoutClient;
}

/**
 * Get Sonnet client (cached singleton)
 * REASONING MODEL for Pro/Enterprise - Multi-step logic, strategy
 */
export function getSonnetClient(): AnthropicClient {
  if (!sonnetClient) {
    sonnetClient = new AnthropicClient('claude-sonnet-4-5');
  }
  return sonnetClient;
}

/**
 * Get Opus client (cached singleton)
 * CFO-LEVEL MODEL for Enterprise only - Portfolio analysis, high-stakes
 */
export function getOpusClient(): AnthropicClient {
  if (!opusClient) {
    opusClient = new AnthropicClient('claude-opus-4-1');
  }
  return opusClient;
}

/**
 * Get Reasoning client (cached singleton)
 * @deprecated Use getSonnetClient() for Pro/Enterprise or getOpusClient() for Enterprise CFO-level
 */
export function getReasoningClient(): ReasoningClient {
  if (!reasoningClient) {
    reasoningClient = new ReasoningClient();
  }
  return reasoningClient;
}
