/**
 * Tier-Aware AI Orchestrator
 * 
 * Wraps the hybrid AI service with subscription tier checking and quota enforcement.
 * Ensures users only access models they're allowed to use based on their plan.
 * 
 * Tier Access Matrix (2-Tier System with Legacy Support):
 * - Free: Gemini only (50/month) - FREE Google AI
 * - Pro: Gemini (unlimited) + Claude Sonnet (25/month) - PRO reasoning
 * - Enterprise: All models (Gemini, Sonnet, GPT-5, Opus)
 * 
 * Model Usage Rules:
 * - Gemini Flash 2.0: FREE TIER - Fast queries for all users
 * - Sonnet 4.5: PRO TIER - Advanced reasoning for Pro users
 * - Legacy (Scout, GPT-5, Opus): Still supported for enterprise/backward compatibility
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
 * Gemini is PRIMARY model for Free tier, Sonnet for Pro
 */
export function resolveAllowedModels(tier: SubscriptionTier): ModelAccess[] {
  switch (tier) {
    case 'free':
      return ['gemini']; // Gemini only, 50/month limit (FREE)
    case 'pro':
      return ['gemini', 'sonnet']; // Unlimited Gemini + Sonnet (25/month)
    case 'enterprise':
      return ['gemini', 'sonnet', 'gpt5', 'opus']; // All models available
    default:
      return ['gemini']; // Default to Gemini (free)
  }
}

/**
 * Get models in descending priority order (highest to lowest)
 * Used for cascading fallback when preferred model lacks quota
 * Gemini is ALWAYS the final fallback (free, unlimited for paid tiers)
 */
function getModelsByPriority(tier: SubscriptionTier): ModelAccess[] {
  switch (tier) {
    case 'free':
      return ['gemini']; // Gemini only
    case 'pro':
      return ['sonnet', 'gemini']; // Try Sonnet first, fall back to Gemini
    case 'enterprise':
      return ['opus', 'gpt5', 'sonnet', 'gemini']; // Try premium models, fall back to Gemini
    default:
      return ['gemini'];
  }
}

/**
 * Build fallback list: preferred first, then other specialty models, Gemini LAST
 * 
 * Strategy:
 * 1. Try preferred model (selected for quality/capability match)
 * 2. Fall back to other allowed specialty models in ascending cost order
 * 3. Fall back to Gemini LAST as final fallback (free, unlimited for Pro/Enterprise)
 * 
 * Examples:
 * - Free any query: preferred=gemini → [gemini]
 * - Pro simple query: preferred=gemini → [gemini, sonnet]
 * - Pro reasoning query: preferred=sonnet → [sonnet, gemini] (Gemini LAST!)
 * - Enterprise CFO query: preferred=opus → [opus, gpt5, sonnet, gemini] (Gemini LAST!)
 */
function buildFallbackList(preferredModel: ModelAccess, tier: SubscriptionTier): ModelAccess[] {
  // Get tier-allowed models as a Set for efficient membership checks
  const allowedModelsArray = resolveAllowedModels(tier);
  const allowedModels = new Set(allowedModelsArray);

  // Free tier: only Gemini available
  if (tier === 'free') {
    return ['gemini'];
  }

  // Start with preferred model
  const fallbackOrder: ModelAccess[] = [preferredModel];

  // Add remaining specialty models in ascending cost order (GPT-5 < Sonnet < Opus)
  const costOrderedModels: ModelAccess[] = ['gpt5', 'sonnet', 'opus'];
  const specialtyModels = costOrderedModels.filter(
    m => m !== preferredModel && allowedModels.has(m)
  ) as ModelAccess[];

  fallbackOrder.push(...specialtyModels);

  // Add Gemini as FINAL fallback (free for all, unlimited for paid tiers)
  if (preferredModel !== 'gemini' && allowedModels.has('gemini')) {
    fallbackOrder.push('gemini');
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
 * Gemini uses scoutLimit for now (shared quota counter)
 */
function hasQuota(
  usage: { scoutUsed: number; sonnetUsed: number; gpt5Used: number; opusUsed: number },
  limits: { scoutLimit: number; sonnetLimit: number; gpt5Limit: number; opusLimit: number },
  model: ModelAccess
): boolean {
  switch (model) {
    case 'gemini':
      return usage.scoutUsed < limits.scoutLimit; // Gemini shares scoutLimit (50 for free, 999999 for paid)
    case 'scout':
      return usage.scoutUsed < limits.scoutLimit; // Legacy: still check scout limit
    case 'sonnet':
      return usage.sonnetUsed < limits.sonnetLimit;
    case 'gpt5':
      return usage.gpt5Used < limits.gpt5Limit;
    case 'opus':
      return usage.opusUsed < limits.opusLimit;
    default:
      return true; // Unknown models default to allowed (Gemini is free)
  }
}

/**
 * Select the best model based on complexity and tier (ignoring quotas)
 * 
 * Model Selection Strategy (Gemini-First):
 * 1. Free tier: Always Gemini (free, fast)
 * 2. Pro tier: Gemini for simple, Sonnet for complex
 * 3. Enterprise tier: Use premium models based on query type
 */
function selectModelForTier(
  signals: ComplexitySignals,
  tier: SubscriptionTier
): ModelAccess {
  const msgLower = typeof signals.message === 'string' ? signals.message.toLowerCase() : '';

  // Free tier: Always Gemini (free)
  if (tier === 'free') {
    return 'gemini';
  }

  // Pro tier: Gemini or Sonnet based on query type
  if (tier === 'pro') {
    // Sonnet for reasoning/strategy
    if (isReasoningQuery(msgLower) || shouldEscalate(signals)) {
      return 'sonnet';
    }
    // Default to Gemini for simple queries (free + fast)
    return 'gemini';
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
    // Default to Gemini (free)
    return 'gemini';
  }

  // Default fallback to Gemini
  return 'gemini';
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
 * Options for routeWithTierCheck
 */
export interface RouteOptions {
  conversationHistory?: ConversationMessage[];
  forceDeepAnalysis?: boolean; // When true, force Claude Sonnet for Pro/Enterprise users
}

/**
 * Main orchestrator: Routes AI queries with tier-based access control
 */
export async function routeWithTierCheck(
  userId: string,
  message: string,
  storage: IStorage,
  options: RouteOptions = {}
): Promise<TierAwareResponse> {
  const { conversationHistory = [], forceDeepAnalysis = false } = options;

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
    // If forceDeepAnalysis is true and user is Pro/Enterprise, force Sonnet
    let preferredModel: ModelAccess;
    if (forceDeepAnalysis && (tier === 'pro' || tier === 'enterprise')) {
      preferredModel = 'sonnet';
      console.log('[TierRouter] Deep Analysis mode forced - selecting Sonnet');
    } else {
      preferredModel = selectModelForTier(signals, tier);
    }


    // 5. Build fallback list: preferred first, then lower-priority models
    const fallbackModels = buildFallbackList(preferredModel, tier);

    // 6. Find first model with available quota (try preferred, then fall back)
    let selectedModel: ModelAccess | null = null;
    let downgradedFrom: ModelAccess | null = null;

    // TESTING MODE: Bypass quota checks and grant access to all models
    if (TESTING_MODE) {
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
      const warning = `Note: Your ${downgradedFrom} quota is exhausted. Using ${selectedModel} instead. ${getNextTier(tier) ? `Upgrade to ${getNextTier(tier)} for more ${downgradedFrom} queries.` : ''
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

  // Gemini (Google AI models) - FREE tier, uses scout quota counter
  if (slug.includes('gemini')) {
    return 'scout'; // Map gemini to scout counter for now
  }

  // Scout (Groq Llama models) - Legacy PRIMARY model
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

  // Unknown model - default to scout (free) to prevent errors
  console.warn(`[TierAwareRouter] Unknown model: ${modelSlug}, defaulting to scout tier`);
  return 'scout';
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
