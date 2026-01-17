/**
 * Country-Specific Financial Intelligence
 * 
 * Deep financial knowledge for each country including:
 * - Retirement systems and tax-advantaged accounts
 * - Investment vehicles and regulations
 * - Banking systems and fees
 * - Real estate considerations
 * - Tax optimization strategies
 * - Common financial products
 * - Cultural money norms
 */

export interface CountryFinancialIntelligence {
    countryCode: string;

    // Retirement & Pension Systems
    retirementSystem: {
        publicPension: string;
        privatePension: string[];
        taxAdvantaged: TaxAdvantaIntelligentAccount[];
        retirementAge: number;
        earlyWithdrawalPenalty?: string;
    };

    // Investment Options
    investmentVehicles: {
        stockMarket: string;
        popularBrokers: string[];
        mutualFunds: string[];
        etfs: string[];
        restrictions?: string[];
    };

    // Banking
    banking: {
        majorBanks: string[];
        averageSavingsRate: number;
        depositInsurance: string;
        commonFees?: string[];
    };

    // Real Estate
    realEstate: {
        foreignOwnership: string;
        propertyTax: string;
        stampDuty?: string;
        rentalYield: number;
        mortgageRates: number;
    };

    // Tax Strategies
    taxStrategies: {
        deductions: string[];
        credits: string[];
        tips: string[];
    };

    // Financial Culture
    culturalNotes: string[];

    // Emergency Contacts
    regulatoryBodies: {
        name: string;
        website: string;
    }[];
}

interface TaxAdvantaIntelligentAccount {
    name: string;
    localName?: string;
    maxContribution: string;
    taxBenefit: string;
    withdrawalRules: string;
}

const COUNTRY_FINANCIAL_INTELLIGENCE: Record<string, CountryFinancialIntelligence> = {
    // ═══════════════════════════════════════════════════════════════════════════
    // THAILAND (🇹🇭) - Deep Financial Knowledge
    // ═══════════════════════════════════════════════════════════════════════════
    TH: {
        countryCode: 'TH',
        retirementSystem: {
            publicPension: 'Social Security Fund (กองทุนประกันสังคม) - Employers/employees contribute 5% each, max ฿750/month',
            privatePension: [
                'Government Pension Fund (กบข.) - For civil servants',
                'Provident Fund (กองทุนสำรองเลี้ยงชีพ) - Employer-sponsored',
                'Private RMF/SSF/THAIESG investments'
            ],
            taxAdvantaged: [
                {
                    name: 'RMF (Retirement Mutual Fund)',
                    localName: 'กองทุนรวมเพื่อการเลี้ยงชีพ',
                    maxContribution: '30% of income, max ฿500,000/year (combined with Provident Fund)',
                    taxBenefit: 'Tax deduction up to ฿500,000. Must hold until age 55 with 5+ years',
                    withdrawalRules: 'Penalty-free after age 55 AND 5 years of investment. Early withdrawal = return tax benefits + 0.5%/month penalty'
                },
                {
                    name: 'SSF (Super Savings Fund)',
                    localName: 'กองทุนรวมเพื่อการออม',
                    maxContribution: '30% of income, max ฿200,000/year',
                    taxBenefit: 'Tax deduction. Minimum 10-year holding period',
                    withdrawalRules: 'Must hold for 10 years minimum. More flexible than RMF'
                },
                {
                    name: 'THAIESG (Thai ESG Fund)',
                    localName: 'กองทุนรวมไทยเพื่อความยั่งยืน',
                    maxContribution: '30% of income, max ฿300,000/year',
                    taxBenefit: 'Tax deduction. 5-year holding period',
                    withdrawalRules: 'Hold for 5 years. Only ESG-qualified Thai stocks'
                },
                {
                    name: 'Provident Fund',
                    localName: 'กองทุนสำรองเลี้ยงชีพ',
                    maxContribution: 'Varies by employer, typically 3-15% of salary',
                    taxBenefit: 'Pre-tax contribution, employer matching',
                    withdrawalRules: 'At retirement or job termination. Early = taxable unless 5+ years of membership'
                }
            ],
            retirementAge: 60,
            earlyWithdrawalPenalty: 'RMF: Return tax deduction + 0.5%/month penalty. SSF: Return tax deduction'
        },
        investmentVehicles: {
            stockMarket: 'SET (Stock Exchange of Thailand) - ตลาดหลักทรัพย์แห่งประเทศไทย',
            popularBrokers: ['Bualuang Securities', 'SCB Securities', 'Krungsri Securities', 'KGI Securities', 'Maybank Kim Eng'],
            mutualFunds: [
                'K-CHINA, K-USA, K-GOLD (Kasikorn)',
                'SCBGOLD, SCBKEQTG (SCB)',
                'BCAP-A (Bangkok Capital)',
                'Principal Thai Equity'
            ],
            etfs: [
                'TDEX (SET50 ETF)',
                'ENGY (Energy Sector)',
                'GOLD (Gold ETF)',
                'CHINA (China A50)'
            ],
            restrictions: [
                'Foreign investors limited to 49% of Thai companies',
                'Some sectors (banking, media) have stricter limits',
                'Must file tax on dividends (10% withholding)'
            ]
        },
        banking: {
            majorBanks: ['Bangkok Bank', 'Kasikorn Bank', 'SCB', 'Krungthai Bank', 'TMBThanachart', 'Krungsri'],
            averageSavingsRate: 0.5, // Current rate around 0.5%
            depositInsurance: 'DPA (Deposit Protection Agency) covers up to ฿1,000,000 per depositor per bank',
            commonFees: [
                'ATM withdrawals at other banks: ฿20-35',
                'Online transfers: Usually free within same bank',
                'PromptPay transfers: Free',
                'Minimum balance fees vary by account type'
            ]
        },
        realEstate: {
            foreignOwnership: 'Foreigners cannot own land directly. Can own condo units (up to 49% of building). Land through Thai company (complex) or lease (30+30+30 years)',
            propertyTax: 'Land and Building Tax: 0.01-0.70% depending on use (residential lower, commercial higher)',
            stampDuty: '0.5% or Specific Business Tax 3.3% (if owned <5 years)',
            rentalYield: 5.5, // Average gross yield in Bangkok
            mortgageRates: 6.5 // Average current rates
        },
        taxStrategies: {
            deductions: [
                'Personal allowance: ฿60,000',
                'Spouse allowance: ฿60,000',
                'Child allowance: ฿30,000 per child (฿60,000 if 2nd child born 2018+)',
                'Parent support: ฿30,000 per parent (if 60+, income <฿30,000/year)',
                'Life/health insurance premiums: up to ฿100,000',
                'Provident Fund/RMF/SSF: up to ฿500,000 combined',
                'Mortgage interest: up to ฿100,000',
                'Easy E-Receipt: up to ฿50,000 (varies by year)'
            ],
            credits: [
                'Home buyer credit (first home): Various schemes',
                'Shop Dee Mee Khuen (Easy E-Receipt) - varies annually'
            ],
            tips: [
                'Max out RMF/SSF for immediate tax savings',
                'Use PromptPay for government tax incentives',
                'Keep receipts for E-Receipt campaigns',
                'Timing income/expenses around tax year (Jan-Dec)',
                'Married couples can file jointly or separately - calculate both'
            ]
        },
        culturalNotes: [
            'Gold (ทอง) is popular as both jewelry and investment - sold by baht weight (15.2g)',
            'Real estate is seen as stable investment, hence high ownership rates',
            'Lottery culture - many spend significant amounts on government lottery',
            'Family financial support is expected (sending money to parents)',
            'Cash is still widely used despite PromptPay growth',
            'Credit card debt can be high due to installment culture (ผ่อน 0%)',
            'Life insurance often sold as investment product (mis-selling concern)'
        ],
        regulatoryBodies: [
            { name: 'SEC Thailand', website: 'https://www.sec.or.th' },
            { name: 'Bank of Thailand', website: 'https://www.bot.or.th' },
            { name: 'Revenue Department', website: 'https://www.rd.go.th' },
            { name: 'DPA (Deposit Protection)', website: 'https://www.dpa.or.th' }
        ]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // UNITED STATES (🇺🇸) - Deep Financial Knowledge
    // ═══════════════════════════════════════════════════════════════════════════
    US: {
        countryCode: 'US',
        retirementSystem: {
            publicPension: 'Social Security - Based on 35 highest earning years, can claim at 62 (reduced) or 67 (full)',
            privatePension: [
                '401(k) - Employer-sponsored, often with matching',
                '403(b) - For non-profit employees',
                '457(b) - For government employees',
                'Pension plans (DB) - Increasingly rare'
            ],
            taxAdvantaged: [
                {
                    name: '401(k)',
                    maxContribution: '$23,000/year (2024), +$7,500 catch-up if 50+',
                    taxBenefit: 'Traditional: Pre-tax contribution, taxed at withdrawal. Roth 401(k): Post-tax, tax-free growth',
                    withdrawalRules: '59½ penalty-free, 10% penalty before. RMDs start at 73'
                },
                {
                    name: 'IRA (Traditional)',
                    maxContribution: '$7,000/year, +$1,000 catch-up if 50+',
                    taxBenefit: 'Tax deduction (income limits if have 401k)',
                    withdrawalRules: '59½ penalty-free, RMDs at 73'
                },
                {
                    name: 'Roth IRA',
                    maxContribution: '$7,000/year (income limits apply)',
                    taxBenefit: 'No deduction, but tax-free growth AND withdrawals',
                    withdrawalRules: 'Contributions anytime. Earnings at 59½ after 5 years. No RMDs'
                },
                {
                    name: 'HSA (Health Savings Account)',
                    maxContribution: '$4,150 individual / $8,300 family (2024)',
                    taxBenefit: 'Triple tax advantage: Pre-tax in, tax-free growth, tax-free out for medical',
                    withdrawalRules: 'Medical expenses anytime. Non-medical after 65 (taxed as income)'
                },
                {
                    name: '529 Plan',
                    maxContribution: 'Varies by state, typically $300K+ lifetime',
                    taxBenefit: 'No federal deduction (some states offer), tax-free growth for education',
                    withdrawalRules: 'Tax-free for qualified education. 10% penalty + income tax for non-education'
                }
            ],
            retirementAge: 67,
            earlyWithdrawalPenalty: '10% penalty before 59½ (exceptions: 55 rule, SEPP, first home, etc.)'
        },
        investmentVehicles: {
            stockMarket: 'NYSE, NASDAQ - Largest in the world',
            popularBrokers: ['Fidelity', 'Charles Schwab', 'Vanguard', 'TD Ameritrade', 'Robinhood', 'Interactive Brokers'],
            mutualFunds: [
                'Vanguard 500 Index (VFIAX)',
                'Fidelity Total Market (FSKAX)',
                'Vanguard Total Bond (VBTLX)'
            ],
            etfs: [
                'VOO, SPY, IVV (S&P 500)',
                'VTI, ITOT (Total Market)',
                'QQQ (NASDAQ 100)',
                'BND, AGG (Bonds)',
                'VWO, EEM (Emerging Markets)'
            ],
            restrictions: [
                'Day trading rules (Pattern Day Trader if 4+ day trades in 5 days with <$25K)',
                'Wash sale rule (30 days) for tax-loss harvesting'
            ]
        },
        banking: {
            majorBanks: ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One'],
            averageSavingsRate: 4.5, // High-yield savings accounts
            depositInsurance: 'FDIC insures up to $250,000 per depositor per bank',
            commonFees: [
                'Overdraft: $25-35 typical',
                'Monthly maintenance: $0-15 (waived with min balance)',
                'ATM out-of-network: $2-5'
            ]
        },
        realEstate: {
            foreignOwnership: 'No restrictions - foreigners can freely buy property',
            propertyTax: '0.3-2.5% of assessed value annually (varies by state/county)',
            stampDuty: 'No stamp duty, but transfer taxes and recording fees vary by state',
            rentalYield: 4.5,
            mortgageRates: 7.0 // Current average 30-year fixed
        },
        taxStrategies: {
            deductions: [
                'Standard deduction: $14,600 single / $29,200 married (2024)',
                'State/local taxes (SALT): up to $10,000',
                'Mortgage interest: on up to $750K loan',
                'Charitable contributions',
                '401(k)/IRA contributions',
                'HSA contributions',
                'Student loan interest: up to $2,500'
            ],
            credits: [
                'Child Tax Credit: $2,000 per child',
                'Earned Income Tax Credit (EITC): up to $7,430',
                'American Opportunity Credit: $2,500 for education',
                'Saver\'s Credit: for low-income retirement contributions'
            ],
            tips: [
                '401(k) match is free money - always max it',
                'Backdoor Roth for high earners',
                'Tax-loss harvesting in December',
                'Mega backdoor Roth if plan allows',
                'Use HSA as stealth retirement account',
                'Bunch charitable donations for itemizing',
                'Consider Roth conversions in low-income years'
            ]
        },
        culturalNotes: [
            'Credit score (FICO 300-850) is crucial for financial life',
            'Employer health insurance tied to employment',
            'Student loan debt is a major issue',
            'Home ownership seen as American Dream',
            'Tipping culture affects spending (15-20% at restaurants)',
            '401(k) is the primary retirement vehicle for most'
        ],
        regulatoryBodies: [
            { name: 'SEC', website: 'https://www.sec.gov' },
            { name: 'IRS', website: 'https://www.irs.gov' },
            { name: 'FDIC', website: 'https://www.fdic.gov' },
            { name: 'FINRA', website: 'https://www.finra.org' }
        ]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // JAPAN (🇯🇵) - Deep Financial Knowledge
    // ═══════════════════════════════════════════════════════════════════════════
    JP: {
        countryCode: 'JP',
        retirementSystem: {
            publicPension: 'Kosei Nenkin (厚生年金) - Employees. Kokumin Nenkin (国民年金) - Self-employed',
            privatePension: [
                'Defined Benefit (確定給付年金)',
                'Defined Contribution (確定拠出年金 - iDeCo equivalent for companies)'
            ],
            taxAdvantaged: [
                {
                    name: 'iDeCo (Individual Defined Contribution)',
                    localName: '個人型確定拠出年金',
                    maxContribution: '¥144,000-816,000/year depending on employment status',
                    taxBenefit: 'Full tax deduction, tax-deferred growth',
                    withdrawalRules: 'After age 60 only. No early withdrawal'
                },
                {
                    name: 'NISA (Nippon Individual Savings Account)',
                    localName: '少額投資非課税制度',
                    maxContribution: '¥3,600,000 lifetime (new NISA 2024)',
                    taxBenefit: 'Tax-free capital gains and dividends',
                    withdrawalRules: 'Anytime, no penalty. Permanent tax exemption'
                },
                {
                    name: 'Tsumitate NISA (Growth portion)',
                    maxContribution: '¥1,200,000/year',
                    taxBenefit: 'Tax-free for qualified funds only',
                    withdrawalRules: 'Part of new NISA system from 2024'
                }
            ],
            retirementAge: 65,
            earlyWithdrawalPenalty: 'iDeCo: No early withdrawal allowed before 60'
        },
        investmentVehicles: {
            stockMarket: 'Tokyo Stock Exchange (TSE) - 東京証券取引所',
            popularBrokers: ['SBI Securities', 'Rakuten Securities', 'Monex', 'Matsui Securities', 'Nomura'],
            mutualFunds: [
                'eMAXIS Slim S&P500',
                'eMAXIS Slim All Country',
                'SBI V S&P500'
            ],
            etfs: [
                '1306 (TOPIX ETF)',
                '1321 (Nikkei 225 ETF)',
                '1557 (S&P 500 ETF)',
                '1655 (Nasdaq 100)'
            ]
        },
        banking: {
            majorBanks: ['MUFG Bank', 'SMBC', 'Mizuho Bank', 'Japan Post Bank', 'Rakuten Bank'],
            averageSavingsRate: 0.01, // Extremely low in Japan
            depositInsurance: '預金保険 covers ¥10,000,000 per depositor'
        },
        realEstate: {
            foreignOwnership: 'No restrictions - foreigners can own land and buildings freely',
            propertyTax: '~1.4% of assessed value + City Planning Tax ~0.3%',
            rentalYield: 4.0,
            mortgageRates: 1.5
        },
        taxStrategies: {
            deductions: [
                'Basic deduction: ¥480,000',
                'Employment income deduction: varies',
                'iDeCo contributions: fully deductible',
                'Life insurance premium deduction'
            ],
            credits: [
                'Housing loan deduction: 0.7% of balance for 13 years',
                'Hometown tax (ふるさと納税): Donate to regions, get gifts + tax credit'
            ],
            tips: [
                'NISA before taxable - use full allowance',
                'iDeCo for tax reduction if can wait until 60',
                'Furusato Nozei for effective spending',
                'Consider US stocks via NISA (no foreign tax credit in NISA)'
            ]
        },
        culturalNotes: [
            'High savings culture but money often kept in cash/deposits',
            'Risk aversion - stocks seen as gambling historically',
            'Cash is still king - many businesses cash-only',
            'Bonuses (賞与) are significant part of annual income',
            'Seniority-based pay is changing but still common'
        ],
        regulatoryBodies: [
            { name: 'FSA (Financial Services Agency)', website: 'https://www.fsa.go.jp' },
            { name: 'NTA (National Tax Agency)', website: 'https://www.nta.go.jp' }
        ]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SINGAPORE (🇸🇬) - Deep Financial Knowledge
    // ═══════════════════════════════════════════════════════════════════════════
    SG: {
        countryCode: 'SG',
        retirementSystem: {
            publicPension: 'CPF (Central Provident Fund) - Mandatory savings, employer + employee contributions',
            privatePension: ['SRS (Supplementary Retirement Scheme)'],
            taxAdvantaged: [
                {
                    name: 'CPF Ordinary Account (OA)',
                    maxContribution: 'Up to 20% employee + 17% employer (age-based)',
                    taxBenefit: 'Pre-tax contributions, can use for housing/education/investment',
                    withdrawalRules: 'Housing anytime, full withdrawal at 55 (minimum sum rules apply)'
                },
                {
                    name: 'CPF Special Account (SA)',
                    maxContribution: 'Part of CPF allocation',
                    taxBenefit: 'Higher interest (4%+), for retirement',
                    withdrawalRules: 'At 55, forms Retirement Account'
                },
                {
                    name: 'SRS (Supplementary Retirement Scheme)',
                    maxContribution: '$15,300/year (citizens) / $35,700 (foreigners)',
                    taxBenefit: 'Tax relief on contributions, investments grow tax-free',
                    withdrawalRules: 'Statutory retirement age (63). 50% of withdrawals tax-free. Penalty: 5% + full tax before'
                }
            ],
            retirementAge: 63
        },
        investmentVehicles: {
            stockMarket: 'SGX (Singapore Exchange)',
            popularBrokers: ['DBS Vickers', 'POEMS (PhillipCapital)', 'Tiger Brokers', 'Interactive Brokers', 'Moomoo'],
            mutualFunds: ['Dimensional funds', 'Infinity US 500 Stock Index'],
            etfs: [
                'ES3 (STI ETF)',
                'CLR (Lion-OCBC HSTECH ETF)',
                'SPDR S&P 500 ETF'
            ]
        },
        banking: {
            majorBanks: ['DBS', 'OCBC', 'UOB', 'Standard Chartered', 'Citibank'],
            averageSavingsRate: 3.0, // Promotional rates higher
            depositInsurance: 'SDIC covers S$100,000 per depositor per member bank'
        },
        realEstate: {
            foreignOwnership: 'Foreigners can buy condos freely. Landed property requires approval. HDB restricted to citizens/PRs',
            propertyTax: '0-20% of Annual Value (progressive for non-owner-occupied)',
            stampDuty: 'BSD 1-6% + ABSD (additional 60% for foreigners, 20% for 2nd property citizens)',
            rentalYield: 3.5,
            mortgageRates: 4.0
        },
        taxStrategies: {
            deductions: [
                'Earned Income Relief: up to $1,000',
                'CPF Relief: automatic',
                'SRS contributions: up to $15,300',
                'NSman Self Relief: $3,000-5,000',
                'Working Mother\'s Child Relief (WMCR)'
            ],
            credits: ['Parenthood Tax Rebate: $5,000-20,000 per child'],
            tips: [
                'Max SRS for immediate tax savings',
                'Top up CPF SA (up to $8,000 tax relief)',
                'Use CPF for housing efficiently',
                'No capital gains tax - invest freely',
                'Dividend withholding tax on US stocks (30%) - use Ireland-domiciled ETFs'
            ]
        },
        culturalNotes: [
            'CPF is cornerstone of financial life',
            'HDB (public housing) is major asset for most',
            'No capital gains tax attracts investors',
            'High cost of living especially cars (COE system)',
            'Strong savings culture'
        ],
        regulatoryBodies: [
            { name: 'MAS (Monetary Authority of Singapore)', website: 'https://www.mas.gov.sg' },
            { name: 'IRAS (Inland Revenue)', website: 'https://www.iras.gov.sg' },
            { name: 'CPF Board', website: 'https://www.cpf.gov.sg' }
        ]
    }
};

/**
 * Get comprehensive financial intelligence for a country
 */
export function getCountryFinancialIntelligence(countryCode: string): CountryFinancialIntelligence | null {
    return COUNTRY_FINANCIAL_INTELLIGENCE[countryCode.toUpperCase()] || null;
}

/**
 * Build AI context string from country financial intelligence
 */
export function buildCountryIntelligenceContext(countryCode: string): string {
    const intel = getCountryFinancialIntelligence(countryCode);
    if (!intel) return '';

    let context = `\n═══════════════════════════════════════════════════════════════════════════
🌍 COUNTRY-SPECIFIC FINANCIAL KNOWLEDGE (${countryCode.toUpperCase()})
═══════════════════════════════════════════════════════════════════════════\n`;

    // Retirement System
    context += `\n**🏦 RETIREMENT SYSTEM:**\n`;
    context += `• Public: ${intel.retirementSystem.publicPension}\n`;
    context += `• Retirement Age: ${intel.retirementSystem.retirementAge}\n`;

    if (intel.retirementSystem.taxAdvantaged.length > 0) {
        context += `\n**📊 TAX-ADVANTAGED ACCOUNTS:**\n`;
        for (const account of intel.retirementSystem.taxAdvantaged) {
            context += `\n• **${account.name}**${account.localName ? ` (${account.localName})` : ''}:\n`;
            context += `  - Max: ${account.maxContribution}\n`;
            context += `  - Benefit: ${account.taxBenefit}\n`;
            context += `  - Rules: ${account.withdrawalRules}\n`;
        }
    }

    // Investment Vehicles
    context += `\n**📈 INVESTMENT OPTIONS:**\n`;
    context += `• Stock Market: ${intel.investmentVehicles.stockMarket}\n`;
    context += `• Popular Brokers: ${intel.investmentVehicles.popularBrokers.join(', ')}\n`;
    if (intel.investmentVehicles.etfs.length > 0) {
        context += `• Popular ETFs: ${intel.investmentVehicles.etfs.slice(0, 5).join(', ')}\n`;
    }
    if (intel.investmentVehicles.restrictions && intel.investmentVehicles.restrictions.length > 0) {
        context += `• ⚠️ Restrictions: ${intel.investmentVehicles.restrictions.join('; ')}\n`;
    }

    // Tax Strategies
    context += `\n**💰 TAX OPTIMIZATION TIPS:**\n`;
    for (const tip of intel.taxStrategies.tips.slice(0, 5)) {
        context += `• ${tip}\n`;
    }

    // Real Estate
    context += `\n**🏠 REAL ESTATE:**\n`;
    context += `• Foreign Ownership: ${intel.realEstate.foreignOwnership}\n`;
    context += `• Property Tax: ${intel.realEstate.propertyTax}\n`;
    context += `• Avg Rental Yield: ${intel.realEstate.rentalYield}%, Mortgage Rate: ~${intel.realEstate.mortgageRates}%\n`;

    // Cultural Notes
    if (intel.culturalNotes.length > 0) {
        context += `\n**🎯 CULTURAL FINANCIAL NORMS:**\n`;
        for (const note of intel.culturalNotes.slice(0, 4)) {
            context += `• ${note}\n`;
        }
    }

    context += `\n═══════════════════════════════════════════════════════════════════════════\n`;

    return context;
}

/**
 * Get available countries with intelligence data
 */
export function getAvailableCountries(): string[] {
    return Object.keys(COUNTRY_FINANCIAL_INTELLIGENCE);
}
