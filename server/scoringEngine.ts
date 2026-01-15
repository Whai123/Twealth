/**
 * WORLD-CLASS FINANCIAL SCORING ENGINE
 * 4-Pillar System with Explainability
 * 
 * Pillars:
 * 1. Cashflow Resilience (25%) - Are you living within means?
 * 2. Stability & Risk (30%) - Are you protected from emergencies?
 * 3. Wealth Growth (25%) - Are you building wealth?
 * 4. Behavioral Alpha (20%) - Are you consistent with good habits?
 */

import type { IStorage } from './storage';
import type { ScoreBand, ScoreDrivers, MonthlyFinancials, InsertScoreSnapshot } from '@shared/schema';

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Clamp value between 0 and 1 */
const clamp = (x: number, min = 0, max = 1): number => Math.max(min, Math.min(max, x));

/** Safe division - prevent division by zero */
const safeDivide = (num: number, den: number): number => num / Math.max(den, 1);

/** Calculate standard deviation */
const std = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const squareDiffs = arr.map(x => Math.pow(x - avg, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / arr.length);
};

/** Calculate average */
const avg = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
};

/** Get score band from 0-100 score */
const getBand = (score: number): ScoreBand => {
    if (score >= 80) return 'Great';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Critical';
};

// ═══════════════════════════════════════════════════════════════════════════
// MONTHLY ROLLUP - Aggregate transactions into monthly_financials
// ═══════════════════════════════════════════════════════════════════════════

export async function rollupMonthlyFinancials(
    storage: IStorage,
    userId: string,
    month: Date
): Promise<void> {
    // Normalize to first of month
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);

    // Get all transactions for this month
    const transactions = await storage.getTransactionsByUserId(userId, 1000);
    const monthTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= monthStart && d < monthEnd;
    });

    // Calculate aggregates
    let incomeCents = 0;
    let expenseCents = 0;
    let fixedExpenseCents = 0;
    let investmentContribCents = 0;

    const fixedCategories = ['rent', 'mortgage', 'insurance', 'subscription', 'utilities', 'loan'];
    const investCategories = ['investment', 'savings', '401k', 'ira', 'stocks', 'crypto'];

    for (const t of monthTxns) {
        const amountCents = Math.round(parseFloat(t.amount) * 100);
        const categoryLower = t.category.toLowerCase();

        if (t.type === 'income') {
            incomeCents += amountCents;
        } else if (t.type === 'expense') {
            expenseCents += amountCents;

            // Check if fixed expense
            if (fixedCategories.some(fc => categoryLower.includes(fc))) {
                fixedExpenseCents += amountCents;
            }
        } else if (t.type === 'transfer' && t.destination) {
            // Investment contributions
            if (investCategories.some(ic => t.destination?.toLowerCase().includes(ic))) {
                investmentContribCents += amountCents;
            }
        }
    }

    // Get debt and emergency fund from user data
    const [debts, profile, goals] = await Promise.all([
        storage.getUserDebts(userId),
        storage.getUserFinancialProfile(userId),
        storage.getFinancialGoalsByUserId(userId)
    ]);

    const totalDebtCents = debts.reduce((sum, d) => sum + Math.round(parseFloat(d.balance) * 100), 0);
    const emergencyFundCents = Math.round(parseFloat(profile?.emergencyFund || '0') * 100);

    // Upsert monthly financials
    await storage.upsertMonthlyFinancials({
        userId,
        month: monthStart,
        incomeCents,
        expenseCents,
        fixedExpenseCents,
        emergencyFundCents,
        totalDebtCents,
        investmentContribCents,
        insuredAmountCents: 0, // TODO: Add insurance tracking
        transactionCount: monthTxns.length,
        updatedAt: new Date()
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING ENGINE - Compute 4 pillars + composite index
// ═══════════════════════════════════════════════════════════════════════════

export interface ScoreResult {
    cashflowScore: number;
    stabilityScore: number;
    growthScore: number;
    behaviorScore: number;
    twealthIndex: number;
    band: ScoreBand;
    confidence: number;
    drivers: ScoreDrivers;
    components: any;
}

export async function computeScores(
    storage: IStorage,
    userId: string,
    targetMonth?: Date
): Promise<ScoreResult> {
    const month = targetMonth || new Date();
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);

    // Get last 6 months of data
    const sixMonthsAgo = new Date(monthStart);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await storage.getMonthlyFinancials(userId, sixMonthsAgo, monthStart);

    // Sort by month descending
    monthlyData.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());

    const latest = monthlyData[0] || {
        incomeCents: 0,
        expenseCents: 0,
        fixedExpenseCents: 0,
        emergencyFundCents: 0,
        totalDebtCents: 0,
        investmentContribCents: 0,
        insuredAmountCents: 0,
        transactionCount: 0
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PILLAR 1: CASHFLOW RESILIENCE (25%)
    // ═══════════════════════════════════════════════════════════════════════

    const income = latest.incomeCents;
    const expense = latest.expenseCents;
    const fixed = latest.fixedExpenseCents;

    // Net ratio: (income - expense) / income
    const netRatio = safeDivide(income - expense, income);

    // Fixed ratio: fixed expenses / income
    const fixedRatio = safeDivide(fixed, income);

    // Income volatility: std(income) / avg(income) over 6 months
    const incomeHistory = monthlyData.map(m => m.incomeCents);
    const incomeVol = safeDivide(std(incomeHistory), avg(incomeHistory));

    // Normalize to 0-1
    const A = clamp((netRatio + 0.20) / 0.40); // Savings margin
    const B = clamp(1 - fixedRatio / 0.70); // Fixed cost control
    const C = clamp(1 - incomeVol / 0.60); // Income stability

    // Weighted score
    const cashflowScore = Math.round(100 * (0.55 * A + 0.30 * B + 0.15 * C));

    // Drivers for cashflow
    const cashflowDrivers: string[] = [];
    const cashflowAction: string[] = [];

    if (A < 0.35) {
        cashflowDrivers.push('Savings rate is low (cashflow is tight)');
        cashflowAction.push(`Increase savings by cutting expenses or boosting income`);
    }
    if (B < 0.35) {
        cashflowDrivers.push('Fixed costs are high relative to income');
        cashflowAction.push('Review fixed costs: subscriptions, rent, insurance');
    }
    if (C < 0.35) {
        cashflowDrivers.push('Income is volatile month-to-month');
        cashflowAction.push('Build 3-6 month buffer for income gaps');
    }
    if (cashflowDrivers.length === 0) {
        cashflowDrivers.push('Cashflow is healthy and sustainable');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PILLAR 2: STABILITY & RISK (30%)
    // ═══════════════════════════════════════════════════════════════════════

    const emergencyFund = latest.emergencyFundCents;
    const totalDebt = latest.totalDebtCents;
    const insured = latest.insuredAmountCents;

    // Liquidity coverage: emergency fund / monthly expenses (in months)
    const liquidityCoverage = safeDivide(emergencyFund, expense);
    const L = clamp(Math.log(liquidityCoverage + 1) / Math.log(7)); // Log scale, 6 months = 1.0

    // Debt leverage: total debt / annual income
    const annualIncome = avg(monthlyData.slice(0, 3).map(m => m.incomeCents)) * 12;
    const leverage = safeDivide(totalDebt, annualIncome);
    const D = clamp(Math.exp(-1.2 * leverage)); // Exponential decay

    // Protection ratio: insured amount / annual expenses
    const protectionRatio = safeDivide(insured, expense * 12);
    const P = clamp(protectionRatio);

    // Weighted score
    const stabilityScore = Math.round(100 * (0.55 * L + 0.35 * D + 0.10 * P));

    // Drivers for stability
    const stabilityDrivers: string[] = [];
    const stabilityAction: string[] = [];

    if (L < 0.35) {
        const monthsCovered = liquidityCoverage.toFixed(1);
        stabilityDrivers.push(`Emergency fund covers only ${monthsCovered} months`);
        stabilityAction.push('Build emergency fund to 3-6 months of expenses');
    }
    if (D < 0.35) {
        const debtToIncome = (leverage * 100).toFixed(0);
        stabilityDrivers.push(`Debt-to-income ratio is ${debtToIncome}%`);
        stabilityAction.push('Focus on paying down highest-interest debt first');
    }
    if (P < 0.35 && insured === 0) {
        stabilityDrivers.push('No insurance protection detected');
        stabilityAction.push('Consider health, life, or disability insurance');
    }
    if (stabilityDrivers.length === 0) {
        stabilityDrivers.push('Strong financial safety net in place');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PILLAR 3: WEALTH GROWTH QUALITY (25%)
    // ═══════════════════════════════════════════════════════════════════════

    const investContrib = latest.investmentContribCents;

    // Saving rate: (income - expense) / income
    const savingRate = safeDivide(income - expense, income);
    const S = clamp(savingRate / 0.25); // 25% savings = 1.0

    // Investment rate: investment contributions / income
    const investRate = safeDivide(investContrib, income);
    const I = clamp(investRate / 0.15); // 15% invest = 1.0

    // Income growth: avg(last 3) vs avg(prev 3)
    const last3Income = avg(monthlyData.slice(0, 3).map(m => m.incomeCents));
    const prev3Income = avg(monthlyData.slice(3, 6).map(m => m.incomeCents));
    const incomeGrowth = safeDivide(last3Income - prev3Income, prev3Income);
    const G = clamp((incomeGrowth + 0.10) / 0.30); // -10% to +20%

    // Consistency: months with investment in last 6
    const investMonths = monthlyData.filter(m => m.investmentContribCents > 0).length;
    const consistency = investMonths / Math.max(monthlyData.length, 1);
    const Co = clamp(consistency);

    // Weighted score
    const growthScore = Math.round(100 * (0.35 * S + 0.30 * I + 0.15 * G + 0.20 * Co));

    // Drivers for growth
    const growthDrivers: string[] = [];
    const growthAction: string[] = [];

    if (S < 0.35) {
        const srPct = (savingRate * 100).toFixed(0);
        growthDrivers.push(`Savings rate is ${srPct}% (target: 20%+)`);
        growthAction.push('Automate savings: set up automatic transfers on payday');
    }
    if (I < 0.35) {
        growthDrivers.push('Investment contributions are low');
        growthAction.push('Start with $100/month into index funds');
    }
    if (Co < 0.35) {
        growthDrivers.push('Investment contributions are inconsistent');
        growthAction.push('Set up recurring investments for consistency');
    }
    if (growthDrivers.length === 0) {
        growthDrivers.push('Strong wealth-building habits');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PILLAR 4: BEHAVIORAL ALPHA (20%)
    // ═══════════════════════════════════════════════════════════════════════

    // Logging consistency: months with transactions in last 3
    const loggingMonths = monthlyData.slice(0, 3).filter(m => m.transactionCount > 0).length;
    const loggingConsistency = loggingMonths / 3;
    const Ba = clamp(loggingConsistency);

    // Budget adherence: 1 - (expense/income - 1) clamped
    // If expense <= income, good. If expense > income, bad.
    const budgetAdherence = 1 - clamp(safeDivide(expense, income) - 1, 0, 1);
    const Bc = clamp(budgetAdherence);

    // Weighted score
    const behaviorScore = Math.round(100 * (0.55 * Bc + 0.45 * Ba));

    // Drivers for behavior
    const behaviorDrivers: string[] = [];
    const behaviorAction: string[] = [];

    if (Ba < 0.35) {
        behaviorDrivers.push('Transaction logging is inconsistent');
        behaviorAction.push('Log transactions daily or connect your accounts');
    }
    if (Bc < 0.35) {
        behaviorDrivers.push('Spending exceeds income');
        behaviorAction.push('Create a monthly budget and track against it');
    }
    if (behaviorDrivers.length === 0) {
        behaviorDrivers.push('Excellent financial habits');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMPOSITE INDEX
    // ═══════════════════════════════════════════════════════════════════════

    const twealthIndex = Math.round(
        0.25 * cashflowScore +
        0.30 * stabilityScore +
        0.25 * growthScore +
        0.20 * behaviorScore
    );

    const band = getBand(twealthIndex);

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIDENCE (data coverage)
    // ═══════════════════════════════════════════════════════════════════════

    // Base confidence on months of data
    let confidence = clamp(monthlyData.length / 6);

    // Reduce confidence if missing key data
    if (emergencyFund === 0) confidence *= 0.9;
    if (monthlyData.every(m => m.investmentContribCents === 0)) confidence *= 0.95;

    confidence = Math.round(confidence * 1000) / 1000; // 3 decimal places

    // ═══════════════════════════════════════════════════════════════════════
    // OVERALL DRIVERS
    // ═══════════════════════════════════════════════════════════════════════

    // Find weakest pillar
    const pillars = [
        { name: 'cashflow', score: cashflowScore, drivers: cashflowDrivers, action: cashflowAction[0] || '' },
        { name: 'stability', score: stabilityScore, drivers: stabilityDrivers, action: stabilityAction[0] || '' },
        { name: 'growth', score: growthScore, drivers: growthDrivers, action: growthAction[0] || '' },
        { name: 'behavior', score: behaviorScore, drivers: behaviorDrivers, action: behaviorAction[0] || '' }
    ];

    const weakest = pillars.reduce((min, p) => p.score < min.score ? p : min);

    const overallDrivers = [
        `Your Twealth Index is ${twealthIndex}/100 (${band})`,
        `Weakest area: ${weakest.name} (${weakest.score}/100)`,
        ...weakest.drivers.slice(0, 1)
    ];

    const overallAction = weakest.action || 'Keep up the great work!';

    const drivers: ScoreDrivers = {
        cashflow: { drivers: cashflowDrivers, action: cashflowAction[0] || 'Maintain healthy cashflow' },
        stability: { drivers: stabilityDrivers, action: stabilityAction[0] || 'Maintain financial safety net' },
        growth: { drivers: growthDrivers, action: growthAction[0] || 'Continue wealth building' },
        behavior: { drivers: behaviorDrivers, action: behaviorAction[0] || 'Keep up good habits' },
        overall: { drivers: overallDrivers, action: overallAction }
    };

    // Components for debugging/tuning
    const components = {
        // Cashflow
        netRatio, fixedRatio, incomeVol, A, B, C,
        // Stability
        liquidityCoverage, leverage, protectionRatio, L, D, P,
        // Growth
        savingRate, investRate, incomeGrowth, consistency, S, I, G, Co,
        // Behavior
        loggingConsistency, budgetAdherence, Ba, Bc
    };

    return {
        cashflowScore,
        stabilityScore,
        growthScore,
        behaviorScore,
        twealthIndex,
        band,
        confidence,
        drivers,
        components
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// SAVE SCORE SNAPSHOT
// ═══════════════════════════════════════════════════════════════════════════

export async function saveScoreSnapshot(
    storage: IStorage,
    userId: string,
    result: ScoreResult,
    month?: Date
): Promise<void> {
    const monthStart = month
        ? new Date(month.getFullYear(), month.getMonth(), 1)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    await storage.upsertScoreSnapshot({
        userId,
        month: monthStart,
        cashflowScore: result.cashflowScore,
        stabilityScore: result.stabilityScore,
        growthScore: result.growthScore,
        behaviorScore: result.behaviorScore,
        twealthIndex: result.twealthIndex,
        band: result.band,
        confidence: result.confidence.toString(),
        drivers: result.drivers,
        components: result.components
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL RECOMPUTE - Rollup + Score + Save
// ═══════════════════════════════════════════════════════════════════════════

export async function recomputeScores(
    storage: IStorage,
    userId: string,
    month?: Date
): Promise<ScoreResult> {
    const targetMonth = month || new Date();

    // 1. Rollup transactions to monthly aggregates
    await rollupMonthlyFinancials(storage, userId, targetMonth);

    // 2. Compute scores
    const result = await computeScores(storage, userId, targetMonth);

    // 3. Save snapshot
    await saveScoreSnapshot(storage, userId, result, targetMonth);

    return result;
}
