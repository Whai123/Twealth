/**
 * Tier-Aware AI Orchestrator
 * 
 * Wraps the hybrid AI service with subscription tier checking and quota enforcement.
 * Ensures users only access models they're allowed to use based on their plan.
 * 
 * Tier Access Matrix:
 * - Free: Scout only (50/month)
 * - Pro: Scout (200/month) + Sonnet (25/month)
 * - Enterprise: Scout (300/month) + Sonnet (60/month) + Opus (20/month)
 */

import type { IStorage } from '../storage';
import { generateHybridAdvice, type HybridAIResponse, type ModelAccess, type GenerateAdviceOptions } from './hybridAIService';
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
 * Map subscription tier to allowed models (in ascending order)
 */
export function resolveAllowedModels(tier: SubscriptionTier): ModelAccess[] {
  switch (tier) {
    case 'free':
      return ['scout'];
    case 'pro':
      return ['scout', 'sonnet'];
    case 'enterprise':
      return ['scout', 'sonnet', 'opus'];
    default:
      return ['scout']; // Default to most restrictive
  }
}

/**
 * Get models in descending priority order (highest to lowest)
 * Used for cascading fallback when preferred model lacks quota
 */
function getModelsByPriority(tier: SubscriptionTier): ModelAccess[] {
  switch (tier) {
    case 'free':
      return ['scout'];
    case 'pro':
      return ['sonnet', 'scout']; // Try Sonnet first, fall back to Scout
    case 'enterprise':
      return ['opus', 'sonnet', 'scout']; // Try Opus, then Sonnet, then Scout
    default:
      return ['scout'];
  }
}

/**
 * Build fallback list starting from preferred model, cascading to lower tiers
 * 
 * Examples:
 * - Enterprise simple query: preferred=scout → [scout]
 * - Enterprise complex query: preferred=opus → [opus, sonnet, scout]
 * - Pro complex query: preferred=sonnet → [sonnet, scout]
 */
function buildFallbackList(preferredModel: ModelAccess, tier: SubscriptionTier): ModelAccess[] {
  const allModelsPriority = getModelsByPriority(tier);
  
  // Find index of preferred model in priority list
  const preferredIndex = allModelsPriority.indexOf(preferredModel);
  
  if (preferredIndex === -1) {
    // Preferred not in tier (shouldn't happen), return just preferred
    return [preferredModel];
  }
  
  // Return models from preferred onwards (lower priority)
  return allModelsPriority.slice(preferredIndex);
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
 */
function hasQuota(
  usage: { scoutUsed: number; sonnetUsed: number; opusUsed: number },
  limits: { scoutLimit: number; sonnetLimit: number; opusLimit: number },
  model: ModelAccess
): boolean {
  switch (model) {
    case 'scout':
      return usage.scoutUsed < limits.scoutLimit;
    case 'sonnet':
      return usage.sonnetUsed < limits.sonnetLimit;
    case 'opus':
      return usage.opusUsed < limits.opusLimit;
    default:
      return false;
  }
}

/**
 * Select the best model based on complexity and tier (ignoring quotas)
 * 
 * Strategy:
 * - Enterprise: Opus for complex, Scout for simple
 * - Pro: Sonnet for complex, Scout for simple
 * - Free: Always Scout
 * 
 * Quota checking happens separately in routeWithTierCheck
 */
function selectModelForTier(
  signals: ComplexitySignals,
  tier: SubscriptionTier
): ModelAccess {
  const shouldEsc = shouldEscalate(signals);
  
  // Free tier: Always Scout
  if (tier === 'free') {
    return 'scout';
  }
  
  // Pro tier: Sonnet for complex, Scout for simple
  if (tier === 'pro') {
    return shouldEsc ? 'sonnet' : 'scout';
  }
  
  // Enterprise tier: Opus for complex, Scout for simple
  if (tier === 'enterprise') {
    return shouldEsc ? 'opus' : 'scout';
  }
  
  // Default fallback
  return 'scout';
}

/**
 * Main orchestrator: Routes AI queries with tier-based access control
 */
export async function routeWithTierCheck(
  userId: string,
  message: string,
  storage: IStorage
): Promise<TierAwareResponse> {
  try {
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
      opusUsed: usage?.opusQueriesUsed || 0,
    };
    
    // Plan limits
    const limits = {
      scoutLimit: plan.scoutLimit || 0,
      sonnetLimit: plan.sonnetLimit || 0,
      opusLimit: plan.opusLimit || 0,
    };
    
    // 2. Build financial context once
    const context = await buildFinancialContext(userId, storage);
    
    // 3. Create complexity signals for model selection
    const signals: ComplexitySignals = {
      message,
      debtsCount: context.debts.length,
      assetsCount: context.assets.length,
      messageLength: message.length,
      contextTokens: estimateContextTokens(context),
    };
    
    // 4. Select preferred model for tier based on complexity
    const preferredModel = selectModelForTier(signals, tier);
    
    // 5. Build fallback list: preferred first, then lower-priority models
    const fallbackModels = buildFallbackList(preferredModel, tier);
    
    // 6. Find first model with available quota (try preferred, then fall back)
    let selectedModel: ModelAccess | null = null;
    let downgradedFrom: ModelAccess | null = null;
    
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
    
    // 8. Route to AI service with selected model and pre-built context
    const options: GenerateAdviceOptions = {
      forceModel: selectedModel,
      preselectedContext: context,
      skipAutoEscalation: true, // Tier router has already decided
    };
    
    const response = await generateHybridAdvice(userId, message, storage, options);
    
    // 9. Add downgrade warning if we fell back to a lower model
    if (downgradedFrom) {
      const warning = `⚠️ Your ${downgradedFrom} quota is exhausted. Using ${selectedModel} instead. ${
        getNextTier(tier) ? `Upgrade to ${getNextTier(tier)} for more ${downgradedFrom} queries.` : ''
      }`;
      response.answer = `${warning}\n\n${response.answer}`;
      response.tierDowngraded = true;
    }
    
    // 7. Track usage synchronously
    try {
      await trackUsage(userId, message, response, subscription.id, tier, storage);
      
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
 * Determine model type from model slug
 * Throws error for unknown models to prevent silent quota theft
 */
function determineModelFromSlug(modelSlug: string): 'scout' | 'sonnet' | 'opus' {
  const slug = modelSlug.toLowerCase();
  
  // Scout (Groq Llama models)
  if (slug.includes('llama') || slug.includes('scout') || slug.includes('groq')) {
    return 'scout';
  }
  
  // Sonnet (Claude Sonnet models)
  if (slug.includes('sonnet')) {
    return 'sonnet';
  }
  
  // Opus (Claude Opus models)
  if (slug.includes('opus')) {
    return 'opus';
  }
  
  // Unknown Anthropic model - log warning and default to Opus tier
  if (slug.includes('claude')) {
    console.warn(`[TierAwareRouter] Unknown Claude model: ${modelSlug}, defaulting to Opus tier`);
    return 'opus';
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
