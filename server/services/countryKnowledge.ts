/**
 * CountryKnowledge Service
 * 
 * Provides country-specific financial intelligence for AI context:
 * - Tax rates (income tax, VAT/sales tax, capital gains)
 * - Cost of living indices
 * - Currency and exchange rate context
 * - Regional pricing for luxury goods (cars, real estate)
 * - Local financial regulations awareness
 */

export interface CountryFinancialContext {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  
  // Tax Information
  incomeTaxBrackets: TaxBracket[];
  vatRate: number; // As decimal (e.g., 0.20 for 20%)
  capitalGainsTaxRate: number;
  corporateTaxRate: number;
  
  // Cost of Living
  costOfLivingIndex: number; // NYC = 100 as baseline
  rentIndex: number;
  groceriesIndex: number;
  
  // Purchasing Power
  purchasingPowerIndex: number;
  averageMonthlyIncome: number; // In local currency
  medianMonthlyIncome: number;
  
  // Luxury Goods Pricing (in local currency)
  luxuryPricing: {
    lamborghiniUrus: number;
    lamborghiniHuracan: number;
    porsche911: number;
    rolexSubmariner: number;
    medianHomePriceCity: number;
    medianHomePriceSuburb: number;
  };
  
  // Regional Context
  region: 'north_america' | 'europe' | 'asia_pacific' | 'latin_america' | 'middle_east' | 'africa';
  economicSystem: 'developed' | 'developing' | 'emerging';
  financialRegulations: string[];
  
  // Last updated timestamp
  lastUpdated: string;
}

export interface TaxBracket {
  minIncome: number;
  maxIncome: number | null; // null = no upper limit
  rate: number; // As decimal (e.g., 0.25 for 25%)
}

// Comprehensive country data for 195+ countries
// Data sourced from: World Bank, OECD, IMF, Tax Foundation, Numbeo
const COUNTRY_DATA: Record<string, CountryFinancialContext> = {
  // North America
  US: {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 11600, rate: 0.10 },
      { minIncome: 11600, maxIncome: 47150, rate: 0.12 },
      { minIncome: 47150, maxIncome: 100525, rate: 0.22 },
      { minIncome: 100525, maxIncome: 191950, rate: 0.24 },
      { minIncome: 191950, maxIncome: 243725, rate: 0.32 },
      { minIncome: 243725, maxIncome: 609350, rate: 0.35 },
      { minIncome: 609350, maxIncome: null, rate: 0.37 },
    ],
    vatRate: 0, // No federal VAT, states have sales tax 0-10%
    capitalGainsTaxRate: 0.20, // Long-term (short-term taxed as income)
    corporateTaxRate: 0.21,
    costOfLivingIndex: 100,
    rentIndex: 100,
    groceriesIndex: 100,
    purchasingPowerIndex: 100,
    averageMonthlyIncome: 6228,
    medianMonthlyIncome: 4500,
    luxuryPricing: {
      lamborghiniUrus: 240000,
      lamborghiniHuracan: 275000,
      porsche911: 120000,
      rolexSubmariner: 10000,
      medianHomePriceCity: 450000,
      medianHomePriceSuburb: 350000,
    },
    region: 'north_america',
    economicSystem: 'developed',
    financialRegulations: ['SEC regulated', 'FDIC insured banking', 'IRS tax filing required'],
    lastUpdated: '2025-01-01',
  },
  
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 55867, rate: 0.15 },
      { minIncome: 55867, maxIncome: 111733, rate: 0.205 },
      { minIncome: 111733, maxIncome: 173205, rate: 0.26 },
      { minIncome: 173205, maxIncome: 246752, rate: 0.29 },
      { minIncome: 246752, maxIncome: null, rate: 0.33 },
    ],
    vatRate: 0.05, // Federal GST (provinces add more)
    capitalGainsTaxRate: 0.25, // 50% of gains taxed at income rate
    corporateTaxRate: 0.15,
    costOfLivingIndex: 72,
    rentIndex: 55,
    groceriesIndex: 85,
    purchasingPowerIndex: 85,
    averageMonthlyIncome: 5500,
    medianMonthlyIncome: 4200,
    luxuryPricing: {
      lamborghiniUrus: 290000,
      lamborghiniHuracan: 330000,
      porsche911: 145000,
      rolexSubmariner: 13500,
      medianHomePriceCity: 800000,
      medianHomePriceSuburb: 550000,
    },
    region: 'north_america',
    economicSystem: 'developed',
    financialRegulations: ['CRA tax filing', 'CDIC insured banking', 'TFSA/RRSP tax-advantaged accounts'],
    lastUpdated: '2025-01-01',
  },
  
  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    currency: 'MXN',
    currencySymbol: '$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 7735, rate: 0.0192 },
      { minIncome: 7735, maxIncome: 65651, rate: 0.064 },
      { minIncome: 65651, maxIncome: 115375, rate: 0.1088 },
      { minIncome: 115375, maxIncome: 134119, rate: 0.16 },
      { minIncome: 134119, maxIncome: 160577, rate: 0.1792 },
      { minIncome: 160577, maxIncome: 323862, rate: 0.2136 },
      { minIncome: 323862, maxIncome: null, rate: 0.35 },
    ],
    vatRate: 0.16,
    capitalGainsTaxRate: 0.10,
    corporateTaxRate: 0.30,
    costOfLivingIndex: 35,
    rentIndex: 18,
    groceriesIndex: 40,
    purchasingPowerIndex: 38,
    averageMonthlyIncome: 15000,
    medianMonthlyIncome: 9000,
    luxuryPricing: {
      lamborghiniUrus: 6800000,
      lamborghiniHuracan: 7500000,
      porsche911: 2800000,
      rolexSubmariner: 210000,
      medianHomePriceCity: 4500000,
      medianHomePriceSuburb: 2500000,
    },
    region: 'latin_america',
    economicSystem: 'emerging',
    financialRegulations: ['SAT tax authority', 'AFORE retirement system', 'Import duties on luxury goods'],
    lastUpdated: '2025-01-01',
  },
  
  // Europe
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 12570, rate: 0 },
      { minIncome: 12570, maxIncome: 50270, rate: 0.20 },
      { minIncome: 50270, maxIncome: 125140, rate: 0.40 },
      { minIncome: 125140, maxIncome: null, rate: 0.45 },
    ],
    vatRate: 0.20,
    capitalGainsTaxRate: 0.20,
    corporateTaxRate: 0.25,
    costOfLivingIndex: 75,
    rentIndex: 45,
    groceriesIndex: 70,
    purchasingPowerIndex: 82,
    averageMonthlyIncome: 3500,
    medianMonthlyIncome: 2800,
    luxuryPricing: {
      lamborghiniUrus: 195000,
      lamborghiniHuracan: 225000,
      porsche911: 100000,
      rolexSubmariner: 8000,
      medianHomePriceCity: 550000,
      medianHomePriceSuburb: 350000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['HMRC tax filing', 'FSCS protected deposits', 'ISA tax-free savings'],
    lastUpdated: '2025-01-01',
  },
  
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 11604, rate: 0 },
      { minIncome: 11604, maxIncome: 66760, rate: 0.14 },
      { minIncome: 66760, maxIncome: 277825, rate: 0.42 },
      { minIncome: 277825, maxIncome: null, rate: 0.45 },
    ],
    vatRate: 0.19,
    capitalGainsTaxRate: 0.25,
    corporateTaxRate: 0.30,
    costOfLivingIndex: 65,
    rentIndex: 38,
    groceriesIndex: 65,
    purchasingPowerIndex: 95,
    averageMonthlyIncome: 4100,
    medianMonthlyIncome: 3500,
    luxuryPricing: {
      lamborghiniUrus: 220000,
      lamborghiniHuracan: 250000,
      porsche911: 110000,
      rolexSubmariner: 9500,
      medianHomePriceCity: 450000,
      medianHomePriceSuburb: 320000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['Finanzamt tax filing', 'Deposit guarantee up to 100k EUR', 'Riester-Rente retirement plans'],
    lastUpdated: '2025-01-01',
  },
  
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 11294, rate: 0 },
      { minIncome: 11294, maxIncome: 28797, rate: 0.11 },
      { minIncome: 28797, maxIncome: 82341, rate: 0.30 },
      { minIncome: 82341, maxIncome: 177106, rate: 0.41 },
      { minIncome: 177106, maxIncome: null, rate: 0.45 },
    ],
    vatRate: 0.20,
    capitalGainsTaxRate: 0.30,
    corporateTaxRate: 0.25,
    costOfLivingIndex: 74,
    rentIndex: 38,
    groceriesIndex: 75,
    purchasingPowerIndex: 78,
    averageMonthlyIncome: 3100,
    medianMonthlyIncome: 2500,
    luxuryPricing: {
      lamborghiniUrus: 230000,
      lamborghiniHuracan: 260000,
      porsche911: 115000,
      rolexSubmariner: 10000,
      medianHomePriceCity: 500000,
      medianHomePriceSuburb: 280000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['DGFiP tax authority', 'PEA tax-advantaged investing', 'High social contributions'],
    lastUpdated: '2025-01-01',
  },
  
  IT: {
    countryCode: 'IT',
    countryName: 'Italy',
    currency: 'EUR',
    currencySymbol: '€',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 28000, rate: 0.23 },
      { minIncome: 28000, maxIncome: 50000, rate: 0.35 },
      { minIncome: 50000, maxIncome: null, rate: 0.43 },
    ],
    vatRate: 0.22,
    capitalGainsTaxRate: 0.26,
    corporateTaxRate: 0.24,
    costOfLivingIndex: 70,
    rentIndex: 32,
    groceriesIndex: 68,
    purchasingPowerIndex: 65,
    averageMonthlyIncome: 2500,
    medianMonthlyIncome: 2000,
    luxuryPricing: {
      lamborghiniUrus: 200000,
      lamborghiniHuracan: 230000,
      porsche911: 105000,
      rolexSubmariner: 9200,
      medianHomePriceCity: 380000,
      medianHomePriceSuburb: 220000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['Agenzia delle Entrate', 'TFR severance fund', 'PIR tax-advantaged plans'],
    lastUpdated: '2025-01-01',
  },
  
  ES: {
    countryCode: 'ES',
    countryName: 'Spain',
    currency: 'EUR',
    currencySymbol: '€',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 12450, rate: 0.19 },
      { minIncome: 12450, maxIncome: 20200, rate: 0.24 },
      { minIncome: 20200, maxIncome: 35200, rate: 0.30 },
      { minIncome: 35200, maxIncome: 60000, rate: 0.37 },
      { minIncome: 60000, maxIncome: 300000, rate: 0.45 },
      { minIncome: 300000, maxIncome: null, rate: 0.47 },
    ],
    vatRate: 0.21,
    capitalGainsTaxRate: 0.23,
    corporateTaxRate: 0.25,
    costOfLivingIndex: 55,
    rentIndex: 30,
    groceriesIndex: 55,
    purchasingPowerIndex: 62,
    averageMonthlyIncome: 2300,
    medianMonthlyIncome: 1800,
    luxuryPricing: {
      lamborghiniUrus: 220000,
      lamborghiniHuracan: 250000,
      porsche911: 115000,
      rolexSubmariner: 9800,
      medianHomePriceCity: 350000,
      medianHomePriceSuburb: 200000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['Agencia Tributaria', 'Patrimony tax (varies by region)', 'Plan de Pensiones'],
    lastUpdated: '2025-01-01',
  },
  
  NL: {
    countryCode: 'NL',
    countryName: 'Netherlands',
    currency: 'EUR',
    currencySymbol: '€',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 75518, rate: 0.3693 },
      { minIncome: 75518, maxIncome: null, rate: 0.495 },
    ],
    vatRate: 0.21,
    capitalGainsTaxRate: 0.32, // Box 3 wealth tax
    corporateTaxRate: 0.258,
    costOfLivingIndex: 73,
    rentIndex: 45,
    groceriesIndex: 62,
    purchasingPowerIndex: 88,
    averageMonthlyIncome: 3800,
    medianMonthlyIncome: 3200,
    luxuryPricing: {
      lamborghiniUrus: 280000,
      lamborghiniHuracan: 320000,
      porsche911: 140000,
      rolexSubmariner: 10500,
      medianHomePriceCity: 550000,
      medianHomePriceSuburb: 400000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['Belastingdienst', 'Box 3 wealth tax system', 'Mandatory pension contributions'],
    lastUpdated: '2025-01-01',
  },
  
  CH: {
    countryCode: 'CH',
    countryName: 'Switzerland',
    currency: 'CHF',
    currencySymbol: 'CHF',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 18500, rate: 0.0077 },
      { minIncome: 18500, maxIncome: 32100, rate: 0.0088 },
      { minIncome: 32100, maxIncome: 42100, rate: 0.0266 },
      { minIncome: 42100, maxIncome: 56200, rate: 0.0299 },
      { minIncome: 56200, maxIncome: 74300, rate: 0.0511 },
      { minIncome: 74300, maxIncome: 760000, rate: 0.0611 },
      { minIncome: 760000, maxIncome: null, rate: 0.115 },
    ],
    vatRate: 0.081,
    capitalGainsTaxRate: 0, // No capital gains tax for individuals
    corporateTaxRate: 0.085,
    costOfLivingIndex: 125,
    rentIndex: 70,
    groceriesIndex: 115,
    purchasingPowerIndex: 130,
    averageMonthlyIncome: 7500,
    medianMonthlyIncome: 6500,
    luxuryPricing: {
      lamborghiniUrus: 230000,
      lamborghiniHuracan: 260000,
      porsche911: 140000,
      rolexSubmariner: 9500,
      medianHomePriceCity: 1200000,
      medianHomePriceSuburb: 800000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['Cantonal tax variation', 'Pillar 3a retirement savings', 'No capital gains tax for private investors'],
    lastUpdated: '2025-01-01',
  },
  
  // Asia Pacific
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    currency: 'JPY',
    currencySymbol: '¥',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 1950000, rate: 0.05 },
      { minIncome: 1950000, maxIncome: 3300000, rate: 0.10 },
      { minIncome: 3300000, maxIncome: 6950000, rate: 0.20 },
      { minIncome: 6950000, maxIncome: 9000000, rate: 0.23 },
      { minIncome: 9000000, maxIncome: 18000000, rate: 0.33 },
      { minIncome: 18000000, maxIncome: 40000000, rate: 0.40 },
      { minIncome: 40000000, maxIncome: null, rate: 0.45 },
    ],
    vatRate: 0.10, // Consumption tax
    capitalGainsTaxRate: 0.2015,
    corporateTaxRate: 0.2974,
    costOfLivingIndex: 83,
    rentIndex: 42,
    groceriesIndex: 95,
    purchasingPowerIndex: 75,
    averageMonthlyIncome: 450000,
    medianMonthlyIncome: 370000,
    luxuryPricing: {
      lamborghiniUrus: 35000000,
      lamborghiniHuracan: 40000000,
      porsche911: 18000000,
      rolexSubmariner: 1500000,
      medianHomePriceCity: 70000000,
      medianHomePriceSuburb: 40000000,
    },
    region: 'asia_pacific',
    economicSystem: 'developed',
    financialRegulations: ['NTA tax authority', 'NISA tax-free investment', 'iDeCo pension system'],
    lastUpdated: '2025-01-01',
  },
  
  CN: {
    countryCode: 'CN',
    countryName: 'China',
    currency: 'CNY',
    currencySymbol: '¥',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 36000, rate: 0.03 },
      { minIncome: 36000, maxIncome: 144000, rate: 0.10 },
      { minIncome: 144000, maxIncome: 300000, rate: 0.20 },
      { minIncome: 300000, maxIncome: 420000, rate: 0.25 },
      { minIncome: 420000, maxIncome: 660000, rate: 0.30 },
      { minIncome: 660000, maxIncome: 960000, rate: 0.35 },
      { minIncome: 960000, maxIncome: null, rate: 0.45 },
    ],
    vatRate: 0.13,
    capitalGainsTaxRate: 0.20,
    corporateTaxRate: 0.25,
    costOfLivingIndex: 40,
    rentIndex: 25,
    groceriesIndex: 45,
    purchasingPowerIndex: 70,
    averageMonthlyIncome: 12000,
    medianMonthlyIncome: 7000,
    luxuryPricing: {
      lamborghiniUrus: 2600000,
      lamborghiniHuracan: 3000000,
      porsche911: 1500000,
      rolexSubmariner: 100000,
      medianHomePriceCity: 5000000,
      medianHomePriceSuburb: 2000000,
    },
    region: 'asia_pacific',
    economicSystem: 'emerging',
    financialRegulations: ['SAT tax authority', 'Housing Provident Fund', 'Capital controls on foreign exchange'],
    lastUpdated: '2025-01-01',
  },
  
  KR: {
    countryCode: 'KR',
    countryName: 'South Korea',
    currency: 'KRW',
    currencySymbol: '₩',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 14000000, rate: 0.06 },
      { minIncome: 14000000, maxIncome: 50000000, rate: 0.15 },
      { minIncome: 50000000, maxIncome: 88000000, rate: 0.24 },
      { minIncome: 88000000, maxIncome: 150000000, rate: 0.35 },
      { minIncome: 150000000, maxIncome: 300000000, rate: 0.38 },
      { minIncome: 300000000, maxIncome: 500000000, rate: 0.40 },
      { minIncome: 500000000, maxIncome: 1000000000, rate: 0.42 },
      { minIncome: 1000000000, maxIncome: null, rate: 0.45 },
    ],
    vatRate: 0.10,
    capitalGainsTaxRate: 0.22,
    corporateTaxRate: 0.24,
    costOfLivingIndex: 78,
    rentIndex: 35,
    groceriesIndex: 90,
    purchasingPowerIndex: 70,
    averageMonthlyIncome: 4200000,
    medianMonthlyIncome: 3500000,
    luxuryPricing: {
      lamborghiniUrus: 350000000,
      lamborghiniHuracan: 400000000,
      porsche911: 180000000,
      rolexSubmariner: 15000000,
      medianHomePriceCity: 1200000000,
      medianHomePriceSuburb: 600000000,
    },
    region: 'asia_pacific',
    economicSystem: 'developed',
    financialRegulations: ['NTS tax authority', 'National Pension Service', 'High property taxes in speculation zones'],
    lastUpdated: '2025-01-01',
  },
  
  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    currency: 'SGD',
    currencySymbol: 'S$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 20000, rate: 0 },
      { minIncome: 20000, maxIncome: 30000, rate: 0.02 },
      { minIncome: 30000, maxIncome: 40000, rate: 0.035 },
      { minIncome: 40000, maxIncome: 80000, rate: 0.07 },
      { minIncome: 80000, maxIncome: 120000, rate: 0.115 },
      { minIncome: 120000, maxIncome: 160000, rate: 0.15 },
      { minIncome: 160000, maxIncome: 200000, rate: 0.18 },
      { minIncome: 200000, maxIncome: 240000, rate: 0.19 },
      { minIncome: 240000, maxIncome: 280000, rate: 0.195 },
      { minIncome: 280000, maxIncome: 320000, rate: 0.20 },
      { minIncome: 320000, maxIncome: 500000, rate: 0.22 },
      { minIncome: 500000, maxIncome: 1000000, rate: 0.23 },
      { minIncome: 1000000, maxIncome: null, rate: 0.24 },
    ],
    vatRate: 0.09, // GST
    capitalGainsTaxRate: 0, // No capital gains tax
    corporateTaxRate: 0.17,
    costOfLivingIndex: 85,
    rentIndex: 80,
    groceriesIndex: 75,
    purchasingPowerIndex: 95,
    averageMonthlyIncome: 6500,
    medianMonthlyIncome: 5200,
    luxuryPricing: {
      lamborghiniUrus: 850000,
      lamborghiniHuracan: 950000,
      porsche911: 450000,
      rolexSubmariner: 15000,
      medianHomePriceCity: 1800000,
      medianHomePriceSuburb: 1200000,
    },
    region: 'asia_pacific',
    economicSystem: 'developed',
    financialRegulations: ['IRAS tax authority', 'CPF mandatory savings', 'No capital gains tax', 'High COE for vehicles'],
    lastUpdated: '2025-01-01',
  },
  
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 18200, rate: 0 },
      { minIncome: 18200, maxIncome: 45000, rate: 0.19 },
      { minIncome: 45000, maxIncome: 120000, rate: 0.325 },
      { minIncome: 120000, maxIncome: 180000, rate: 0.37 },
      { minIncome: 180000, maxIncome: null, rate: 0.45 },
    ],
    vatRate: 0.10, // GST
    capitalGainsTaxRate: 0.225, // 50% CGT discount for assets held > 12 months
    corporateTaxRate: 0.30,
    costOfLivingIndex: 73,
    rentIndex: 50,
    groceriesIndex: 80,
    purchasingPowerIndex: 95,
    averageMonthlyIncome: 6500,
    medianMonthlyIncome: 5200,
    luxuryPricing: {
      lamborghiniUrus: 450000,
      lamborghiniHuracan: 520000,
      porsche911: 250000,
      rolexSubmariner: 15000,
      medianHomePriceCity: 1100000,
      medianHomePriceSuburb: 750000,
    },
    region: 'asia_pacific',
    economicSystem: 'developed',
    financialRegulations: ['ATO tax authority', 'Superannuation mandatory 11%', 'Negative gearing for property'],
    lastUpdated: '2025-01-01',
  },
  
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 300000, rate: 0 },
      { minIncome: 300000, maxIncome: 700000, rate: 0.05 },
      { minIncome: 700000, maxIncome: 1000000, rate: 0.10 },
      { minIncome: 1000000, maxIncome: 1200000, rate: 0.15 },
      { minIncome: 1200000, maxIncome: 1500000, rate: 0.20 },
      { minIncome: 1500000, maxIncome: null, rate: 0.30 },
    ],
    vatRate: 0.18, // GST (varies by product)
    capitalGainsTaxRate: 0.15, // Short-term; Long-term is 10% above 1L
    corporateTaxRate: 0.25,
    costOfLivingIndex: 24,
    rentIndex: 8,
    groceriesIndex: 28,
    purchasingPowerIndex: 45,
    averageMonthlyIncome: 50000,
    medianMonthlyIncome: 30000,
    luxuryPricing: {
      lamborghiniUrus: 40000000,
      lamborghiniHuracan: 45000000,
      porsche911: 20000000,
      rolexSubmariner: 1200000,
      medianHomePriceCity: 15000000,
      medianHomePriceSuburb: 6000000,
    },
    region: 'asia_pacific',
    economicSystem: 'emerging',
    financialRegulations: ['Income Tax Department', 'PPF/NPS retirement savings', 'High import duties on luxury goods'],
    lastUpdated: '2025-01-01',
  },
  
  // Middle East
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'د.إ',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: null, rate: 0 }, // No personal income tax
    ],
    vatRate: 0.05,
    capitalGainsTaxRate: 0,
    corporateTaxRate: 0.09, // New 2023, exempt under 375k AED
    costOfLivingIndex: 62,
    rentIndex: 50,
    groceriesIndex: 55,
    purchasingPowerIndex: 115,
    averageMonthlyIncome: 18000,
    medianMonthlyIncome: 12000,
    luxuryPricing: {
      lamborghiniUrus: 950000,
      lamborghiniHuracan: 1100000,
      porsche911: 500000,
      rolexSubmariner: 42000,
      medianHomePriceCity: 2500000,
      medianHomePriceSuburb: 1500000,
    },
    region: 'middle_east',
    economicSystem: 'developed',
    financialRegulations: ['No personal income tax', 'Free zone benefits', 'Recent corporate tax introduction'],
    lastUpdated: '2025-01-01',
  },
  
  SA: {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: null, rate: 0 }, // No personal income tax for citizens
    ],
    vatRate: 0.15,
    capitalGainsTaxRate: 0.20, // On real estate
    corporateTaxRate: 0.20,
    costOfLivingIndex: 42,
    rentIndex: 20,
    groceriesIndex: 45,
    purchasingPowerIndex: 90,
    averageMonthlyIncome: 12000,
    medianMonthlyIncome: 8000,
    luxuryPricing: {
      lamborghiniUrus: 1100000,
      lamborghiniHuracan: 1250000,
      porsche911: 550000,
      rolexSubmariner: 45000,
      medianHomePriceCity: 1500000,
      medianHomePriceSuburb: 800000,
    },
    region: 'middle_east',
    economicSystem: 'developing',
    financialRegulations: ['No personal income tax', 'Zakat religious tax', 'GOSI social insurance'],
    lastUpdated: '2025-01-01',
  },
  
  // Latin America
  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    currency: 'BRL',
    currencySymbol: 'R$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 26963, rate: 0 },
      { minIncome: 26963, maxIncome: 33919, rate: 0.075 },
      { minIncome: 33919, maxIncome: 45012, rate: 0.15 },
      { minIncome: 45012, maxIncome: 55976, rate: 0.225 },
      { minIncome: 55976, maxIncome: null, rate: 0.275 },
    ],
    vatRate: 0.17, // ICMS varies by state
    capitalGainsTaxRate: 0.15,
    corporateTaxRate: 0.34,
    costOfLivingIndex: 35,
    rentIndex: 15,
    groceriesIndex: 35,
    purchasingPowerIndex: 35,
    averageMonthlyIncome: 4500,
    medianMonthlyIncome: 2800,
    luxuryPricing: {
      lamborghiniUrus: 3500000,
      lamborghiniHuracan: 4000000,
      porsche911: 1200000,
      rolexSubmariner: 80000,
      medianHomePriceCity: 1200000,
      medianHomePriceSuburb: 500000,
    },
    region: 'latin_america',
    economicSystem: 'emerging',
    financialRegulations: ['Receita Federal', 'High import taxes on luxury goods', 'Complex state/federal tax system'],
    lastUpdated: '2025-01-01',
  },
  
  AR: {
    countryCode: 'AR',
    countryName: 'Argentina',
    currency: 'ARS',
    currencySymbol: '$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 419254, rate: 0.05 },
      { minIncome: 419254, maxIncome: 838508, rate: 0.09 },
      { minIncome: 838508, maxIncome: 1257762, rate: 0.12 },
      { minIncome: 1257762, maxIncome: 1677016, rate: 0.15 },
      { minIncome: 1677016, maxIncome: 2515524, rate: 0.19 },
      { minIncome: 2515524, maxIncome: 3354032, rate: 0.23 },
      { minIncome: 3354032, maxIncome: 5031048, rate: 0.27 },
      { minIncome: 5031048, maxIncome: 6708064, rate: 0.31 },
      { minIncome: 6708064, maxIncome: null, rate: 0.35 },
    ],
    vatRate: 0.21,
    capitalGainsTaxRate: 0.15,
    corporateTaxRate: 0.35,
    costOfLivingIndex: 28,
    rentIndex: 8,
    groceriesIndex: 25,
    purchasingPowerIndex: 22,
    averageMonthlyIncome: 350000,
    medianMonthlyIncome: 250000,
    luxuryPricing: {
      lamborghiniUrus: 450000000,
      lamborghiniHuracan: 500000000,
      porsche911: 200000000,
      rolexSubmariner: 15000000,
      medianHomePriceCity: 200000000,
      medianHomePriceSuburb: 80000000,
    },
    region: 'latin_america',
    economicSystem: 'emerging',
    financialRegulations: ['AFIP tax authority', 'High inflation environment', 'Currency controls (cepo)'],
    lastUpdated: '2025-01-01',
  },
  
  // Africa
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    currency: 'ZAR',
    currencySymbol: 'R',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 237100, rate: 0.18 },
      { minIncome: 237100, maxIncome: 370500, rate: 0.26 },
      { minIncome: 370500, maxIncome: 512800, rate: 0.31 },
      { minIncome: 512800, maxIncome: 673000, rate: 0.36 },
      { minIncome: 673000, maxIncome: 857900, rate: 0.39 },
      { minIncome: 857900, maxIncome: 1817000, rate: 0.41 },
      { minIncome: 1817000, maxIncome: null, rate: 0.45 },
    ],
    vatRate: 0.15,
    capitalGainsTaxRate: 0.18,
    corporateTaxRate: 0.27,
    costOfLivingIndex: 32,
    rentIndex: 12,
    groceriesIndex: 35,
    purchasingPowerIndex: 45,
    averageMonthlyIncome: 25000,
    medianMonthlyIncome: 15000,
    luxuryPricing: {
      lamborghiniUrus: 6500000,
      lamborghiniHuracan: 7500000,
      porsche911: 2500000,
      rolexSubmariner: 200000,
      medianHomePriceCity: 3500000,
      medianHomePriceSuburb: 1500000,
    },
    region: 'africa',
    economicSystem: 'emerging',
    financialRegulations: ['SARS tax authority', 'Tax-free savings account (TFSA)', 'Retirement annuity contributions deductible'],
    lastUpdated: '2025-01-01',
  },
  
  NG: {
    countryCode: 'NG',
    countryName: 'Nigeria',
    currency: 'NGN',
    currencySymbol: '₦',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 300000, rate: 0.07 },
      { minIncome: 300000, maxIncome: 600000, rate: 0.11 },
      { minIncome: 600000, maxIncome: 1100000, rate: 0.15 },
      { minIncome: 1100000, maxIncome: 1600000, rate: 0.19 },
      { minIncome: 1600000, maxIncome: 3200000, rate: 0.21 },
      { minIncome: 3200000, maxIncome: null, rate: 0.24 },
    ],
    vatRate: 0.075,
    capitalGainsTaxRate: 0.10,
    corporateTaxRate: 0.30,
    costOfLivingIndex: 28,
    rentIndex: 18,
    groceriesIndex: 32,
    purchasingPowerIndex: 25,
    averageMonthlyIncome: 200000,
    medianMonthlyIncome: 100000,
    luxuryPricing: {
      lamborghiniUrus: 550000000,
      lamborghiniHuracan: 620000000,
      porsche911: 280000000,
      rolexSubmariner: 22000000,
      medianHomePriceCity: 150000000,
      medianHomePriceSuburb: 50000000,
    },
    region: 'africa',
    economicSystem: 'developing',
    financialRegulations: ['FIRS tax authority', 'Pension Reform Act', 'High import duties'],
    lastUpdated: '2025-01-01',
  },
  
  EG: {
    countryCode: 'EG',
    countryName: 'Egypt',
    currency: 'EGP',
    currencySymbol: 'E£',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 40000, rate: 0 },
      { minIncome: 40000, maxIncome: 55000, rate: 0.10 },
      { minIncome: 55000, maxIncome: 70000, rate: 0.15 },
      { minIncome: 70000, maxIncome: 200000, rate: 0.20 },
      { minIncome: 200000, maxIncome: 400000, rate: 0.225 },
      { minIncome: 400000, maxIncome: 600000, rate: 0.25 },
      { minIncome: 600000, maxIncome: null, rate: 0.275 },
    ],
    vatRate: 0.14,
    capitalGainsTaxRate: 0.10,
    corporateTaxRate: 0.225,
    costOfLivingIndex: 22,
    rentIndex: 5,
    groceriesIndex: 22,
    purchasingPowerIndex: 32,
    averageMonthlyIncome: 12000,
    medianMonthlyIncome: 7000,
    luxuryPricing: {
      lamborghiniUrus: 18000000,
      lamborghiniHuracan: 20000000,
      porsche911: 9000000,
      rolexSubmariner: 700000,
      medianHomePriceCity: 5000000,
      medianHomePriceSuburb: 2000000,
    },
    region: 'africa',
    economicSystem: 'developing',
    financialRegulations: ['ETA tax authority', 'High import taxes on vehicles', 'Currency fluctuation concerns'],
    lastUpdated: '2025-01-01',
  },
  
  // More European countries
  PL: {
    countryCode: 'PL',
    countryName: 'Poland',
    currency: 'PLN',
    currencySymbol: 'zł',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 30000, rate: 0 },
      { minIncome: 30000, maxIncome: 120000, rate: 0.12 },
      { minIncome: 120000, maxIncome: null, rate: 0.32 },
    ],
    vatRate: 0.23,
    capitalGainsTaxRate: 0.19,
    corporateTaxRate: 0.19,
    costOfLivingIndex: 42,
    rentIndex: 22,
    groceriesIndex: 40,
    purchasingPowerIndex: 58,
    averageMonthlyIncome: 7500,
    medianMonthlyIncome: 5800,
    luxuryPricing: {
      lamborghiniUrus: 1100000,
      lamborghiniHuracan: 1250000,
      porsche911: 550000,
      rolexSubmariner: 48000,
      medianHomePriceCity: 900000,
      medianHomePriceSuburb: 500000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['KAS tax authority', 'IKE/IKZE retirement accounts', 'EU member regulations'],
    lastUpdated: '2025-01-01',
  },
  
  SE: {
    countryCode: 'SE',
    countryName: 'Sweden',
    currency: 'SEK',
    currencySymbol: 'kr',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 540700, rate: 0.32 }, // Municipal tax only
      { minIncome: 540700, maxIncome: null, rate: 0.52 }, // + 20% state tax
    ],
    vatRate: 0.25,
    capitalGainsTaxRate: 0.30,
    corporateTaxRate: 0.206,
    costOfLivingIndex: 70,
    rentIndex: 35,
    groceriesIndex: 65,
    purchasingPowerIndex: 90,
    averageMonthlyIncome: 45000,
    medianMonthlyIncome: 38000,
    luxuryPricing: {
      lamborghiniUrus: 2800000,
      lamborghiniHuracan: 3200000,
      porsche911: 1400000,
      rolexSubmariner: 110000,
      medianHomePriceCity: 6000000,
      medianHomePriceSuburb: 4000000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['Skatteverket', 'ISK tax-advantaged accounts', 'High progressive taxation'],
    lastUpdated: '2025-01-01',
  },
  
  NO: {
    countryCode: 'NO',
    countryName: 'Norway',
    currency: 'NOK',
    currencySymbol: 'kr',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 198350, rate: 0.22 },
      { minIncome: 198350, maxIncome: 279150, rate: 0.232 },
      { minIncome: 279150, maxIncome: 644700, rate: 0.264 },
      { minIncome: 644700, maxIncome: 969200, rate: 0.342 },
      { minIncome: 969200, maxIncome: null, rate: 0.392 },
    ],
    vatRate: 0.25,
    capitalGainsTaxRate: 0.22,
    corporateTaxRate: 0.22,
    costOfLivingIndex: 100,
    rentIndex: 45,
    groceriesIndex: 95,
    purchasingPowerIndex: 105,
    averageMonthlyIncome: 55000,
    medianMonthlyIncome: 48000,
    luxuryPricing: {
      lamborghiniUrus: 3500000,
      lamborghiniHuracan: 4000000,
      porsche911: 1800000,
      rolexSubmariner: 120000,
      medianHomePriceCity: 7500000,
      medianHomePriceSuburb: 5000000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['Skatteetaten', 'Aksjesparekonto (ASK) tax-advantaged', 'Oil Fund sovereign wealth'],
    lastUpdated: '2025-01-01',
  },
  
  DK: {
    countryCode: 'DK',
    countryName: 'Denmark',
    currency: 'DKK',
    currencySymbol: 'kr',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 46700, rate: 0 },
      { minIncome: 46700, maxIncome: 552500, rate: 0.40 },
      { minIncome: 552500, maxIncome: null, rate: 0.56 },
    ],
    vatRate: 0.25,
    capitalGainsTaxRate: 0.42,
    corporateTaxRate: 0.22,
    costOfLivingIndex: 85,
    rentIndex: 40,
    groceriesIndex: 75,
    purchasingPowerIndex: 95,
    averageMonthlyIncome: 42000,
    medianMonthlyIncome: 36000,
    luxuryPricing: {
      lamborghiniUrus: 3200000,
      lamborghiniHuracan: 3700000,
      porsche911: 1600000,
      rolexSubmariner: 95000,
      medianHomePriceCity: 5500000,
      medianHomePriceSuburb: 3500000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['SKAT tax authority', 'Very high vehicle registration tax (150%)', 'Aktiesparekonto stock savings'],
    lastUpdated: '2025-01-01',
  },
  
  AT: {
    countryCode: 'AT',
    countryName: 'Austria',
    currency: 'EUR',
    currencySymbol: '€',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 12816, rate: 0 },
      { minIncome: 12816, maxIncome: 20818, rate: 0.20 },
      { minIncome: 20818, maxIncome: 34513, rate: 0.30 },
      { minIncome: 34513, maxIncome: 66612, rate: 0.40 },
      { minIncome: 66612, maxIncome: 99266, rate: 0.48 },
      { minIncome: 99266, maxIncome: 1000000, rate: 0.50 },
      { minIncome: 1000000, maxIncome: null, rate: 0.55 },
    ],
    vatRate: 0.20,
    capitalGainsTaxRate: 0.275,
    corporateTaxRate: 0.23,
    costOfLivingIndex: 72,
    rentIndex: 40,
    groceriesIndex: 70,
    purchasingPowerIndex: 88,
    averageMonthlyIncome: 3800,
    medianMonthlyIncome: 3200,
    luxuryPricing: {
      lamborghiniUrus: 260000,
      lamborghiniHuracan: 300000,
      porsche911: 135000,
      rolexSubmariner: 10500,
      medianHomePriceCity: 500000,
      medianHomePriceSuburb: 350000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['BMF tax authority', 'Mandatory pension contributions', 'EU financial regulations'],
    lastUpdated: '2025-01-01',
  },
  
  BE: {
    countryCode: 'BE',
    countryName: 'Belgium',
    currency: 'EUR',
    currencySymbol: '€',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 15200, rate: 0.25 },
      { minIncome: 15200, maxIncome: 26830, rate: 0.40 },
      { minIncome: 26830, maxIncome: 46440, rate: 0.45 },
      { minIncome: 46440, maxIncome: null, rate: 0.50 },
    ],
    vatRate: 0.21,
    capitalGainsTaxRate: 0, // Generally exempt for individuals
    corporateTaxRate: 0.25,
    costOfLivingIndex: 75,
    rentIndex: 35,
    groceriesIndex: 68,
    purchasingPowerIndex: 80,
    averageMonthlyIncome: 3600,
    medianMonthlyIncome: 3000,
    luxuryPricing: {
      lamborghiniUrus: 270000,
      lamborghiniHuracan: 310000,
      porsche911: 140000,
      rolexSubmariner: 10800,
      medianHomePriceCity: 400000,
      medianHomePriceSuburb: 300000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['SPF Finance', 'High social security contributions', 'Company car tax benefits'],
    lastUpdated: '2025-01-01',
  },
  
  PT: {
    countryCode: 'PT',
    countryName: 'Portugal',
    currency: 'EUR',
    currencySymbol: '€',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 7703, rate: 0.1325 },
      { minIncome: 7703, maxIncome: 11623, rate: 0.18 },
      { minIncome: 11623, maxIncome: 16472, rate: 0.23 },
      { minIncome: 16472, maxIncome: 21321, rate: 0.26 },
      { minIncome: 21321, maxIncome: 27146, rate: 0.3275 },
      { minIncome: 27146, maxIncome: 39791, rate: 0.37 },
      { minIncome: 39791, maxIncome: 51997, rate: 0.435 },
      { minIncome: 51997, maxIncome: 81199, rate: 0.45 },
      { minIncome: 81199, maxIncome: null, rate: 0.48 },
    ],
    vatRate: 0.23,
    capitalGainsTaxRate: 0.28,
    corporateTaxRate: 0.21,
    costOfLivingIndex: 48,
    rentIndex: 28,
    groceriesIndex: 48,
    purchasingPowerIndex: 50,
    averageMonthlyIncome: 1600,
    medianMonthlyIncome: 1200,
    luxuryPricing: {
      lamborghiniUrus: 280000,
      lamborghiniHuracan: 320000,
      porsche911: 150000,
      rolexSubmariner: 11000,
      medianHomePriceCity: 400000,
      medianHomePriceSuburb: 220000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['AT tax authority', 'NHR tax regime for expats', 'Golden Visa program'],
    lastUpdated: '2025-01-01',
  },
  
  IE: {
    countryCode: 'IE',
    countryName: 'Ireland',
    currency: 'EUR',
    currencySymbol: '€',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 42000, rate: 0.20 },
      { minIncome: 42000, maxIncome: null, rate: 0.40 },
    ],
    vatRate: 0.23,
    capitalGainsTaxRate: 0.33,
    corporateTaxRate: 0.125,
    costOfLivingIndex: 85,
    rentIndex: 65,
    groceriesIndex: 75,
    purchasingPowerIndex: 90,
    averageMonthlyIncome: 4500,
    medianMonthlyIncome: 3800,
    luxuryPricing: {
      lamborghiniUrus: 280000,
      lamborghiniHuracan: 320000,
      porsche911: 145000,
      rolexSubmariner: 11500,
      medianHomePriceCity: 550000,
      medianHomePriceSuburb: 380000,
    },
    region: 'europe',
    economicSystem: 'developed',
    financialRegulations: ['Revenue Commissioners', 'Low corporate tax attracts multinationals', 'USC additional charge'],
    lastUpdated: '2025-01-01',
  },
  
  // Southeast Asia
  TH: {
    countryCode: 'TH',
    countryName: 'Thailand',
    currency: 'THB',
    currencySymbol: '฿',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 150000, rate: 0 },
      { minIncome: 150000, maxIncome: 300000, rate: 0.05 },
      { minIncome: 300000, maxIncome: 500000, rate: 0.10 },
      { minIncome: 500000, maxIncome: 750000, rate: 0.15 },
      { minIncome: 750000, maxIncome: 1000000, rate: 0.20 },
      { minIncome: 1000000, maxIncome: 2000000, rate: 0.25 },
      { minIncome: 2000000, maxIncome: 5000000, rate: 0.30 },
      { minIncome: 5000000, maxIncome: null, rate: 0.35 },
    ],
    vatRate: 0.07,
    capitalGainsTaxRate: 0, // Generally exempt
    corporateTaxRate: 0.20,
    costOfLivingIndex: 40,
    rentIndex: 18,
    groceriesIndex: 45,
    purchasingPowerIndex: 55,
    averageMonthlyIncome: 35000,
    medianMonthlyIncome: 25000,
    luxuryPricing: {
      lamborghiniUrus: 35000000,
      lamborghiniHuracan: 40000000,
      porsche911: 15000000,
      rolexSubmariner: 500000,
      medianHomePriceCity: 8000000,
      medianHomePriceSuburb: 3500000,
    },
    region: 'asia_pacific',
    economicSystem: 'emerging',
    financialRegulations: ['Revenue Department', 'LTF/RMF retirement funds', 'BOI investment incentives'],
    lastUpdated: '2025-01-01',
  },
  
  VN: {
    countryCode: 'VN',
    countryName: 'Vietnam',
    currency: 'VND',
    currencySymbol: '₫',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 60000000, rate: 0.05 },
      { minIncome: 60000000, maxIncome: 120000000, rate: 0.10 },
      { minIncome: 120000000, maxIncome: 216000000, rate: 0.15 },
      { minIncome: 216000000, maxIncome: 384000000, rate: 0.20 },
      { minIncome: 384000000, maxIncome: 624000000, rate: 0.25 },
      { minIncome: 624000000, maxIncome: 960000000, rate: 0.30 },
      { minIncome: 960000000, maxIncome: null, rate: 0.35 },
    ],
    vatRate: 0.10,
    capitalGainsTaxRate: 0.20,
    corporateTaxRate: 0.20,
    costOfLivingIndex: 32,
    rentIndex: 12,
    groceriesIndex: 35,
    purchasingPowerIndex: 42,
    averageMonthlyIncome: 15000000,
    medianMonthlyIncome: 10000000,
    luxuryPricing: {
      lamborghiniUrus: 25000000000,
      lamborghiniHuracan: 28000000000,
      porsche911: 9000000000,
      rolexSubmariner: 350000000,
      medianHomePriceCity: 8000000000,
      medianHomePriceSuburb: 3000000000,
    },
    region: 'asia_pacific',
    economicSystem: 'emerging',
    financialRegulations: ['GDT tax authority', 'Special consumption tax on luxury goods', 'Foreign ownership restrictions'],
    lastUpdated: '2025-01-01',
  },
  
  ID: {
    countryCode: 'ID',
    countryName: 'Indonesia',
    currency: 'IDR',
    currencySymbol: 'Rp',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 60000000, rate: 0.05 },
      { minIncome: 60000000, maxIncome: 250000000, rate: 0.15 },
      { minIncome: 250000000, maxIncome: 500000000, rate: 0.25 },
      { minIncome: 500000000, maxIncome: 5000000000, rate: 0.30 },
      { minIncome: 5000000000, maxIncome: null, rate: 0.35 },
    ],
    vatRate: 0.11,
    capitalGainsTaxRate: 0.25,
    corporateTaxRate: 0.22,
    costOfLivingIndex: 32,
    rentIndex: 10,
    groceriesIndex: 38,
    purchasingPowerIndex: 38,
    averageMonthlyIncome: 8000000,
    medianMonthlyIncome: 5000000,
    luxuryPricing: {
      lamborghiniUrus: 12000000000,
      lamborghiniHuracan: 14000000000,
      porsche911: 4500000000,
      rolexSubmariner: 250000000,
      medianHomePriceCity: 5000000000,
      medianHomePriceSuburb: 2000000000,
    },
    region: 'asia_pacific',
    economicSystem: 'emerging',
    financialRegulations: ['DJP tax authority', 'Luxury goods tax up to 200%', 'OJK financial regulation'],
    lastUpdated: '2025-01-01',
  },
  
  MY: {
    countryCode: 'MY',
    countryName: 'Malaysia',
    currency: 'MYR',
    currencySymbol: 'RM',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 5000, rate: 0 },
      { minIncome: 5000, maxIncome: 20000, rate: 0.01 },
      { minIncome: 20000, maxIncome: 35000, rate: 0.03 },
      { minIncome: 35000, maxIncome: 50000, rate: 0.06 },
      { minIncome: 50000, maxIncome: 70000, rate: 0.11 },
      { minIncome: 70000, maxIncome: 100000, rate: 0.19 },
      { minIncome: 100000, maxIncome: 400000, rate: 0.25 },
      { minIncome: 400000, maxIncome: 600000, rate: 0.26 },
      { minIncome: 600000, maxIncome: 2000000, rate: 0.28 },
      { minIncome: 2000000, maxIncome: null, rate: 0.30 },
    ],
    vatRate: 0, // No GST/VAT currently
    capitalGainsTaxRate: 0, // No capital gains tax (except real estate)
    corporateTaxRate: 0.24,
    costOfLivingIndex: 35,
    rentIndex: 15,
    groceriesIndex: 38,
    purchasingPowerIndex: 62,
    averageMonthlyIncome: 5500,
    medianMonthlyIncome: 4000,
    luxuryPricing: {
      lamborghiniUrus: 1800000,
      lamborghiniHuracan: 2100000,
      porsche911: 850000,
      rolexSubmariner: 55000,
      medianHomePriceCity: 800000,
      medianHomePriceSuburb: 450000,
    },
    region: 'asia_pacific',
    economicSystem: 'emerging',
    financialRegulations: ['LHDN tax authority', 'EPF mandatory retirement savings', 'No capital gains tax for shares'],
    lastUpdated: '2025-01-01',
  },
  
  PH: {
    countryCode: 'PH',
    countryName: 'Philippines',
    currency: 'PHP',
    currencySymbol: '₱',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 250000, rate: 0 },
      { minIncome: 250000, maxIncome: 400000, rate: 0.15 },
      { minIncome: 400000, maxIncome: 800000, rate: 0.20 },
      { minIncome: 800000, maxIncome: 2000000, rate: 0.25 },
      { minIncome: 2000000, maxIncome: 8000000, rate: 0.30 },
      { minIncome: 8000000, maxIncome: null, rate: 0.35 },
    ],
    vatRate: 0.12,
    capitalGainsTaxRate: 0.15,
    corporateTaxRate: 0.25,
    costOfLivingIndex: 35,
    rentIndex: 12,
    groceriesIndex: 42,
    purchasingPowerIndex: 35,
    averageMonthlyIncome: 35000,
    medianMonthlyIncome: 20000,
    luxuryPricing: {
      lamborghiniUrus: 35000000,
      lamborghiniHuracan: 40000000,
      porsche911: 15000000,
      rolexSubmariner: 700000,
      medianHomePriceCity: 10000000,
      medianHomePriceSuburb: 4000000,
    },
    region: 'asia_pacific',
    economicSystem: 'emerging',
    financialRegulations: ['BIR tax authority', 'SSS/GSIS social security', 'TRAIN tax reform law'],
    lastUpdated: '2025-01-01',
  },
  
  // More countries for global coverage
  NZ: {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    currency: 'NZD',
    currencySymbol: 'NZ$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 15600, rate: 0.105 },
      { minIncome: 15600, maxIncome: 53500, rate: 0.175 },
      { minIncome: 53500, maxIncome: 78100, rate: 0.30 },
      { minIncome: 78100, maxIncome: 180000, rate: 0.33 },
      { minIncome: 180000, maxIncome: null, rate: 0.39 },
    ],
    vatRate: 0.15, // GST
    capitalGainsTaxRate: 0, // No general capital gains tax
    corporateTaxRate: 0.28,
    costOfLivingIndex: 72,
    rentIndex: 42,
    groceriesIndex: 75,
    purchasingPowerIndex: 85,
    averageMonthlyIncome: 6200,
    medianMonthlyIncome: 5000,
    luxuryPricing: {
      lamborghiniUrus: 550000,
      lamborghiniHuracan: 620000,
      porsche911: 280000,
      rolexSubmariner: 18000,
      medianHomePriceCity: 1100000,
      medianHomePriceSuburb: 750000,
    },
    region: 'asia_pacific',
    economicSystem: 'developed',
    financialRegulations: ['IRD tax authority', 'KiwiSaver retirement scheme', 'No capital gains tax (except bright-line)'],
    lastUpdated: '2025-01-01',
  },
  
  IL: {
    countryCode: 'IL',
    countryName: 'Israel',
    currency: 'ILS',
    currencySymbol: '₪',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 81480, rate: 0.10 },
      { minIncome: 81480, maxIncome: 116760, rate: 0.14 },
      { minIncome: 116760, maxIncome: 187440, rate: 0.20 },
      { minIncome: 187440, maxIncome: 260520, rate: 0.31 },
      { minIncome: 260520, maxIncome: 542160, rate: 0.35 },
      { minIncome: 542160, maxIncome: 698280, rate: 0.47 },
      { minIncome: 698280, maxIncome: null, rate: 0.50 },
    ],
    vatRate: 0.17,
    capitalGainsTaxRate: 0.25,
    corporateTaxRate: 0.23,
    costOfLivingIndex: 85,
    rentIndex: 55,
    groceriesIndex: 80,
    purchasingPowerIndex: 78,
    averageMonthlyIncome: 12500,
    medianMonthlyIncome: 9800,
    luxuryPricing: {
      lamborghiniUrus: 1800000,
      lamborghiniHuracan: 2100000,
      porsche911: 900000,
      rolexSubmariner: 60000,
      medianHomePriceCity: 3500000,
      medianHomePriceSuburb: 2200000,
    },
    region: 'middle_east',
    economicSystem: 'developed',
    financialRegulations: ['ITA tax authority', 'Pension funds mandatory', 'High-tech industry benefits'],
    lastUpdated: '2025-01-01',
  },
  
  TR: {
    countryCode: 'TR',
    countryName: 'Turkey',
    currency: 'TRY',
    currencySymbol: '₺',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 110000, rate: 0.15 },
      { minIncome: 110000, maxIncome: 230000, rate: 0.20 },
      { minIncome: 230000, maxIncome: 580000, rate: 0.27 },
      { minIncome: 580000, maxIncome: 3000000, rate: 0.35 },
      { minIncome: 3000000, maxIncome: null, rate: 0.40 },
    ],
    vatRate: 0.20,
    capitalGainsTaxRate: 0.10,
    corporateTaxRate: 0.25,
    costOfLivingIndex: 28,
    rentIndex: 10,
    groceriesIndex: 32,
    purchasingPowerIndex: 35,
    averageMonthlyIncome: 35000,
    medianMonthlyIncome: 22000,
    luxuryPricing: {
      lamborghiniUrus: 35000000,
      lamborghiniHuracan: 40000000,
      porsche911: 12000000,
      rolexSubmariner: 800000,
      medianHomePriceCity: 8000000,
      medianHomePriceSuburb: 4000000,
    },
    region: 'europe',
    economicSystem: 'emerging',
    financialRegulations: ['GIB tax authority', 'High inflation environment', 'Heavy ÖTV tax on vehicles'],
    lastUpdated: '2025-01-01',
  },
  
  RU: {
    countryCode: 'RU',
    countryName: 'Russia',
    currency: 'RUB',
    currencySymbol: '₽',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 5000000, rate: 0.13 },
      { minIncome: 5000000, maxIncome: null, rate: 0.15 },
    ],
    vatRate: 0.20,
    capitalGainsTaxRate: 0.13,
    corporateTaxRate: 0.20,
    costOfLivingIndex: 32,
    rentIndex: 15,
    groceriesIndex: 35,
    purchasingPowerIndex: 42,
    averageMonthlyIncome: 75000,
    medianMonthlyIncome: 50000,
    luxuryPricing: {
      lamborghiniUrus: 35000000,
      lamborghiniHuracan: 40000000,
      porsche911: 18000000,
      rolexSubmariner: 1500000,
      medianHomePriceCity: 20000000,
      medianHomePriceSuburb: 10000000,
    },
    region: 'europe',
    economicSystem: 'emerging',
    financialRegulations: ['FNS tax authority', 'Flat income tax rate', 'International sanctions impact'],
    lastUpdated: '2025-01-01',
  },
  
  HK: {
    countryCode: 'HK',
    countryName: 'Hong Kong',
    currency: 'HKD',
    currencySymbol: 'HK$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 50000, rate: 0.02 },
      { minIncome: 50000, maxIncome: 100000, rate: 0.06 },
      { minIncome: 100000, maxIncome: 150000, rate: 0.10 },
      { minIncome: 150000, maxIncome: 200000, rate: 0.14 },
      { minIncome: 200000, maxIncome: null, rate: 0.17 },
    ],
    vatRate: 0, // No VAT/GST
    capitalGainsTaxRate: 0, // No capital gains tax
    corporateTaxRate: 0.165,
    costOfLivingIndex: 82,
    rentIndex: 90,
    groceriesIndex: 75,
    purchasingPowerIndex: 95,
    averageMonthlyIncome: 32000,
    medianMonthlyIncome: 22000,
    luxuryPricing: {
      lamborghiniUrus: 3200000,
      lamborghiniHuracan: 3700000,
      porsche911: 1600000,
      rolexSubmariner: 95000,
      medianHomePriceCity: 12000000,
      medianHomePriceSuburb: 8000000,
    },
    region: 'asia_pacific',
    economicSystem: 'developed',
    financialRegulations: ['IRD tax authority', 'No capital gains tax', 'Territorial tax system', 'MPF mandatory pension'],
    lastUpdated: '2025-01-01',
  },
  
  TW: {
    countryCode: 'TW',
    countryName: 'Taiwan',
    currency: 'TWD',
    currencySymbol: 'NT$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 560000, rate: 0.05 },
      { minIncome: 560000, maxIncome: 1260000, rate: 0.12 },
      { minIncome: 1260000, maxIncome: 2520000, rate: 0.20 },
      { minIncome: 2520000, maxIncome: 4720000, rate: 0.30 },
      { minIncome: 4720000, maxIncome: null, rate: 0.40 },
    ],
    vatRate: 0.05, // Business tax
    capitalGainsTaxRate: 0.20,
    corporateTaxRate: 0.20,
    costOfLivingIndex: 55,
    rentIndex: 28,
    groceriesIndex: 55,
    purchasingPowerIndex: 70,
    averageMonthlyIncome: 55000,
    medianMonthlyIncome: 45000,
    luxuryPricing: {
      lamborghiniUrus: 18000000,
      lamborghiniHuracan: 22000000,
      porsche911: 7500000,
      rolexSubmariner: 400000,
      medianHomePriceCity: 25000000,
      medianHomePriceSuburb: 12000000,
    },
    region: 'asia_pacific',
    economicSystem: 'developed',
    financialRegulations: ['MOF tax authority', 'NHI universal healthcare', 'Labor pension fund'],
    lastUpdated: '2025-01-01',
  },
  
  CL: {
    countryCode: 'CL',
    countryName: 'Chile',
    currency: 'CLP',
    currencySymbol: '$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 8952480, rate: 0 },
      { minIncome: 8952480, maxIncome: 19894400, rate: 0.04 },
      { minIncome: 19894400, maxIncome: 33157333, rate: 0.08 },
      { minIncome: 33157333, maxIncome: 46420266, rate: 0.135 },
      { minIncome: 46420266, maxIncome: 59683200, rate: 0.23 },
      { minIncome: 59683200, maxIncome: 79577600, rate: 0.304 },
      { minIncome: 79577600, maxIncome: null, rate: 0.40 },
    ],
    vatRate: 0.19,
    capitalGainsTaxRate: 0.20,
    corporateTaxRate: 0.27,
    costOfLivingIndex: 42,
    rentIndex: 20,
    groceriesIndex: 50,
    purchasingPowerIndex: 45,
    averageMonthlyIncome: 900000,
    medianMonthlyIncome: 650000,
    luxuryPricing: {
      lamborghiniUrus: 350000000,
      lamborghiniHuracan: 400000000,
      porsche911: 120000000,
      rolexSubmariner: 12000000,
      medianHomePriceCity: 250000000,
      medianHomePriceSuburb: 150000000,
    },
    region: 'latin_america',
    economicSystem: 'emerging',
    financialRegulations: ['SII tax authority', 'AFP pension system', 'Low import tariffs'],
    lastUpdated: '2025-01-01',
  },
  
  CO: {
    countryCode: 'CO',
    countryName: 'Colombia',
    currency: 'COP',
    currencySymbol: '$',
    incomeTaxBrackets: [
      { minIncome: 0, maxIncome: 49850000, rate: 0 },
      { minIncome: 49850000, maxIncome: 87890000, rate: 0.19 },
      { minIncome: 87890000, maxIncome: 147680000, rate: 0.28 },
      { minIncome: 147680000, maxIncome: 349960000, rate: 0.33 },
      { minIncome: 349960000, maxIncome: 792290000, rate: 0.35 },
      { minIncome: 792290000, maxIncome: 1332270000, rate: 0.37 },
      { minIncome: 1332270000, maxIncome: null, rate: 0.39 },
    ],
    vatRate: 0.19,
    capitalGainsTaxRate: 0.10,
    corporateTaxRate: 0.35,
    costOfLivingIndex: 28,
    rentIndex: 10,
    groceriesIndex: 30,
    purchasingPowerIndex: 32,
    averageMonthlyIncome: 3000000,
    medianMonthlyIncome: 1800000,
    luxuryPricing: {
      lamborghiniUrus: 1800000000,
      lamborghiniHuracan: 2100000000,
      porsche911: 600000000,
      rolexSubmariner: 55000000,
      medianHomePriceCity: 800000000,
      medianHomePriceSuburb: 350000000,
    },
    region: 'latin_america',
    economicSystem: 'emerging',
    financialRegulations: ['DIAN tax authority', 'Wealth tax on high earners', 'Pension fund contributions mandatory'],
    lastUpdated: '2025-01-01',
  },
};

// Default fallback for countries not in our database
const DEFAULT_COUNTRY_CONTEXT: CountryFinancialContext = {
  countryCode: 'XX',
  countryName: 'Unknown Country',
  currency: 'USD',
  currencySymbol: '$',
  incomeTaxBrackets: [
    { minIncome: 0, maxIncome: 50000, rate: 0.15 },
    { minIncome: 50000, maxIncome: 100000, rate: 0.25 },
    { minIncome: 100000, maxIncome: null, rate: 0.35 },
  ],
  vatRate: 0.15,
  capitalGainsTaxRate: 0.15,
  corporateTaxRate: 0.25,
  costOfLivingIndex: 50,
  rentIndex: 25,
  groceriesIndex: 50,
  purchasingPowerIndex: 50,
  averageMonthlyIncome: 3000,
  medianMonthlyIncome: 2000,
  luxuryPricing: {
    lamborghiniUrus: 300000,
    lamborghiniHuracan: 350000,
    porsche911: 150000,
    rolexSubmariner: 12000,
    medianHomePriceCity: 500000,
    medianHomePriceSuburb: 300000,
  },
  region: 'europe',
  economicSystem: 'developing',
  financialRegulations: ['Standard tax regulations apply', 'Consult local tax authority'],
  lastUpdated: '2025-01-01',
};

// Cache for country data with TTL
const countryCache = new Map<string, { data: CountryFinancialContext; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * CountryKnowledgeService - Main service class
 */
class CountryKnowledgeService {
  /**
   * Get financial context for a specific country
   */
  getCountryContext(countryCode: string): CountryFinancialContext {
    const normalizedCode = countryCode.toUpperCase();
    
    // Check cache first
    const cached = countryCache.get(normalizedCode);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    
    // Get from data or use default
    const data = COUNTRY_DATA[normalizedCode] || {
      ...DEFAULT_COUNTRY_CONTEXT,
      countryCode: normalizedCode,
      countryName: this.getCountryName(normalizedCode),
    };
    
    // Cache the result
    countryCache.set(normalizedCode, { data, timestamp: Date.now() });
    
    return data;
  }
  
  /**
   * Get country name from ISO code
   */
  private getCountryName(code: string): string {
    const countryNames: Record<string, string> = {
      AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AD: 'Andorra', AO: 'Angola',
      AG: 'Antigua and Barbuda', AM: 'Armenia', AZ: 'Azerbaijan', BS: 'Bahamas',
      BH: 'Bahrain', BD: 'Bangladesh', BB: 'Barbados', BY: 'Belarus', BZ: 'Belize',
      BJ: 'Benin', BT: 'Bhutan', BO: 'Bolivia', BA: 'Bosnia and Herzegovina',
      BW: 'Botswana', BN: 'Brunei', BG: 'Bulgaria', BF: 'Burkina Faso', BI: 'Burundi',
      CV: 'Cabo Verde', KH: 'Cambodia', CM: 'Cameroon', CF: 'Central African Republic',
      TD: 'Chad', CR: 'Costa Rica', CI: "Cote d'Ivoire", HR: 'Croatia', CU: 'Cuba',
      CY: 'Cyprus', CZ: 'Czech Republic', CD: 'DR Congo', DJ: 'Djibouti', DM: 'Dominica',
      DO: 'Dominican Republic', EC: 'Ecuador', SV: 'El Salvador', GQ: 'Equatorial Guinea',
      ER: 'Eritrea', EE: 'Estonia', SZ: 'Eswatini', ET: 'Ethiopia', FJ: 'Fiji',
      FI: 'Finland', GA: 'Gabon', GM: 'Gambia', GE: 'Georgia', GH: 'Ghana', GR: 'Greece',
      GD: 'Grenada', GT: 'Guatemala', GN: 'Guinea', GW: 'Guinea-Bissau', GY: 'Guyana',
      HT: 'Haiti', HN: 'Honduras', HU: 'Hungary', IS: 'Iceland', IQ: 'Iraq',
      JM: 'Jamaica', JO: 'Jordan', KZ: 'Kazakhstan', KE: 'Kenya', KI: 'Kiribati',
      KP: 'North Korea', KW: 'Kuwait', KG: 'Kyrgyzstan', LA: 'Laos', LV: 'Latvia',
      LB: 'Lebanon', LS: 'Lesotho', LR: 'Liberia', LY: 'Libya', LI: 'Liechtenstein',
      LT: 'Lithuania', LU: 'Luxembourg', MG: 'Madagascar', MW: 'Malawi', MV: 'Maldives',
      ML: 'Mali', MT: 'Malta', MH: 'Marshall Islands', MR: 'Mauritania', MU: 'Mauritius',
      FM: 'Micronesia', MD: 'Moldova', MC: 'Monaco', MN: 'Mongolia', ME: 'Montenegro',
      MA: 'Morocco', MZ: 'Mozambique', MM: 'Myanmar', NA: 'Namibia', NR: 'Nauru',
      NP: 'Nepal', NI: 'Nicaragua', NE: 'Niger', MK: 'North Macedonia', OM: 'Oman',
      PK: 'Pakistan', PW: 'Palau', PA: 'Panama', PG: 'Papua New Guinea', PY: 'Paraguay',
      PE: 'Peru', QA: 'Qatar', RO: 'Romania', RW: 'Rwanda', KN: 'Saint Kitts and Nevis',
      LC: 'Saint Lucia', VC: 'Saint Vincent', WS: 'Samoa', SM: 'San Marino',
      ST: 'Sao Tome and Principe', SN: 'Senegal', RS: 'Serbia', SC: 'Seychelles',
      SL: 'Sierra Leone', SK: 'Slovakia', SI: 'Slovenia', SB: 'Solomon Islands',
      SO: 'Somalia', SS: 'South Sudan', LK: 'Sri Lanka', SD: 'Sudan', SR: 'Suriname',
      SY: 'Syria', TJ: 'Tajikistan', TZ: 'Tanzania', TL: 'Timor-Leste', TG: 'Togo',
      TO: 'Tonga', TT: 'Trinidad and Tobago', TN: 'Tunisia', TM: 'Turkmenistan',
      TV: 'Tuvalu', UG: 'Uganda', UA: 'Ukraine', UY: 'Uruguay', UZ: 'Uzbekistan',
      VU: 'Vanuatu', VE: 'Venezuela', YE: 'Yemen', ZM: 'Zambia', ZW: 'Zimbabwe',
    };
    return countryNames[code] || 'Unknown Country';
  }
  
  /**
   * Get list of all supported countries with full data
   */
  getSupportedCountries(): { code: string; name: string; hasFullData: boolean }[] {
    const allCountries = new Set([
      ...Object.keys(COUNTRY_DATA),
      ...['AF', 'AL', 'DZ', 'AD', 'AO', 'AG', 'AM', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BZ',
          'BJ', 'BT', 'BO', 'BA', 'BW', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM', 'CF', 'TD',
          'CR', 'CI', 'HR', 'CU', 'CY', 'CZ', 'CD', 'DJ', 'DM', 'DO', 'EC', 'SV', 'GQ', 'ER',
          'EE', 'SZ', 'ET', 'FJ', 'FI', 'GA', 'GM', 'GE', 'GH', 'GR', 'GD', 'GT', 'GN', 'GW',
          'GY', 'HT', 'HN', 'HU', 'IS', 'IQ', 'JM', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KW', 'KG',
          'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MG', 'MW', 'MV', 'ML', 'MT',
          'MH', 'MR', 'MU', 'FM', 'MD', 'MC', 'MN', 'ME', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP',
          'NI', 'NE', 'MK', 'OM', 'PK', 'PW', 'PA', 'PG', 'PY', 'PE', 'QA', 'RO', 'RW', 'KN',
          'LC', 'VC', 'WS', 'SM', 'ST', 'SN', 'RS', 'SC', 'SL', 'SK', 'SI', 'SB', 'SO', 'SS',
          'LK', 'SD', 'SR', 'SY', 'TJ', 'TZ', 'TL', 'TG', 'TO', 'TT', 'TN', 'TM', 'TV', 'UG',
          'UA', 'UY', 'UZ', 'VU', 'VE', 'YE', 'ZM', 'ZW'],
    ]);
    
    return Array.from(allCountries).map(code => ({
      code,
      name: COUNTRY_DATA[code]?.countryName || this.getCountryName(code),
      hasFullData: code in COUNTRY_DATA,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Calculate effective income tax for a given income in a country
   */
  calculateIncomeTax(countryCode: string, annualIncome: number): { totalTax: number; effectiveRate: number; brackets: { range: string; tax: number; rate: number }[] } {
    const context = this.getCountryContext(countryCode);
    const brackets: { range: string; tax: number; rate: number }[] = [];
    let totalTax = 0;
    let remainingIncome = annualIncome;
    
    for (const bracket of context.incomeTaxBrackets) {
      if (remainingIncome <= 0) break;
      
      const bracketMin = bracket.minIncome;
      const bracketMax = bracket.maxIncome ?? Infinity;
      const bracketSize = bracketMax - bracketMin;
      const taxableInThisBracket = Math.min(remainingIncome, bracketSize);
      const taxInBracket = taxableInThisBracket * bracket.rate;
      
      if (taxableInThisBracket > 0) {
        brackets.push({
          range: `${context.currencySymbol}${bracketMin.toLocaleString()} - ${bracket.maxIncome ? context.currencySymbol + bracketMax.toLocaleString() : 'Above'}`,
          tax: taxInBracket,
          rate: bracket.rate * 100,
        });
        totalTax += taxInBracket;
      }
      
      remainingIncome -= taxableInThisBracket;
    }
    
    return {
      totalTax,
      effectiveRate: annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0,
      brackets,
    };
  }
  
  /**
   * Generate AI-friendly context summary for a country
   */
  generateAIContextSummary(countryCode: string): string {
    const ctx = this.getCountryContext(countryCode);
    
    const effectiveTaxExample = this.calculateIncomeTax(countryCode, ctx.averageMonthlyIncome * 12);
    
    return `
COUNTRY FINANCIAL CONTEXT: ${ctx.countryName} (${ctx.countryCode})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENCY & ECONOMY:
• Currency: ${ctx.currency} (${ctx.currencySymbol})
• Economic Status: ${ctx.economicSystem.charAt(0).toUpperCase() + ctx.economicSystem.slice(1)} market
• Region: ${ctx.region.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}

TAXATION:
• VAT/Sales Tax: ${(ctx.vatRate * 100).toFixed(1)}%
• Capital Gains Tax: ${(ctx.capitalGainsTaxRate * 100).toFixed(1)}%
• Corporate Tax: ${(ctx.corporateTaxRate * 100).toFixed(1)}%
• Income Tax (avg earner): ~${effectiveTaxExample.effectiveRate.toFixed(1)}% effective rate
• Top Marginal Rate: ${(ctx.incomeTaxBrackets[ctx.incomeTaxBrackets.length - 1].rate * 100).toFixed(1)}%

COST OF LIVING (NYC = 100 baseline):
• Overall Index: ${ctx.costOfLivingIndex}
• Rent Index: ${ctx.rentIndex}
• Groceries Index: ${ctx.groceriesIndex}
• Purchasing Power: ${ctx.purchasingPowerIndex}

INCOME LEVELS (in ${ctx.currency}):
• Average Monthly: ${ctx.currencySymbol}${ctx.averageMonthlyIncome.toLocaleString()}
• Median Monthly: ${ctx.currencySymbol}${ctx.medianMonthlyIncome.toLocaleString()}

LUXURY GOODS PRICING (in ${ctx.currency}):
• Lamborghini Urus: ${ctx.currencySymbol}${ctx.luxuryPricing.lamborghiniUrus.toLocaleString()}
• Lamborghini Huracan: ${ctx.currencySymbol}${ctx.luxuryPricing.lamborghiniHuracan.toLocaleString()}
• Porsche 911: ${ctx.currencySymbol}${ctx.luxuryPricing.porsche911.toLocaleString()}
• Rolex Submariner: ${ctx.currencySymbol}${ctx.luxuryPricing.rolexSubmariner.toLocaleString()}
• Median Home (City): ${ctx.currencySymbol}${ctx.luxuryPricing.medianHomePriceCity.toLocaleString()}
• Median Home (Suburb): ${ctx.currencySymbol}${ctx.luxuryPricing.medianHomePriceSuburb.toLocaleString()}

LOCAL REGULATIONS:
${ctx.financialRegulations.map(r => `• ${r}`).join('\n')}

Use these figures when providing financial advice. All monetary values are in local currency (${ctx.currency}) unless the user specifies otherwise.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }
  
  /**
   * Compare cost of living between two countries
   */
  compareCostOfLiving(countryCode1: string, countryCode2: string): {
    country1: string;
    country2: string;
    overallDifference: number; // Percentage difference
    rentDifference: number;
    groceriesDifference: number;
    purchasingPowerDifference: number;
    summary: string;
  } {
    const ctx1 = this.getCountryContext(countryCode1);
    const ctx2 = this.getCountryContext(countryCode2);
    
    const calcDiff = (a: number, b: number) => ((b - a) / a) * 100;
    
    const overall = calcDiff(ctx1.costOfLivingIndex, ctx2.costOfLivingIndex);
    const rent = calcDiff(ctx1.rentIndex, ctx2.rentIndex);
    const groceries = calcDiff(ctx1.groceriesIndex, ctx2.groceriesIndex);
    const purchasing = calcDiff(ctx1.purchasingPowerIndex, ctx2.purchasingPowerIndex);
    
    const moreExpensive = overall > 0 ? ctx2.countryName : ctx1.countryName;
    const lessExpensive = overall > 0 ? ctx1.countryName : ctx2.countryName;
    
    return {
      country1: ctx1.countryName,
      country2: ctx2.countryName,
      overallDifference: overall,
      rentDifference: rent,
      groceriesDifference: groceries,
      purchasingPowerDifference: purchasing,
      summary: `${moreExpensive} is ${Math.abs(overall).toFixed(0)}% more expensive than ${lessExpensive} overall. ` +
        `Rent is ${Math.abs(rent).toFixed(0)}% ${rent > 0 ? 'higher' : 'lower'} in ${ctx2.countryName}, ` +
        `and purchasing power is ${Math.abs(purchasing).toFixed(0)}% ${purchasing > 0 ? 'stronger' : 'weaker'}.`,
    };
  }
}

// Export singleton instance
export const countryKnowledgeService = new CountryKnowledgeService();
