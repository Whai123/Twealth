/**
 * Proactive Financial Coach - Intelligent Insights Generator
 * 
 * Analyzes user data and generates personalized coaching insights:
 * 1. Daily financial tips based on spending patterns
 * 2. Weekly progress summaries
 * 3. Milestone celebrations
 * 4. Risk alerts (overspending, goal at risk, etc.)
 * 5. Opportunity suggestions (investment timing, debt payoff, etc.)
 */

import type { IStorage } from '../storage';
import { buildFinancialContext, type FinancialContext } from './contextBuilder';

export interface CoachingInsight {
    type: 'tip' | 'alert' | 'milestone' | 'opportunity' | 'summary';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    action?: string;
    actionLabel?: string;
    data?: Record<string, any>;
    createdAt: Date;
    expiresAt?: Date;
}

/**
 * Generate daily personalized insights for a user
 */
export async function generateDailyInsights(
    userId: string,
    storage: IStorage
): Promise<CoachingInsight[]> {
    const insights: CoachingInsight[] = [];
    const context = await buildFinancialContext(userId, storage);
    const now = new Date();

    // 1. Check savings rate
    const savingsRateInsight = analyzeSavingsRate(context);
    if (savingsRateInsight) insights.push(savingsRateInsight);

    // 2. Check emergency fund
    const emergencyFundInsight = analyzeEmergencyFund(context);
    if (emergencyFundInsight) insights.push(emergencyFundInsight);

    // 3. Check goals at risk
    const goalInsights = analyzeGoalsAtRisk(context);
    insights.push(...goalInsights);

    // 4. Check debt opportunities
    const debtInsight = analyzeDebtOpportunities(context);
    if (debtInsight) insights.push(debtInsight);

    // 5. Check spending anomalies
    const spendingInsights = analyzeSpendingAnomalies(context);
    insights.push(...spendingInsights);

    // 6. Net worth milestone check
    const milestoneInsight = checkNetWorthMilestones(context);
    if (milestoneInsight) insights.push(milestoneInsight);

    // 7. Day-specific tips
    const dayTip = getDaySpecificTip(now.getDay(), context);
    if (dayTip) insights.push(dayTip);

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return insights.slice(0, 5); // Return top 5 insights
}

/**
 * Analyze savings rate and provide coaching
 */
function analyzeSavingsRate(context: FinancialContext): CoachingInsight | null {
    const { savingsRate } = context.analytics;
    const monthlyIncome = context.income.monthlyNet;
    const monthlySurplus = monthlyIncome - context.expenses.monthly;

    if (monthlyIncome <= 0) return null;

    if (savingsRate < 0) {
        return {
            type: 'alert',
            priority: 'critical',
            title: '⚠️ Negative Cash Flow',
            message: `You're spending ${Math.abs(savingsRate)}% more than you earn. This month you're ${Math.abs(monthlySurplus).toLocaleString()} in the red.`,
            action: '/ai-assistant?prompt=Help me reduce my spending',
            actionLabel: 'Get Help',
            data: { savingsRate, monthlySurplus },
            createdAt: new Date()
        };
    }

    if (savingsRate < 10) {
        const targetSavings = Math.round(monthlyIncome * 0.15);
        const currentSavings = Math.round(monthlyIncome * savingsRate / 100);
        const gap = targetSavings - currentSavings;

        return {
            type: 'tip',
            priority: 'high',
            title: '💡 Boost Your Savings Rate',
            message: `You're saving ${savingsRate}% of income. Aim for 15%+ by saving an extra ${gap.toLocaleString()}/month. Try the 50/30/20 rule.`,
            action: '/ai-assistant?prompt=How can I save more money',
            actionLabel: 'Get a Plan',
            data: { savingsRate, targetSavings, gap },
            createdAt: new Date()
        };
    }

    if (savingsRate >= 30) {
        return {
            type: 'milestone',
            priority: 'low',
            title: '🎉 Excellent Savings Rate!',
            message: `You're saving ${savingsRate}% of income - that's better than 95% of people! Consider investing more for compound growth.`,
            action: '/ai-assistant?prompt=How should I invest my savings',
            actionLabel: 'Investment Ideas',
            data: { savingsRate },
            createdAt: new Date()
        };
    }

    return null;
}

/**
 * Analyze emergency fund status
 */
function analyzeEmergencyFund(context: FinancialContext): CoachingInsight | null {
    const { emergencyFundMonths } = context.analytics;
    const monthlyExpenses = context.expenses.monthly;

    if (monthlyExpenses <= 0) return null;

    const targetMonths = 6;
    const cashAssets = context.assets.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.value, 0);

    if (emergencyFundMonths < 1) {
        const needed = Math.round(monthlyExpenses * 3);
        return {
            type: 'alert',
            priority: 'critical',
            title: '🚨 Emergency Fund Critical',
            message: `You have less than 1 month of expenses saved. Build a ${needed.toLocaleString()} emergency fund (3 months) as your top priority.`,
            action: '/ai-assistant?prompt=Help me build an emergency fund',
            actionLabel: 'Build Plan',
            data: { emergencyFundMonths, needed, cashAssets },
            createdAt: new Date()
        };
    }

    if (emergencyFundMonths < 3) {
        const needed = Math.round(monthlyExpenses * 3) - cashAssets;
        return {
            type: 'tip',
            priority: 'high',
            title: '💰 Grow Your Safety Net',
            message: `You have ${emergencyFundMonths.toFixed(1)} months saved. Add ${needed.toLocaleString()} to reach the 3-month minimum.`,
            action: '/goals',
            actionLabel: 'Set Goal',
            data: { emergencyFundMonths, needed },
            createdAt: new Date()
        };
    }

    if (emergencyFundMonths >= 6) {
        return {
            type: 'milestone',
            priority: 'low',
            title: '🛡️ Emergency Fund Complete!',
            message: `You have ${emergencyFundMonths.toFixed(1)} months of expenses saved. Consider investing the excess for growth.`,
            data: { emergencyFundMonths, cashAssets },
            createdAt: new Date()
        };
    }

    return null;
}

/**
 * Analyze goals that are at risk of missing their deadline
 */
function analyzeGoalsAtRisk(context: FinancialContext): CoachingInsight[] {
    const insights: CoachingInsight[] = [];
    const atRiskGoals = context.goals.filter(g => !g.onTrack && g.horizonMonths > 0 && g.progressPercent < 100);

    for (const goal of atRiskGoals.slice(0, 2)) {
        const monthlyGap = goal.monthlyRequired - (context.income.monthlyNet - context.expenses.monthly);

        insights.push({
            type: 'alert',
            priority: goal.horizonMonths < 6 ? 'high' : 'medium',
            title: `⚠️ ${goal.name} At Risk`,
            message: `You need ${goal.monthlyRequired.toLocaleString()}/month but can only save ${(context.income.monthlyNet - context.expenses.monthly).toLocaleString()}. ${goal.horizonMonths} months left.`,
            action: '/goals',
            actionLabel: 'View Goal',
            data: {
                goalName: goal.name,
                monthlyRequired: goal.monthlyRequired,
                progressPercent: goal.progressPercent,
                horizonMonths: goal.horizonMonths
            },
            createdAt: new Date()
        });
    }

    // Check for goals close to completion
    const almostDone = context.goals.filter(g => g.progressPercent >= 80 && g.progressPercent < 100);
    for (const goal of almostDone.slice(0, 1)) {
        const remaining = goal.target - goal.current;
        insights.push({
            type: 'opportunity',
            priority: 'medium',
            title: `🎯 Almost There: ${goal.name}`,
            message: `You're ${goal.progressPercent}% there! Just ${remaining.toLocaleString()} more to complete this goal.`,
            action: '/goals',
            actionLabel: 'View Goal',
            data: { goalName: goal.name, remaining, progressPercent: goal.progressPercent },
            createdAt: new Date()
        });
    }

    return insights;
}

/**
 * Analyze debt and find payoff opportunities
 */
function analyzeDebtOpportunities(context: FinancialContext): CoachingInsight | null {
    if (context.debts.length === 0) return null;

    // Find highest interest debt
    const sortedDebts = [...context.debts].sort((a, b) => b.apr - a.apr);
    const highestAPR = sortedDebts[0];
    const monthlySurplus = context.income.monthlyNet - context.expenses.monthly;

    if (highestAPR.apr > 15 && monthlySurplus > 0) {
        // Calculate interest savings if they pay extra
        const extraPayment = Math.min(monthlySurplus * 0.5, highestAPR.balance * 0.1);
        const monthsSaved = Math.round(extraPayment / (highestAPR.balance * highestAPR.apr / 100 / 12));

        return {
            type: 'opportunity',
            priority: 'high',
            title: '💸 Attack High-Interest Debt',
            message: `Your ${highestAPR.name} at ${highestAPR.apr}% is costing you ${Math.round(highestAPR.balance * highestAPR.apr / 100 / 12).toLocaleString()}/month in interest. Adding ${Math.round(extraPayment).toLocaleString()}/month extra saves months of payments.`,
            action: '/ai-assistant?prompt=Create a debt payoff plan',
            actionLabel: 'Get Plan',
            data: {
                debtName: highestAPR.name,
                apr: highestAPR.apr,
                balance: highestAPR.balance,
                extraPayment: Math.round(extraPayment)
            },
            createdAt: new Date()
        };
    }

    // No high-interest debt but has debt
    const totalDebt = context.debts.reduce((sum, d) => sum + d.balance, 0);
    const avgAPR = context.debts.reduce((sum, d) => sum + d.apr, 0) / context.debts.length;

    if (totalDebt > 0 && avgAPR < 8) {
        return {
            type: 'tip',
            priority: 'low',
            title: '✅ Debt Under Control',
            message: `Your average interest rate is ${avgAPR.toFixed(1)}% - that's manageable. Consider investing extra money instead of accelerating low-rate debt payoff.`,
            data: { totalDebt, avgAPR },
            createdAt: new Date()
        };
    }

    return null;
}

/**
 * Analyze spending anomalies from the analytics
 */
function analyzeSpendingAnomalies(context: FinancialContext): CoachingInsight[] {
    const insights: CoachingInsight[] = [];
    const anomalies = context.analytics.categoryAnomalies;

    for (const anomaly of anomalies.slice(0, 2)) {
        if (anomaly.severity === 'high' || anomaly.percentChange > 50) {
            insights.push({
                type: 'alert',
                priority: anomaly.severity === 'high' ? 'high' : 'medium',
                title: `📈 ${anomaly.category} Spending Up`,
                message: `${anomaly.percentChange}% higher than usual (${anomaly.currentAmount.toLocaleString()} vs ${anomaly.averageAmount.toLocaleString()} avg). Review these transactions.`,
                action: '/my-money',
                actionLabel: 'Review',
                data: {
                    category: anomaly.category,
                    currentAmount: anomaly.currentAmount,
                    averageAmount: anomaly.averageAmount,
                    percentChange: anomaly.percentChange
                },
                createdAt: new Date()
            });
        }
    }

    // Check spending trend direction
    const { spendingTrends } = context.analytics;
    if (spendingTrends.direction === 'up' && spendingTrends.monthOverMonthChange > 15) {
        insights.push({
            type: 'alert',
            priority: 'medium',
            title: '📊 Spending Trend Alert',
            message: `Overall spending is up ${spendingTrends.monthOverMonthChange}% vs last month (${spendingTrends.currentMonth.toLocaleString()} vs ${spendingTrends.lastMonth.toLocaleString()}).`,
            action: '/my-money',
            actionLabel: 'Analyze',
            data: spendingTrends,
            createdAt: new Date()
        });
    }

    return insights;
}

/**
 * Check for net worth milestones
 */
function checkNetWorthMilestones(context: FinancialContext): CoachingInsight | null {
    const netWorth = context.analytics.netWorth;

    const milestones = [100000, 250000, 500000, 750000, 1000000, 2000000, 5000000, 10000000];

    for (const milestone of milestones) {
        // Check if close to reaching a milestone (within 5%)
        if (netWorth >= milestone * 0.95 && netWorth < milestone) {
            const remaining = milestone - netWorth;
            return {
                type: 'opportunity',
                priority: 'low',
                title: `🎯 Close to ${(milestone / 1000).toFixed(0)}K Milestone!`,
                message: `You're just ${remaining.toLocaleString()} away from a ${(milestone / 1000).toFixed(0)}K net worth. Keep going!`,
                data: { netWorth, milestone, remaining },
                createdAt: new Date()
            };
        }

        // Just crossed a milestone
        if (netWorth >= milestone && netWorth < milestone * 1.05) {
            return {
                type: 'milestone',
                priority: 'medium',
                title: `🎉 ${(milestone / 1000).toFixed(0)}K Net Worth Achieved!`,
                message: `Congratulations! You've hit a major financial milestone. Your net worth is now ${netWorth.toLocaleString()}.`,
                data: { netWorth, milestone },
                createdAt: new Date()
            };
        }
    }

    return null;
}

/**
 * Get day-specific financial tips
 */
function getDaySpecificTip(dayOfWeek: number, context: FinancialContext): CoachingInsight | null {
    const tips: Record<number, CoachingInsight> = {
        // Sunday - Weekly reflection
        0: {
            type: 'tip',
            priority: 'low',
            title: '📅 Sunday Money Check-In',
            message: 'Review your spending from last week and plan your budget for the week ahead. Small weekly reviews prevent big surprises.',
            action: '/my-money',
            actionLabel: 'Review Week',
            createdAt: new Date()
        },
        // Monday - Fresh start
        1: {
            type: 'tip',
            priority: 'low',
            title: '🌅 Monday Money Mindset',
            message: 'Set one financial micro-goal for this week. Maybe pack lunch twice or skip one impulse purchase. Small wins compound!',
            createdAt: new Date()
        },
        // Friday - Weekend prep
        5: {
            type: 'tip',
            priority: 'low',
            title: '🎉 Weekend Budget Check',
            message: 'Weekends account for ~40% of discretionary spending. Set a weekend budget before making plans to avoid overspending.',
            createdAt: new Date()
        },
        // First of month
        // (handled separately in caller)
    };

    // Check if first of month
    const today = new Date();
    if (today.getDate() === 1) {
        return {
            type: 'summary',
            priority: 'medium',
            title: '📊 New Month, Fresh Start',
            message: `It's the 1st! Review last month's spending vs budget, update your goals, and set intentions for this month.`,
            action: '/dashboard',
            actionLabel: 'View Dashboard',
            createdAt: new Date()
        };
    }

    // Check if payday (15th or last day of month)
    if (today.getDate() === 15 || today.getDate() === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()) {
        const monthlyIncome = context.income.monthlyNet;
        const suggested50 = Math.round(monthlyIncome * 0.5);
        const suggested30 = Math.round(monthlyIncome * 0.3);
        const suggested20 = Math.round(monthlyIncome * 0.2);

        return {
            type: 'tip',
            priority: 'medium',
            title: '💰 Payday Strategy',
            message: `Automate your savings first! With ${monthlyIncome.toLocaleString()} income, try: ${suggested50.toLocaleString()} needs, ${suggested30.toLocaleString()} wants, ${suggested20.toLocaleString()} savings/debt.`,
            action: '/ai-assistant?prompt=Help me set up automatic savings',
            actionLabel: 'Get Help',
            data: { monthlyIncome, suggested50, suggested30, suggested20 },
            createdAt: new Date()
        };
    }

    return tips[dayOfWeek] || null;
}

/**
 * Generate a personalized weekly financial summary
 */
export async function generateWeeklySummary(
    userId: string,
    storage: IStorage
): Promise<CoachingInsight> {
    const context = await buildFinancialContext(userId, storage);

    const { spendingTrends, savingsRate, netWorth, goalProgress } = context.analytics;

    let summary = '';
    let priority: CoachingInsight['priority'] = 'medium';

    // Spending summary
    if (spendingTrends.currentMonth > 0) {
        const vsLastMonth = spendingTrends.monthOverMonthChange;
        const direction = vsLastMonth > 0 ? 'up' : vsLastMonth < 0 ? 'down' : 'same as';
        summary += `Spending ${direction} ${Math.abs(vsLastMonth)}% vs last month. `;
        if (vsLastMonth > 20) priority = 'high';
    }

    // Savings summary
    summary += `Savings rate: ${savingsRate}%. `;

    // Goals summary
    if (goalProgress.totalGoals > 0) {
        summary += `Goals: ${goalProgress.onTrackGoals}/${goalProgress.totalGoals} on track. `;
        if (goalProgress.atRiskGoals > 0) {
            summary += `${goalProgress.atRiskGoals} at risk! `;
            priority = 'high';
        }
    }

    // Net worth change (estimated weekly)
    const weeklyChange = (context.income.monthlyNet - context.expenses.monthly) / 4;
    summary += `Est. weekly net worth change: ${weeklyChange >= 0 ? '+' : ''}${Math.round(weeklyChange).toLocaleString()}.`;

    return {
        type: 'summary',
        priority,
        title: '📊 Your Weekly Financial Summary',
        message: summary,
        action: '/dashboard',
        actionLabel: 'View Details',
        data: {
            spendingTrends,
            savingsRate,
            netWorth,
            goalProgress,
            weeklyChange: Math.round(weeklyChange)
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
    };
}

/**
 * Get a single smart insight for the dashboard greeting
 */
export async function getSmartGreeting(
    userId: string,
    storage: IStorage
): Promise<{ greeting: string; insight: string; emoji: string }> {
    const context = await buildFinancialContext(userId, storage);
    const hour = new Date().getHours();

    // Time-based greeting
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    // Generate smart insight
    let insight = '';
    let emoji = '👋';

    const { savingsRate, emergencyFundMonths, netWorth, goalProgress } = context.analytics;

    // Priority-based insight selection
    if (savingsRate < 0) {
        insight = "You're spending more than you earn this month. Let's fix that together.";
        emoji = '⚠️';
    } else if (emergencyFundMonths < 1) {
        insight = "Building your emergency fund should be priority #1 right now.";
        emoji = '🚨';
    } else if (goalProgress.atRiskGoals > 0) {
        insight = `${goalProgress.atRiskGoals} of your goals need attention. Let's get you back on track.`;
        emoji = '🎯';
    } else if (savingsRate >= 20) {
        insight = `Great savings rate at ${savingsRate}%! You're building wealth faster than most.`;
        emoji = '🌟';
    } else if (netWorth > 0) {
        insight = `Your net worth is ${netWorth.toLocaleString()}. Every day you're building toward financial freedom.`;
        emoji = '📈';
    } else {
        insight = "I'm here to help you take control of your finances. What would you like to work on?";
        emoji = '💪';
    }

    return { greeting, insight, emoji };
}
