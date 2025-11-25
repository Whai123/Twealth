/**
 * Hybrid AI Service - 4-Model Architecture (Scout/Sonnet/GPT-5/Opus)
 * 
 * This service integrates all hybrid AI components:
 * - Scout (Llama 4 via Groq): PRIMARY - Fast queries, budgeting, spending (⚡ Fast)
 * - Sonnet 3.5/4.5 (Claude): REASONING - Multi-step logic, strategy (🧠 Smart)
 * - GPT-5 (OpenAI): MATH - Projections, simulations, calculations (🧮 Math)
 * - Opus 4.1 (Claude): CFO-LEVEL - Portfolio analysis, high-stakes (👔 CFO)
 * 
 * Components:
 * - Smart router for complexity-based escalation
 * - Context builder for financial data normalization
 * - AI clients (Scout, Sonnet, GPT-5, Opus)
 * - Orchestrators for deep CFO-level analysis
 */

// 🧪 TESTING MODE: Set to true to bypass all quota limits and tier restrictions
// ⚠️ REMEMBER TO SET BACK TO FALSE AFTER TESTING
export const TESTING_MODE = false;

import type { IStorage } from '../storage';
import { buildFinancialContext, estimateContextTokens, type FinancialContext } from './contextBuilder';
import { shouldEscalate, routeToModel, getRoutingReason, type ComplexitySignals } from './router';
import { getGPT5Client, getScoutClient, getSonnetClient, getOpusClient, getReasoningClient } from './clients';
import { analyzeDebt } from './orchestrators/debt';
import { analyzeRetirement } from './orchestrators/retirement';
import { analyzeTax } from './orchestrators/tax';
import { analyzePortfolio } from './orchestrators/portfolio';
import { getTwealthTools, getTwealthIdentity } from './tools';

/**
 * Model access levels (matches tier system)
 * Scout is PRIMARY, others are for escalation based on complexity
 */
export type ModelAccess = 'scout' | 'sonnet' | 'gpt5' | 'opus';

/**
 * Options for generating AI advice
 */
export interface GenerateAdviceOptions {
  forceModel?: ModelAccess; // Override auto-escalation with tier-selected model
  preselectedContext?: FinancialContext; // Pre-built context to avoid double assembly
  skipAutoEscalation?: boolean; // Disable internal escalation logic
}

/**
 * Structured response from hybrid AI service
 */
export interface HybridAIResponse {
  answer: string; // Natural language response
  modelUsed: 'scout' | 'sonnet' | 'gpt5' | 'opus' | 'reasoning'; // Which model was used (maps to quota counter)
  modelSlug: string; // Exact model identifier (e.g., 'gpt-5', 'claude-opus-4-1')
  tokensIn: number; // Input tokens
  tokensOut: number; // Output tokens
  cost: number; // Cost in USD
  escalated: boolean; // Whether query was escalated from Scout
  escalationReason?: string; // Why it was escalated (if applicable)
  orchestratorUsed?: string; // Which orchestrator was called (if any)
  structuredData?: any; // Structured data from orchestrator (if any)
  tierDowngraded?: boolean; // Whether tier logic downgraded the model
  actualModel?: 'scout' | 'sonnet' | 'gpt5' | 'opus'; // Actual model used (fallback for determineModelFromSlug)
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
  const { forceModel, preselectedContext, skipAutoEscalation } = options;
  
  // Step 1: Build or use pre-selected financial context
  const context = preselectedContext || await buildFinancialContext(userId, storage);
  
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
  if (targetModel === 'scout') {
    return await handleScoutQuery(userMessage, context);
  } else if (targetModel === 'sonnet') {
    return await handleReasoningQuery(userMessage, context, routingReason, 'sonnet');
  } else if (targetModel === 'gpt5') {
    return await handleGPT5Query(userMessage, context);
  } else if (targetModel === 'opus') {
    // Opus uses reasoning path with orchestrators
    return await handleReasoningQuery(userMessage, context, routingReason, 'opus');
  } else {
    // Fallback to Scout
    return await handleScoutQuery(userMessage, context);
  }
}

/**
 * Handle queries with GPT-5 (OpenAI via Replit AI Integrations)
 * MATH MODEL - Advanced calculations, projections, simulations (🧮 Math)
 */
async function handleGPT5Query(
  userMessage: string,
  context: any
): Promise<HybridAIResponse> {
  const client = getGPT5Client();
  
  // Build optimized prompt with financial context
  const systemPrompt = buildGPT5SystemPrompt(context);
  
  const response = await client.chat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
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
 * PRIMARY MODEL - Fast queries, budgeting, spending, goals (⚡ Fast)
 */
async function handleScoutQuery(
  userMessage: string,
  context: any
): Promise<HybridAIResponse> {
  const client = getScoutClient();
  
  // Build simple prompt with context
  const systemPrompt = buildScoutSystemPrompt(context);
  
  const response = await client.chat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    maxTokens: 1000,
    tools: getTwealthTools(), // Pass tools for action-taking
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
 * Sonnet: REASONING - Multi-step logic, strategy (🧠 Smart)
 * Opus: CFO-LEVEL - Portfolio analysis, high-stakes (👔 CFO)
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
  
  // Build comprehensive prompt with context
  const systemPrompt = buildReasoningSystemPrompt(context);
  
  const response = await client.chat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
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
 * Build system prompt for GPT-5 (optimized for financial reasoning)
 */
function buildGPT5SystemPrompt(context: any): string {
  const monthlyIncome = context.income.sources.reduce((sum: number, s: any) => sum + s.amount, 0);
  const monthlyExpenses = context.expenses.monthly;
  const totalDebts = context.debts.reduce((sum: number, d: any) => sum + d.balance, 0);
  const totalAssets = context.assets.reduce((sum: number, a: any) => sum + a.value, 0);
  
  const countryContext = buildCountryContextSection(context);
  const currencySymbol = context.countryContext?.currencySymbol || '$';
  
  return `${getTwealthIdentity()}
${countryContext}
**User Financial Profile:**
- Monthly Income: ${currencySymbol}${monthlyIncome.toLocaleString()}
- Monthly Expenses: ${currencySymbol}${monthlyExpenses.toLocaleString()}
- Net Monthly: ${currencySymbol}${(monthlyIncome - monthlyExpenses).toLocaleString()}
- Total Debts: ${currencySymbol}${totalDebts.toLocaleString()}
- Total Assets: ${currencySymbol}${totalAssets.toLocaleString()}
- Net Worth: ${currencySymbol}${(totalAssets - totalDebts).toLocaleString()}

**Your Role as GPT-5 (MATH Model):**
You're the quantitative specialist powered by GPT-5. Your strengths:
- Superior mathematical reasoning (94.6% on AIME 2025)
- Complex multi-variable financial analysis & projections
- Compound interest calculations & retirement planning
- Investment modeling & future value simulations
- Country-specific tax calculations and cost comparisons

Use available tools to provide detailed calculations. Keep responses focused on measurable outcomes with specific numbers and actionable steps. Always use the user's local currency and apply their country's tax rates when relevant.`;
}

/**
 * Build system prompt for Scout (simple queries)
 */
function buildScoutSystemPrompt(context: any): string {
  const monthlyIncome = context.income.sources.reduce((sum: number, s: any) => sum + s.amount, 0);
  const monthlyExpenses = context.expenses.monthly;
  const totalDebts = context.debts.reduce((sum: number, d: any) => sum + d.balance, 0);
  const totalAssets = context.assets.reduce((sum: number, a: any) => sum + a.value, 0);
  
  const countryContext = buildCountryContextSection(context);
  const currencySymbol = context.countryContext?.currencySymbol || '$';
  const countryName = context.countryContext?.countryName || 'United States';
  
  return `${getTwealthIdentity()}
${countryContext}
**User Financial Snapshot:**
- Monthly Income: ${currencySymbol}${monthlyIncome.toLocaleString()}
- Monthly Expenses: ${currencySymbol}${monthlyExpenses.toLocaleString()}
- Total Debts: ${currencySymbol}${totalDebts.toLocaleString()}
- Total Assets: ${currencySymbol}${totalAssets.toLocaleString()}

**Your Role as Scout (PRIMARY Model):**
You're the fast, always-available financial advisor for users in ${countryName}. Handle:
- General budgeting advice & spending analysis using local costs
- Quick financial calculations in ${context.countryContext?.currency || 'USD'}
- Goal creation & transaction logging
- Budget recommendations based on local cost of living
- Luxury goods and major purchase pricing in their country

Keep responses concise (2-4 paragraphs) and actionable. Always use the user's local currency (${currencySymbol}). Use available tools to take actions when users command you. If the query requires deep analysis (retirement planning, tax optimization, portfolio analysis), recommend they ask for deeper analysis which will escalate to specialized models.`;
}

/**
 * Build system prompt for Reasoning (complex queries)
 */
function buildReasoningSystemPrompt(context: any): string {
  const monthlyIncome = context.income.sources.reduce((sum: number, s: any) => sum + s.amount, 0);
  const monthlyExpenses = context.expenses.monthly;
  
  const countryContext = buildCountryContextSection(context);
  const currencySymbol = context.countryContext?.currencySymbol || '$';
  const countryName = context.countryContext?.countryName || 'United States';
  
  let prompt = `${getTwealthIdentity()}
${countryContext}
**User Financial Context (${countryName}):**
- Monthly Income: ${currencySymbol}${monthlyIncome.toLocaleString()}
- Monthly Expenses: ${currencySymbol}${monthlyExpenses.toLocaleString()}
- Monthly Surplus: ${currencySymbol}${(monthlyIncome - monthlyExpenses).toLocaleString()}

`;
  
  if (context.debts.length > 0) {
    prompt += `**Debts:**\n`;
    context.debts.forEach((d: any, i: number) => {
      prompt += `${i + 1}. ${d.name}: ${currencySymbol}${d.balance.toLocaleString()} @ ${d.apr}% APR\n`;
    });
    prompt += `\n`;
  }
  
  if (context.assets.length > 0) {
    prompt += `**Assets:**\n`;
    context.assets.forEach((a: any, i: number) => {
      prompt += `${i + 1}. ${a.name} (${a.type}): ${currencySymbol}${a.value.toLocaleString()}\n`;
    });
    prompt += `\n`;
  }
  
  if (context.goals.length > 0) {
    prompt += `**Goals:**\n`;
    context.goals.forEach((g: any) => {
      prompt += `- ${g.name}: ${currencySymbol}${g.target.toLocaleString()} in ${Math.floor(g.horizonMonths / 12)} years\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `**Your Role as Claude Sonnet/Opus (REASONING/CFO Model):**
You're the strategic advisor for complex financial decisions in ${countryName}. Your strengths:
- Multi-step reasoning for debt payoff strategies using local interest rates
- Investment portfolio optimization with country-specific tax implications
- Tax planning using ${countryName}'s tax brackets and regulations
- Country-specific retirement contribution strategies
- Comprehensive CFO-level analysis for high-stakes decisions
- Cost comparisons for luxury goods and major purchases in local currency

Use available tools to provide detailed, well-reasoned analysis with specific numbers in ${currencySymbol} (${context.countryContext?.currency || 'USD'}). Apply local tax rates and financial regulations. Think step-by-step through complex problems.`;
  
  return prompt;
}
