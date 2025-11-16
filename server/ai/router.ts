/**
 * Smart Router - Decides whether to use Scout or Reasoning model
 * 
 * Escalation Rules (5-10% of traffic goes to Reasoning):
 * - Multi-year financial projections (10y, 20y, 30y)
 * - Debt payoff ordering (3+ debt accounts)
 * - Invest vs. payoff simulations
 * - Tax strategy (Roth vs Traditional, bracket optimization)
 * - Retirement glidepath planning
 * - Portfolio optimization
 * - Multi-scenario comparisons (2+ scenarios)
 * - Complex context (high token count or multiple financial products)
 * 
 * Default: Scout for fast, cheap queries
 */

export interface ComplexitySignals {
  message: string;
  messageLength: number;
  debtsCount?: number;
  assetsCount?: number;
  goalsCount?: number;
  contextTokens?: number;
}

export type RouteDecision = 'scout' | 'reasoning';

/**
 * Keywords that trigger escalation to Reasoning model
 */
const ESCALATION_KEYWORDS = {
  // Multi-year planning
  multiYear: [
    '10 year', '10-year', '10year',
    '15 year', '15-year', '15year',
    '20 year', '20-year', '20year',
    '25 year', '25-year', '25year',
    '30 year', '30-year', '30year',
    'long term', 'long-term',
    'decade',
  ],
  
  // Debt optimization
  debtOptimization: [
    'debt payoff order',
    'which debt first',
    'snowball',
    'avalanche',
    'pay off debt',
    'debt strategy',
    'multiple debt',
    'all my debt',
  ],
  
  // Invest vs payoff
  investVsPayoff: [
    'invest or pay',
    'invest vs pay',
    'pay off or invest',
    'debt or invest',
    'investing vs debt',
  ],
  
  // Tax strategy
  taxStrategy: [
    'roth',
    'traditional ira',
    'tax bracket',
    'tax optimization',
    'tax strategy',
    'tax planning',
    'tax efficient',
  ],
  
  // Retirement planning
  retirement: [
    'retire',
    'retirement',
    'glidepath',
    'target date',
    '401k',
    'pension',
  ],
  
  // Portfolio optimization
  portfolio: [
    'portfolio',
    'asset allocation',
    'rebalance',
    'diversif',
    'risk tolerance',
    'modern portfolio',
  ],
  
  // Scenario comparison
  scenarios: [
    'compare',
    'versus',
    'vs.',
    'which is better',
    'should i',
    'option',
    'scenario',
  ],
  
  // Complex analysis
  complex: [
    'optimize',
    'optimal',
    'best strategy',
    'maximize',
    'minimize',
    'calculate',
  ],
};

/**
 * Check if message contains any keywords from a category
 */
function containsKeywords(message: string, keywords: string[]): boolean {
  const lowerMsg = typeof message === 'string' ? message.toLowerCase() : '';
  return keywords.some(keyword => lowerMsg.includes(keyword));
}

/**
 * Count how many scenario indicators are in the message
 */
function countScenarios(message: string): number {
  const scenarioIndicators = [
    'option 1', 'option 2', 'option 3',
    'scenario 1', 'scenario 2', 'scenario 3',
    'first option', 'second option', 'third option',
    'or', 'versus', 'vs.', 'compared to',
  ];
  
  let count = 0;
  const lowerMsg = typeof message === 'string' ? message.toLowerCase() : '';
  
  for (const indicator of scenarioIndicators) {
    if (lowerMsg.includes(indicator)) {
      count++;
    }
  }
  
  // If we found "or" or "versus", that suggests at least 2 scenarios
  if (count > 0 && (lowerMsg.includes(' or ') || lowerMsg.includes('versus') || lowerMsg.includes('vs.'))) {
    count = Math.max(count, 2);
  }
  
  return count;
}

/**
 * Determine if query should be escalated to Reasoning model
 */
export function shouldEscalate(signals: ComplexitySignals): boolean {
  const {
    message,
    messageLength,
    debtsCount = 0,
    assetsCount = 0,
    goalsCount = 0,
    contextTokens = 0,
  } = signals;
  
  // Rule 1: Multi-year planning triggers
  if (containsKeywords(message, ESCALATION_KEYWORDS.multiYear)) {
    return true;
  }
  
  // Rule 2: User has 3+ debts (auto-escalate for complex debt analysis regardless of keywords)
  if (debtsCount >= 3) {
    return true;
  }
  
  // Rule 3: Invest vs. payoff questions
  if (containsKeywords(message, ESCALATION_KEYWORDS.investVsPayoff)) {
    return true;
  }
  
  // Rule 4: Tax strategy
  if (containsKeywords(message, ESCALATION_KEYWORDS.taxStrategy)) {
    return true;
  }
  
  // Rule 5: Retirement planning
  if (containsKeywords(message, ESCALATION_KEYWORDS.retirement)) {
    return true;
  }
  
  // Rule 6: Portfolio optimization
  if (containsKeywords(message, ESCALATION_KEYWORDS.portfolio)) {
    return true;
  }
  
  // Rule 7: Multi-scenario comparisons (2+ scenarios)
  const scenarioCount = countScenarios(message);
  if (scenarioCount >= 2) {
    return true;
  }
  
  // Rule 8: Complex analysis with financial products
  if (containsKeywords(message, ESCALATION_KEYWORDS.complex)) {
    // Only escalate complex queries if user has debts OR assets
    if (debtsCount > 0 || assetsCount > 0) {
      return true;
    }
  }
  
  // Rule 9: Long messages with multiple financial products
  if (messageLength > 220 && (debtsCount > 0 || assetsCount > 0)) {
    return true;
  }
  
  // Rule 10: High context token count (very detailed financial situation)
  if (contextTokens > 2000) {
    return true;
  }
  
  // Default: Use Scout
  return false;
}

/**
 * Route to appropriate model based on complexity
 */
export function routeToModel(signals: ComplexitySignals): RouteDecision {
  return shouldEscalate(signals) ? 'reasoning' : 'scout';
}

/**
 * Get explanation for routing decision (for debugging/logging)
 */
export function getRoutingReason(signals: ComplexitySignals): string {
  const { message, debtsCount = 0, assetsCount = 0, messageLength, contextTokens = 0 } = signals;
  
  if (containsKeywords(message, ESCALATION_KEYWORDS.multiYear)) {
    return 'Multi-year planning detected';
  }
  if (debtsCount >= 3) {
    return `Complex debt situation (${debtsCount} debts) - auto-escalated`;
  }
  if (containsKeywords(message, ESCALATION_KEYWORDS.investVsPayoff)) {
    return 'Invest vs. payoff analysis';
  }
  if (containsKeywords(message, ESCALATION_KEYWORDS.taxStrategy)) {
    return 'Tax strategy planning';
  }
  if (containsKeywords(message, ESCALATION_KEYWORDS.retirement)) {
    return 'Retirement planning';
  }
  if (containsKeywords(message, ESCALATION_KEYWORDS.portfolio)) {
    return 'Portfolio optimization';
  }
  
  const scenarioCount = countScenarios(message);
  if (scenarioCount >= 2) {
    return `Multi-scenario comparison (${scenarioCount} scenarios)`;
  }
  
  if (containsKeywords(message, ESCALATION_KEYWORDS.complex) && (debtsCount > 0 || assetsCount > 0)) {
    return 'Complex analysis with financial products';
  }
  if (messageLength > 220 && (debtsCount > 0 || assetsCount > 0)) {
    return 'Long detailed query with financial products';
  }
  if (contextTokens > 2000) {
    return 'High context complexity';
  }
  
  return 'Simple query - using Scout';
}
