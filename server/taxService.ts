// Tax Service - Country-specific tax bracket calculations
// Provides accurate net income calculations based on location and income level

export interface TaxBracket {
  min: number;
  max: number | null; // null means infinity
  rate: number; // percentage
}

export interface CountryTaxInfo {
  countryCode: string;
  countryName: string;
  currency: string;
  brackets: TaxBracket[];
  standardDeduction?: number;
  socialSecurityRate?: number; // additional payroll tax
  medicareRate?: number; // additional healthcare tax
}

// Comprehensive tax data for multiple countries (2024-2025 rates)
const TAX_DATA: Record<string, CountryTaxInfo> = {
  'US': {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    standardDeduction: 14600, // 2024 standard deduction for single filers
    socialSecurityRate: 6.2,
    medicareRate: 1.45,
    brackets: [
      { min: 0, max: 11600, rate: 10 },
      { min: 11600, max: 47150, rate: 12 },
      { min: 47150, max: 100525, rate: 22 },
      { min: 100525, max: 191950, rate: 24 },
      { min: 191950, max: 243725, rate: 32 },
      { min: 243725, max: 609350, rate: 35 },
      { min: 609350, max: null, rate: 37 }
    ]
  },
  'GB': {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currency: 'GBP',
    standardDeduction: 12570, // Personal allowance
    socialSecurityRate: 12, // National Insurance
    brackets: [
      { min: 0, max: 12570, rate: 0 },
      { min: 12570, max: 50270, rate: 20 },
      { min: 50270, max: 125140, rate: 40 },
      { min: 125140, max: null, rate: 45 }
    ]
  },
  'CA': {
    countryCode: 'CA',
    countryName: 'Canada',
    currency: 'CAD',
    standardDeduction: 15000,
    socialSecurityRate: 5.95, // CPP
    medicareRate: 0, // Healthcare covered by taxes
    brackets: [
      { min: 0, max: 53359, rate: 15 },
      { min: 53359, max: 106717, rate: 20.5 },
      { min: 106717, max: 165430, rate: 26 },
      { min: 165430, max: 235675, rate: 29 },
      { min: 235675, max: null, rate: 33 }
    ]
  },
  'AU': {
    countryCode: 'AU',
    countryName: 'Australia',
    currency: 'AUD',
    standardDeduction: 18200, // Tax-free threshold
    medicareRate: 2, // Medicare levy
    brackets: [
      { min: 0, max: 18200, rate: 0 },
      { min: 18200, max: 45000, rate: 19 },
      { min: 45000, max: 120000, rate: 32.5 },
      { min: 120000, max: 180000, rate: 37 },
      { min: 180000, max: null, rate: 45 }
    ]
  },
  'DE': {
    countryCode: 'DE',
    countryName: 'Germany',
    currency: 'EUR',
    standardDeduction: 10908, // Basic allowance (Grundfreibetrag)
    socialSecurityRate: 18.6, // Social security + unemployment insurance
    medicareRate: 7.3, // Health insurance
    brackets: [
      { min: 0, max: 10908, rate: 0 },
      { min: 10908, max: 62810, rate: 14 }, // Progressive from 14% to 24%
      { min: 62810, max: 277826, rate: 42 },
      { min: 277826, max: null, rate: 45 }
    ]
  },
  'FR': {
    countryCode: 'FR',
    countryName: 'France',
    currency: 'EUR',
    standardDeduction: 10777, // Minimum tax-free allowance
    socialSecurityRate: 15, // Social contributions
    brackets: [
      { min: 0, max: 10777, rate: 0 },
      { min: 10777, max: 27478, rate: 11 },
      { min: 27478, max: 78570, rate: 30 },
      { min: 78570, max: 168994, rate: 41 },
      { min: 168994, max: null, rate: 45 }
    ]
  },
  'IN': {
    countryCode: 'IN',
    countryName: 'India',
    currency: 'INR',
    standardDeduction: 50000, // Standard deduction
    brackets: [
      { min: 0, max: 300000, rate: 0 },
      { min: 300000, max: 600000, rate: 5 },
      { min: 600000, max: 900000, rate: 10 },
      { min: 900000, max: 1200000, rate: 15 },
      { min: 1200000, max: 1500000, rate: 20 },
      { min: 1500000, max: null, rate: 30 }
    ]
  },
  'BR': {
    countryCode: 'BR',
    countryName: 'Brazil',
    currency: 'BRL',
    standardDeduction: 24511, // Basic deduction
    socialSecurityRate: 11, // INSS
    brackets: [
      { min: 0, max: 24511, rate: 0 },
      { min: 24511, max: 33919, rate: 7.5 },
      { min: 33919, max: 45012, rate: 15 },
      { min: 45012, max: 55976, rate: 22.5 },
      { min: 55976, max: null, rate: 27.5 }
    ]
  },
  'SG': {
    countryCode: 'SG',
    countryName: 'Singapore',
    currency: 'SGD',
    standardDeduction: 20000, // Personal relief
    brackets: [
      { min: 0, max: 20000, rate: 0 },
      { min: 20000, max: 30000, rate: 2 },
      { min: 30000, max: 40000, rate: 3.5 },
      { min: 40000, max: 80000, rate: 7 },
      { min: 80000, max: 120000, rate: 11.5 },
      { min: 120000, max: 160000, rate: 15 },
      { min: 160000, max: 200000, rate: 18 },
      { min: 200000, max: 240000, rate: 19 },
      { min: 240000, max: 280000, rate: 19.5 },
      { min: 280000, max: 320000, rate: 20 },
      { min: 320000, max: null, rate: 22 }
    ]
  },
  'AE': {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    currency: 'AED',
    brackets: [
      { min: 0, max: null, rate: 0 } // No personal income tax
    ]
  }
};

export interface TaxCalculationResult {
  grossIncome: number;
  federalTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  totalTax: number;
  netIncome: number;
  effectiveTaxRate: number; // percentage
  marginalTaxRate: number; // percentage
  taxableIncome: number;
  countryInfo: CountryTaxInfo;
}

class TaxService {
  /**
   * Calculate taxes for annual income
   */
  calculateAnnualTax(annualIncome: number, countryCode: string = 'US'): TaxCalculationResult {
    const taxInfo = TAX_DATA[countryCode] || TAX_DATA['US'];
    
    // Calculate taxable income after standard deduction
    const taxableIncome = Math.max(0, annualIncome - (taxInfo.standardDeduction || 0));
    
    // Calculate federal/income tax using progressive brackets
    let federalTax = 0;
    let marginalRate = 0;
    
    for (const bracket of taxInfo.brackets) {
      if (taxableIncome > bracket.min) {
        const taxableInBracket = bracket.max 
          ? Math.min(taxableIncome - bracket.min, bracket.max - bracket.min)
          : taxableIncome - bracket.min;
        
        federalTax += (taxableInBracket * bracket.rate) / 100;
        marginalRate = bracket.rate; // Update to highest bracket reached
      }
    }
    
    // Calculate payroll taxes (on gross income, not taxable)
    const socialSecurityTax = taxInfo.socialSecurityRate 
      ? (annualIncome * taxInfo.socialSecurityRate) / 100 
      : 0;
    
    const medicareTax = taxInfo.medicareRate 
      ? (annualIncome * taxInfo.medicareRate) / 100 
      : 0;
    
    const totalTax = federalTax + socialSecurityTax + medicareTax;
    const netIncome = annualIncome - totalTax;
    const effectiveTaxRate = annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;
    
    return {
      grossIncome: annualIncome,
      federalTax: Math.round(federalTax * 100) / 100,
      socialSecurityTax: Math.round(socialSecurityTax * 100) / 100,
      medicareTax: Math.round(medicareTax * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
      marginalTaxRate: marginalRate,
      taxableIncome: Math.round(taxableIncome * 100) / 100,
      countryInfo: taxInfo
    };
  }
  
  /**
   * Calculate taxes for monthly income
   */
  calculateMonthlyTax(monthlyIncome: number, countryCode: string = 'US'): TaxCalculationResult {
    const annualIncome = monthlyIncome * 12;
    const result = this.calculateAnnualTax(annualIncome, countryCode);
    
    // Convert to monthly values
    return {
      ...result,
      grossIncome: monthlyIncome,
      federalTax: Math.round((result.federalTax / 12) * 100) / 100,
      socialSecurityTax: Math.round((result.socialSecurityTax / 12) * 100) / 100,
      medicareTax: Math.round((result.medicareTax / 12) * 100) / 100,
      totalTax: Math.round((result.totalTax / 12) * 100) / 100,
      netIncome: Math.round((result.netIncome / 12) * 100) / 100
    };
  }
  
  /**
   * Get tax info for AI context
   */
  getTaxContextForAI(monthlyIncome: number, countryCode: string = 'US'): string {
    if (monthlyIncome === 0) {
      return ''; // Skip tax info if no income data
    }
    
    const result = this.calculateMonthlyTax(monthlyIncome, countryCode);
    
    return `
💰 TAX CALCULATION (${result.countryInfo.countryName}):
• Gross Monthly Income: ${result.countryInfo.currency} ${result.grossIncome.toLocaleString()}
• Annual Income: ${result.countryInfo.currency} ${(result.grossIncome * 12).toLocaleString()}
• Federal/Income Tax: ${result.countryInfo.currency} ${result.federalTax.toLocaleString()}/month (${result.countryInfo.currency} ${(result.federalTax * 12).toLocaleString()}/year)
${result.socialSecurityTax > 0 ? `• Social Security: ${result.countryInfo.currency} ${result.socialSecurityTax.toLocaleString()}/month` : ''}
${result.medicareTax > 0 ? `• Medicare/Healthcare: ${result.countryInfo.currency} ${result.medicareTax.toLocaleString()}/month` : ''}
• Total Monthly Tax: ${result.countryInfo.currency} ${result.totalTax.toLocaleString()} 
• Net Monthly Income: ${result.countryInfo.currency} ${result.netIncome.toLocaleString()} (take-home pay)
• Effective Tax Rate: ${result.effectiveTaxRate}% | Marginal Rate: ${result.marginalTaxRate}%
• Tax Bracket: ${result.marginalTaxRate}% (highest bracket reached)

⚠️ IMPORTANT: When giving financial advice, use NET income (${result.countryInfo.currency} ${result.netIncome.toLocaleString()}/month), not gross! This is the actual take-home pay after all taxes.`;
  }
  
  /**
   * Get supported countries
   */
  getSupportedCountries(): CountryTaxInfo[] {
    return Object.values(TAX_DATA);
  }
  
  /**
   * Check if country is supported
   */
  isCountrySupported(countryCode: string): boolean {
    return countryCode in TAX_DATA;
  }
}

export const taxService = new TaxService();
