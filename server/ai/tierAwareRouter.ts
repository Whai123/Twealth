/**
 * Tier-Aware AI Orchestrator
 * 
 * Wraps the hybrid AI service with subscription tier checking and quota enforcement.
 * Ensures users only access models they're allowed to use based on their plan.
 * 
 * Tier Access Matrix (4-Model System):
 * - Free: Scout only (50/month) - NO Sonnet, NO GPT-5, NO Opus
 * - Pro: Scout (unlimited) + Sonnet (25/month) + GPT-5 (5/month) - NO Opus
 * - Enterprise: Scout (unlimited) + Sonnet (60/month) + GPT-5 (10/month) + Opus (20/month)
 * 
 * Model Usage Rules:
 * - Scout (Llama 4): PRIMARY - Fast queries, budgeting, spending, goals (Fast)
 * - Sonnet 3.5/4.5: REASONING - Multi-step logic, investment, debt strategy (Smart)
 * - GPT-5: MATH - Projections, simulations, compound interest, retirement (Math)
 * - Opus 4.1: CFO-LEVEL - Portfolio analysis, high-stakes decisions (CFO)
 */

import type { IStorage } from '../storage';
import { generateHybridAdvice, type HybridAIResponse, type ModelAccess, type GenerateAdviceOptions, TESTING_MODE } from './hybridAIService';
import { shouldEscalate, type ComplexitySignals } from './router';
import { estimateContextTokens, buildFinancialContext } from './contextBuilder';

// Re-export ModelAccess for convenience
export type { ModelAccess };

// Tier names
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// Quota exceeded error
export interface QuotaExceededError {
  type: 'quota_exceeded';
  model: ModelAccess;
  remaining: number;
  used: number;
  limit: number;
  nextTier: SubscriptionTier | null;
  upgradeRequired: boolean;
}

// Tier-aware response (either success or quota error)
export type TierAwareResponse = HybridAIResponse | QuotaExceededError;

/**
 * Map subscription tier to allowed models
 * Scout is PRIMARY model for all tiers (unlimited for Pro/Enterprise)
 */
export function resolveAllowedModels(tier: SubscriptionTier): ModelAccess[] {
  switch (tier) {
    case 'free':
      return ['scout']; // Scout only, 50/month limit
    case 'pro':
      return ['scout', 'sonnet', 'gpt5']; // Unlimited Scout + Sonnet + GPT-5
    case 'enterprise':
      return ['scout', 'sonnet', 'gpt5', 'opus']; // All models available
    default:
      return ['scout']; // Default to Scout
  }
}

/**
 * Get models in descending priority order (highest to lowest)
 * Used for cascading fallback when preferred model lacks quota
 * Scout is ALWAYS the final fallback (unlimited for paid tiers)
 */
function getModelsByPriority(tier: SubscriptionTier): ModelAccess[] {
  switch (tier) {
    case 'free':
      return ['scout']; // Scout only
    case 'pro':
      return ['gpt5', 'sonnet', 'scout']; // Try GPT-5/Sonnet first, fall back to Scout
    case 'enterprise':
      return ['opus', 'gpt5', 'sonnet', 'scout']; // Try premium models, fall back to Scout
    default:
      return ['scout'];
  }
}

/**
 * Build fallback list: preferred first, then other specialty models, Scout LAST
 * 
 * Strategy:
 * 1. Try preferred model (selected for quality/capability match)
 * 2. Fall back to other allowed specialty models in ascending cost order
 * 3. Fall back to Scout LAST as final fallback (unlimited for Pro/Enterprise)
 * 
 * Examples:
 * - Free any query: preferred=scout → [scout]
 * - Pro simple query: preferred=scout → [scout, gpt5, sonnet]
 * - Pro reasoning query: preferred=sonnet → [sonnet, gpt5, scout] (Scout LAST!)
 * - Pro math query: preferred=gpt5 → [gpt5, sonnet, scout] (Scout LAST!)
 * - Enterprise CFO query: preferred=opus → [opus, gpt5, sonnet, scout] (Scout LAST!)
 */
function buildFallbackList(preferredModel: ModelAccess, tier: SubscriptionTier): ModelAccess[] {
  // Get tier-allowed models as a Set for efficient membership checks
  const allowedModelsArray = resolveAllowedModels(tier);
  const allowedModels = new Set(allowedModelsArray);
  
  // Free tier: only Scout available
  if (tier === 'free') {
    return ['scout'];
  }
  
  // Start with preferred model
  const fallbackOrder: ModelAccess[] = [preferredModel];
  
  // Add remaining specialty models in ascending cost order (GPT-5 < Sonnet < Opus)
  const costOrderedModels: ModelAccess[] = ['gpt5', 'sonnet', 'opus'];
  const specialtyModels = costOrderedModels.filter(
    m => m !== preferredModel && allowedModels.has(m)
  ) as ModelAccess[];
  
  fallbackOrder.push(...specialtyModels);
  
  // Add Scout as FINAL fallback (unlimited for paid tiers, cheapest)
  if (preferredModel !== 'scout' && allowedModels.has('scout')) {
    fallbackOrder.push('scout');
  }
  
  return fallbackOrder;
}

/**
 * Get next tier for upgrade suggestions
 */
function getNextTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  switch (currentTier) {
    case 'free':
      return 'pro';
    case 'pro':
      return 'enterprise';
    case 'enterprise':
      return null; // Already at highest tier
    default:
      return 'pro';
  }
}

/**
 * Check if user has quota remaining for a specific model
 * Scout is unlimited for Pro/Enterprise (scoutLimit = 999999)
 */
function hasQuota(
  usage: { scoutUsed: number; sonnetUsed: number; gpt5Used: number; opusUsed: number },
  limits: { scoutLimit: number; sonnetLimit: number; gpt5Limit: number; opusLimit: number },
  model: ModelAccess
): boolean {
  switch (model) {
    case 'scout':
      return usage.scoutUsed < limits.scoutLimit; // Unlimited for paid (999999)
    case 'sonnet':
      return usage.sonnetUsed < limits.sonnetLimit;
    case 'gpt5':
      return usage.gpt5Used < limits.gpt5Limit;
    case 'opus':
      return usage.opusUsed < limits.opusLimit;
    default:
      return false;
  }
}

/**
 * Select the best model based on complexity and tier (ignoring quotas)
 * 
 * Model Selection Strategy (Scout-First):
 * 1. Analyze query complexity and keywords
 * 2. Route to appropriate model based on use case:
 *    - Scout: Simple queries (spending, budgeting, goals, transactions)
 *    - Sonnet: Multi-step reasoning (debt strategy, investment basics, risk assessment)
 *    - GPT-5: Advanced math (projections, simulations, compound interest, retirement)
 *    - Opus: CFO-level (portfolio analysis, macroeconomics, high-stakes decisions)
 * 3. Quota checking happens separately in routeWithTierCheck
 */
function selectModelForTier(
  signals: ComplexitySignals,
  tier: SubscriptionTier
): ModelAccess {
  const msgLower = typeof signals.message === 'string' ? signals.message.toLowerCase() : '';
  
  // Free tier: Always Scout (no escalation allowed)
  if (tier === 'free') {
    return 'scout';
  }
  
  // Pro tier: Scout, Sonnet, or GPT-5 based on query type
  if (tier === 'pro') {
    // GPT-5 for advanced math/projections
    if (isMathQuery(msgLower)) {
      return 'gpt5';
    }
    // Sonnet for reasoning/strategy
    if (isReasoningQuery(msgLower) || shouldEscalate(signals)) {
      return 'sonnet';
    }
    // Default to Scout for simple queries
    return 'scout';
  }
  
  // Enterprise tier: All models available
  if (tier === 'enterprise') {
    // Opus for CFO-level analysis
    if (isCFOQuery(msgLower)) {
      return 'opus';
    }
    // GPT-5 for advanced math
    if (isMathQuery(msgLower)) {
      return 'gpt5';
    }
    // Sonnet for reasoning
    if (isReasoningQuery(msgLower) || shouldEscalate(signals)) {
      return 'sonnet';
    }
    // Default to Scout
    return 'scout';
  }
  
  // Default fallback
  return 'scout';
}

/**
 * Detect if query requires advanced math/projections (GPT-5)
 */
function isMathQuery(msg: string): boolean {
  return (
    msg.includes('projection') ||
    msg.includes('simulate') ||
    msg.includes('compound interest') ||
    msg.includes('retirement') ||
    msg.includes('amortization') ||
    msg.includes('inflation') ||
    msg.includes('multi-year') ||
    msg.includes('monte carlo') ||
    msg.includes('calculate')
  );
}

/**
 * Detect if query requires reasoning/strategy (Sonnet)
 */
function isReasoningQuery(msg: string): boolean {
  return (
    msg.includes('strategy') ||
    msg.includes('debt payoff') ||
    msg.includes('investment') ||
    msg.includes('risk') ||
    msg.includes('crypto') ||
    msg.includes('budget optimi') ||
    msg.includes('should i') ||
    msg.includes('analyze') ||
    msg.includes('compare')
  );
}

/**
 * Detect if query requires CFO-level intelligence (Opus)
 */
function isCFOQuery(msg: string): boolean {
  return (
    msg.includes('portfolio') ||
    msg.includes('multi-currency') ||
    msg.includes('macroeconomic') ||
    msg.includes('de-dollarization') ||
    msg.includes('high stakes') ||
    msg.includes('asset allocation') ||
    msg.includes('tax optimization') ||
    msg.includes('wealth management')
  );
}

/**
 * Conversation message for memory
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Main orchestrator: Routes AI queries with tier-based access control
 */
export async function routeWithTierCheck(
  userId: string,
  message: string,
  storage: IStorage,
  conversationHistory: ConversationMessage[] = []
): Promise<TierAwareResponse> {
  try {
    // CRITICAL: Sanitize message at entry point to prevent TypeError
    // This ensures all downstream code receives a safe string
    const sanitizedMessage = typeof message === 'string' ? message : '';
    
    // 1. Fetch user subscription and usage
    const subData = await storage.getUserSubscriptionWithUsage(userId);
    
    if (!subData) {
      throw new Error('User subscription not found');
    }
    
    const { subscription, usage, plan } = subData;
    
    // Determine tier
    const tier: SubscriptionTier = (plan.name?.toLowerCase() as SubscriptionTier) || 'free';
    
    // Current usage
    const currentUsage = {
      scoutUsed: usage?.scoutQueriesUsed || 0,
      sonnetUsed: usage?.sonnetQueriesUsed || 0,
      gpt5Used: usage?.gpt5QueriesUsed || 0,
      opusUsed: usage?.opusQueriesUsed || 0,
    };
    
    // Plan limits
    const limits = {
      scoutLimit: plan.scoutLimit || 0,
      sonnetLimit: plan.sonnetLimit || 0,
      gpt5Limit: plan.gpt5Limit || 0,
      opusLimit: plan.opusLimit || 0,
    };
    
    // 2. Build financial context once
    const context = await buildFinancialContext(userId, storage);
    
    // 3. Create complexity signals for model selection using sanitized message
    const signals: ComplexitySignals = {
      message: sanitizedMessage,
      debtsCount: context.debts.length,
      assetsCount: context.assets.length,
      messageLength: sanitizedMessage.length,
      contextTokens: estimateContextTokens(context),
    };
    
    // 4. Select preferred model for tier based on complexity
    const preferredModel = selectModelForTier(signals, tier);
    
    // 5. Build fallback list: preferred first, then lower-priority models
    const fallbackModels = buildFallbackList(preferredModel, tier);
    
    // 6. Find first model with available quota (try preferred, then fall back)
    let selectedModel: ModelAccess | null = null;
    let downgradedFrom: ModelAccess | null = null;
    
    // TESTING MODE: Bypass quota checks and grant access to all models
    if (TESTING_MODE) {
      console.log('TESTING MODE ENABLED - Bypassing quota limits');
      console.log(`   User requested: ${preferredModel}`);
      console.log(`   Granting access to: ${preferredModel} (no quota check)`);
      selectedModel = preferredModel; // Use preferred model directly
      downgradedFrom = null; // No downgrade in testing mode
    } else {
      // Production mode: Check quotas
      for (const model of fallbackModels) {
        if (hasQuota(currentUsage, limits, model)) {
          selectedModel = model;
          // Mark as downgraded only if we fell back from preferred
          if (model !== preferredModel) {
            downgradedFrom = preferredModel;
          }
          break;
        }
      }
      
      // 7. If no model has quota, return quota_exceeded
      if (!selectedModel) {
        // All tier models exhausted
        return {
          type: 'quota_exceeded',
          model: preferredModel,
          remaining: 0,
          used: currentUsage[`${preferredModel}Used` as keyof typeof currentUsage],
          limit: limits[`${preferredModel}Limit` as keyof typeof limits],
          nextTier: getNextTier(tier),
          upgradeRequired: true,
        };
      }
    }
    
    // 8. Route to AI service with selected model and pre-built context
    const options: GenerateAdviceOptions = {
      forceModel: selectedModel,
      preselectedContext: context,
      skipAutoEscalation: true, // Tier router has already decided
      conversationHistory, // Pass conversation history for context
    };
    
    const response = await generateHybridAdvice(userId, sanitizedMessage, storage, options);
    
    // 9. Add downgrade warning if we fell back to a lower model
    if (downgradedFrom) {
      const warning = `Note: Your ${downgradedFrom} quota is exhausted. Using ${selectedModel} instead. ${
        getNextTier(tier) ? `Upgrade to ${getNextTier(tier)} for more ${downgradedFrom} queries.` : ''
      }`;
      response.answer = `${warning}\n\n${response.answer}`;
      response.tierDowngraded = true;
    }
    
    // 7. Track usage synchronously
    try {
      await trackUsage(userId, sanitizedMessage, response, subscription.id, tier, storage);
      
      // Increment usage counters based on actual model used
      const actualModel = determineModelFromSlug(response.modelSlug);
      await storage.incrementUsageCounters(
        userId,
        subscription.id,
        actualModel
      );
    } catch (error) {
      console.error('[TierAwareRouter] Failed to track usage:', error);
      // Don't fail the request if logging fails
    }
    
    return response;
  } catch (error) {
    console.error('[TierAwareRouter] Error routing query:', error);
    throw error;
  }
}

/**
 * Determine model type from model slug for quota tracking
 * Maps actual AI model to database quota counter
 */
function determineModelFromSlug(modelSlug: string): 'scout' | 'sonnet' | 'gpt5' | 'opus' {
  const slug = modelSlug.toLowerCase();
  
  // Scout (Groq Llama models) - PRIMARY model
  if (slug.includes('llama') || slug.includes('scout') || slug.includes('groq')) {
    return 'scout';
  }
  
  // Sonnet (Claude Sonnet models) - REASONING
  if (slug.includes('sonnet')) {
    return 'sonnet';
  }
  
  // GPT-5 (OpenAI models) - MATH/PROJECTIONS
  if (slug.includes('gpt-5') || slug.includes('gpt5') || slug.includes('openai')) {
    return 'gpt5';
  }
  
  // Opus (Claude Opus models) - CFO-LEVEL (Enterprise only)
  if (slug.includes('opus')) {
    return 'opus';
  }
  
  // Unknown Claude model - log warning and default to Sonnet tier
  if (slug.includes('claude')) {
    console.warn(`[TierAwareRouter] Unknown Claude model: ${modelSlug}, defaulting to Sonnet tier`);
    return 'sonnet';
  }
  
  // Completely unknown model - throw error to prevent silent quota theft
  throw new Error(`[TierAwareRouter] Unknown AI model slug: ${modelSlug}. Cannot determine tier for quota tracking.`);
}

/**
 * Track usage to aiUsageLogs table
 */
async function trackUsage(
  userId: string,
  query: string,
  response: HybridAIResponse,
  subscriptionId: string,
  tier: SubscriptionTier,
  storage: IStorage
): Promise<void> {
  // Determine model type from modelSlug (accurate, not heuristic)
  const modelUsed = determineModelFromSlug(response.modelSlug);
  
  await storage.insertAIUsageLog({
    userId,
    subscriptionId,
    query,
    response: response.answer,
    modelUsed,
    modelName: response.modelSlug,
    escalated: response.escalated,
    escalationReason: response.escalationReason || null,
    orchestratorUsed: response.orchestratorUsed || null,
    tokensIn: response.tokensIn,
    tokensOut: response.tokensOut,
    totalTokens: response.tokensIn + response.tokensOut,
    costUsd: response.cost.toString(),
    tierAtQuery: tier,
  });
}
