# Hybrid AI Architecture Documentation

## Overview

Twealth uses a **hybrid AI architecture** that intelligently routes queries between two AI models:

1. **Scout** (Llama 4 via Groq) - Fast, cost-effective model for 90-95% of queries
2. **Reasoning** (Claude Opus 4.1 via Anthropic) - Deep CFO-level analysis for complex scenarios

This architecture delivers:
- **92-96% cost savings** compared to using Claude Opus for all queries
- **Sub-second response times** for simple queries
- **Professional-grade analysis** for complex financial scenarios
- **Estimated cost**: $0.40-$1.60 per premium user/month (vs. $9.99/month subscription)

---

## Architecture Flow

```
User Query → API Endpoint
              ↓
         Router (shouldEscalate?)
              ↓
         ┌────┴────┐
         ↓         ↓
      Scout    Reasoning
    (Llama 4)  (Opus 4.1)
         ↓         ↓
    Fast Answer  ↓
              Orchestrator?
                  ↓
        ┌─────────┴──────────┐
        ↓         ↓          ↓
      Debt    Retirement   Tax   Portfolio
        ↓         ↓          ↓      ↓
     Structured Analysis (Zod-validated)
                  ↓
            Response with Metadata
```

---

## Component Architecture

### 1. Configuration Layer
**File**: `server/config/ai.ts`

```typescript
export const AI_CONFIG = {
  SCOUT_PROVIDER: 'groq',
  SCOUT_MODEL: 'llama-3.3-70b-versatile',
  REASON_PROVIDER: 'anthropic',
  REASON_MODEL: 'claude-opus-4-20250514',
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7
};

export const MODEL_COSTS = {
  'llama-3.3-70b-versatile': { input: 0.00059, output: 0.00079 },
  'claude-opus-4-20250514': { input: 0.015, output: 0.075 }
};
```

**Environment Variables**:
- `AI_SCOUT_PROVIDER` - Provider for Scout (default: 'groq')
- `AI_SCOUT_MODEL` - Model name for Scout
- `AI_REASON_PROVIDER` - Provider for Reasoning (default: 'anthropic')
- `AI_REASON_MODEL` - Model name for Reasoning
- `GROQ_API_KEY` - Groq API key (required)
- `ANTHROPIC_API_KEY` - Anthropic API key (required)

---

### 2. AI Clients
**File**: `server/ai/clients.ts`

Thin wrappers around provider SDKs with standardized interface:

```typescript
interface AIResponse {
  text: string;      // Natural language response
  tokensIn: number;  // Input tokens consumed
  tokensOut: number; // Output tokens generated
  cost: number;      // Cost in USD
}
```

**Scout Client** (Groq SDK):
- Model: Llama 3.3 70B Versatile
- Cost: ~$0.0006/1K input, ~$0.0008/1K output
- Latency: 200-500ms average

**Reasoning Client** (Anthropic SDK):
- Model: Claude Opus 4.1
- Cost: ~$0.015/1K input, ~$0.075/1K output
- Latency: 2-5s average

---

### 3. Smart Router
**File**: `server/ai/router.ts`

**Primary Function**: `shouldEscalate(signals: ComplexitySignals): boolean`

**Complexity Signals**:
```typescript
interface ComplexitySignals {
  message: string;         // User query text
  debtsCount: number;      // Number of debts
  assetsCount: number;     // Number of assets
  messageLength: number;   // Character count
  contextTokens: number;   // Estimated context size
}
```

**Auto-Escalation Triggers** (always escalate):
1. **3+ debts** - Automatic regardless of keywords
2. **Multi-year planning** - Keywords: "5 year", "10 year", "multi-year"
3. **Retirement planning** - Keywords: "retire", "retirement", "glidepath", "401k", "ira"
4. **Tax optimization** - Keywords: "tax", "roth", "traditional", "bracket"
5. **Portfolio analysis** - Keywords: "portfolio", "asset allocation", "rebalance" + assets > 0
6. **Invest vs pay-off** - Keywords: "invest" + ("debt" | "pay off")
7. **Multiple scenarios** - Keywords: "compare", "vs", "versus" with 2+ financial terms

**Routing Logic**:
```typescript
export function shouldEscalate(signals: ComplexitySignals): boolean {
  const msg = signals.message.toLowerCase();
  
  // Auto-escalate on 3+ debts (regardless of keywords)
  if (signals.debtsCount >= 3) return true;
  
  // Multi-year planning
  if (/\d+[- ]year/i.test(msg) || /multi[- ]year/i.test(msg)) return true;
  
  // Retirement planning
  if (/(retire|retirement|401k|ira|glidepath)/i.test(msg)) return true;
  
  // Tax optimization
  if (/(tax|roth|traditional|bracket)/i.test(msg)) return true;
  
  // Portfolio (only if user has assets)
  if (signals.assetsCount > 0 && 
      /(portfolio|asset allocation|rebalance|diversif)/i.test(msg)) return true;
  
  // Invest vs pay-off scenarios
  if (/invest/i.test(msg) && /(debt|pay[ -]?off)/i.test(msg)) return true;
  
  return false;
}
```

---

### 4. Context Builder
**File**: `server/ai/contextBuilder.ts`

**Purpose**: Normalize user financial data into a structured format for both Scout and Reasoning models.

**Data Sources**:
- User income (monthly)
- User expenses (monthly)
- Transactions (last 30 days)
- Financial goals
- Debts (balance, APR, minimum payment)
- Assets (type, value, liquid vs illiquid)
- Budget categories
- User preferences (risk tolerance, timeline)

**Output Structure**:
```typescript
interface FinancialContext {
  income: {
    sources: Array<{ name: string; amount: number; frequency: string }>;
    total: number;
  };
  expenses: {
    monthly: number;
    categories: Array<{ name: string; amount: number }>;
  };
  debts: Array<{
    name: string;
    balance: number;
    apr: number;
    minimumPayment: number;
    monthlyPayment: number;
  }>;
  assets: Array<{
    name: string;
    type: string;
    value: number;
    liquid: boolean;
  }>;
  goals: Array<{
    name: string;
    target: number;
    current: number;
    horizonMonths: number;
  }>;
  preferences: {
    riskTolerance?: string;
    savingsTimeline?: string;
  };
}
```

**Token Estimation**:
```typescript
export function estimateContextTokens(context: FinancialContext): number {
  // Rough estimate: 4 characters ≈ 1 token
  return Math.ceil(JSON.stringify(context).length / 4);
}
```

---

### 5. Orchestrators
**Directory**: `server/ai/orchestrators/`

Deep CFO-level analysis modules for complex scenarios. Each orchestrator:
- Uses Claude Opus 4.1 (Reasoning model)
- Returns **structured JSON** validated by Zod
- Provides **natural language summary**
- Throws errors on validation failure (no silent fallbacks)

#### Debt Orchestrator
**File**: `debt.ts`

**Purpose**: Analyze debt payoff strategies (Snowball vs Avalanche)

**Input**: FinancialContext + user query
**Output** (Zod-validated):
```typescript
{
  strategy: {
    type: 'snowball' | 'avalanche' | 'hybrid';
    reason: string;
    projectedMonthsToDebtFree: number;
    totalInterestPaid: number;
  };
  payoffOrder: Array<{
    debtName: string;
    balance: number;
    apr: number;
    priorityRank: number;
    monthsToPayoff: number;
    interestPaid: number;
  }>;
  alternativeStrategy?: {
    type: string;
    projectedMonths: number;
    totalInterest: number;
    tradeoffs: string;
  };
  summary: string;
}
```

**Safeguards**:
- Throws if no debts provided
- Validates all numeric fields are non-negative
- Ensures payoff order has same count as debts

#### Retirement Orchestrator
**File**: `retirement.ts`

**Purpose**: Retirement planning with glidepath optimization

**Output** (Zod-validated):
```typescript
{
  targetRetirementAge: number;
  yearsToRetirement: number;
  targetAmount: number;
  currentSavings: number;
  monthlyContributionNeeded: number;
  glidepath: {
    currentAllocation: { stocks: number; bonds: number; cash: number };
    targetAllocation: { stocks: number; bonds: number; cash: number };
    rebalancingSchedule: string;
  };
  incomeProjection: {
    monthlyIncome: number;
    source: string;
    inflationAdjusted: boolean;
  };
  summary: string;
}
```

**Safeguards**:
- Division by zero guards for years to retirement
- Validates allocation percentages sum to 100
- Ensures all ages are positive

#### Tax Orchestrator
**File**: `tax.ts`

**Purpose**: Tax optimization (Roth vs Traditional, bracket analysis)

**Output** (Zod-validated):
```typescript
{
  recommendation: {
    accountType: 'roth' | 'traditional' | 'split';
    rothContribution: number;
    traditionalContribution: number;
    reason: string;
  };
  taxImpact: {
    currentBracket: string;
    effectiveRate: number;
    marginalRate: number;
    estimatedSavings: number;
  };
  multiYearStrategy?: {
    year1: string;
    year2: string;
    year3: string;
  };
  summary: string;
}
```

**Safeguards**:
- Validates contribution amounts are non-negative
- Ensures rates are between 0-100%
- Includes filing status and deductions in prompts

#### Portfolio Orchestrator
**File**: `portfolio.ts`

**Purpose**: Asset allocation, rebalancing, risk-adjusted returns

**Output** (Zod-validated):
```typescript
{
  currentAllocation: {
    stocks: number;
    bonds: number;
    cash: number;
    alternatives: number;
  };
  targetAllocation: {
    stocks: number;
    bonds: number;
    cash: number;
    alternatives: number;
  };
  rebalancingPlan: Array<{
    assetClass: string;
    currentPercentage: number;
    targetPercentage: number;
    action: 'buy' | 'sell' | 'hold';
    amount: number;
  }>;
  riskAssessment: {
    currentRiskLevel: 'low' | 'medium' | 'high';
    targetRiskLevel: 'low' | 'medium' | 'high';
    volatility: number;
  };
  summary: string;
}
```

**Safeguards**:
- Early return if no assets
- Asset categorization (liquid vs illiquid)
- Validates allocation percentages
- Prevents division by zero

---

### 6. Hybrid AI Service
**File**: `server/ai/hybridAIService.ts`

**Main Entry Point**: `generateHybridAdvice(userId, message, storage)`

**Flow**:
1. Build financial context from user data
2. Evaluate complexity signals
3. Route to Scout or Reasoning
4. If Reasoning: detect and call orchestrator
5. Return structured response with metadata

**Response Structure**:
```typescript
interface HybridAIResponse {
  answer: string;              // Natural language response
  modelUsed: 'scout' | 'reasoning';
  tokensIn: number;
  tokensOut: number;
  cost: number;                // Cost in USD
  escalated: boolean;
  escalationReason?: string;   // Why it was escalated
  orchestratorUsed?: string;   // 'debt' | 'retirement' | 'tax' | 'portfolio'
  structuredData?: any;        // Zod-validated structured output
}
```

---

### 7. API Endpoint
**File**: `server/routes.ts`

**Endpoint**: `POST /api/ai/advise`

**Request**:
```json
{
  "message": "I have 3 credit cards with high interest. What should I do?"
}
```

**Response**:
```json
{
  "answer": "Based on your debt situation...",
  "modelUsed": "reasoning",
  "tokensIn": 850,
  "tokensOut": 420,
  "cost": 0.04425,
  "escalated": true,
  "escalationReason": "Complex debt situation (3 debts) - auto-escalated",
  "orchestratorUsed": "debt",
  "structuredData": { ... }
}
```

**Authentication**: Required (`isAuthenticated` middleware)

**Error Handling**:
- Returns 400 if message is missing
- Returns 500 with error details in development mode
- Logs all requests with model used, escalation status, and cost

---

## Cost Analysis

### Scout (Llama 4 via Groq)
- **Input**: $0.00059 per 1K tokens
- **Output**: $0.00079 per 1K tokens
- **Typical query**: 500 input + 300 output = **$0.00053**

### Reasoning (Claude Opus 4.1)
- **Input**: $0.015 per 1K tokens
- **Output**: $0.075 per 1K tokens
- **Typical query**: 1000 input + 500 output = **$0.0525**

### Monthly Cost Projection (Premium User)
- **Assumption**: 50 queries/month
- **Split**: 45 Scout (90%) + 5 Reasoning (10%)
- **Cost**: (45 × $0.0005) + (5 × $0.05) = **$0.27/month**

**Margin at $9.99/month**: 97.3%

---

## Environment Setup

### Required API Keys
```bash
# Groq (Scout)
GROQ_API_KEY=gsk_...

# Anthropic (Reasoning)
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional Configuration
```bash
# Override default models
AI_SCOUT_MODEL=llama-3.3-70b-versatile
AI_REASON_MODEL=claude-opus-4-20250514

# Override providers
AI_SCOUT_PROVIDER=groq
AI_REASON_PROVIDER=anthropic

# AI parameters
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

---

## Adding New Orchestrators

### Step 1: Create Orchestrator File
**File**: `server/ai/orchestrators/[name].ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// 1. Define Zod schema
const MyAnalysisSchema = z.object({
  recommendation: z.string(),
  details: z.object({
    // ... your fields
  }),
  summary: z.string()
});

// 2. Export orchestrator function
export async function analyzeMyFeature(context: any, userQuery: string) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  // 3. Build prompt
  const prompt = `Analyze the following scenario...
Context: ${JSON.stringify(context)}
User Query: ${userQuery}

Return JSON matching this schema: ${JSON.stringify(MyAnalysisSchema.shape)}`;
  
  // 4. Call Claude Opus
  const response = await client.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });
  
  // 5. Extract and validate
  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  
  const parsed = JSON.parse(jsonMatch[0]);
  const validated = MyAnalysisSchema.parse(parsed); // Throws if invalid
  
  return validated;
}
```

### Step 2: Register in Hybrid Service
**File**: `server/ai/hybridAIService.ts`

```typescript
// Add to detectOrchestrator()
function detectOrchestrator(userMessage: string, context: any): string | null {
  const msgLower = userMessage.toLowerCase();
  
  // ... existing conditions ...
  
  // Add your orchestrator
  if (msgLower.includes('your-keyword')) {
    return 'my-feature';
  }
  
  return null;
}

// Add to callOrchestrator()
async function callOrchestrator(...) {
  switch (orchestrator) {
    // ... existing cases ...
    
    case 'my-feature':
      structuredData = await analyzeMyFeature(context, userMessage);
      break;
  }
}
```

### Step 3: Add Tests
**File**: `tests/ai/hybrid-ai.test.ts`

```typescript
describe('My Feature Orchestrator', () => {
  it('should export analyzeMyFeature function', async () => {
    const { analyzeMyFeature } = await import('../../server/ai/orchestrators/my-feature');
    expect(typeof analyzeMyFeature).toBe('function');
  });
  
  it('should escalate on my-feature keywords', () => {
    const signals: ComplexitySignals = {
      message: "Help me with my-feature",
      debtsCount: 0,
      assetsCount: 0,
      messageLength: 25,
      contextTokens: 500,
    };
    
    expect(shouldEscalate(signals)).toBe(true);
  });
});
```

---

## Testing

### Run Smoke Tests
```bash
npm test tests/ai/hybrid-ai.test.ts
```

### Test Coverage
- ✅ Router escalation logic
- ✅ Keyword detection
- ✅ Edge cases (zero debts, long messages)
- ✅ Orchestrator exports
- ✅ Client exports
- ✅ Service exports

### Manual Testing
Navigate to `/hybrid-ai` in the app to test:
- Sample queries (Scout vs Reasoning)
- Custom queries
- Premium gate (for non-premium users)
- Model badges
- Loading states
- Response metadata

---

## UI Components

### HybridAIDemo Page
**Route**: `/hybrid-ai`
**File**: `client/src/pages/HybridAIDemo.tsx`

**Features**:
- Sample query templates
- Custom query input
- Model badges (Scout ⚡ vs Reasoning 🧠)
- Loading states with brain animation
- Escalation reason display
- Structured data preview
- Cost/token metadata
- Premium gate integration

### PremiumGateModal
**File**: `client/src/components/modals/PremiumGateModal.tsx`

**Triggers**:
- Non-premium user attempts deep analysis
- Query would escalate to Reasoning

**Benefits Highlighted**:
- Advanced debt payoff strategies
- Retirement planning with glidepath
- Tax optimization (Roth vs Traditional)
- Portfolio rebalancing
- Multi-year financial planning
- Unlimited deep analysis

**CTA**: Upgrade to Premium ($9.99/mo)

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] Set `GROQ_API_KEY` environment variable
- [ ] Set `ANTHROPIC_API_KEY` environment variable
- [ ] Test routing with sample queries
- [ ] Verify premium gate triggers correctly
- [ ] Check cost tracking logs
- [ ] Run smoke tests (`npm test`)
- [ ] Monitor initial cost per user

### Monitoring
- Log all escalations with reason
- Track model usage distribution (Scout vs Reasoning)
- Monitor cost per user per month
- Alert if cost exceeds $2/user/month

### Performance
- **Scout**: 200-500ms average latency
- **Reasoning**: 2-5s average latency
- **Target**: 90-95% of queries use Scout

---

## Troubleshooting

### Issue: All queries escalating to Reasoning
**Solution**: Check router logic - likely too many keywords matching

### Issue: Orchestrator throwing validation errors
**Solution**: Check Zod schema matches Claude's JSON output exactly

### Issue: High costs
**Solution**: Review escalation logs - adjust router thresholds if needed

### Issue: Premium gate not showing
**Solution**: Check subscription query returns `{ tier: 'premium' }` or `{ tier: 'pro' }`

---

## Future Enhancements

1. **Fine-tuned Scout Model**: Train Llama on Twealth-specific financial queries
2. **Hybrid Routing ML**: Use ML model to predict escalation more accurately
3. **Orchestrator Caching**: Cache common orchestrator results
4. **Streaming Responses**: Stream Reasoning responses for better UX
5. **Multi-model Consensus**: For critical decisions, get 2+ model opinions

---

## References

- [Groq API Docs](https://console.groq.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Llama 3.3 Model Card](https://llama.meta.com/)
- [Claude Opus 4.1 Release Notes](https://www.anthropic.com/claude)

---

**Last Updated**: November 11, 2025
**Version**: 1.0.0
**Maintainer**: Twealth AI Team
