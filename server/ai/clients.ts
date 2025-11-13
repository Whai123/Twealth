/**
 * AI Clients - GPT-5 (primary), Opus 4.1 (Enterprise precision)
 * 
 * Standardized interface for both providers with cost tracking
 * Return shape: { text, tokensIn, tokensOut, cost }
 */

import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getAIConfig, type ModelId } from '../config/ai';

// Standardized response shape
export interface AIResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  model: string;
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

/**
 * GPT-5 Client (OpenAI via Replit AI Integrations)
 * Primary model for Free/Pro/Enterprise - 13x cheaper than Opus, superior reasoning
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
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        max_tokens: maxTokens,
        temperature,
        tools: tools as any,
      });
      
      const text = completion.choices[0]?.message?.content || '';
      const tokensIn = completion.usage?.prompt_tokens || 0;
      const tokensOut = completion.usage?.completion_tokens || 0;
      
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
      };
    } catch (error) {
      console.error('[GPT5Client] Error:', error);
      throw new Error(`GPT-5 client error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Scout Client (Groq Llama 4) - LEGACY
 * @deprecated Use GPT5Client instead - GPT-5 is faster, cheaper, better reasoning
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
    
    try {
      const completion = await this.groq.chat.completions.create({
        model: this.config.model,
        messages: groqMessages,
        max_tokens: maxTokens,
        temperature,
      });
      
      const text = completion.choices[0]?.message?.content || '';
      const tokensIn = completion.usage?.prompt_tokens || 0;
      const tokensOut = completion.usage?.completion_tokens || 0;
      
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
      };
    } catch (error) {
      console.error('[ScoutClient] Error:', error);
      throw new Error(`Scout client error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Anthropic Client (Claude Sonnet 4.5 and Opus 4.1)
 * Flexible client that supports both Pro and Enterprise tier models
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
    
    try {
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
      };
    } catch (error) {
      console.error('[AnthropicClient] Error:', error);
      throw new Error(`Anthropic client error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Legacy Reasoning Client - For backward compatibility
 * @deprecated Use AnthropicClient directly or getOpusClient()
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
 * PRIMARY MODEL for Free/Pro/Enterprise tiers
 */
export function getGPT5Client(): GPT5Client {
  if (!gpt5Client) {
    gpt5Client = new GPT5Client();
  }
  return gpt5Client;
}

/**
 * Get Scout client (cached singleton)
 * @deprecated Use getGPT5Client() instead
 */
export function getScoutClient(): ScoutClient {
  if (!scoutClient) {
    scoutClient = new ScoutClient();
  }
  return scoutClient;
}

/**
 * Get Sonnet client (cached singleton)
 * For Pro tier - Claude Sonnet 4.5
 */
export function getSonnetClient(): AnthropicClient {
  if (!sonnetClient) {
    sonnetClient = new AnthropicClient('claude-sonnet-4-5');
  }
  return sonnetClient;
}

/**
 * Get Opus client (cached singleton)
 * For Enterprise tier - Claude Opus 4.1
 */
export function getOpusClient(): AnthropicClient {
  if (!opusClient) {
    opusClient = new AnthropicClient('claude-opus-4-1');
  }
  return opusClient;
}

/**
 * Get Reasoning client (cached singleton)
 * @deprecated Use getOpusClient() for Enterprise tier or getSonnetClient() for Pro tier
 */
export function getReasoningClient(): ReasoningClient {
  if (!reasoningClient) {
    reasoningClient = new ReasoningClient();
  }
  return reasoningClient;
}
