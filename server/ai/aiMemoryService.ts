/**
 * AI Memory Service - Long-term Learning from User Interactions
 * 
 * This service enables the AI to:
 * 1. Remember facts about users across sessions (long-term memory)
 * 2. Detect and track spending patterns
 * 3. Learn and adapt to user communication preferences
 */

import { db } from '../db';
import {
    aiUserMemories,
    aiSpendingPatterns,
    aiCommunicationPrefs,
    transactions,
    type AiUserMemory,
    type AiSpendingPattern,
    type AiCommunicationPrefs
} from '@shared/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════════════════════
// LONG-TERM MEMORY - Facts about Users
// ═══════════════════════════════════════════════════════════════════════════

interface ExtractedFact {
    factType: 'preference' | 'life_event' | 'financial_goal' | 'context' | 'personal';
    factKey: string;
    factValue: string;
    confidence: number;
}

/**
 * Extract facts from AI response using pattern matching
 * Called after each AI response to learn from the conversation
 */
export function extractFactsFromConversation(
    userMessage: string,
    aiResponse: string
): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const msgLower = userMessage.toLowerCase();

    // Pattern matching for common facts
    const patterns: Array<{
        regex: RegExp;
        factType: ExtractedFact['factType'];
        factKey: string;
        extract: (match: RegExpMatchArray) => string;
    }> = [
            // Job/profession
            {
                regex: /(?:i am|i'm|i work as|my job is|my profession is) (?:a |an )?(\w+(?:\s+\w+)?)/i,
                factType: 'personal',
                factKey: 'job_title',
                extract: (m) => m[1],
            },
            // Family mentions
            {
                regex: /my (?:wife|husband|spouse|partner)(?:'s name is|,?\s+)(\w+)/i,
                factType: 'personal',
                factKey: 'spouse_name',
                extract: (m) => m[1],
            },
            {
                regex: /i have (\d+) (?:kids?|children)/i,
                factType: 'personal',
                factKey: 'number_of_children',
                extract: (m) => m[1],
            },
            // Age
            {
                regex: /i(?:'m| am) (\d{2,3}) years old/i,
                factType: 'personal',
                factKey: 'age',
                extract: (m) => m[1],
            },
            // Location
            {
                regex: /i live in (\w+(?:\s+\w+)?(?:,\s*\w+)?)/i,
                factType: 'context',
                factKey: 'location',
                extract: (m) => m[1],
            },
            // Income mentions
            {
                regex: /(?:my |i )(?:earn|make|salary is|income is)[^\d]*(\d[\d,]*)/i,
                factType: 'financial_goal',
                factKey: 'mentioned_income',
                extract: (m) => m[1].replace(/,/g, ''),
            },
            // Investment preferences
            {
                regex: /i (?:prefer|like|want) (?:to invest in |)(\w+(?:\s+\w+)?)(?: investments?| stocks?)?/i,
                factType: 'preference',
                factKey: 'investment_preference',
                extract: (m) => m[1],
            },
            // Risk tolerance
            {
                regex: /(?:i am|i'm) (?:a )?(conservative|moderate|aggressive) investor/i,
                factType: 'preference',
                factKey: 'risk_tolerance',
                extract: (m) => m[1],
            },
            // Life events
            {
                regex: /(?:i'm |we're |we are )(?:planning to |going to )?(get(?:ting)? married|hav(?:e|ing) a baby|buying a house|retir(?:e|ing))/i,
                factType: 'life_event',
                factKey: 'upcoming_life_event',
                extract: (m) => m[1],
            },
        ];

    for (const pattern of patterns) {
        const match = userMessage.match(pattern.regex);
        if (match) {
            facts.push({
                factType: pattern.factType,
                factKey: pattern.factKey,
                factValue: pattern.extract(match),
                confidence: 0.85,
            });
        }
    }

    return facts;
}

/**
 * Store a memory fact for a user (upsert - update if exists)
 */
export async function storeMemory(
    userId: string,
    fact: ExtractedFact
): Promise<void> {
    try {
        await db
            .insert(aiUserMemories)
            .values({
                userId,
                factType: fact.factType,
                factKey: fact.factKey,
                factValue: fact.factValue,
                confidence: fact.confidence.toFixed(2),
                source: 'conversation',
                mentionCount: 1,
            })
            .onConflictDoUpdate({
                target: [aiUserMemories.userId, aiUserMemories.factKey],
                set: {
                    factValue: fact.factValue,
                    confidence: sql`LEAST(1.0, ${aiUserMemories.confidence} + 0.05)`, // Increase confidence with each mention
                    lastMentionedAt: sql`NOW()`,
                    mentionCount: sql`${aiUserMemories.mentionCount} + 1`,
                },
            });
    } catch (error) {
        console.error('[AIMemory] Error storing memory:', error);
    }
}

/**
 * Get all memories for a user (for AI context)
 */
export async function getUserMemories(userId: string): Promise<AiUserMemory[]> {
    try {
        return await db
            .select()
            .from(aiUserMemories)
            .where(eq(aiUserMemories.userId, userId))
            .orderBy(desc(aiUserMemories.confidence), desc(aiUserMemories.mentionCount));
    } catch (error) {
        console.error('[AIMemory] Error fetching memories:', error);
        return [];
    }
}

/**
 * Build memory context string for AI prompts
 */
export async function buildMemoryContextForPrompt(userId: string): Promise<string> {
    const memories = await getUserMemories(userId);

    if (memories.length === 0) {
        return '';
    }

    // Group memories by type
    const grouped: Record<string, AiUserMemory[]> = {};
    for (const mem of memories) {
        if (!grouped[mem.factType]) grouped[mem.factType] = [];
        grouped[mem.factType].push(mem);
    }

    let context = '\n**🧠 USER MEMORY (Facts you\'ve learned about this user):**\n';

    if (grouped.personal?.length) {
        context += '**Personal:**\n';
        for (const m of grouped.personal.slice(0, 5)) {
            context += `- ${formatFactKey(m.factKey)}: ${m.factValue}\n`;
        }
    }

    if (grouped.preference?.length) {
        context += '**Preferences:**\n';
        for (const m of grouped.preference.slice(0, 5)) {
            context += `- ${formatFactKey(m.factKey)}: ${m.factValue}\n`;
        }
    }

    if (grouped.life_event?.length) {
        context += '**Upcoming Life Events:**\n';
        for (const m of grouped.life_event.slice(0, 3)) {
            context += `- ${m.factValue}\n`;
        }
    }

    if (grouped.financial_goal?.length) {
        context += '**Financial Context:**\n';
        for (const m of grouped.financial_goal.slice(0, 3)) {
            context += `- ${formatFactKey(m.factKey)}: ${m.factValue}\n`;
        }
    }

    context += '\n**IMPORTANT:** Use these memories naturally in your responses. Reference their name, job, or situation when relevant.\n';

    return context;
}

function formatFactKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ═══════════════════════════════════════════════════════════════════════════
// SPENDING PATTERN ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

interface SpendingPatternData {
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    lastAmount?: number;
    percentChange?: number;
    prediction?: number;
}

/**
 * Analyze user's spending patterns from transaction history
 * Called periodically or after bulk transaction imports
 */
export async function analyzeSpendingPatterns(userId: string): Promise<void> {
    try {
        // Get last 6 months of transactions
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const userTransactions = await db
            .select()
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, userId),
                    eq(transactions.type, 'expense'),
                    gte(transactions.date, sixMonthsAgo)
                )
            )
            .orderBy(desc(transactions.date));

        if (userTransactions.length < 5) {
            return; // Not enough data for pattern analysis
        }

        // Group by category
        const byCategory: Record<string, { amounts: number[]; dates: Date[] }> = {};
        for (const tx of userTransactions) {
            const cat = tx.category || 'Other';
            if (!byCategory[cat]) byCategory[cat] = { amounts: [], dates: [] };
            byCategory[cat].amounts.push(parseFloat(tx.amount));
            byCategory[cat].dates.push(tx.date);
        }

        // Analyze each category
        for (const [category, data] of Object.entries(byCategory)) {
            if (data.amounts.length < 3) continue;

            const average = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
            const lastAmount = data.amounts[0];

            // Calculate trend (compare first half to second half)
            const midpoint = Math.floor(data.amounts.length / 2);
            const firstHalfAvg = data.amounts.slice(midpoint).reduce((a, b) => a + b, 0) / (data.amounts.length - midpoint);
            const secondHalfAvg = data.amounts.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;

            let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
            const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
            if (changePercent > 10) trend = 'increasing';
            else if (changePercent < -10) trend = 'decreasing';

            // Determine frequency based on transaction count and date spread
            const daySpread = (data.dates[0].getTime() - data.dates[data.dates.length - 1].getTime()) / (1000 * 60 * 60 * 24);
            const avgDaysBetween = daySpread / data.amounts.length;

            let frequency: SpendingPatternData['frequency'] = 'monthly';
            if (avgDaysBetween <= 2) frequency = 'daily';
            else if (avgDaysBetween <= 10) frequency = 'weekly';
            else if (avgDaysBetween <= 45) frequency = 'monthly';
            else frequency = 'quarterly';

            // Simple prediction (average with trend adjustment)
            const prediction = average * (1 + changePercent / 100);

            const patternData: SpendingPatternData = {
                average: Math.round(average),
                trend,
                frequency,
                lastAmount: Math.round(lastAmount),
                percentChange: Math.round(changePercent),
                prediction: Math.round(prediction),
            };

            // Upsert pattern
            await db
                .insert(aiSpendingPatterns)
                .values({
                    userId,
                    patternType: 'trend',
                    category,
                    patternData,
                    confidence: '0.75',
                })
                .onConflictDoUpdate({
                    target: [aiSpendingPatterns.userId, aiSpendingPatterns.patternType, aiSpendingPatterns.category],
                    set: {
                        patternData,
                        updatedAt: sql`NOW()`,
                    },
                });
        }
    } catch (error) {
        console.error('[AIMemory] Error analyzing spending patterns:', error);
    }
}

/**
 * Get spending patterns for AI context
 */
export async function getSpendingPatterns(userId: string): Promise<AiSpendingPattern[]> {
    try {
        return await db
            .select()
            .from(aiSpendingPatterns)
            .where(eq(aiSpendingPatterns.userId, userId))
            .orderBy(desc(aiSpendingPatterns.confidence));
    } catch (error) {
        console.error('[AIMemory] Error fetching spending patterns:', error);
        return [];
    }
}

/**
 * Build spending pattern context for AI prompts
 */
export async function buildSpendingPatternContext(userId: string): Promise<string> {
    const patterns = await getSpendingPatterns(userId);

    if (patterns.length === 0) {
        return '';
    }

    let context = '\n**📊 SPENDING PATTERNS (Detected from transaction history):**\n';

    for (const p of patterns.slice(0, 6)) {
        const data = p.patternData as SpendingPatternData;
        const trendEmoji = data.trend === 'increasing' ? '📈' : data.trend === 'decreasing' ? '📉' : '➡️';
        context += `- **${p.category}**: Avg ${data.average}/mo ${trendEmoji} (${data.trend}), ${data.frequency} spending\n`;
        if (data.prediction && data.percentChange) {
            context += `  └─ Predicted next: ${data.prediction} (${data.percentChange > 0 ? '+' : ''}${data.percentChange}%)\n`;
        }
    }

    context += '\n**Use these patterns to provide personalized budgeting advice and spending predictions.**\n';

    return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMUNICATION STYLE LEARNING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get or create communication preferences for a user
 */
export async function getCommunicationPrefs(userId: string): Promise<AiCommunicationPrefs | null> {
    try {
        const [prefs] = await db
            .select()
            .from(aiCommunicationPrefs)
            .where(eq(aiCommunicationPrefs.userId, userId));

        if (!prefs) {
            // Create default preferences
            const [newPrefs] = await db
                .insert(aiCommunicationPrefs)
                .values({ userId })
                .returning();
            return newPrefs;
        }

        return prefs;
    } catch (error) {
        console.error('[AIMemory] Error fetching communication prefs:', error);
        return null;
    }
}

/**
 * Update communication preferences based on user feedback
 */
export async function updateCommunicationPrefs(
    userId: string,
    updates: Partial<{
        adviceLength: string;
        communicationStyle: string;
        usesEmoji: boolean;
        technicalLevel: string;
        topicsOfInterest: string[];
        positiveSignal: boolean;
        negativeSignal: boolean;
    }>
): Promise<void> {
    try {
        const updateObj: Record<string, any> = { updatedAt: sql`NOW()` };

        if (updates.adviceLength) updateObj.adviceLength = updates.adviceLength;
        if (updates.communicationStyle) updateObj.communicationStyle = updates.communicationStyle;
        if (updates.usesEmoji !== undefined) updateObj.usesEmoji = updates.usesEmoji;
        if (updates.technicalLevel) updateObj.technicalLevel = updates.technicalLevel;
        if (updates.topicsOfInterest) updateObj.topicsOfInterest = updates.topicsOfInterest;

        if (updates.positiveSignal) {
            updateObj.positiveSignals = sql`${aiCommunicationPrefs.positiveSignals} + 1`;
            updateObj.lastFeedbackAt = sql`NOW()`;
        }
        if (updates.negativeSignal) {
            updateObj.negativeSignals = sql`${aiCommunicationPrefs.negativeSignals} + 1`;
            updateObj.lastFeedbackAt = sql`NOW()`;
        }

        await db
            .update(aiCommunicationPrefs)
            .set(updateObj)
            .where(eq(aiCommunicationPrefs.userId, userId));
    } catch (error) {
        console.error('[AIMemory] Error updating communication prefs:', error);
    }
}

/**
 * Build communication style instruction for AI prompts
 */
export async function buildCommunicationStyleInstruction(userId: string): Promise<string> {
    const prefs = await getCommunicationPrefs(userId);

    if (!prefs) {
        return '';
    }

    let instruction = '\n**🎨 USER COMMUNICATION PREFERENCES:**\n';

    // Length preference
    switch (prefs.adviceLength) {
        case 'brief':
            instruction += '- Keep responses SHORT and to the point (2-3 sentences max)\n';
            break;
        case 'detailed':
            instruction += '- Provide DETAILED explanations with examples and context\n';
            break;
        default:
            instruction += '- Use balanced response length (not too short, not too long)\n';
    }

    // Style preference
    switch (prefs.communicationStyle) {
        case 'professional':
            instruction += '- Use PROFESSIONAL tone (formal language, no slang)\n';
            break;
        case 'casual':
            instruction += '- Use CASUAL, relaxed tone (like talking to a friend)\n';
            break;
        default:
            instruction += '- Use FRIENDLY tone (warm but informative)\n';
    }

    // Emoji preference
    if (prefs.usesEmoji) {
        instruction += '- Feel free to use relevant emojis 😊\n';
    } else {
        instruction += '- Do NOT use emojis in responses\n';
    }

    // Technical level
    switch (prefs.technicalLevel) {
        case 'beginner':
            instruction += '- Explain financial terms simply (assume no prior knowledge)\n';
            break;
        case 'expert':
            instruction += '- Use technical financial terminology freely\n';
            break;
        default:
            instruction += '- Balance technical accuracy with accessibility\n';
    }

    // Topics of interest
    const topics = prefs.topicsOfInterest as string[] | null;
    if (topics && topics.length > 0) {
        instruction += `- User is particularly interested in: ${topics.join(', ')}\n`;
    }

    return instruction;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CONTEXT BUILDER - Combines all AI learning
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build complete AI learning context for prompts
 * This combines memory, patterns, and style preferences
 */
export async function buildAILearningContext(userId: string): Promise<{
    memoryContext: string;
    patternContext: string;
    styleInstruction: string;
    fullContext: string;
}> {
    const [memoryContext, patternContext, styleInstruction] = await Promise.all([
        buildMemoryContextForPrompt(userId),
        buildSpendingPatternContext(userId),
        buildCommunicationStyleInstruction(userId),
    ]);

    const fullContext = `
═══════════════════════════════════════════════════════════════════════════
🧠 AI LEARNING CONTEXT (Personalization based on past interactions)
═══════════════════════════════════════════════════════════════════════════
${memoryContext}
${patternContext}
${styleInstruction}
═══════════════════════════════════════════════════════════════════════════
`;

    return {
        memoryContext,
        patternContext,
        styleInstruction,
        fullContext,
    };
}

/**
 * Process conversation and update learning
 * Called after each AI response
 */
export async function processConversationForLearning(
    userId: string,
    userMessage: string,
    aiResponse: string
): Promise<void> {
    // Extract and store facts from the conversation
    const facts = extractFactsFromConversation(userMessage, aiResponse);

    for (const fact of facts) {
        await storeMemory(userId, fact);
    }

    // Log for debugging
    if (facts.length > 0) {
        console.log(`[AIMemory] Extracted ${facts.length} facts for user ${userId}:`,
            facts.map(f => `${f.factKey}: ${f.factValue}`));
    }
}
