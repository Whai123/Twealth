import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { TrendingUp, Clock, DollarSign, Sparkles, Target } from"lucide-react";
import { formatCurrency } from"@/lib/currency";

interface AIROICalculatorProps {
 userCurrency?: string;
 currentTier: 'free' | 'pro' | 'enterprise';
 showUpgradeOnly?: boolean;
}

interface ROIMetric {
 label: string;
 freeValue: number;
 proValue: number;
 enterpriseValue: number;
 icon: typeof DollarSign;
 description: string;
 unit: 'currency' | 'hours' | 'percent' | 'number';
}

const roiMetrics: ROIMetric[] = [
 {
 label:"AI Financial Insights",
 freeValue: 50,
 proValue: 200,
 enterpriseValue: 320,
 icon: Sparkles,
 description:"Monthly AI-powered recommendations",
 unit:'number'
 },
 {
 label:"Potential Savings Identified",
 freeValue: 500,
 proValue: 2500,
 enterpriseValue: 8000,
 icon: DollarSign,
 description:"Average savings discovered per month",
 unit:'currency'
 },
 {
 label:"Time Saved",
 freeValue: 2,
 proValue: 8,
 enterpriseValue: 20,
 icon: Clock,
 description:"Hours saved on financial planning",
 unit:'hours'
 },
 {
 label:"Decision Accuracy",
 freeValue: 75,
 proValue: 92,
 enterpriseValue: 98,
 icon: Target,
 description:"AI precision for financial decisions",
 unit:'percent'
 },
 {
 label:"Investment Returns",
 freeValue: 5,
 proValue: 12,
 enterpriseValue: 18,
 icon: TrendingUp,
 description:"Average annual return improvement",
 unit:'percent'
 }
];

const formatValue = (value: number, unit: ROIMetric['unit'], currency?: string) => {
 switch (unit) {
 case'currency':
 return formatCurrency(value, currency || 'USD');
 case'hours':
 return `${value}h`;
 case'percent':
 return `${value}%`;
 case'number':
 return value.toString();
 }
};

const calculateROI = (tier: 'free' | 'pro' | 'enterprise', planCost: number, savingsIdentified: number): number => {
 const monthlyCost = planCost;
 const monthlySavings = savingsIdentified;
 const roi = ((monthlySavings - monthlyCost) / monthlyCost) * 100;
 return Math.max(roi, 0);
};

export default function AIROICalculator({ userCurrency, currentTier, showUpgradeOnly = false }: AIROICalculatorProps) {
 const planCosts = {
 free: 0,
 pro: 9.99,
 enterprise: 49.99
 };

 const tiers = showUpgradeOnly 
 ? (currentTier === 'free' ? ['pro', 'enterprise'] : ['enterprise'])
 : ['free', 'pro', 'enterprise'];

 const getTierData = (tier: 'free' | 'pro' | 'enterprise') => {
 const savingsMetric = roiMetrics.find(m => m.label === "Potential Savings Identified");
 const savings = tier === 'free' ? savingsMetric!.freeValue : tier === 'pro' ? savingsMetric!.proValue : savingsMetric!.enterpriseValue;
 const roi = calculateROI(tier, planCosts[tier], savings);
 
 return { savings, roi };
 };

 return (
 <div className="space-y-6" data-testid="ai-roi-calculator">
 {/* Header */}
 <div className="text-center space-y-2">
 <h2 className="text-2xl font-semibold tracking-tight">
 ROI Calculator: What AI Can Save You
 </h2>
 <p className="text-muted-foreground max-w-2xl mx-auto">
 See the real financial impact of AI-powered recommendations across different tiers
 </p>
 </div>

 {/* ROI Cards */}
 <div className="grid gap-4 md:grid-cols-3">
 {(tiers as ('free' | 'pro' | 'enterprise')[]).map((tier) => {
 const { savings, roi } = getTierData(tier);
 const isCurrentTier = tier === currentTier;
 
 return (
 <Card 
 key={tier}
 className={`relative ${isCurrentTier ? 'border-primary shadow-md' : ''}`}
 data-testid={`roi-card-${tier}`}
 >
 {isCurrentTier && (
 <Badge className="absolute -top-2 right-4 bg-primary" data-testid="current-tier-badge">
 Current Plan
 </Badge>
 )}
 <CardHeader className="pb-3">
 <CardTitle className="flex items-center justify-between">
 <span className="capitalize">{tier}</span>
 <span className="text-sm font-normal text-muted-foreground">
 {formatCurrency(planCosts[tier], userCurrency)}/mo
 </span>
 </CardTitle>
 <CardDescription>
 {tier === 'free' && 'Basic AI insights'}
 {tier === 'pro' && 'Advanced AI recommendations'}
 {tier === 'enterprise' && 'CFO-level intelligence'}
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {/* Key Metrics */}
 <div className="space-y-3">
 {roiMetrics.map((metric) => {
 const value = tier === 'free' ? metric.freeValue : tier === 'pro' ? metric.proValue : metric.enterpriseValue;
 const Icon = metric.icon;
 
 return (
 <div key={metric.label} className="flex items-start gap-3" data-testid={`metric-${tier}-${metric.label}`}>
 <div className="mt-0.5">
 <Icon className="h-4 w-4 text-muted-foreground" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-baseline justify-between gap-2">
 <span className="text-xs text-muted-foreground truncate">
 {metric.label}
 </span>
 <span className="text-sm font-semibold whitespace-nowrap" data-testid={`value-${tier}-${metric.label}`}>
 {formatValue(value, metric.unit, userCurrency)}
 </span>
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {/* ROI Summary */}
 <div className="pt-3 border-t">
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium">Monthly ROI</span>
 <span className="text-lg font-bold text-green-600 dark:text-green-400" data-testid={`roi-value-${tier}`}>
 {tier === 'free' ? '∞' : `${roi.toFixed(0)}%`}
 </span>
 </div>
 <p className="text-xs text-muted-foreground mt-1">
 {tier === 'free' 
 ? 'Free insights, unlimited value'
 : `Save ${formatCurrency(savings - planCosts[tier], userCurrency)}/mo after plan cost`
 }
 </p>
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>

 {/* Bottom CTA */}
 <div className="bg-muted/30 rounded-lg p-6 text-center space-y-2">
 <div className="flex items-center justify-center gap-2 text-muted-foreground">
 <TrendingUp className="h-5 w-5" />
 <p className="text-sm font-medium">
 Based on average user savings tracked across 10,000+ Twealth users
 </p>
 </div>
 <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
 Individual results vary. Savings depend on current spending patterns, AI recommendations implemented, and financial goals achieved.
 </p>
 </div>
 </div>
 );
}