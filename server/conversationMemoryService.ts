import type { IStorage } from './storage';

interface ConversationMemory {
  financialPriorities?: string[];
  investmentPreferences?: string[];
  lifeEvents?: { event: string; timeframe?: string }[];
  spendingHabits?: string[];
  riskTolerance?: string;
  lastUpdated?: string;
  // Enhanced memory features
  adviceHistory?: Array<{
    topic: string;
    advice: string;
    date: string;
    outcome?: 'followed' | 'ignored' | 'modified' | 'pending';
  }>;
  financialLiteracyLevel?: 'beginner' | 'intermediate' | 'advanced';
  emotionalState?: {
    recentStressIndicators?: string[];
    recentWins?: string[];
    lastAssessed?: string;
  };
  preferredDetailLevel?: 'brief' | 'detailed' | 'comprehensive';
  followUpTopics?: string[]; // Topics where we need to check back with user
}

export async function extractAndUpdateMemory(
  storage: IStorage,
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<void> {
  try {
    const messageLower = userMessage.toLowerCase();
    const responseLower = aiResponse.toLowerCase();
    const combinedText = `${messageLower} ${responseLower}`;

    // Get existing memory
    const prefs = await storage.getUserPreferences(userId);
    const existingMemory: ConversationMemory = (prefs?.conversationMemory as ConversationMemory) || {};

    let updated = false;

    // Extract financial priorities
    const priorities: string[] = [...(existingMemory.financialPriorities || [])];
    
    if (messageLower.includes('saving for') || messageLower.includes('want to buy')) {
      const savingMatch = messageLower.match(/saving for (?:a |an )?(\w+(?:\s+\w+)?)/i);
      if (savingMatch && !priorities.includes(savingMatch[1])) {
        priorities.push(`saving for ${savingMatch[1]}`);
        updated = true;
      }
    }

    if (messageLower.includes('planning') || messageLower.includes('plan to')) {
      const planMatch = messageLower.match(/plan(?:ning)? (?:to |for )?(\w+(?:\s+\w+)?)/i);
      if (planMatch && !priorities.includes(planMatch[1])) {
        priorities.push(`planning ${planMatch[1]}`);
        updated = true;
      }
    }

    if (messageLower.includes('retire') || messageLower.includes('retirement')) {
      if (!priorities.includes('retirement planning')) {
        priorities.push('retirement planning');
        updated = true;
      }
    }

    // Extract investment preferences
    const investments: string[] = [...(existingMemory.investmentPreferences || [])];

    if (combinedText.includes('conservative') && combinedText.includes('invest')) {
      if (!investments.includes('prefers conservative investments')) {
        investments.push('prefers conservative investments');
        updated = true;
      }
    }

    if (combinedText.includes('aggressive') && combinedText.includes('invest')) {
      if (!investments.includes('prefers aggressive investments')) {
        investments.push('prefers aggressive investments');
        updated = true;
      }
    }

    if (combinedText.includes('tech stock') || combinedText.includes('technology stock')) {
      if (!investments.includes('interested in tech stocks')) {
        investments.push('interested in tech stocks');
        updated = true;
      }
    }

    if (combinedText.includes('index fund') || combinedText.includes('etf')) {
      if (!investments.includes('interested in index funds/ETFs')) {
        investments.push('interested in index funds/ETFs');
        updated = true;
      }
    }

    if (combinedText.includes('crypto') || combinedText.includes('bitcoin') || combinedText.includes('ethereum')) {
      if (!investments.includes('interested in cryptocurrency')) {
        investments.push('interested in cryptocurrency');
        updated = true;
      }
    }

    // Extract life events
    const lifeEvents: { event: string; timeframe?: string }[] = [...(existingMemory.lifeEvents || [])];

    if (messageLower.includes('getting married') || messageLower.includes('wedding')) {
      const yearMatch = messageLower.match(/\b(202[4-9]|20[3-9]\d)\b/);
      const event = { event: 'getting married', timeframe: yearMatch ? yearMatch[1] : undefined };
      if (!lifeEvents.some(e => e.event === 'getting married')) {
        lifeEvents.push(event);
        updated = true;
      }
    }

    if (messageLower.includes('baby') || messageLower.includes('expecting') || messageLower.includes('pregnant')) {
      const event = { event: 'expecting baby', timeframe: undefined };
      if (!lifeEvents.some(e => e.event === 'expecting baby')) {
        lifeEvents.push(event);
        updated = true;
      }
    }

    if (messageLower.includes('buying house') || messageLower.includes('buying a house') || messageLower.includes('house purchase')) {
      const event = { event: 'buying house', timeframe: undefined };
      if (!lifeEvents.some(e => e.event === 'buying house')) {
        lifeEvents.push(event);
        updated = true;
      }
    }

    if (messageLower.includes('graduating') || messageLower.includes('graduation')) {
      const event = { event: 'graduating', timeframe: undefined };
      if (!lifeEvents.some(e => e.event === 'graduating')) {
        lifeEvents.push(event);
        updated = true;
      }
    }

    if (messageLower.includes('new job') || messageLower.includes('changing job') || messageLower.includes('career change')) {
      const event = { event: 'career change', timeframe: undefined };
      if (!lifeEvents.some(e => e.event === 'career change')) {
        lifeEvents.push(event);
        updated = true;
      }
    }

    // Extract spending habits
    const habits: string[] = [...(existingMemory.spendingHabits || [])];

    if (combinedText.includes('eat out') || combinedText.includes('dining out') || combinedText.includes('restaurant')) {
      if (!habits.includes('eats out frequently')) {
        habits.push('eats out frequently');
        updated = true;
      }
    }

    if (combinedText.includes('online shopping') || combinedText.includes('amazon')) {
      if (!habits.includes('shops online frequently')) {
        habits.push('shops online frequently');
        updated = true;
      }
    }

    if (combinedText.includes('impulse buy') || combinedText.includes('impulse purchase')) {
      if (!habits.includes('impulse buyer')) {
        habits.push('impulse buyer');
        updated = true;
      }
    }

    if (combinedText.includes('budgets carefully') || combinedText.includes('track every expense')) {
      if (!habits.includes('careful budgeter')) {
        habits.push('careful budgeter');
        updated = true;
      }
    }

    // Extract risk tolerance
    let riskTolerance = existingMemory.riskTolerance;

    if (!riskTolerance) {
      if (combinedText.includes('risk-averse') || combinedText.includes('low risk') || combinedText.includes('safe investments')) {
        riskTolerance = 'conservative';
        updated = true;
      } else if (combinedText.includes('moderate risk') || combinedText.includes('balanced')) {
        riskTolerance = 'moderate';
        updated = true;
      } else if (combinedText.includes('high risk') || combinedText.includes('aggressive')) {
        riskTolerance = 'aggressive';
        updated = true;
      }
    }

    // Detect financial literacy level from language complexity
    let financialLiteracyLevel = existingMemory.financialLiteracyLevel;
    if (!financialLiteracyLevel) {
      const advancedTerms = ['etf', 'rebalancing', 'asset allocation', 'tax-loss harvesting', 'dividend yield', 'p/e ratio', 'market cap', 'arbitrage', 'derivatives', 'options trading', 'short selling'];
      const intermediateTerms = ['401k', 'roth ira', 'index fund', 'compound interest', 'expense ratio', 'diversification', 'bonds', 'mutual fund'];
      const advancedCount = advancedTerms.filter(term => messageLower.includes(term)).length;
      const intermediateCount = intermediateTerms.filter(term => messageLower.includes(term)).length;
      
      if (advancedCount >= 2) {
        financialLiteracyLevel = 'advanced';
        updated = true;
      } else if (intermediateCount >= 2 || advancedCount >= 1) {
        financialLiteracyLevel = 'intermediate';
        updated = true;
      } else if (messageLower.includes("what is") || messageLower.includes("explain") || messageLower.includes("i don't understand") || messageLower.includes("confused about")) {
        financialLiteracyLevel = 'beginner';
        updated = true;
      }
    }

    // Detect emotional state - stress indicators and wins
    const emotionalState = existingMemory.emotionalState ?? { recentStressIndicators: [], recentWins: [] };
    const stressIndicators: string[] = [...(emotionalState.recentStressIndicators || [])];
    const recentWins: string[] = [...(emotionalState.recentWins || [])];

    // Stress detection
    const stressPatterns = [
      { pattern: /can't (afford|pay|save)/i, label: 'affordability concern' },
      { pattern: /worried|anxious|stressed|scared/i, label: 'financial anxiety' },
      { pattern: /debt.*overwhelming|drowning in debt/i, label: 'debt stress' },
      { pattern: /emergency|unexpected expense|crisis/i, label: 'financial emergency' },
      { pattern: /lost.*job|laid off|unemployed/i, label: 'income loss' },
      { pattern: /behind on (payments|bills)/i, label: 'payment struggles' },
    ];

    for (const { pattern, label } of stressPatterns) {
      if (pattern.test(messageLower) && !stressIndicators.includes(label)) {
        stressIndicators.push(label);
        updated = true;
      }
    }

    // Win detection - celebrate achievements
    const winPatterns = [
      { pattern: /paid off|debt.free/i, label: 'paid off debt' },
      { pattern: /saved (up|enough)|reached.*goal/i, label: 'reached savings goal' },
      { pattern: /got.*raise|promotion|new job.*higher/i, label: 'income increase' },
      { pattern: /emergency fund.*complete|fully funded/i, label: 'emergency fund complete' },
      { pattern: /first.*investment|started investing/i, label: 'started investing' },
      { pattern: /under budget|saved more than/i, label: 'budget success' },
    ];

    for (const { pattern, label } of winPatterns) {
      if (pattern.test(combinedText) && !recentWins.includes(label)) {
        recentWins.push(label);
        updated = true;
      }
    }

    // Extract advice topics from AI response for tracking
    const adviceHistory = [...(existingMemory.adviceHistory || [])].slice(-10); // Keep last 10
    const adviceTopics = [
      { pattern: /recommend.*saving|should save/i, topic: 'savings' },
      { pattern: /recommend.*invest|should invest/i, topic: 'investing' },
      { pattern: /recommend.*pay.*debt|debt.*strategy/i, topic: 'debt payoff' },
      { pattern: /recommend.*budget|budget.*strategy/i, topic: 'budgeting' },
      { pattern: /emergency fund|rainy day/i, topic: 'emergency fund' },
      { pattern: /retirement|401k|ira/i, topic: 'retirement' },
      { pattern: /tax.*strategy|tax.*saving/i, topic: 'tax optimization' },
    ];

    for (const { pattern, topic } of adviceTopics) {
      if (pattern.test(aiResponse.toLowerCase())) {
        const recentAdvice = adviceHistory.find(a => a.topic === topic && 
          new Date(a.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (!recentAdvice) {
          adviceHistory.push({
            topic,
            advice: aiResponse.slice(0, 200), // Store summary
            date: new Date().toISOString(),
            outcome: 'pending'
          });
          updated = true;
        }
      }
    }

    // Update memory if anything changed
    if (updated) {
      const newMemory: ConversationMemory = {
        ...(priorities.length > 0 && { financialPriorities: priorities }),
        ...(investments.length > 0 && { investmentPreferences: investments }),
        ...(lifeEvents.length > 0 && { lifeEvents }),
        ...(habits.length > 0 && { spendingHabits: habits }),
        ...(riskTolerance && { riskTolerance }),
        ...(financialLiteracyLevel && { financialLiteracyLevel }),
        ...((stressIndicators.length > 0 || recentWins.length > 0) && {
          emotionalState: {
            recentStressIndicators: stressIndicators.slice(-5),
            recentWins: recentWins.slice(-5),
            lastAssessed: new Date().toISOString()
          }
        }),
        ...(adviceHistory.length > 0 && { adviceHistory }),
        lastUpdated: new Date().toISOString()
      };

      await storage.updateUserPreferences(userId, {
        conversationMemory: newMemory as any
      });
    }
  } catch (error) {
    console.error('[ConversationMemory] Update failed:', error);
    // Memory update failures shouldn't break the chat
  }
}

export async function getMemoryContext(storage: IStorage, userId: string): Promise<string> {
  try {
    const prefs = await storage.getUserPreferences(userId);
    const memory: ConversationMemory = (prefs?.conversationMemory as ConversationMemory) || {};

    if (!memory || Object.keys(memory).length === 0) {
      return '';
    }

    const parts: string[] = [];

    if (memory.financialPriorities && memory.financialPriorities.length > 0) {
      parts.push(`Financial priorities: ${memory.financialPriorities.join(', ')}`);
    }

    if (memory.investmentPreferences && memory.investmentPreferences.length > 0) {
      parts.push(`Investment preferences: ${memory.investmentPreferences.join(', ')}`);
    }

    if (memory.lifeEvents && memory.lifeEvents.length > 0) {
      const events = memory.lifeEvents.map(e => 
        e.timeframe ? `${e.event} (${e.timeframe})` : e.event
      ).join(', ');
      parts.push(`Life events: ${events}`);
    }

    if (memory.spendingHabits && memory.spendingHabits.length > 0) {
      parts.push(`Spending habits: ${memory.spendingHabits.join(', ')}`);
    }

    if (memory.riskTolerance) {
      parts.push(`Risk tolerance: ${memory.riskTolerance}`);
    }

    // Enhanced memory fields
    if (memory.financialLiteracyLevel) {
      parts.push(`Financial expertise level: ${memory.financialLiteracyLevel}`);
    }

    if (memory.emotionalState) {
      if (memory.emotionalState.recentStressIndicators && memory.emotionalState.recentStressIndicators.length > 0) {
        parts.push(`Recent stress indicators: ${memory.emotionalState.recentStressIndicators.join(', ')} - BE SUPPORTIVE AND EMPATHETIC`);
      }
      if (memory.emotionalState.recentWins && memory.emotionalState.recentWins.length > 0) {
        parts.push(`Recent wins to celebrate: ${memory.emotionalState.recentWins.join(', ')} - ACKNOWLEDGE AND ENCOURAGE`);
      }
    }

    if (memory.adviceHistory && memory.adviceHistory.length > 0) {
      const recentAdvice = memory.adviceHistory.slice(-3).map(a => 
        `${a.topic} (${new Date(a.date).toLocaleDateString()})`
      ).join(', ');
      parts.push(`Recent advice given: ${recentAdvice} - FOLLOW UP on pending items and maintain consistency`);
    }

    if (parts.length === 0) {
      return '';
    }

    return `\n\nREMEMBERED USER CONTEXT (from previous conversations):\n${parts.join('\n')}`;
  } catch (error) {
    console.error('[ConversationMemory] Get context failed:', error);
    return '';
  }
}
