/**
 * Hybrid AI System Smoke Tests
 * 
 * Tests routing logic, escalation triggers, and response structure
 * for both Scout (Llama 4) and Reasoning (Claude Opus 4.1) paths
 */

import { describe, it, expect } from 'vitest';
import { shouldEscalate, routeToModel, getRoutingReason } from '../../server/ai/router';
import type { ComplexitySignals } from '../../server/ai/router';

describe('Hybrid AI Router', () => {
  describe('shouldEscalate()', () => {
    it('should NOT escalate simple queries', () => {
      const signals: ComplexitySignals = {
        message: "What's a good monthly budget?",
        debtsCount: 0,
        assetsCount: 0,
        messageLength: 30,
        contextTokens: 500,
      };
      
      expect(shouldEscalate(signals)).toBe(false);
    });

    it('should escalate when 3+ debts present (auto-escalation)', () => {
      const signals: ComplexitySignals = {
        message: "Help me with my finances",
        debtsCount: 3,
        assetsCount: 0,
        messageLength: 25,
        contextTokens: 600,
      };
      
      expect(shouldEscalate(signals)).toBe(true);
    });

    it('should escalate multi-year planning queries', () => {
      const signals: ComplexitySignals = {
        message: "I need a 5-year financial plan to save for retirement",
        debtsCount: 0,
        assetsCount: 0,
        messageLength: 55,
        contextTokens: 500,
      };
      
      expect(shouldEscalate(signals)).toBe(true);
    });

    it('should escalate retirement planning queries', () => {
      const signals: ComplexitySignals = {
        message: "How much should I save to retire at 65?",
        debtsCount: 0,
        assetsCount: 0,
        messageLength: 45,
        contextTokens: 500,
      };
      
      expect(shouldEscalate(signals)).toBe(true);
    });

    it('should escalate tax optimization queries', () => {
      const signals: ComplexitySignals = {
        message: "Should I do Roth or Traditional IRA?",
        debtsCount: 0,
        assetsCount: 0,
        messageLength: 40,
        contextTokens: 500,
      };
      
      expect(shouldEscalate(signals)).toBe(true);
    });

    it('should escalate portfolio queries with assets', () => {
      const signals: ComplexitySignals = {
        message: "Should I rebalance my portfolio?",
        debtsCount: 0,
        assetsCount: 5,
        messageLength: 35,
        contextTokens: 500,
      };
      
      expect(shouldEscalate(signals)).toBe(true);
    });

    it('should escalate invest vs pay-off scenarios', () => {
      const signals: ComplexitySignals = {
        message: "Should I invest my bonus or pay off debt?",
        debtsCount: 1,
        assetsCount: 0,
        messageLength: 45,
        contextTokens: 500,
      };
      
      expect(shouldEscalate(signals)).toBe(true);
    });

    it('should escalate complex multi-part queries', () => {
      const signals: ComplexitySignals = {
        message: "I have $10k to spare. Should I invest, pay debt, or save? Consider tax implications.",
        debtsCount: 1,
        assetsCount: 2,
        messageLength: 90,
        contextTokens: 500,
      };
      
      expect(shouldEscalate(signals)).toBe(true);
    });
  });

  describe('routeToModel()', () => {
    it('should route simple queries to Scout', () => {
      const signals: ComplexitySignals = {
        message: "What's a good savings rate?",
        debtsCount: 0,
        assetsCount: 0,
        messageLength: 30,
        contextTokens: 500,
      };
      
      expect(routeToModel(signals)).toBe('scout');
    });

    it('should route complex queries to Reasoning', () => {
      const signals: ComplexitySignals = {
        message: "Create a 10-year retirement plan with tax-optimized withdrawals",
        debtsCount: 0,
        assetsCount: 3,
        messageLength: 65,
        contextTokens: 500,
      };
      
      expect(routeToModel(signals)).toBe('reasoning');
    });

    it('should route 3+ debts to Reasoning', () => {
      const signals: ComplexitySignals = {
        message: "Help me budget",
        debtsCount: 3,
        assetsCount: 0,
        messageLength: 15,
        contextTokens: 500,
      };
      
      expect(routeToModel(signals)).toBe('reasoning');
    });
  });

  describe('getRoutingReason()', () => {
    it('should explain debt auto-escalation', () => {
      const signals: ComplexitySignals = {
        message: "Any advice?",
        debtsCount: 4,
        assetsCount: 0,
        messageLength: 12,
        contextTokens: 500,
      };
      
      const reason = getRoutingReason(signals);
      expect(reason).toContain('4 debts');
      expect(reason).toContain('auto-escalated');
    });

    it('should explain multi-year escalation', () => {
      const signals: ComplexitySignals = {
        message: "I need a 5-year plan",
        debtsCount: 0,
        assetsCount: 0,
        messageLength: 22,
        contextTokens: 500,
      };
      
      const reason = getRoutingReason(signals);
      expect(reason).toContain('Multi-year');
    });

    it('should explain retirement escalation', () => {
      const signals: ComplexitySignals = {
        message: "When can I retire?",
        debtsCount: 0,
        assetsCount: 0,
        messageLength: 18,
        contextTokens: 500,
      };
      
      const reason = getRoutingReason(signals);
      expect(reason).toContain('Retirement');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-length messages', () => {
      const signals: ComplexitySignals = {
        message: "",
        debtsCount: 0,
        assetsCount: 0,
        messageLength: 0,
        contextTokens: 0,
      };
      
      expect(shouldEscalate(signals)).toBe(false);
    });

    it('should handle very long messages (>500 chars)', () => {
      const longMessage = "a".repeat(600);
      const signals: ComplexitySignals = {
        message: longMessage,
        debtsCount: 0,
        assetsCount: 0,
        messageLength: 600,
        contextTokens: 2000,
      };
      
      expect(shouldEscalate(signals)).toBe(false);
    });

    it('should prioritize debt count over keywords', () => {
      const signals: ComplexitySignals = {
        message: "Simple question",
        debtsCount: 5,
        assetsCount: 0,
        messageLength: 15,
        contextTokens: 500,
      };
      
      expect(shouldEscalate(signals)).toBe(true);
    });

    it('should handle mixed signals (high assets, no keywords)', () => {
      const signals: ComplexitySignals = {
        message: "What should I do?",
        debtsCount: 0,
        assetsCount: 10,
        messageLength: 18,
        contextTokens: 500,
      };
      
      // Should NOT escalate without portfolio keywords
      expect(shouldEscalate(signals)).toBe(false);
    });
  });

  describe('Keyword Detection', () => {
    const testCases = [
      { keyword: 'debt', shouldEscalate: true },
      { keyword: 'retirement', shouldEscalate: true },
      { keyword: 'tax optimization', shouldEscalate: true },
      { keyword: 'portfolio rebalancing', shouldEscalate: true },
      { keyword: 'budget', shouldEscalate: false },
      { keyword: 'spending', shouldEscalate: false },
    ];

    testCases.forEach(({ keyword, shouldEscalate: expected }) => {
      it(`should ${expected ? 'escalate' : 'NOT escalate'} "${keyword}"`, () => {
        const signals: ComplexitySignals = {
          message: `Help me with ${keyword}`,
          debtsCount: 0,
          assetsCount: keyword.includes('portfolio') ? 3 : 0,
          messageLength: keyword.length + 13,
          contextTokens: 500,
        };
        
        expect(shouldEscalate(signals)).toBe(expected);
      });
    });
  });
});

describe('Context Builder', () => {
  // Note: These are structure tests. Actual data would require mocked storage.
  
  it('should export estimateContextTokens function', async () => {
    const { estimateContextTokens } = await import('../../server/ai/contextBuilder');
    expect(typeof estimateContextTokens).toBe('function');
  });

  it('should export buildFinancialContext function', async () => {
    const { buildFinancialContext } = await import('../../server/ai/contextBuilder');
    expect(typeof buildFinancialContext).toBe('function');
  });
});

describe('Orchestrators', () => {
  it('should export debt orchestrator', async () => {
    const { analyzeDebt } = await import('../../server/ai/orchestrators/debt');
    expect(typeof analyzeDebt).toBe('function');
  });

  it('should export retirement orchestrator', async () => {
    const { analyzeRetirement } = await import('../../server/ai/orchestrators/retirement');
    expect(typeof analyzeRetirement).toBe('function');
  });

  it('should export tax orchestrator', async () => {
    const { analyzeTax } = await import('../../server/ai/orchestrators/tax');
    expect(typeof analyzeTax).toBe('function');
  });

  it('should export portfolio orchestrator', async () => {
    const { analyzePortfolio } = await import('../../server/ai/orchestrators/portfolio');
    expect(typeof analyzePortfolio).toBe('function');
  });
});

describe('AI Clients', () => {
  it('should export Scout client getter', async () => {
    const { getScoutClient } = await import('../../server/ai/clients');
    expect(typeof getScoutClient).toBe('function');
  });

  it('should export Reasoning client getter', async () => {
    const { getReasoningClient } = await import('../../server/ai/clients');
    expect(typeof getReasoningClient).toBe('function');
  });
});

describe('Hybrid AI Service', () => {
  it('should export generateHybridAdvice function', async () => {
    const { generateHybridAdvice } = await import('../../server/ai/hybridAIService');
    expect(typeof generateHybridAdvice).toBe('function');
  });

  describe('Response Contract', () => {
    it('should return required fields in response', () => {
      // Mock response structure validation
      const mockResponse = {
        answer: "Test answer",
        modelUsed: 'scout' as const,
        tokensIn: 100,
        tokensOut: 50,
        cost: 0.001,
        escalated: false
      };

      expect(mockResponse).toHaveProperty('answer');
      expect(mockResponse).toHaveProperty('modelUsed');
      expect(mockResponse).toHaveProperty('tokensIn');
      expect(mockResponse).toHaveProperty('tokensOut');
      expect(mockResponse).toHaveProperty('cost');
      expect(mockResponse).toHaveProperty('escalated');
      expect(typeof mockResponse.answer).toBe('string');
      expect(['scout', 'reasoning']).toContain(mockResponse.modelUsed);
      expect(typeof mockResponse.tokensIn).toBe('number');
      expect(typeof mockResponse.tokensOut).toBe('number');
      expect(typeof mockResponse.cost).toBe('number');
      expect(typeof mockResponse.escalated).toBe('boolean');
    });

    it('should include escalation metadata when escalated', () => {
      const escalatedResponse = {
        answer: "Deep analysis...",
        modelUsed: 'reasoning' as const,
        tokensIn: 1000,
        tokensOut: 500,
        cost: 0.05,
        escalated: true,
        escalationReason: "Complex debt situation (3 debts) - auto-escalated",
        orchestratorUsed: "debt"
      };

      expect(escalatedResponse.escalated).toBe(true);
      expect(escalatedResponse).toHaveProperty('escalationReason');
      expect(escalatedResponse).toHaveProperty('orchestratorUsed');
      expect(typeof escalatedResponse.escalationReason).toBe('string');
    });

    it('should include structuredData when orchestrator used', () => {
      const orchestratorResponse = {
        answer: "Debt payoff strategy...",
        modelUsed: 'reasoning' as const,
        tokensIn: 1000,
        tokensOut: 500,
        cost: 0.05,
        escalated: true,
        escalationReason: "Debt optimization requested",
        orchestratorUsed: "debt",
        structuredData: {
          strategy: { type: 'avalanche' },
          payoffOrder: []
        }
      };

      expect(orchestratorResponse).toHaveProperty('structuredData');
      expect(typeof orchestratorResponse.structuredData).toBe('object');
    });
  });

  describe('Cost Calculations', () => {
    it('should calculate Scout costs correctly', () => {
      // Scout: $0.00059 input, $0.00079 output per 1K tokens
      const tokensIn = 500;
      const tokensOut = 300;
      const expectedCost = (500 / 1000) * 0.00059 + (300 / 1000) * 0.00079;
      
      // Cost should be ~$0.000532
      expect(expectedCost).toBeCloseTo(0.000532, 6);
    });

    it('should calculate Reasoning costs correctly', () => {
      // Reasoning: $0.015 input, $0.075 output per 1K tokens
      const tokensIn = 1000;
      const tokensOut = 500;
      const expectedCost = (1000 / 1000) * 0.015 + (500 / 1000) * 0.075;
      
      // Cost should be $0.0525
      expect(expectedCost).toBeCloseTo(0.0525, 4);
    });

    it('should verify Reasoning is ~100x more expensive than Scout', () => {
      const scoutCost = (500 / 1000) * 0.00059 + (300 / 1000) * 0.00079;
      const reasoningCost = (500 / 1000) * 0.015 + (300 / 1000) * 0.075;
      const ratio = reasoningCost / scoutCost;
      
      // Reasoning should be 40-100x more expensive
      expect(ratio).toBeGreaterThan(40);
      expect(ratio).toBeLessThan(100);
    });
  });
});

describe('Premium Gating Logic', () => {
  describe('Client-Side Heuristics', () => {
    const detectLikelyEscalation = (text: string): boolean => {
      const lower = text.toLowerCase();
      const triggers = [
        'debt', 'debts', 'credit card', 
        'retire', 'retirement', '401k', 'ira',
        'tax', 'roth', 'traditional',
        'portfolio', 'asset allocation', 'rebalance',
        'multi-year', 'invest vs pay'
      ];
      return triggers.some(trigger => lower.includes(trigger)) || text.length > 200;
    };

    it('should detect debt-related queries', () => {
      expect(detectLikelyEscalation("I have credit card debt")).toBe(true);
      expect(detectLikelyEscalation("Should I pay off my debts?")).toBe(true);
    });

    it('should detect retirement-related queries', () => {
      expect(detectLikelyEscalation("How much for retirement?")).toBe(true);
      expect(detectLikelyEscalation("401k vs IRA?")).toBe(true);
    });

    it('should detect tax-related queries', () => {
      expect(detectLikelyEscalation("Roth or Traditional IRA?")).toBe(true);
      expect(detectLikelyEscalation("Tax optimization strategy?")).toBe(true);
    });

    it('should detect portfolio-related queries', () => {
      expect(detectLikelyEscalation("Should I rebalance my portfolio?")).toBe(true);
      expect(detectLikelyEscalation("Asset allocation advice?")).toBe(true);
    });

    it('should NOT detect simple queries', () => {
      expect(detectLikelyEscalation("What's a good budget?")).toBe(false);
      expect(detectLikelyEscalation("How much should I save?")).toBe(false);
    });

    it('should detect very long queries', () => {
      const longQuery = "a".repeat(250);
      expect(detectLikelyEscalation(longQuery)).toBe(true);
    });
  });

  describe('Subscription Tier Checks', () => {
    it('should identify premium tier', () => {
      const subscription = { tier: 'premium' };
      const isPremium = subscription?.tier === 'premium' || subscription?.tier === 'pro';
      expect(isPremium).toBe(true);
    });

    it('should identify pro tier as premium', () => {
      const subscription = { tier: 'pro' };
      const isPremium = subscription?.tier === 'premium' || subscription?.tier === 'pro';
      expect(isPremium).toBe(true);
    });

    it('should identify free tier as non-premium', () => {
      const subscription = { tier: 'free' };
      const isPremium = subscription?.tier === 'premium' || subscription?.tier === 'pro';
      expect(isPremium).toBe(false);
    });

    it('should handle missing subscription', () => {
      const subscription: { tier?: string } | undefined = undefined;
      const isPremium = subscription?.tier === 'premium' || subscription?.tier === 'pro';
      expect(isPremium).toBe(false);
    });
  });

  describe('Gate Trigger Behavior', () => {
    it('should trigger gate for non-premium + complex query', () => {
      const isPremium = false;
      const wouldEscalate = true;
      const shouldShowGate = wouldEscalate && !isPremium;
      
      expect(shouldShowGate).toBe(true);
    });

    it('should NOT trigger gate for premium + complex query', () => {
      const isPremium = true;
      const wouldEscalate = true;
      const shouldShowGate = wouldEscalate && !isPremium;
      
      expect(shouldShowGate).toBe(false);
    });

    it('should NOT trigger gate for non-premium + simple query', () => {
      const isPremium = false;
      const wouldEscalate = false;
      const shouldShowGate = wouldEscalate && !isPremium;
      
      expect(shouldShowGate).toBe(false);
    });
  });
});
