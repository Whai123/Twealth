// Financial Calculation Utilities
// Real formulas for compound interest, monthly payments, and investment returns

/**
 * Calculate Future Value with compound interest
 * FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
 * @param principal - Initial investment amount
 * @param monthlyContribution - Monthly payment/contribution
 * @param annualRate - Annual interest rate (e.g., 0.08 for 8%)
 * @param years - Number of years
 * @returns Future value
 */
export function calculateFutureValue(
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  
  // FV of principal
  const pvFuture = principal * Math.pow(1 + monthlyRate, months);
  
  // FV of monthly contributions
  const pmtFuture = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  
  return pvFuture + pmtFuture;
}

/**
 * Calculate required monthly payment to reach a goal
 * PMT = FV * [r / ((1 + r)^n - 1)]
 * @param futureValue - Target amount
 * @param principal - Initial amount already saved
 * @param annualRate - Annual interest rate
 * @param years - Number of years
 * @returns Required monthly payment
 */
export function calculateMonthlyPayment(
  futureValue: number,
  principal: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  
  // Adjust for initial principal
  const futureValueNeeded = futureValue - (principal * Math.pow(1 + monthlyRate, months));
  
  if (futureValueNeeded <= 0) return 0;
  
  // Calculate PMT
  const pmt = futureValueNeeded * (monthlyRate / (Math.pow(1 + monthlyRate, months) - 1));
  
  return pmt;
}

/**
 * Calculate investment scenarios with different risk levels
 */
export interface InvestmentPlan {
  name: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  annualReturn: number;
  monthlyPayment: number;
  futureValue: number;
  totalContributed: number;
  totalGains: number;
  description: string;
  recommendations: string[];
}

export function calculateInvestmentPlans(
  targetAmount: number,
  currentSavings: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  years: number
): {
  conservative: InvestmentPlan;
  balanced: InvestmentPlan;
  aggressive: InvestmentPlan;
  maxMonthlyCapacity: number;
} {
  const maxMonthlyCapacity = Math.max(0, monthlyIncome - monthlyExpenses);
  
  // Conservative: High-yield savings (4-5%)
  const conservativeRate = 0.045;
  const conservativePmt = calculateMonthlyPayment(targetAmount, currentSavings, conservativeRate, years);
  const conservativeFv = calculateFutureValue(currentSavings, conservativePmt, conservativeRate, years);
  const conservativeContributed = currentSavings + (conservativePmt * years * 12);
  
  // Balanced: Index funds (7-8%)
  const balancedRate = 0.075;
  const balancedPmt = calculateMonthlyPayment(targetAmount, currentSavings, balancedRate, years);
  const balancedFv = calculateFutureValue(currentSavings, balancedPmt, balancedRate, years);
  const balancedContributed = currentSavings + (balancedPmt * years * 12);
  
  // Aggressive: Growth stocks/diversified portfolio (10-12%)
  const aggressiveRate = 0.11;
  const aggressivePmt = calculateMonthlyPayment(targetAmount, currentSavings, aggressiveRate, years);
  const aggressiveFv = calculateFutureValue(currentSavings, aggressivePmt, aggressiveRate, years);
  const aggressiveContributed = currentSavings + (aggressivePmt * years * 12);
  
  return {
    maxMonthlyCapacity,
    conservative: {
      name: 'Conservative Plan',
      riskLevel: 'Low',
      annualReturn: conservativeRate,
      monthlyPayment: conservativePmt,
      futureValue: conservativeFv,
      totalContributed: conservativeContributed,
      totalGains: conservativeFv - conservativeContributed,
      description: 'High-yield savings accounts, CDs, bonds',
      recommendations: ['Marcus by Goldman Sachs (4.5% APY)', 'Treasury bonds', 'Certificate of Deposit (CD)']
    },
    balanced: {
      name: 'Balanced Plan',
      riskLevel: 'Medium',
      annualReturn: balancedRate,
      monthlyPayment: balancedPmt,
      futureValue: balancedFv,
      totalContributed: balancedContributed,
      totalGains: balancedFv - balancedContributed,
      description: 'Index funds, diversified ETFs, balanced portfolio',
      recommendations: ['Vanguard S&P 500 (VOO)', 'Total Stock Market (VTI)', 'Target-Date Funds']
    },
    aggressive: {
      name: 'Aggressive Plan',
      riskLevel: 'High',
      annualReturn: aggressiveRate,
      monthlyPayment: aggressivePmt,
      futureValue: aggressiveFv,
      totalContributed: aggressiveContributed,
      totalGains: aggressiveFv - aggressiveContributed,
      description: 'Growth stocks, tech sector, higher risk higher reward',
      recommendations: ['QQQ (Tech-heavy)', 'Individual growth stocks', 'Emerging markets ETF']
    }
  };
}

/**
 * Calculate realistic timeline based on monthly capacity
 */
export function calculateRealisticTimeline(
  targetAmount: number,
  currentSavings: number,
  maxMonthlyCapacity: number,
  utilizationRate: number = 0.7 // Use 70% of capacity for safety
): {
  yearsNeeded: number;
  monthlyContribution: number;
  annualReturn: number;
  isRealistic: boolean;
} {
  const safeMonthlyAmount = maxMonthlyCapacity * utilizationRate;
  
  // Try with balanced returns (7.5%)
  const balancedRate = 0.075;
  
  // Calculate years needed with this monthly amount
  const monthlyRate = balancedRate / 12;
  const futureValueFromPrincipal = currentSavings;
  const remainingNeeded = targetAmount - futureValueFromPrincipal;
  
  if (safeMonthlyAmount <= 0) {
    // Can't save anything
    return {
      yearsNeeded: Infinity,
      monthlyContribution: 0,
      annualReturn: balancedRate,
      isRealistic: false
    };
  }
  
  // Solve for n: FV = PMT * [((1 + r)^n - 1) / r] + PV * (1 + r)^n
  // This is complex, so we'll use iterative approach
  let years = 1;
  while (years <= 100) {
    const fv = calculateFutureValue(currentSavings, safeMonthlyAmount, balancedRate, years);
    if (fv >= targetAmount) {
      return {
        yearsNeeded: years,
        monthlyContribution: safeMonthlyAmount,
        annualReturn: balancedRate,
        isRealistic: years <= 30 // Realistic if <= 30 years
      };
    }
    years++;
  }
  
  return {
    yearsNeeded: years,
    monthlyContribution: safeMonthlyAmount,
    annualReturn: balancedRate,
    isRealistic: false
  };
}

/**
 * Detect language from message text
 */
export function detectLanguage(message: string): string {
  const text = message.toLowerCase();
  
  // Thai detection - check for Thai script
  const thaiPattern = /[\u0E00-\u0E7F]/;
  if (thaiPattern.test(message)) {
    return 'th';
  }
  
  // Spanish detection - common Spanish words
  const spanishWords = ['hola', 'gracias', 'por favor', 'dinero', 'casa', 'coche', 'quiero', 'necesito', 'tengo', 'cuánto', 'precio'];
  if (spanishWords.some(word => text.includes(word))) {
    return 'es';
  }
  
  // Portuguese detection
  const portugueseWords = ['olá', 'obrigado', 'dinheiro', 'quanto', 'preciso', 'quero', 'casa', 'carro'];
  if (portugueseWords.some(word => text.includes(word))) {
    return 'pt';
  }
  
  // Indonesian detection
  const indonesianWords = ['halo', 'terima kasih', 'uang', 'rumah', 'mobil', 'berapa', 'saya', 'ingin'];
  if (indonesianWords.some(word => text.includes(word))) {
    return 'id';
  }
  
  // Japanese detection - check for Japanese scripts
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  if (japanesePattern.test(message)) {
    return 'ja';
  }
  
  // Chinese detection
  const chinesePattern = /[\u4E00-\u9FFF]/;
  if (chinesePattern.test(message)) {
    return 'zh';
  }
  
  // Korean detection
  const koreanPattern = /[\uAC00-\uD7AF]/;
  if (koreanPattern.test(message)) {
    return 'ko';
  }
  
  // Vietnamese detection
  const vietnameseWords = ['xin chào', 'cảm ơn', 'tiền', 'nhà', 'xe', 'bao nhiêu', 'tôi', 'muốn'];
  if (vietnameseWords.some(word => text.includes(word))) {
    return 'vi';
  }
  
  // Hindi detection - check for Devanagari script
  const hindiPattern = /[\u0900-\u097F]/;
  if (hindiPattern.test(message)) {
    return 'hi';
  }
  
  // Arabic detection
  const arabicPattern = /[\u0600-\u06FF]/;
  if (arabicPattern.test(message)) {
    return 'ar';
  }
  
  // Turkish detection
  const turkishWords = ['merhaba', 'teşekkür', 'para', 'ev', 'araba', 'ne kadar', 'istiyorum'];
  if (turkishWords.some(word => text.includes(word))) {
    return 'tr';
  }
  
  // Default to English
  return 'en';
}
