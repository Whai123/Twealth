/**
 * Gemini Client - Google AI
 * FREE TIER MODEL - Gemini Flash 2.5 for fast, free queries (Free tier: 50/month)
 * 
 * Uses @google/genai package with standardized interface matching other AI clients.
 * Free tier: 2M tokens/day, perfect for most user queries.
 */

import { GoogleGenAI } from '@google/genai';
import { getAIConfig, type ModelId, MODEL_COST_TABLE } from '../config/ai';
import { aiLogger } from '../utils/logger';

// Add Gemini to cost table (it's free but we track usage)
const GEMINI_COSTS = {
    'gemini-2.5-flash': {
        input: 0,  // FREE
        output: 0, // FREE
    },
    'gemini-1.5-flash': {
        input: 0,
        output: 0,
    },
};

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
};

// Interfaces from clients.ts for compatibility
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: any;
    };
}

export interface AIResponse {
    text: string;
    tokensIn: number;
    tokensOut: number;
    cost: number;
    model: string;
    toolCalls?: ToolCall[];
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

export interface StreamChunk {
    type: 'text' | 'tool_call' | 'done' | 'error';
    content?: string;
    toolCall?: ToolCall;
    error?: string;
    tokensIn?: number;
    tokensOut?: number;
    cost?: number;
    model?: string;
}

/**
 * Sleep for exponential backoff
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getBackoffDelay(attempt: number): number {
    const delay = Math.min(
        RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelayMs
    );
    return delay + Math.random() * delay * 0.3;
}

/**
 * Coerce tool arguments to proper types
 */
function coerceToolArguments(args: Record<string, any>): Record<string, any> {
    const coerced: Record<string, any> = {};
    for (const [key, value] of Object.entries(args)) {
        if (value === "true" || value === "True" || value === "TRUE") {
            coerced[key] = true;
        } else if (value === "false" || value === "False" || value === "FALSE") {
            coerced[key] = false;
        } else if (typeof value === 'object' && value !== null) {
            coerced[key] = coerceToolArguments(value);
        } else {
            coerced[key] = value;
        }
    }
    return coerced;
}

/**
 * Gemini Client
 * FREE TIER - For all Free users (50 queries/month limit on Twealth, unlimited on Gemini)
 */
export class GeminiClient {
    private client: GoogleGenAI;
    private model = 'gemini-2.5-flash';

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
            console.error('[GeminiClient] CRITICAL: GEMINI_API_KEY not set');
            aiLogger.warn('GEMINI_API_KEY not set - Gemini client will not work');
        } else {
            console.log('[GeminiClient] API key loaded (length:', apiKey.length, ')');
        }
        this.client = new GoogleGenAI({ apiKey });
    }

    async chat(options: ChatOptions): Promise<AIResponse> {
        console.log('[GeminiClient] chat() called with messages:', options.messages?.length);
        const {
            messages,
            system,
            tools,
            maxTokens = 8192,
            temperature = 0.7,
        } = options;

        let lastError: any;

        for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
            try {
                // Build Gemini content format
                const contents = messages
                    .filter(msg => msg.role !== 'system')
                    .map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }],
                    }));

                // Build generation config
                const generationConfig: any = {
                    maxOutputTokens: maxTokens,
                    temperature,
                };

                // Build system instruction if provided
                const systemInstruction = system ? { parts: [{ text: system }] } : undefined;

                // Convert tools to Gemini format if provided
                const geminiTools = tools ? [{
                    functionDeclarations: tools.map((t: any) => ({
                        name: t.function?.name || t.name,
                        description: t.function?.description || t.description,
                        parameters: t.function?.parameters || t.parameters,
                    })),
                }] : undefined;

                const response = await this.client.models.generateContent({
                    model: this.model,
                    contents,
                    config: {
                        ...generationConfig,
                        systemInstruction,
                        tools: geminiTools,
                    },
                });

                // Extract text from response
                const text = response.text || '';

                // Extract token usage
                const tokensIn = response.usageMetadata?.promptTokenCount || 0;
                const tokensOut = response.usageMetadata?.candidatesTokenCount || 0;

                // Extract tool calls if any
                let toolCalls: ToolCall[] | undefined;
                const candidate = response.candidates?.[0];
                if (candidate?.content?.parts) {
                    const functionCalls = candidate.content.parts
                        .filter((part: any) => part.functionCall)
                        .map((part: any, index: number) => ({
                            id: `gemini_${Date.now()}_${index}`,
                            type: 'function' as const,
                            function: {
                                name: part.functionCall.name,
                                arguments: coerceToolArguments(part.functionCall.args || {}),
                            },
                        }));

                    if (functionCalls.length > 0) {
                        toolCalls = functionCalls;
                    }
                }

                // Cost is 0 for Gemini Flash (free tier)
                const cost = 0;

                aiLogger.debug('[Gemini] chat completed', {
                    data: { tokensIn, tokensOut, model: this.model }
                });

                return {
                    text,
                    tokensIn,
                    tokensOut,
                    cost,
                    model: this.model,
                    toolCalls,
                };
            } catch (error: any) {
                lastError = error;
                aiLogger.warn(`[Gemini] attempt ${attempt + 1} failed`, {
                    data: { error: error.message }
                });

                // Check if retryable
                const status = error.status || error.statusCode;
                if (status === 429 || (status >= 500 && status < 600)) {
                    if (attempt < RETRY_CONFIG.maxRetries - 1) {
                        await sleep(getBackoffDelay(attempt));
                        continue;
                    }
                }
                break;
            }
        }

        throw new Error(`Gemini error: ${lastError?.message || 'Unknown error'}`);
    }

    async *chatStream(options: ChatOptions): AsyncGenerator<StreamChunk> {
        const {
            messages,
            system,
            maxTokens = 8192,
            temperature = 0.7,
        } = options;

        let lastError: any;

        // Retry loop for rate limit errors
        for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
            try {
                const contents = messages
                    .filter(msg => msg.role !== 'system')
                    .map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }],
                    }));

                const generationConfig: any = {
                    maxOutputTokens: maxTokens,
                    temperature,
                };

                const systemInstruction = system ? { parts: [{ text: system }] } : undefined;

                const response = await this.client.models.generateContentStream({
                    model: this.model,
                    contents,
                    config: {
                        ...generationConfig,
                        systemInstruction,
                    },
                });

                let tokensIn = 0;
                let tokensOut = 0;

                for await (const chunk of response) {
                    const text = chunk.text;
                    if (text) {
                        yield { type: 'text', content: text };
                    }

                    // Update token counts from final chunk
                    if (chunk.usageMetadata) {
                        tokensIn = chunk.usageMetadata.promptTokenCount || 0;
                        tokensOut = chunk.usageMetadata.candidatesTokenCount || 0;
                    }
                }

                yield {
                    type: 'done',
                    tokensIn,
                    tokensOut,
                    cost: 0, // Free
                    model: this.model,
                };
                return; // Success - exit the retry loop
            } catch (error: any) {
                lastError = error;
                const errorMsg = error.message || '';
                const isRateLimitError = errorMsg.includes('429') ||
                    errorMsg.includes('quota') ||
                    errorMsg.includes('RESOURCE_EXHAUSTED') ||
                    error.status === 429;

                aiLogger.warn(`[Gemini] streaming attempt ${attempt + 1} failed`, {
                    data: { error: errorMsg.substring(0, 100), isRateLimit: isRateLimitError }
                });

                // Retry on rate limit or server errors
                if (isRateLimitError || (error.status >= 500 && error.status < 600)) {
                    if (attempt < RETRY_CONFIG.maxRetries - 1) {
                        const delay = getBackoffDelay(attempt);
                        console.log(`[GeminiClient] Rate limited, waiting ${Math.round(delay / 1000)}s before retry...`);
                        await sleep(delay);
                        continue;
                    }
                }
                break;
            }
        }

        // All retries failed
        aiLogger.error('[Gemini] streaming failed after all retries', lastError);
        yield { type: 'error', error: lastError?.message || 'Gemini streaming failed' };
    }
}

// Singleton instance
let geminiClient: GeminiClient | null = null;

/**
 * Get Gemini client (cached singleton)
 * FREE TIER MODEL - For all Free users
 */
export function getGeminiClient(): GeminiClient {
    if (!geminiClient) {
        geminiClient = new GeminiClient();
    }
    return geminiClient;
}
