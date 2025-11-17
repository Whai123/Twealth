/**
 * AI Clients - 4-Model Architecture
 * - Scout (Llama 4 via Groq): PRIMARY - Fast queries (⚡ Fast)
 * - Sonnet 3.5/4.5 (Claude): REASONING - Multi-step logic (🧠 Smart)
 * - GPT-5 (OpenAI): MATH - Advanced calculations (🧮 Math)
 * - Opus 4.1 (Claude): CFO-LEVEL - Portfolio analysis (👔 CFO)
 * 
 * Standardized interface for all providers with cost tracking
 * Return shape: { text, tokensIn, tokensOut, cost, model }
 */

import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getAIConfig, type ModelId } from '../config/ai';

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
    
    try {
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
        ?.filter((tc: any) => tc.type === 'function' && tc.function) // Filter for function calls only
        .map((tc: any) => {
          try {
            return {
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.function.name,
                arguments: JSON.parse(tc.function.arguments), // Parse JSON string to object
              },
            };
          } catch (error) {
            console.error('[GPT5Client] Failed to parse tool call arguments:', error);
            console.error('Tool call:', tc);
            return null; // Skip malformed tool calls
          }
        })
        .filter((tc): tc is ToolCall => tc !== null); // Remove nulls from malformed parses
      
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
    } catch (error) {
      console.error('[GPT5Client] Error:', error);
      throw new Error(`GPT-5 client error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    try {
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
        ?.filter((tc: any) => tc.type === 'function' && tc.function) // Filter for function calls only
        .map((tc: any) => {
          try {
            return {
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.function.name,
                arguments: JSON.parse(tc.function.arguments), // Parse JSON string to object
              },
            };
          } catch (error) {
            console.error('[ScoutClient] Failed to parse tool call arguments:', error);
            console.error('Tool call:', tc);
            return null; // Skip malformed tool calls
          }
        })
        .filter((tc): tc is ToolCall => tc !== null); // Remove nulls from malformed parses
      
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
    } catch (error) {
      console.error('[ScoutClient] Error:', error);
      throw new Error(`Scout client error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      // Extract tool calls from Anthropic response (they use 'tool_use' blocks)
      const toolUseBlocks = message.content.filter(block => block.type === 'tool_use');
      const toolCalls: ToolCall[] | undefined = toolUseBlocks.length > 0
        ? toolUseBlocks.map((block: any) => ({
            id: block.id,
            type: 'function' as const,
            function: {
              name: block.name,
              arguments: block.input, // Anthropic provides input as object - use directly
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
    } catch (error) {
      console.error('[AnthropicClient] Error:', error);
      throw new Error(`Anthropic client error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
