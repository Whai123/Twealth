import type { IStorage } from './storage';

interface ConversationMemory {
  financialPriorities?: string[];
  investmentPreferences?: string[];
  lifeEvents?: { event: string; timeframe?: string }[];
  spendingHabits?: string[];
  riskTolerance?: string;
  lastUpdated?: string;
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

    // Update memory if anything changed
    if (updated) {
      const newMemory: ConversationMemory = {
        ...(priorities.length > 0 && { financialPriorities: priorities }),
        ...(investments.length > 0 && { investmentPreferences: investments }),
        ...(lifeEvents.length > 0 && { lifeEvents }),
        ...(habits.length > 0 && { spendingHabits: habits }),
        ...(riskTolerance && { riskTolerance }),
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

    if (parts.length === 0) {
      return '';
    }

    return `\n\nREMEMBERED USER CONTEXT (from previous conversations):\n${parts.join('\n')}`;
  } catch (error) {
    console.error('[ConversationMemory] Get context failed:', error);
    return '';
  }
}
