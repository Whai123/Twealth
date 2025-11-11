/**
 * Hybrid AI Service - Orchestrates Scout (Groq) and Reasoning (Claude Opus 4.1)
 * 
 * This service integrates all hybrid AI components:
 * - Smart router for escalation detection
 * - Context builder for financial data normalization
 * - AI clients (Scout and Reasoning)
 * - Orchestrators for deep CFO-level analysis
 */

import type { IStorage } from '../storage';
import { buildFinancialContext, estimateContextTokens } from './contextBuilder';
import { shouldEscalate, routeToModel, getRoutingReason, type ComplexitySignals } from './router';
import { getScoutClient, getReasoningClient } from './clients';
import { analyzeDebt } from './orchestrators/debt';
import { analyzeRetirement } from './orchestrators/retirement';
import { analyzeTax } from './orchestrators/tax';
import { analyzePortfolio } from './orchestrators/portfolio';

/**
 * Structured response from hybrid AI service
 */
export interface HybridAIResponse {
  answer: string; // Natural language response
  modelUsed: 'scout' | 'reasoning'; // Which model was used
  tokensIn: number; // Input tokens
  tokensOut: number; // Output tokens
  cost: number; // Cost in USD
  escalated: boolean; // Whether query was escalated to Reasoning
  escalationReason?: string; // Why it was escalated (if applicable)
  orchestratorUsed?: string; // Which orchestrator was called (if any)
  structuredData?: any; // Structured data from orchestrator (if any)
}

/**
 * Main entry point for hybrid AI system
 * 
 * @param userId - User ID for context building
 * @param userMessage - User's question/request
 * @param storage - Storage interface for data access
 * @returns Structured AI response with metadata
 */
export async function generateHybridAdvice(
  userId: string,
  userMessage: string,
  storage: IStorage
): Promise<HybridAIResponse> {
  // Step 1: Build financial context
  const context = await buildFinancialContext(userId, storage);
  
  // Step 2: Estimate context size for routing
  const contextTokens = estimateContextTokens(context);
  
  // Step 3: Determine escalation
  const signals: ComplexitySignals = {
    message: userMessage,
    debtsCount: context.debts.length,
    assetsCount: context.assets.length,
    messageLength: userMessage.length,
    contextTokens,
  };
  
  const escalate = shouldEscalate(signals);
  const model = routeToModel(signals);
  const routingReason = escalate ? getRoutingReason(signals) : undefined;
  
  // Step 4: Route to appropriate model/orchestrator
  if (escalate) {
    // Deep CFO-level analysis with Claude Opus 4.1
    return await handleReasoningQuery(userMessage, context, routingReason);
  } else {
    // Fast query with Scout (Llama 4)
    return await handleScoutQuery(userMessage, context);
  }
}

/**
 * Handle simple/fast queries with Scout (Llama 4 via Groq)
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
  });
  
  return {
    answer: response.text,
    modelUsed: 'scout',
    tokensIn: response.tokensIn,
    tokensOut: response.tokensOut,
    cost: response.cost,
    escalated: false,
  };
}

/**
 * Handle complex queries with Reasoning (Claude Opus 4.1) + orchestrators
 */
async function handleReasoningQuery(
  userMessage: string,
  context: any,
  routingReason?: string
): Promise<HybridAIResponse> {
  // Detect which orchestrator to use based on keywords
  const orchestrator = detectOrchestrator(userMessage, context);
  
  if (orchestrator) {
    // Call specialized orchestrator
    return await callOrchestrator(orchestrator, userMessage, context, routingReason);
  } else {
    // Generic reasoning query (no specific orchestrator)
    return await handleGenericReasoningQuery(userMessage, context, routingReason);
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
  routingReason?: string
): Promise<HybridAIResponse> {
  let structuredData: any;
  let tokensIn = 0;
  let tokensOut = 0;
  let cost = 0;
  
  try {
    switch (orchestrator) {
      case 'debt':
        structuredData = await analyzeDebt(context, userMessage);
        // Estimate tokens (rough approximation)
        tokensIn = Math.ceil((userMessage.length + JSON.stringify(context).length) / 4);
        tokensOut = Math.ceil(structuredData.summary.length / 4);
        cost = (tokensIn / 1000) * 0.015 + (tokensOut / 1000) * 0.075; // Claude Opus 4.1 pricing
        break;
      
      case 'retirement':
        structuredData = await analyzeRetirement(context, userMessage);
        tokensIn = Math.ceil((userMessage.length + JSON.stringify(context).length) / 4);
        tokensOut = Math.ceil(structuredData.summary.length / 4);
        cost = (tokensIn / 1000) * 0.015 + (tokensOut / 1000) * 0.075;
        break;
      
      case 'tax':
        structuredData = await analyzeTax(context, userMessage);
        tokensIn = Math.ceil((userMessage.length + JSON.stringify(context).length) / 4);
        tokensOut = Math.ceil(structuredData.summary.length / 4);
        cost = (tokensIn / 1000) * 0.015 + (tokensOut / 1000) * 0.075;
        break;
      
      case 'portfolio':
        structuredData = await analyzePortfolio(context, userMessage);
        tokensIn = Math.ceil((userMessage.length + JSON.stringify(context).length) / 4);
        tokensOut = Math.ceil(structuredData.summary.length / 4);
        cost = (tokensIn / 1000) * 0.015 + (tokensOut / 1000) * 0.075;
        break;
      
      default:
        throw new Error(`Unknown orchestrator: ${orchestrator}`);
    }
    
    return {
      answer: structuredData.summary,
      modelUsed: 'reasoning',
      tokensIn,
      tokensOut,
      cost,
      escalated: true,
      escalationReason: routingReason,
      orchestratorUsed: orchestrator,
      structuredData,
    };
  } catch (error) {
    // If orchestrator fails, fall back to generic reasoning query
    console.error(`Orchestrator ${orchestrator} failed:`, error);
    return await handleGenericReasoningQuery(userMessage, context, routingReason);
  }
}

/**
 * Handle generic reasoning query (no specific orchestrator)
 */
async function handleGenericReasoningQuery(
  userMessage: string,
  context: any,
  routingReason?: string
): Promise<HybridAIResponse> {
  const client = getReasoningClient();
  
  // Build comprehensive prompt with context
  const systemPrompt = buildReasoningSystemPrompt(context);
  
  const response = await client.chat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.5,
    maxTokens: 2000,
  });
  
  return {
    answer: response.text,
    modelUsed: 'reasoning',
    tokensIn: response.tokensIn,
    tokensOut: response.tokensOut,
    cost: response.cost,
    escalated: true,
    escalationReason: routingReason,
  };
}

/**
 * Build system prompt for Scout (simple queries)
 */
function buildScoutSystemPrompt(context: any): string {
  const monthlyIncome = context.income.sources.reduce((sum: number, s: any) => sum + s.amount, 0);
  const monthlyExpenses = context.expenses.monthly;
  const totalDebts = context.debts.reduce((sum: number, d: any) => sum + d.balance, 0);
  const totalAssets = context.assets.reduce((sum: number, a: any) => sum + a.value, 0);
  
  return `You are a helpful CFO-level financial advisor. You provide clear, actionable advice.

**User Financial Snapshot:**
- Monthly Income: $${monthlyIncome.toLocaleString()}
- Monthly Expenses: $${monthlyExpenses.toLocaleString()}
- Total Debts: $${totalDebts.toLocaleString()}
- Total Assets: $${totalAssets.toLocaleString()}

Keep responses concise and actionable. If the query is complex, recommend they ask for deeper analysis.`;
}

/**
 * Build system prompt for Reasoning (complex queries)
 */
function buildReasoningSystemPrompt(context: any): string {
  const monthlyIncome = context.income.sources.reduce((sum: number, s: any) => sum + s.amount, 0);
  const monthlyExpenses = context.expenses.monthly;
  
  let prompt = `You are a CFO-level financial advisor providing comprehensive analysis.

**User Financial Context:**
- Monthly Income: $${monthlyIncome.toLocaleString()}
- Monthly Expenses: $${monthlyExpenses.toLocaleString()}
- Monthly Surplus: $${(monthlyIncome - monthlyExpenses).toLocaleString()}

`;
  
  if (context.debts.length > 0) {
    prompt += `**Debts:**\n`;
    context.debts.forEach((d: any, i: number) => {
      prompt += `${i + 1}. ${d.name}: $${d.balance.toLocaleString()} @ ${d.apr}% APR\n`;
    });
    prompt += `\n`;
  }
  
  if (context.assets.length > 0) {
    prompt += `**Assets:**\n`;
    context.assets.forEach((a: any, i: number) => {
      prompt += `${i + 1}. ${a.name} (${a.type}): $${a.value.toLocaleString()}\n`;
    });
    prompt += `\n`;
  }
  
  if (context.goals.length > 0) {
    prompt += `**Goals:**\n`;
    context.goals.forEach((g: any) => {
      prompt += `- ${g.name}: $${g.target.toLocaleString()} in ${Math.floor(g.horizonMonths / 12)} years\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Provide comprehensive, CFO-level analysis with specific numbers and actionable recommendations.`;
  
  return prompt;
}
