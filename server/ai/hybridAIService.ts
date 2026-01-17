/**
 * Hybrid AI Service - 2-Tier Architecture (Free/Pro)
 * 
 * This service integrates all AI components:
 * - Gemini Flash 2.0: FREE TIER - Fast queries for all users (Free: 50/mo)
 * - Claude Sonnet 4.5: PRO TIER - Advanced reasoning for Pro users
 * 
 * Legacy models (deprecated but still available):
 * - Scout (Llama 4 via Groq): Being replaced by Gemini
 * - GPT-5 (OpenAI): Optional for math-heavy queries
 * - Opus 4.1 (Claude): Enterprise only
 * 
 * Components:
 * - Tier-based router (Free → Gemini, Pro → Claude)
 * - Context builder for financial data normalization
 * - Orchestrators for deep CFO-level analysis
 */

// TESTING MODE: Set to true to bypass all quota limits and tier restrictions
// REMEMBER TO SET BACK TO FALSE AFTER TESTING
export const TESTING_MODE = false;

import type { IStorage } from '../storage';
import { buildFinancialContext, estimateContextTokens, type FinancialContext } from './contextBuilder';
import { shouldEscalate, routeToModel, getRoutingReason, type ComplexitySignals } from './router';
import { getGeminiClient, getGPT5Client, getScoutClient, getSonnetClient, getOpusClient, getReasoningClient } from './clients';
import { analyzeDebt } from './orchestrators/debt';
import { analyzeRetirement } from './orchestrators/retirement';
import { analyzeTax } from './orchestrators/tax';
import { analyzePortfolio } from './orchestrators/portfolio';
import { getTwealthTools, getTwealthIdentity } from './tools';
import { detectLanguage } from '../financialCalculations';
import { marketDataService } from '../marketDataService';
import { processConversationForLearning } from './aiMemoryService';


// Per-country cached market context to avoid repeated API calls
const cachedMarketContextByCountry = new Map<string, { data: string; timestamp: number }>();
const MARKET_CONTEXT_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Get cached market context for AI prompts (country-specific caching)
 */
async function getMarketContextForPrompt(userCountry: string = 'US'): Promise<string> {
  const cacheKey = userCountry.toUpperCase();
  const cached = cachedMarketContextByCountry.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < MARKET_CONTEXT_CACHE_DURATION) {
    return cached.data;
  }

  try {
    const context = await marketDataService.getMarketContextForAI(userCountry);
    cachedMarketContextByCountry.set(cacheKey, { data: context, timestamp: Date.now() });
    return context;
  } catch (error) {
    console.error('[HybridAI] Error fetching market context:', error);
    return ''; // Return empty string on error - prompts will work without it
  }
}

/**
 * Model access levels (matches tier system)
 * Gemini is FREE tier, Sonnet is PRO tier
 */
export type ModelAccess = 'gemini' | 'scout' | 'sonnet' | 'gpt5' | 'opus';

/**
 * Conversation message for memory
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Options for generating AI advice
 */
export interface GenerateAdviceOptions {
  forceModel?: ModelAccess; // Override auto-escalation with tier-selected model
  preselectedContext?: FinancialContext; // Pre-built context to avoid double assembly
  skipAutoEscalation?: boolean; // Disable internal escalation logic
  conversationHistory?: ConversationMessage[]; // Previous messages for context
  skipTools?: boolean; // Skip tool calling - use for plain text/JSON responses (e.g., playbooks)
}

/**
 * Structured response from hybrid AI service
 */
export interface HybridAIResponse {
  answer: string; // Natural language response
  modelUsed: 'gemini' | 'scout' | 'sonnet' | 'gpt5' | 'opus' | 'reasoning'; // Which model was used (maps to quota counter)
  modelSlug: string; // Exact model identifier (e.g., 'gemini-2.0-flash', 'claude-sonnet-4-5')
  tokensIn: number; // Input tokens
  tokensOut: number; // Output tokens
  cost: number; // Cost in USD
  escalated: boolean; // Whether query was escalated from Scout
  escalationReason?: string; // Why it was escalated (if applicable)
  orchestratorUsed?: string; // Which orchestrator was called (if any)
  structuredData?: any; // Structured data from orchestrator (if any)
  tierDowngraded?: boolean; // Whether tier logic downgraded the model
  actualModel?: 'gemini' | 'scout' | 'sonnet' | 'gpt5' | 'opus'; // Actual model used (fallback for determineModelFromSlug)
  toolCalls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: any } }>; // Tool calls for action execution
}

/**
 * Main entry point for hybrid AI system
 * 
 * @param userId - User ID for context building
 * @param userMessage - User's question/request
 * @param storage - Storage interface for data access
 * @param options - Optional configuration for forced model selection
 * @returns Structured AI response with metadata
 */
export async function generateHybridAdvice(
  userId: string,
  userMessage: string,
  storage: IStorage,
  options: GenerateAdviceOptions = {}
): Promise<HybridAIResponse> {
  const { forceModel, preselectedContext, skipAutoEscalation, conversationHistory = [], skipTools = false } = options;

  // Step 1: Build or use pre-selected financial context
  const context = preselectedContext || await buildFinancialContext(userId, storage);

  // AUTO-DETECT LANGUAGE from user message (critical for Thai/Spanish/etc responses)
  const detectedLanguage = detectLanguage(userMessage);
  (context as any).detectedLanguage = detectedLanguage;
  (context as any).userMessage = userMessage; // Store for prompt building

  // Add conversation history and skipTools flag to context for handlers
  (context as any).conversationHistory = conversationHistory;
  (context as any).skipTools = skipTools;

  // Step 2: Determine which model to use
  let targetModel: ModelAccess;
  let routingReason: string | undefined;

  if (forceModel) {
    // Tier-aware router has pre-selected the model
    targetModel = forceModel;
    routingReason = `Tier-enforced model: ${forceModel}`;
  } else if (skipAutoEscalation) {
    // Skip escalation logic, use Scout
    targetModel = 'scout';
  } else {
    // Auto-escalation based on complexity
    const contextTokens = estimateContextTokens(context);
    const signals: ComplexitySignals = {
      message: userMessage,
      debtsCount: context.debts.length,
      assetsCount: context.assets.length,
      messageLength: userMessage.length,
      contextTokens,
    };

    const escalate = shouldEscalate(signals);
    routingReason = escalate ? getRoutingReason(signals) : undefined;

    // Default to Scout for simple, Opus for complex (tierAwareRouter will override this)
    targetModel = escalate ? 'opus' : 'scout';
  }

  // Step 3: Route to appropriate model/orchestrator
  if (targetModel === 'gemini') {
    return await handleGeminiQuery(userMessage, context);
  } else if (targetModel === 'scout') {
    return await handleScoutQuery(userMessage, context);
  } else if (targetModel === 'sonnet') {
    return await handleReasoningQuery(userMessage, context, routingReason, 'sonnet');
  } else if (targetModel === 'gpt5') {
    return await handleGPT5Query(userMessage, context);
  } else if (targetModel === 'opus') {
    // Opus uses reasoning path with orchestrators
    return await handleReasoningQuery(userMessage, context, routingReason, 'opus');
  } else {
    // Fallback to Gemini (free tier default)
    return await handleGeminiQuery(userMessage, context);
  }
}

/**
 * Handle queries with Gemini Flash 2.0 (Google AI)
 * FREE TIER MODEL - Fast queries for all Free users (50/month limit on Twealth)
 */
async function handleGeminiQuery(
  userMessage: string,
  context: any
): Promise<HybridAIResponse> {
  const client = getGeminiClient();

  // Fetch market context for smarter financial advice
  const marketContext = await getMarketContextForPrompt(context.countryContext?.countryCode || 'US');

  // Use Scout system prompt (Gemini is similar in capability)
  const systemPrompt = buildScoutSystemPrompt(context, marketContext);

  // Build messages array with conversation history (last 6 messages for context)
  const conversationHistory = (context.conversationHistory || []).slice(-6);
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  // Only pass tools if not in skipTools mode
  const skipTools = context.skipTools === true;

  const response = await client.chat({
    messages,
    temperature: 0.7,
    maxTokens: 1000,
    tools: skipTools ? undefined : getTwealthTools(),
  });

  return {
    answer: response.text,
    modelUsed: 'gemini',
    modelSlug: response.model,
    tokensIn: response.tokensIn,
    tokensOut: response.tokensOut,
    cost: response.cost, // Always 0 for Gemini
    escalated: false,
    actualModel: 'gemini',
    toolCalls: response.toolCalls,
  };
}

/**
 * Handle queries with GPT-5 (OpenAI via Replit AI Integrations)
 * MATH MODEL - Advanced calculations, projections, simulations
 */
async function handleGPT5Query(
  userMessage: string,
  context: any
): Promise<HybridAIResponse> {
  const client = getGPT5Client();

  // Fetch market context for smarter financial advice
  const marketContext = await getMarketContextForPrompt(context.countryContext?.countryCode || 'US');

  // Build optimized prompt with financial context
  const systemPrompt = buildGPT5SystemPrompt(context, marketContext);

  // Build messages array with conversation history (last 6 messages for context)
  const conversationHistory = (context.conversationHistory || []).slice(-6);
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.chat({
    messages,
    tools: getTwealthTools(), // Pass tools for action-taking
  });

  return {
    answer: response.text,
    modelUsed: 'gpt5', // CRITICAL: Use gpt5 to increment correct quota counter
    modelSlug: response.model,
    tokensIn: response.tokensIn,
    tokensOut: response.tokensOut,
    cost: response.cost,
    escalated: true, // GPT-5 is an escalation from Scout
    actualModel: 'gpt5', // Track actual model used
    toolCalls: response.toolCalls, // Return tool calls for execution
  };
}

/**
 * Handle simple/fast queries with Scout (Llama 4 via Groq)
 * PRIMARY MODEL - Fast queries, budgeting, spending, goals
 */
async function handleScoutQuery(
  userMessage: string,
  context: any
): Promise<HybridAIResponse> {
  const client = getScoutClient();

  // Fetch market context for smarter financial advice
  const marketContext = await getMarketContextForPrompt(context.countryContext?.countryCode || 'US');

  // Build simple prompt with context
  const systemPrompt = buildScoutSystemPrompt(context, marketContext);

  // Build messages array with conversation history (last 6 messages for context)
  const conversationHistory = (context.conversationHistory || []).slice(-6);
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  // Only pass tools if not in skipTools mode (for plain text/JSON responses)
  const skipTools = context.skipTools === true;

  const response = await client.chat({
    messages,
    temperature: 0.7,
    maxTokens: 1000,
    tools: skipTools ? undefined : getTwealthTools(), // Skip tools for playbook generation
  });

  return {
    answer: response.text,
    modelUsed: 'scout',
    modelSlug: response.model,
    tokensIn: response.tokensIn,
    tokensOut: response.tokensOut,
    cost: response.cost,
    escalated: false,
    actualModel: 'scout', // Track actual model used
    toolCalls: response.toolCalls, // Return tool calls for execution
  };
}

/**
 * Handle complex queries with Reasoning (Claude Sonnet or Opus) + orchestrators
 * Sonnet: REASONING - Multi-step logic, strategy
 * Opus: CFO-LEVEL - Portfolio analysis, high-stakes
 */
async function handleReasoningQuery(
  userMessage: string,
  context: any,
  routingReason?: string,
  targetModel: ModelAccess = 'sonnet'
): Promise<HybridAIResponse> {
  // Detect which orchestrator to use based on keywords
  const orchestrator = detectOrchestrator(userMessage, context);

  if (orchestrator) {
    // Call specialized orchestrator
    return await callOrchestrator(orchestrator, userMessage, context, routingReason, targetModel);
  } else {
    // Generic reasoning query (no specific orchestrator)
    return await handleGenericReasoningQuery(userMessage, context, routingReason, targetModel);
  }
}

/**
 * Detect which orchestrator should handle the query
 */
function detectOrchestrator(userMessage: string, context: any): string | null {
  const msgLower = userMessage.toLowerCase();

  // Debt-related keywords
  if (context.debts.length > 0 &&
    (msgLower.includes('debt') ||
      msgLower.includes('pay off') ||
      msgLower.includes('snowball') ||
      msgLower.includes('avalanche'))) {
    return 'debt';
  }

  // Retirement-related keywords
  if (msgLower.includes('retire') ||
    msgLower.includes('retirement') ||
    msgLower.includes('glidepath') ||
    msgLower.includes('401k') ||
    msgLower.includes('ira')) {
    return 'retirement';
  }

  // Tax-related keywords
  if (msgLower.includes('tax') ||
    msgLower.includes('roth') ||
    msgLower.includes('traditional') ||
    msgLower.includes('bracket')) {
    return 'tax';
  }

  // Portfolio-related keywords
  if (context.assets.length > 0 &&
    (msgLower.includes('portfolio') ||
      msgLower.includes('asset allocation') ||
      msgLower.includes('rebalance') ||
      msgLower.includes('diversif'))) {
    return 'portfolio';
  }

  return null;
}

/**
 * Call the appropriate orchestrator
 */
async function callOrchestrator(
  orchestrator: string,
  userMessage: string,
  context: any,
  routingReason?: string,
  targetModel: ModelAccess = 'opus'
): Promise<HybridAIResponse> {
  let structuredData: any;
  let tokensIn = 0;
  let tokensOut = 0;
  let cost = 0;

  // Determine model slug for the target model
  const modelSlug = targetModel === 'sonnet' ? 'claude-sonnet-4-5' : 'claude-opus-4-1';

  try {
    switch (orchestrator) {
      case 'debt':
        structuredData = await analyzeDebt(context, userMessage);
        // Estimate tokens (rough approximation)
        tokensIn = Math.ceil((userMessage.length + JSON.stringify(context).length) / 4);
        tokensOut = Math.ceil(structuredData.summary.length / 4);
        // Use pricing for the actual model
        const inputCost = targetModel === 'sonnet' ? 0.003 : 0.015; // $3 vs $15 per 1M
        const outputCost = targetModel === 'sonnet' ? 0.015 : 0.075; // $15 vs $75 per 1M
        cost = (tokensIn / 1000) * inputCost + (tokensOut / 1000) * outputCost;
        break;

      case 'retirement':
        structuredData = await analyzeRetirement(context, userMessage);
        tokensIn = Math.ceil((userMessage.length + JSON.stringify(context).length) / 4);
        tokensOut = Math.ceil(structuredData.summary.length / 4);
        cost = (tokensIn / 1000) * (targetModel === 'sonnet' ? 0.003 : 0.015) +
          (tokensOut / 1000) * (targetModel === 'sonnet' ? 0.015 : 0.075);
        break;

      case 'tax':
        structuredData = await analyzeTax(context, userMessage);
        tokensIn = Math.ceil((userMessage.length + JSON.stringify(context).length) / 4);
        tokensOut = Math.ceil(structuredData.summary.length / 4);
        cost = (tokensIn / 1000) * (targetModel === 'sonnet' ? 0.003 : 0.015) +
          (tokensOut / 1000) * (targetModel === 'sonnet' ? 0.015 : 0.075);
        break;

      case 'portfolio':
        structuredData = await analyzePortfolio(context, userMessage);
        tokensIn = Math.ceil((userMessage.length + JSON.stringify(context).length) / 4);
        tokensOut = Math.ceil(structuredData.summary.length / 4);
        cost = (tokensIn / 1000) * (targetModel === 'sonnet' ? 0.003 : 0.015) +
          (tokensOut / 1000) * (targetModel === 'sonnet' ? 0.015 : 0.075);
        break;

      default:
        throw new Error(`Unknown orchestrator: ${orchestrator}`);
    }

    return {
      answer: structuredData.summary,
      modelUsed: 'reasoning',
      modelSlug,
      tokensIn,
      tokensOut,
      cost,
      escalated: true,
      escalationReason: routingReason,
      orchestratorUsed: orchestrator,
      structuredData,
      actualModel: targetModel === 'sonnet' ? 'sonnet' : 'opus', // Track actual model for analytics
    };
  } catch (error) {
    // If orchestrator fails, fall back to generic reasoning query
    console.error(`Orchestrator ${orchestrator} failed:`, error);
    return await handleGenericReasoningQuery(userMessage, context, routingReason, targetModel);
  }
}

/**
 * Handle generic reasoning query (no specific orchestrator)
 */
async function handleGenericReasoningQuery(
  userMessage: string,
  context: any,
  routingReason?: string,
  targetModel: ModelAccess = 'opus'
): Promise<HybridAIResponse> {
  // Select the appropriate client based on target model
  const client = targetModel === 'sonnet' ? getSonnetClient() : getOpusClient();

  // Fetch market context for smarter financial advice
  const marketContext = await getMarketContextForPrompt(context.countryContext?.countryCode || 'US');

  // Build comprehensive prompt with context
  const systemPrompt = buildReasoningSystemPrompt(context, marketContext);

  // Build messages array with conversation history (last 6 messages for context)
  const conversationHistory = (context.conversationHistory || []).slice(-6);
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.chat({
    messages,
    temperature: 0.5,
    maxTokens: 2000,
    tools: getTwealthTools(), // Pass tools for action-taking
  });

  return {
    answer: response.text,
    modelUsed: 'reasoning',
    modelSlug: response.model,
    tokensIn: response.tokensIn,
    tokensOut: response.tokensOut,
    cost: response.cost,
    escalated: true,
    escalationReason: routingReason,
    actualModel: targetModel === 'sonnet' ? 'sonnet' : 'opus', // Track actual model for analytics
    toolCalls: response.toolCalls, // Return tool calls for execution
  };
}

/**
 * Build country context section for prompts
 */
function buildCountryContextSection(context: any): string {
  const cc = context.countryContext;
  if (!cc) return '';

  return `
**Country-Specific Financial Context (${cc.countryName}):**
- Currency: ${cc.currency} (${cc.currencySymbol})
- VAT/Sales Tax: ${(cc.vatRate * 100).toFixed(1)}%
- Capital Gains Tax: ${(cc.capitalGainsTaxRate * 100).toFixed(1)}%
- Cost of Living Index: ${cc.costOfLivingIndex} (NYC = 100)
- Purchasing Power Index: ${cc.purchasingPowerIndex}
- Average Monthly Income: ${cc.currencySymbol}${cc.averageMonthlyIncome.toLocaleString()}
- Median Home (City): ${cc.currencySymbol}${cc.luxuryPricing.medianHomeCity.toLocaleString()}

**Luxury Goods Pricing (${cc.currency}):**
- Lamborghini Urus: ${cc.currencySymbol}${cc.luxuryPricing.lamborghiniUrus.toLocaleString()}
- Porsche 911: ${cc.currencySymbol}${cc.luxuryPricing.porsche911.toLocaleString()}
- Rolex Submariner: ${cc.currencySymbol}${cc.luxuryPricing.rolexSubmariner.toLocaleString()}

**Local Regulations:**
${cc.financialRegulations.slice(0, 3).map((r: string) => `- ${r}`).join('\n')}

IMPORTANT: Use ${cc.currencySymbol} (${cc.currency}) for all monetary values. Apply local tax rates and cost of living when giving advice.
`;
}

/**
 * Build language instruction for prompts (put at TOP of system prompt)
 * This ensures AI responds in the same language the user writes in
 */
function buildLanguageInstruction(context: any): string {
  const detectedLang = context.detectedLanguage || 'en';

  // Map language codes to full language names, native greetings, and financial vocabulary
  const langMap: Record<string, {
    name: string;
    nativeName: string;
    greeting: string;
    currency: string;
    financialTerms: string;
  }> = {
    'th': {
      name: 'Thai',
      nativeName: 'ภาษาไทย',
      greeting: 'สวัสดีครับ/ค่ะ',
      currency: '฿',
      financialTerms: `
**ศัพท์การเงินไทย (ใช้คำเหล่านี้):**
- รายได้ = income, เงินเดือน = salary
- รายจ่าย = expenses, ค่าใช้จ่าย = costs  
- เงินออม = savings, บัญชีออมทรัพย์ = savings account
- หนี้สิน = debt/liabilities, สินเชื่อ = loan/credit
- สินทรัพย์ = assets, ทรัพย์สิน = property
- งบประมาณ = budget, เป้าหมาย = goal
- ดอกเบี้ย = interest, APR = อัตราดอกเบี้ยต่อปี
- กองทุนฉุกเฉิน = emergency fund
- การลงทุน = investment, หุ้น = stocks
- กองทุนรวม = mutual funds, ETF = กองทุนดัชนี
- เกษียณ = retirement, บำนาญ = pension
- ภาษี = tax, ประกัน = insurance
- รายได้สุทธิ = net income, รายได้รวม = gross income
- อัตราส่วนหนี้ต่อรายได้ = debt-to-income ratio
- มูลค่าสุทธิ = net worth
`
    },
    'es': {
      name: 'Spanish',
      nativeName: 'Español',
      greeting: 'Hola',
      currency: '$',
      financialTerms: `Use Spanish financial terms: ingresos, gastos, ahorros, deudas, presupuesto, metas, inversiones, jubilación.`
    },
    'pt': {
      name: 'Portuguese',
      nativeName: 'Português',
      greeting: 'Olá',
      currency: 'R$',
      financialTerms: `Use Portuguese financial terms: renda, despesas, poupança, dívidas, orçamento, metas, investimentos, aposentadoria.`
    },
    'id': {
      name: 'Indonesian',
      nativeName: 'Bahasa Indonesia',
      greeting: 'Halo',
      currency: 'Rp',
      financialTerms: `Use Indonesian financial terms: pendapatan, pengeluaran, tabungan, hutang, anggaran, tujuan, investasi, pensiun.`
    },
    'vi': {
      name: 'Vietnamese',
      nativeName: 'Tiếng Việt',
      greeting: 'Xin chào',
      currency: '₫',
      financialTerms: `Use Vietnamese financial terms: thu nhập, chi tiêu, tiết kiệm, nợ, ngân sách, mục tiêu, đầu tư, nghỉ hưu.`
    },
    'zh': {
      name: 'Chinese',
      nativeName: '中文',
      greeting: '你好',
      currency: '¥',
      financialTerms: `Use Chinese financial terms: 收入, 支出, 储蓄, 债务, 预算, 目标, 投资, 退休, 资产净值.`
    },
    'ja': {
      name: 'Japanese',
      nativeName: '日本語',
      greeting: 'こんにちは',
      currency: '¥',
      financialTerms: `Use Japanese financial terms: 収入, 支出, 貯蓄, 負債, 予算, 目標, 投資, 退職, 純資産.`
    },
    'ko': {
      name: 'Korean',
      nativeName: '한국어',
      greeting: '안녕하세요',
      currency: '₩',
      financialTerms: `Use Korean financial terms: 수입, 지출, 저축, 부채, 예산, 목표, 투자, 은퇴, 순자산.`
    },
    'hi': {
      name: 'Hindi',
      nativeName: 'हिन्दी',
      greeting: 'नमस्ते',
      currency: '₹',
      financialTerms: `Use Hindi financial terms: आय, व्यय, बचत, कर्ज, बजट, लक्ष्य, निवेश, सेवानिवृत्ति.`
    },
    'ar': {
      name: 'Arabic',
      nativeName: 'العربية',
      greeting: 'مرحبا',
      currency: '$',
      financialTerms: `Use Arabic financial terms: دخل, مصروفات, مدخرات, ديون, ميزانية, أهداف, استثمار, تقاعد.`
    },
    'tr': {
      name: 'Turkish',
      nativeName: 'Türkçe',
      greeting: 'Merhaba',
      currency: '₺',
      financialTerms: `Use Turkish financial terms: gelir, gider, tasarruf, borç, bütçe, hedef, yatırım, emeklilik.`
    },
    'en': {
      name: 'English',
      nativeName: 'English',
      greeting: 'Hello',
      currency: '$',
      financialTerms: ''
    },
  };

  const lang = langMap[detectedLang] || langMap['en'];

  // If English detected, return minimal instruction
  if (detectedLang === 'en') {
    return `**RESPONSE LANGUAGE: English**
Respond fully in English.`;
  }

  // For non-English languages, be VERY explicit with financial vocabulary
  return `🔴 **MANDATORY RESPONSE LANGUAGE: ${lang.name} (${lang.nativeName})** 🔴

THE USER WROTE IN ${lang.name.toUpperCase()}. YOU MUST RESPOND 100% IN ${lang.name.toUpperCase()}.

RULES:
1. Your ENTIRE response must be in ${lang.name} - every single word
2. Do NOT use English for any part of your response
3. Use ${lang.currency} for currency unless user specifies otherwise
4. Technical terms should use ${lang.name} equivalents when available
5. This is NON-NEGOTIABLE - responding in English is WRONG
6. Numbers should use local formatting (e.g., ฿15,000 not 15000 baht)

${lang.financialTerms}

Example greeting in ${lang.name}: "${lang.greeting}"

NOW RESPOND IN ${lang.name.toUpperCase()} ONLY.`;
}

/**
 * Build system prompt for GPT-5 (optimized for financial reasoning)
 */
function buildGPT5SystemPrompt(context: any, marketContext?: string): string {
  const monthlyIncome = context.income.sources.reduce((sum: number, s: any) => sum + s.amount, 0);
  const monthlyExpenses = context.expenses.monthly;
  const totalDebts = context.debts.reduce((sum: number, d: any) => sum + d.balance, 0);
  const totalAssets = context.assets.reduce((sum: number, a: any) => sum + a.value, 0);
  const netWorth = totalAssets - totalDebts;
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  const countryContext = buildCountryContextSection(context);
  const currencySymbol = context.countryContext?.currencySymbol || '$';

  // Build language instruction at TOP of prompt (critical for Thai/other languages)
  const langInstruction = buildLanguageInstruction(context);

  let prompt = `${langInstruction}

${getTwealthIdentity()}
${countryContext}
**CRITICAL: YOU HAVE FULL ACCESS TO THIS USER'S FINANCIAL DATA IN TWEALTH**
You are their personal CFO with complete visibility into their finances. Reference their actual data below.

**User Financial Profile:**
- Monthly Income: ${currencySymbol}${monthlyIncome.toLocaleString()}
- Monthly Expenses: ${currencySymbol}${monthlyExpenses.toLocaleString()}
- Monthly Surplus: ${currencySymbol}${monthlySurplus.toLocaleString()}
- Total Debts: ${currencySymbol}${totalDebts.toLocaleString()}
- Total Assets: ${currencySymbol}${totalAssets.toLocaleString()}
- Net Worth: ${currencySymbol}${netWorth.toLocaleString()}

`;

  // Include user's financial goals with progress
  if (context.goals && context.goals.length > 0) {
    prompt += `**User's Financial Goals (${context.goals.length} active):**\n`;
    context.goals.forEach((g: any, i: number) => {
      const progress = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
      const monthlyNeeded = g.horizonMonths > 0 ? (g.target - g.current) / g.horizonMonths : 0;
      prompt += `${i + 1}. **${g.name}**: ${currencySymbol}${g.current.toLocaleString()} / ${currencySymbol}${g.target.toLocaleString()} (${progress}% saved, needs ${currencySymbol}${monthlyNeeded.toLocaleString()}/mo)\n`;
    });
    prompt += `\n`;
  }

  // Include debts for calculations
  if (context.debts && context.debts.length > 0) {
    prompt += `**User's Debts:**\n`;
    context.debts.forEach((d: any, i: number) => {
      prompt += `${i + 1}. ${d.name}: ${currencySymbol}${d.balance.toLocaleString()} @ ${d.apr}% APR\n`;
    });
    prompt += `\n`;
  }

  // Include assets
  if (context.assets && context.assets.length > 0) {
    prompt += `**User's Assets:**\n`;
    context.assets.forEach((a: any, i: number) => {
      prompt += `${i + 1}. ${a.name} (${a.type}): ${currencySymbol}${a.value.toLocaleString()}\n`;
    });
    prompt += `\n`;
  }

  // Include live market data context (only if available)
  if (marketContext && marketContext.trim().length > 0) {
    prompt += `\n**LIVE MARKET DATA (Use for context-aware advice):**\n${marketContext}\n`;
  }

  prompt += `**Your Role as GPT-5 (MATH Model):**
You're the quantitative specialist. You HAVE ACCESS to all user data above - reference it directly.

**ACTION-FIRST MINDSET - EXECUTE IMMEDIATELY:**
When user gives a command with enough info, JUST DO IT:
- "Set a goal to buy a house for 5 million baht" → IMMEDIATELY call create_financial_goal
- "I spent 200 on food" → IMMEDIATELY call add_transaction  
- The user's command IS their confirmation - execute immediately, don't ask for confirmation
- Calculate dates automatically: "next year" = 1 year from today
- **LANGUAGE MATCHING (CRITICAL)**: RESPOND in the EXACT SAME LANGUAGE the user writes in. If Thai → reply 100% in Thai. If Spanish → reply 100% in Spanish. If Chinese → reply 100% in Chinese. NEVER default to English unless the user writes in English.

Your strengths:
- Superior mathematical reasoning (94.6% on AIME 2025)
- Complex multi-variable financial analysis & projections
- Compound interest calculations & retirement planning
- Investment modeling & future value simulations
- Country-specific tax calculations and cost comparisons

CRITICAL: When user asks about their goals or finances, USE THE DATA ABOVE.
Never say "I don't have access" - you DO have their complete financial picture.

**PREMIUM RESPONSE FORMAT:**
1. Provide your detailed calculations and analysis
2. Reference specific numbers from their data
3. For financial calculations, use "---CALCULATION---" blocks with structured data
4. For goal/budget progress, use "---PROGRESS---" blocks
5. If you spot a financial insight (opportunity, warning, or milestone), add "---INSIGHT---" section
6. At the END of EVERY response, include "---SUGGESTIONS---" with exactly 3 follow-up questions

Example format:
[Your analysis here]

---CALCULATION---
title: Monthly Savings Projection
items:
- Monthly Income: $5,000
- Monthly Expenses: $3,500
- *Current Savings Rate: 30%*
result: Annual Savings = $18,000

---PROGRESS---
title: Emergency Fund Goal
current: 4500
target: 10000
unit: $

---INSIGHT---
type: opportunity
title: Investment Potential
message: With your $X surplus, you could earn $Y more annually

---SUGGESTIONS---
1. What if I increased my monthly contribution?
2. How does this compare to alternative strategies?
3. What's my break-even point?

Use available tools to provide detailed calculations. Keep responses focused on measurable outcomes with specific numbers and actionable steps. Always use the user's local currency and apply their country's tax rates when relevant.`;

  return prompt;
}

/**
 * Build system prompt for Scout (simple queries)
 */
function buildScoutSystemPrompt(context: any, marketContext?: string): string {
  const monthlyIncome = context.income.sources.reduce((sum: number, s: any) => sum + s.amount, 0);
  const monthlyExpenses = context.expenses.monthly;
  const totalDebts = context.debts.reduce((sum: number, d: any) => sum + d.balance, 0);
  const totalAssets = context.assets.reduce((sum: number, a: any) => sum + a.value, 0);
  const netWorth = totalAssets - totalDebts;
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  const countryContext = buildCountryContextSection(context);
  const currencySymbol = context.countryContext?.currencySymbol || '$';
  const countryName = context.countryContext?.countryName || 'United States';

  // Build language instruction at TOP of prompt (critical for Thai/other languages)
  const langInstruction = buildLanguageInstruction(context);

  let prompt = `${langInstruction}

${getTwealthIdentity()}
${countryContext}
**CRITICAL: YOU HAVE FULL ACCESS TO THIS USER'S FINANCIAL DATA IN TWEALTH**
You are NOT a generic chatbot. You ARE their personal CFO with complete visibility into their finances.
When they ask about their goals, spending, debts, or assets - YOU ALREADY KNOW THIS DATA.
Reference it directly. Never say "I don't have access" - you DO have access below.

**User Financial Overview:**
- Monthly Income: ${currencySymbol}${monthlyIncome.toLocaleString()}
- Monthly Expenses: ${currencySymbol}${monthlyExpenses.toLocaleString()}
- Monthly Surplus: ${currencySymbol}${monthlySurplus.toLocaleString()}
- Total Debts: ${currencySymbol}${totalDebts.toLocaleString()}
- Total Assets: ${currencySymbol}${totalAssets.toLocaleString()}
- Net Worth: ${currencySymbol}${netWorth.toLocaleString()}

`;

  // Include user's financial goals with progress
  if (context.goals && context.goals.length > 0) {
    prompt += `**User's Financial Goals (${context.goals.length} active):**\n`;
    context.goals.forEach((g: any, i: number) => {
      const progress = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
      const yearsRemaining = Math.floor(g.horizonMonths / 12);
      const monthsRemaining = g.horizonMonths % 12;
      const timeStr = yearsRemaining > 0
        ? `${yearsRemaining}y ${monthsRemaining}m`
        : `${monthsRemaining}m`;
      prompt += `${i + 1}. **${g.name}**: ${currencySymbol}${g.current.toLocaleString()} / ${currencySymbol}${g.target.toLocaleString()} (${progress}% saved, ${timeStr} remaining)\n`;
    });
    prompt += `\n`;
  } else {
    prompt += `**User's Financial Goals:** No goals set yet. Offer to help create one!\n\n`;
  }

  // Include Twealth Index 4-pillar scores if available (enhanced for score improvement advice)
  const ti = context.analytics?.twealthIndex;
  if (ti) {
    // Find the weakest pillar for priority focus
    const pillars = [
      { name: 'Cashflow', score: ti.cashflowScore, drivers: ti.drivers?.cashflow?.drivers || [], action: ti.drivers?.cashflow?.action || '' },
      { name: 'Stability', score: ti.stabilityScore, drivers: ti.drivers?.stability?.drivers || [], action: ti.drivers?.stability?.action || '' },
      { name: 'Growth', score: ti.growthScore, drivers: ti.drivers?.growth?.drivers || [], action: ti.drivers?.growth?.action || '' },
      { name: 'Behavior', score: ti.behaviorScore, drivers: ti.drivers?.behavior?.drivers || [], action: ti.drivers?.behavior?.action || '' },
    ];
    const sortedPillars = [...pillars].sort((a, b) => a.score - b.score);
    const weakestPillar = sortedPillars[0];
    const secondWeakest = sortedPillars[1];

    prompt += `
═══════════════════════════════════════════════════════════════════════════
🎯 **TWEALTH INDEX™ SCORE BREAKDOWN** (CRITICAL FOR ADVICE)
═══════════════════════════════════════════════════════════════════════════

**OVERALL SCORE: ${ti.overallScore}/100 (${ti.band})**
Confidence: ${ti.confidence || 'N/A'} based on data completeness

**📊 PILLAR-BY-PILLAR ANALYSIS (sorted by priority):**

1. **🔴 WEAKEST - ${weakestPillar.name} Pillar: ${weakestPillar.score}/100**
   Issues: ${weakestPillar.drivers.join('; ') || 'None detected'}
   Action: ${weakestPillar.action}

2. **⚠️ ${secondWeakest.name} Pillar: ${secondWeakest.score}/100**
   Issues: ${secondWeakest.drivers.join('; ') || 'None detected'}
   Action: ${secondWeakest.action}

3. **Cashflow Pillar: ${ti.cashflowScore}/100** - ${ti.drivers?.cashflow?.drivers?.[0] || 'Healthy'}
4. **Stability Pillar: ${ti.stabilityScore}/100** - ${ti.drivers?.stability?.drivers?.[0] || 'Healthy'}
5. **Growth Pillar: ${ti.growthScore}/100** - ${ti.drivers?.growth?.drivers?.[0] || 'Healthy'}
6. **Behavior Pillar: ${ti.behaviorScore}/100** - ${ti.drivers?.behavior?.drivers?.[0] || 'Healthy'}

**📋 PRIORITY ACTION FROM SCORING ENGINE:**
${ti.drivers?.overall?.action || 'Continue tracking finances'}

═══════════════════════════════════════════════════════════════════════════
**🚨 HOW TO ANSWER "IMPROVE MY SCORE" QUESTIONS:**
═══════════════════════════════════════════════════════════════════════════

When user asks about improving their score, you MUST follow this structure:

1. **STATE THEIR CURRENT SCORE**: "Your Twealth Index is ${ti.overallScore}/100 (${ti.band})"

2. **IDENTIFY WEAKEST PILLAR**: "Your biggest opportunity is the ${weakestPillar.name} pillar at ${weakestPillar.score}/100"

3. **CITE SPECIFIC ISSUES**: Reference the exact driver text above (e.g., "${weakestPillar.drivers[0] || 'N/A'}")

4. **GIVE SCORING ENGINE ACTION**: "${weakestPillar.action}"

5. **PROVIDE NUMERIC TARGET**: Based on their income of ${currencySymbol}${monthlyIncome.toLocaleString()}/mo, calculate specific savings/investment amounts

**NEVER give generic advice like "use 50/30/20 rule" without connecting it to their specific pillar deficiency.**
**ALWAYS reference their actual scores and driver messages from above.**

Example good response for "${weakestPillar.name}" issues:
"Your ${weakestPillar.name} pillar is ${weakestPillar.score}/100 because: ${weakestPillar.drivers[0] || 'data is limited'}. 
To improve this, ${weakestPillar.action}. Based on your ${currencySymbol}${monthlyIncome.toLocaleString()}/mo income, 
aim to [specific numeric action]."

`;
  }


  // Include user's debts
  if (context.debts && context.debts.length > 0) {
    prompt += `**User's Debts (${context.debts.length} accounts):**\n`;
    context.debts.forEach((d: any, i: number) => {
      prompt += `${i + 1}. ${d.name}: ${currencySymbol}${d.balance.toLocaleString()} @ ${d.apr}% APR (${currencySymbol}${d.monthlyPayment.toLocaleString()}/mo)\n`;
    });
    prompt += `\n`;
  }

  // Include user's assets
  if (context.assets && context.assets.length > 0) {
    prompt += `**User's Assets (${context.assets.length} items):**\n`;
    context.assets.forEach((a: any, i: number) => {
      prompt += `${i + 1}. ${a.name} (${a.type}): ${currencySymbol}${a.value.toLocaleString()}\n`;
    });
    prompt += `\n`;
  }

  // Include recent transactions for spending context
  if (context.recentTransactionsSample && context.recentTransactionsSample.length > 0) {
    prompt += `**Recent Transactions (last ${context.recentTransactionsSample.length}):**\n`;
    context.recentTransactionsSample.slice(0, 5).forEach((t: any) => {
      const sign = t.type === 'income' ? '+' : '-';
      const date = new Date(t.date).toLocaleDateString();
      prompt += `- ${date}: ${sign}${currencySymbol}${Math.abs(t.amount).toLocaleString()} - ${t.desc || t.category || 'No description'}\n`;
    });
    prompt += `\n`;
  }

  // Include expense breakdown
  if (context.expenses.byCategory && Object.keys(context.expenses.byCategory).length > 0) {
    prompt += `**Monthly Spending by Category:**\n`;
    const sortedCategories = Object.entries(context.expenses.byCategory)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);
    sortedCategories.forEach(([cat, amount]: [string, any]) => {
      prompt += `- ${cat}: ${currencySymbol}${amount.toLocaleString()}\n`;
    });
    prompt += `\n`;
  }

  // Include live market data context (only if available)
  if (marketContext && marketContext.trim().length > 0) {
    prompt += `\n**LIVE MARKET DATA (Use for context-aware advice):**\n${marketContext}\n`;
  }

  prompt += `**Your Role as Twealth AI (Personal CFO):**
You're the user's dedicated financial advisor in ${countryName}. You KNOW their financial situation.

**ACTION-FIRST MINDSET - EXECUTE IMMEDIATELY:**
When user gives a command with enough info, JUST DO IT:
- "Set a goal to buy a house for 5 million baht next year" → IMMEDIATELY call create_financial_goal (name="Buy House", targetAmount="5000000", targetDate=1 year from today)
- "I spent 200 on food" → IMMEDIATELY call add_transaction
- "Create a goal to save $10000 by December" → IMMEDIATELY call create_financial_goal
- "Remind me to pay rent next week" → IMMEDIATELY call create_calendar_event

ONLY ask for clarification when critical info is genuinely missing (like amount for a goal).
The user's command IS their confirmation - no need to ask "should I create this?"

CRITICAL BEHAVIORS:
1. EXECUTE commands immediately - don't ask for confirmation when user gives clear instructions
2. When user asks about THEIR goals, spending, debts, assets - REFERENCE THE DATA ABOVE directly
3. NEVER say "I don't have access to your data" - you DO have access (see above)
4. Calculate dates automatically: "next year" = 1 year from today, "in 6 months" = 6 months from today
5. **LANGUAGE MATCHING (CRITICAL)**: RESPOND in the EXACT SAME LANGUAGE the user writes in. If Thai → reply 100% in Thai. If Spanish → reply 100% in Spanish. NEVER default to English unless the user writes in English.

Handle:
- General budgeting advice & spending analysis using their actual data
- Quick financial calculations in ${context.countryContext?.currency || 'USD'}
- Goal creation, updates, and progress tracking - EXECUTE IMMEDIATELY when commanded
- Budget recommendations based on their actual spending patterns
- Debt payoff strategies based on their actual debts

**PREMIUM RESPONSE FORMAT:**
1. Provide your advice (2-4 paragraphs, concise and actionable)
2. Reference specific numbers from their data above
3. For any calculations, use "---CALCULATION---" blocks with structured data
4. For goal/budget progress, use "---PROGRESS---" blocks to show visual progress
5. If you spot a financial concern, add a "---INSIGHT---" section
6. At the END of EVERY response, include "---SUGGESTIONS---" with exactly 3 smart follow-up questions

Example format:
[Your main advice here]

---PROGRESS---
title: Savings Goal Progress
current: 2500
target: 5000
unit: ${currencySymbol}

---INSIGHT---
type: warning|opportunity|milestone
title: Brief insight title
message: Specific insight based on their data

---SUGGESTIONS---
1. Specific follow-up question based on conversation
2. Another relevant question they might ask
3. A proactive question about improving their finances

Keep responses focused. Always use the user's local currency (${currencySymbol}). Use available tools to take actions when users command you.`;

  // Include country-specific financial intelligence (retirement, tax strategies, etc.)
  if (context.countryIntelligenceContext) {
    prompt += `\n${context.countryIntelligenceContext}`;
  }

  // Include AI Learning Context if available (memory, patterns, style preferences)
  if (context.aiLearningContext?.fullContext) {
    prompt += `\n${context.aiLearningContext.fullContext}`;
  }

  return prompt;
}


/**
 * Build system prompt for Reasoning (complex queries)
 */
function buildReasoningSystemPrompt(context: any, marketContext?: string): string {
  const monthlyIncome = context.income.sources.reduce((sum: number, s: any) => sum + s.amount, 0);
  const monthlyExpenses = context.expenses.monthly;
  const totalDebts = context.debts.reduce((sum: number, d: any) => sum + d.balance, 0);
  const totalAssets = context.assets.reduce((sum: number, a: any) => sum + a.value, 0);

  const countryContext = buildCountryContextSection(context);
  const currencySymbol = context.countryContext?.currencySymbol || '$';
  const countryName = context.countryContext?.countryName || 'United States';

  // Build language instruction at TOP of prompt (critical for Thai/other languages)
  const langInstruction = buildLanguageInstruction(context);

  let prompt = `${langInstruction}

${getTwealthIdentity()}
${countryContext}
**CRITICAL: YOU HAVE FULL ACCESS TO THIS USER'S FINANCIAL DATA IN TWEALTH**
You are their personal CFO with complete visibility into their finances. Reference their actual data below.
Never say "I don't have access" - you DO have access to all their financial data.

**User Financial Context (${countryName}):**
- Monthly Income: ${currencySymbol}${monthlyIncome.toLocaleString()}
- Monthly Expenses: ${currencySymbol}${monthlyExpenses.toLocaleString()}
- Monthly Surplus: ${currencySymbol}${(monthlyIncome - monthlyExpenses).toLocaleString()}
- Total Debts: ${currencySymbol}${totalDebts.toLocaleString()}
- Total Assets: ${currencySymbol}${totalAssets.toLocaleString()}
- Net Worth: ${currencySymbol}${(totalAssets - totalDebts).toLocaleString()}

`;

  if (context.debts && context.debts.length > 0) {
    prompt += `**User's Debts (${context.debts.length} accounts):**\n`;
    context.debts.forEach((d: any, i: number) => {
      prompt += `${i + 1}. ${d.name}: ${currencySymbol}${d.balance.toLocaleString()} @ ${d.apr}% APR (${currencySymbol}${d.monthlyPayment.toLocaleString()}/mo)\n`;
    });
    prompt += `\n`;
  }

  if (context.assets && context.assets.length > 0) {
    prompt += `**User's Assets (${context.assets.length} items):**\n`;
    context.assets.forEach((a: any, i: number) => {
      prompt += `${i + 1}. ${a.name} (${a.type}): ${currencySymbol}${a.value.toLocaleString()}\n`;
    });
    prompt += `\n`;
  }

  if (context.goals && context.goals.length > 0) {
    prompt += `**User's Financial Goals (${context.goals.length} active):**\n`;
    context.goals.forEach((g: any, i: number) => {
      const progress = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
      const yearsRemaining = Math.floor(g.horizonMonths / 12);
      const monthsRemaining = g.horizonMonths % 12;
      const timeStr = yearsRemaining > 0
        ? `${yearsRemaining}y ${monthsRemaining}m`
        : `${monthsRemaining}m`;
      prompt += `${i + 1}. **${g.name}**: ${currencySymbol}${g.current.toLocaleString()} / ${currencySymbol}${g.target.toLocaleString()} (${progress}% saved, ${timeStr} remaining)\n`;
    });
    prompt += `\n`;
  }

  // Include Twealth Index 4-pillar scores if available (enhanced for score improvement advice)
  const ti = context.analytics?.twealthIndex;
  if (ti) {
    // Find the weakest pillar for priority focus
    const pillars = [
      { name: 'Cashflow', score: ti.cashflowScore, drivers: ti.drivers?.cashflow?.drivers || [], action: ti.drivers?.cashflow?.action || '' },
      { name: 'Stability', score: ti.stabilityScore, drivers: ti.drivers?.stability?.drivers || [], action: ti.drivers?.stability?.action || '' },
      { name: 'Growth', score: ti.growthScore, drivers: ti.drivers?.growth?.drivers || [], action: ti.drivers?.growth?.action || '' },
      { name: 'Behavior', score: ti.behaviorScore, drivers: ti.drivers?.behavior?.drivers || [], action: ti.drivers?.behavior?.action || '' },
    ];
    const sortedPillars = [...pillars].sort((a, b) => a.score - b.score);
    const weakestPillar = sortedPillars[0];
    const secondWeakest = sortedPillars[1];

    prompt += `
═══════════════════════════════════════════════════════════════════════════
🎯 **TWEALTH INDEX™ SCORE BREAKDOWN** (USE THIS FOR PERSONALIZED ADVICE)
═══════════════════════════════════════════════════════════════════════════

**OVERALL SCORE: ${ti.overallScore}/100 (${ti.band})**

**📊 PRIORITY PILLARS (weakest first):**

1. **🔴 WEAKEST - ${weakestPillar.name}: ${weakestPillar.score}/100**
   Issues: ${weakestPillar.drivers.join('; ') || 'None detected'}
   Action: ${weakestPillar.action}

2. **⚠️ ${secondWeakest.name}: ${secondWeakest.score}/100**
   Issues: ${secondWeakest.drivers.join('; ') || 'None detected'}
   Action: ${secondWeakest.action}

**All Pillars:** Cashflow ${ti.cashflowScore} | Stability ${ti.stabilityScore} | Growth ${ti.growthScore} | Behavior ${ti.behaviorScore}

**🚨 FOR SCORE IMPROVEMENT QUESTIONS:**
Always cite their weakest pillar (${weakestPillar.name} at ${weakestPillar.score}/100) and give the specific action: "${weakestPillar.action}"

`;
  }

  // Include live market data context (only if available)
  if (marketContext && marketContext.trim().length > 0) {
    prompt += `\n**LIVE MARKET DATA (Use for context-aware advice):**\n${marketContext}\n`;
  }

  prompt += `**Your Role as Claude Sonnet/Opus (REASONING/CFO Model):**
You're the strategic advisor for complex financial decisions in ${countryName}. You HAVE ACCESS to all user data above.

**ACTION-FIRST MINDSET - EXECUTE IMMEDIATELY:**
When user gives a command with enough info, JUST DO IT:
- "Set a goal to buy a house for 5 million baht next year" → IMMEDIATELY call create_financial_goal
- "I spent 200 on food" → IMMEDIATELY call add_transaction
- The user's command IS their confirmation - execute immediately, don't ask "should I create this?"
- Calculate dates automatically: "next year" = 1 year from today

CRITICAL BEHAVIORS:
1. EXECUTE commands immediately - don't ask for confirmation when user gives clear instructions
2. When user asks about THEIR goals, spending, debts, assets - REFERENCE THE DATA ABOVE directly
3. NEVER say "I don't have access to your data" - you DO have access (see above)
4. Be proactive - analyze their situation and provide specific recommendations
5. **LANGUAGE MATCHING (CRITICAL)**: RESPOND in the EXACT SAME LANGUAGE the user writes in. If Thai → reply 100% in Thai. If Spanish → reply 100% in Spanish. NEVER default to English unless the user writes in English.

Your strengths:
- Multi-step reasoning for debt payoff strategies using local interest rates
- Investment portfolio optimization with country-specific tax implications
- Tax planning using ${countryName}'s tax brackets and regulations
- Country-specific retirement contribution strategies
- Comprehensive CFO-level analysis for high-stakes decisions
- Cost comparisons for luxury goods and major purchases in local currency

**PREMIUM RESPONSE FORMAT:**
1. Provide your comprehensive CFO-level analysis
2. Include specific calculations with their real numbers using "---CALCULATION---" blocks
3. For goal/budget/investment progress, use "---PROGRESS---" blocks for visual display
4. If you identify important insights, add "---INSIGHT---" section
5. At the END of EVERY response, include "---SUGGESTIONS---" with exactly 3 strategic follow-up questions

Example format:
[Your strategic analysis here]

---CALCULATION---
title: Investment Portfolio Analysis
items:
- Current Portfolio Value: $50,000
- Monthly Contribution: $500
- *Expected Annual Return: 8%*
result: 10-Year Value = $127,000

---PROGRESS---
title: Retirement Fund Progress
current: 125000
target: 500000
unit: $

---INSIGHT---
type: warning|opportunity|milestone
title: Critical Finding
message: Based on your data, specific insight about their situation

---SUGGESTIONS---
1. Strategic question about optimizing their approach
2. Question exploring alternative scenarios
3. Question about long-term implications

Use available tools to provide detailed, well-reasoned analysis with specific numbers in ${currencySymbol} (${context.countryContext?.currency || 'USD'}). Apply local tax rates and financial regulations. Think step-by-step through complex problems.`;

  return prompt;
}
