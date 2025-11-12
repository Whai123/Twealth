import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Progress } from"@/components/ui/progress";
import { useQuery, useMutation } from"@tanstack/react-query";
import { Skeleton } from"@/components/ui/skeleton";
import { Crown, Check, Zap, TrendingUp, AlertTriangle, Sparkles } from"lucide-react";
import { useToast } from"@/hooks/use-toast";
import { queryClient, apiRequest } from"@/lib/queryClient";
import { useLocation } from"wouter";
import { getLocalizedPrice, formatCurrency, getCurrencySymbol } from"@/lib/currency";

interface SubscriptionPlan {
 id: string;
 name: string;
 displayName: string;
 description: string;
 priceThb: string;
 priceUsd: string;
 currency: string;
 billingInterval: string;
 scoutLimit: number;
 sonnetLimit: number;
 opusLimit: number;
 aiChatLimit: number;
 aiDeepAnalysisLimit: number;
 aiInsightsFrequency: string;
 isLifetimeLimit: boolean;
 features: string[];
 isActive: boolean;
 sortOrder: number;
}

interface Subscription {
 id: string;
 planId: string;
 status: string;
 currentPeriodStart: string;
 currentPeriodEnd: string;
 plan: SubscriptionPlan;
}

interface SubscriptionData {
 subscription: Subscription;
 usage: {
 aiChatsUsed: number;
 aiDeepAnalysisUsed: number;
 aiInsightsGenerated: number;
 totalTokensUsed: number;
 estimatedCostUsd: string;
 };
 addOns: any[];
}

interface UsageInfo {
 scoutUsage: {
 used: number;
 limit: number;
 remaining: number;
 };
 sonnetUsage: {
 used: number;
 limit: number;
 remaining: number;
 };
 opusUsage: {
 used: number;
 limit: number;
 remaining: number;
 };
 chatUsage: {
 used: number;
 limit: number;
 remaining: number;
 allowed: boolean;
 };
 analysisUsage: {
 used: number;
 limit: number;
 remaining: number;
 allowed: boolean;
 };
 insights: number;
 totalTokens: number;
 estimatedCost: string;
}

const formatFeatureName = (feature: string) => {
 const map: Record<string, string> = {
 'basic_tracking': 'Basic expense tracking',
 'ai_chat': 'AI financial assistant',
 'advanced_goals': 'Advanced goal setting',
 'group_planning': 'Group event planning',
 'transaction_import': 'Import transactions',
 'priority_support': 'Priority support',
 'advanced_analytics': 'Advanced analytics',
 'api_access': 'API access'
 };
 return map[feature] || feature.replace(/_/g, ' ');
};

export default function SubscriptionPage() {
 const { toast } = useToast();
 const [, setLocation] = useLocation();

 const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
 queryKey: ["/api/subscription/plans"]
 });

 const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<SubscriptionData>({
 queryKey: ["/api/subscription/current"]
 });

 const { data: usage } = useQuery<UsageInfo>({
 queryKey: ["/api/subscription/usage"],
 refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
 });

 const { data: userPreferences } = useQuery<{ currency?: string }>({
 queryKey: ["/api/user-preferences"],
 });

 const handleUpgrade = (planId: string, planName: string) => {
 // Free plan doesn't need payment
 if (planName === 'Free') {
 // Direct upgrade without payment
 apiRequest("POST","/api/subscription/upgrade", { planId })
 .then(() => {
 toast({
 title:"Switched to Free Plan",
 description:"You're now on the Free plan."
 });
 queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
 queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
 })
 .catch((error: any) => {
 toast({
 title:"Upgrade failed",
 description: error.message ||"Failed to change plan",
 variant:"destructive"
 });
 });
 } else {
 // Redirect to Stripe checkout for paid plans
 setLocation(`/checkout/${planId}`);
 }
 };

 if (plansLoading || subscriptionLoading) {
 return (
 <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
 <div className="space-y-2">
 <Skeleton className="h-8 w-48" />
 <Skeleton className="h-4 w-64" />
 </div>
 <div className="grid gap-6 md:grid-cols-3">
 {[1, 2, 3].map(i => (
 <Skeleton key={i} className="h-80" />
 ))}
 </div>
 </div>
 );
 }

 const currentPlan = currentSubscription?.subscription?.plan;

 return (
 <div className="min-h-screen bg-background">
 {/* Clean Professional Header */}
 <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
 <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
 <div className="flex-1 min-w-0">
 <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
 Premium Plans
 </h1>
 <p className="text-sm text-muted-foreground mt-1">Upgrade your account to unlock advanced features</p>
 </div>
 </div>
 </header>
 
 <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">

 {/* Current Plan Status */}
 {currentPlan && (
 <Card className="border-border/40">
 <CardHeader className="space-y-4">
 <CardTitle className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div>
 <h2 className="text-xl font-semibold">Your Current Plan</h2>
 <p className="text-sm text-muted-foreground mt-1">{currentPlan.displayName}</p>
 </div>
 </div>
 <Badge variant="secondary" className="text-xs font-medium">Active</Badge>
 </CardTitle>
 <CardDescription className="text-sm leading-relaxed">
 {currentPlan.description}
 </CardDescription>
 </CardHeader>
 <CardContent className="relative space-y-8">
 {usage && (
 <div className="grid gap-4 md:grid-cols-3">
 {/* Scout Queries - Available for all tiers */}
 <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl border border-blue-200/30 dark:border-blue-800/30 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Zap className="w-4 h-4 text-blue-600" />
 <span className="text-sm font-semibold">Scout Queries</span>
 </div>
 <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">Scout</Badge>
 </div>
 <div className="flex items-baseline gap-1">
 <span className="text-2xl font-bold text-blue-600">
 {usage.scoutUsage.used}
 </span>
 <span className="text-muted-foreground text-sm">/ {usage.scoutUsage.limit}</span>
 </div>
 <Progress 
 value={(usage.scoutUsage.used / usage.scoutUsage.limit) * 100} 
 className="h-2 bg-blue-100 dark:bg-blue-900/30"
 />
 {usage.scoutUsage.used >= usage.scoutUsage.limit * 0.8 && (
 <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 rounded-lg p-2">
 <AlertTriangle className="h-3 w-3" />
 <span className="font-medium">Running low on quota!</span>
 </div>
 )}
 </div>

 {/* Sonnet Queries - Available for Pro/Enterprise only */}
 {usage.sonnetUsage.limit > 0 && (
 <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl border border-purple-200/30 dark:border-purple-800/30 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-purple-600" />
 <span className="text-sm font-semibold">Sonnet Queries</span>
 </div>
 <Badge className="bg-purple-500 text-white text-xs px-2 py-0.5">Sonnet</Badge>
 </div>
 <div className="flex items-baseline gap-1">
 <span className="text-2xl font-bold text-purple-600">
 {usage.sonnetUsage.used}
 </span>
 <span className="text-muted-foreground text-sm">/ {usage.sonnetUsage.limit}</span>
 </div>
 <Progress 
 value={(usage.sonnetUsage.used / usage.sonnetUsage.limit) * 100} 
 className="h-2 bg-purple-100 dark:bg-purple-900/30"
 />
 {usage.sonnetUsage.used >= usage.sonnetUsage.limit * 0.8 && (
 <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 rounded-lg p-2">
 <AlertTriangle className="h-3 w-3" />
 <span className="font-medium">Running low on quota!</span>
 </div>
 )}
 </div>
 )}

 {/* Opus Queries - Available for Enterprise only */}
 {usage.opusUsage.limit > 0 && (
 <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl border border-amber-200/30 dark:border-amber-800/30 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Crown className="w-4 h-4 text-amber-600" />
 <span className="text-sm font-semibold">Opus Queries</span>
 </div>
 <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs px-2 py-0.5">Opus</Badge>
 </div>
 <div className="flex items-baseline gap-1">
 <span className="text-2xl font-bold text-amber-600">
 {usage.opusUsage.used}
 </span>
 <span className="text-muted-foreground text-sm">/ {usage.opusUsage.limit}</span>
 </div>
 <Progress 
 value={(usage.opusUsage.used / usage.opusUsage.limit) * 100} 
 className="h-2 bg-amber-100 dark:bg-amber-900/30"
 />
 {usage.opusUsage.used >= usage.opusUsage.limit * 0.8 && (
 <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 rounded-lg p-2">
 <AlertTriangle className="h-3 w-3" />
 <span className="font-medium">Running low on quota!</span>
 </div>
 )}
 </div>
 )}
 </div>
 )}

 <div className="grid gap-4 md:grid-cols-3">
 <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl border border-border/30">
 <div className="text-2xl font-bold text-foreground">
 {usage?.insights || 0}
 </div>
 <div className="text-xs text-muted-foreground mt-1">Insights Generated</div>
 </div>
 <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl border border-border/30">
 <div className="text-2xl font-bold text-foreground">
 {usage?.totalTokens?.toLocaleString() || 0}
 </div>
 <div className="text-xs text-muted-foreground mt-1">Tokens Used</div>
 </div>
 <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl border border-border/30">
 <div className="text-2xl font-bold text-foreground">
 ${usage?.estimatedCost || '0.000'}
 </div>
 <div className="text-xs text-muted-foreground mt-1">AI Costs This Month</div>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Enhanced Pricing Plans */}
 <div className="space-y-12">
 <div className="text-center space-y-4">
 <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
 Choose Your Perfect Plan
 </h2>
 <p className="text-base text-muted-foreground max-w-2xl mx-auto">
 Start free, upgrade anytime. All plans include our core financial tracking features.
 </p>
 <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
 <div className="flex items-center gap-1">
 <Check className="w-4 h-4 text-green-500" />
 <span>Cancel anytime</span>
 </div>
 <div className="flex items-center gap-1">
 <Check className="w-4 h-4 text-green-500" />
 <span>Instant activation</span>
 </div>
 <div className="flex items-center gap-1">
 <Check className="w-4 h-4 text-green-500" />
 <span>No setup fees</span>
 </div>
 </div>
 </div>
 <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
 {plans?.filter(p => p.name === 'Free' || p.name === 'Pro').map((plan, index) => {
 const isCurrentPlan = currentPlan?.id === plan.id;
 const isPremium = plan.name === 'Pro';
 const isMostPopular = plan.name === 'Pro';
 
 return (
 <Card 
 key={plan.id} 
 className={`relative transition-all ${
 isMostPopular 
 ? 'border-primary/40 shadow-lg ring-1 ring-primary/20' 
 : 'border-border/40 hover:border-border shadow-sm'
 } ${isCurrentPlan ? 'ring-2 ring-primary bg-primary/5' : ''}
 `}
 data-testid={`card-plan-${plan.name.toLowerCase()}`}
 >
 {isMostPopular && (
 <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-xs font-medium z-10">
 MOST POPULAR
 </Badge>
 )}
 
 <CardHeader className="relative space-y-4 p-4 sm:p-6">
 <div className="flex items-center justify-between">
 <CardTitle className="text-lg font-bold">
 {plan.displayName}
 </CardTitle>
 {isCurrentPlan && (
 <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
 Active
 </Badge>
 )}
 </div>
 <CardDescription className="text-sm leading-relaxed">{plan.description}</CardDescription>
 
 <div className="space-y-2">
 <div className="flex items-baseline gap-2">
 {(() => {
 // Get user's preferred currency or default to USD
 const userCurrency = userPreferences?.currency || 'USD';
 
 if (plan.priceUsd === '0.00') {
 return (
 <span className="text-5xl font-bold">Free</span>
 );
 }

 // Get localized pricing
 const basePrice = parseFloat(plan.priceUsd);
 const localizedPrice = getLocalizedPrice(basePrice, userCurrency);
 
 return (
 <>
 <div className="flex items-end gap-2">
 <span className={`text-5xl font-bold ${
 isMostPopular ? 'text-foreground' : ''
 }`}>
 {localizedPrice.currency.symbol}{Math.round(localizedPrice.amount)}
 </span>
 <span className="text-muted-foreground text-lg">/month</span>
 </div>
 {localizedPrice.isDiscounted && localizedPrice.originalAmount && (
 <div className="flex items-center gap-2 mt-1">
 <span className="text-sm text-muted-foreground line-through">
 {formatCurrency(localizedPrice.originalAmount, userCurrency)}
 </span>
 <Badge className="bg-green-500 text-white text-xs">
 {Math.round((1 - localizedPrice.amount / localizedPrice.originalAmount) * 100)}% OFF
 </Badge>
 </div>
 )}
 {userCurrency !== 'USD' && (
 <div className="text-sm text-muted-foreground mt-1">
 ~${basePrice.toFixed(2)} USD
 </div>
 )}
 </>
 );
 })()}
 </div>
 {plan.priceUsd === '0.00' && (
 <div className="text-sm text-green-600 dark:text-green-400 font-medium">
 Perfect for getting started!
 </div>
 )}
 </div>
 </CardHeader>

 <CardContent className="relative space-y-6 p-4 sm:p-6">
 {/* AI Model Quotas */}
 <div className="space-y-4">
 <h4 className="text-base font-semibold flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-primary" />
 AI Model Quotas
 </h4>
 <div className="space-y-3">
 {/* Scout Queries - Available for all plans */}
 <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-200/30 dark:border-blue-800/30">
 <div className="flex items-center gap-2">
 <Zap className="w-4 h-4 text-blue-600" />
 <span className="text-sm font-medium">Scout Queries</span>
 <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">Fast</Badge>
 </div>
 <div className="text-right">
 <span className="text-base font-bold text-blue-600 block" data-testid={`text-${plan.name.toLowerCase()}-scout-limit`}>
 {plan.scoutLimit === 999999 ? 'Unlimited' : plan.scoutLimit}
 </span>
 <span className="text-xs text-muted-foreground">
 {plan.isLifetimeLimit ? 'lifetime total' : 'per month'}
 </span>
 </div>
 </div>

 {/* Sonnet Queries - Pro/Enterprise only */}
 {plan.sonnetLimit > 0 && (
 <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-purple-200/30 dark:border-purple-800/30">
 <div className="flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-purple-600" />
 <span className="text-sm font-medium">Sonnet Queries</span>
 <Badge className="bg-purple-500 text-white text-xs px-2 py-0.5">Advanced</Badge>
 </div>
 <div className="text-right">
 <span className="text-base font-bold text-purple-600 block" data-testid={`text-${plan.name.toLowerCase()}-sonnet-limit`}>
 {plan.sonnetLimit === 999999 ? 'Unlimited' : plan.sonnetLimit}
 </span>
 <span className="text-xs text-muted-foreground">per month</span>
 </div>
 </div>
 )}

 {/* Opus Queries - Enterprise only */}
 {plan.opusLimit > 0 && (
 <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-200/30 dark:border-amber-800/30">
 <div className="flex items-center gap-2">
 <Crown className="w-4 h-4 text-amber-600" />
 <span className="text-sm font-medium">Opus Queries</span>
 <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs px-2 py-0.5">Premium</Badge>
 </div>
 <div className="text-right">
 <span className="text-base font-bold text-amber-600 block" data-testid={`text-${plan.name.toLowerCase()}-opus-limit`}>
 {plan.opusLimit === 999999 ? 'Unlimited' : plan.opusLimit}
 </span>
 <span className="text-xs text-muted-foreground">per month</span>
 </div>
 </div>
 )}

 {/* AI Insights */}
 <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-border/30">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-primary" />
 <span className="text-sm font-medium">AI Insights</span>
 </div>
 <span className="text-base font-bold capitalize">
 {plan.aiInsightsFrequency}
 </span>
 </div>
 </div>
 </div>

 {/* Core Features */}
 <div className="space-y-3">
 <h4 className="font-bold text-base flex items-center gap-2">
 <Check className="w-5 h-5 text-green-500" />
 Everything Included
 </h4>
 <ul className="space-y-2">
 {plan.features.map((feature, index) => (
 <li key={index} className="flex items-center gap-3 text-sm">
 <div className="p-1 bg-white dark:bg-gray-900 rounded-full">
 <Check className="w-3 h-3 text-white" />
 </div>
 <span className="font-medium">{formatFeatureName(feature)}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Enhanced CTA Button */}
 <Button
 className={`w-full h-14 text-lg font-bold transform shadow-lg ${
 isCurrentPlan 
 ? 'bg-primary text-primary-foreground' 
 : isMostPopular 
 ? 'bg-primary text-primary-foreground' 
 : isPremium 
 ? 'bg-primary text-primary-foreground'
 : 'bg-primary text-primary-foreground'
 }`}
 disabled={isCurrentPlan}
 onClick={() => handleUpgrade(plan.id, plan.name)}
 data-testid={`button-upgrade-${plan.name.toLowerCase()}`}
 >
 {isCurrentPlan ? (
 <>
 <Crown className="w-5 h-5 mr-2" />
 Your Current Plan
 </>
 ) : plan.name === 'Free' ? (
 <>
 <span>Start Free Today</span>
 <Sparkles className="w-5 h-5 ml-2" />
 </>
 ) : (
 <>
 <span>Upgrade to {plan.name}</span>
 <Crown className="w-5 h-5 ml-2" />
 </>
 )}
 </Button>
 
 {isMostPopular && (
 <div className="text-center">
 <p className="text-sm text-muted-foreground">
 Save 60% compared to competitors
 </p>
 </div>
 )}
 </CardContent>
 </Card>
 );
 })}
 </div>
 
 {/* Premium ROI Calculator */}
 <Card className="relative overflow-hidden border-primary/20 bg-green-50 dark:bg-green-950/10 max-w-4xl mx-auto">
 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
 <CardHeader className="text-center relative">
 <div className="flex items-center justify-center gap-3 mb-2">
 <TrendingUp className="w-8 h-8 text-green-600" />
 <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
 Premium users save an average of $347/month
 </CardTitle>
 </div>
 <CardDescription className="text-base">
 That's 13.8x your subscription cost - real savings from better financial management
 </CardDescription>
 </CardHeader>
 <CardContent className="relative">
 <div className="grid md:grid-cols-3 gap-6 mb-6">
 <div className="text-center p-6 bg-white/80 dark:bg-gray-900/50 rounded-xl border border-border/50">
 <div className="text-sm text-muted-foreground mb-2">AI Time Savings</div>
 <div className="text-3xl font-bold text-blue-600">+$100</div>
 <div className="text-xs text-muted-foreground mt-1">Auto-categorization & insights</div>
 </div>
 <div className="text-center p-6 bg-white/80 dark:bg-gray-900/50 rounded-xl border border-border/50">
 <div className="text-sm text-muted-foreground mb-2">Budget Optimization</div>
 <div className="text-3xl font-bold text-green-600">+$197</div>
 <div className="text-xs text-muted-foreground mt-1">Reduced overspending</div>
 </div>
 <div className="text-center p-6 bg-white/80 dark:bg-gray-900/50 rounded-xl border border-border/50">
 <div className="text-sm text-muted-foreground mb-2">Goal Achievement</div>
 <div className="text-3xl font-bold text-purple-600">+$50</div>
 <div className="text-xs text-muted-foreground mt-1">Stay on track value</div>
 </div>
 </div>

 <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-green-300/50 dark:border-green-700/50">
 <div className="flex items-center justify-between text-lg mb-3">
 <span className="font-semibold">Total Value Per Month</span>
 <span className="text-2xl font-bold text-green-600">+$347</span>
 </div>
 <div className="flex items-center justify-between text-lg mb-3">
 <span className="font-semibold">Premium Subscription</span>
 <span className="text-2xl font-bold text-red-600">-$25</span>
 </div>
 <div className="h-px bg-border/50 my-4"></div>
 <div className="flex items-center justify-between">
 <span className="text-xl font-bold">Net Benefit</span>
 <span className="text-4xl font-bold text-foreground">+$322</span>
 </div>
 <p className="text-sm text-center text-muted-foreground mt-4">
 Premium pays for itself 13.8x over every single month
 </p>
 </div>
 </CardContent>
 </Card>

 {/* Enterprise Card */}
 <Card className="relative overflow-hidden border-2 border-dashed border-primary/50 bg-white dark:bg-gray-900 max-w-5xl mx-auto mt-8">
 <CardHeader className="text-center">
 <CardTitle className="text-2xl font-bold text-foreground">
 Need More? Enterprise Solution
 </CardTitle>
 <CardDescription className="text-base">
 Custom pricing for institutions, heavy users, and API access
 </CardDescription>
 </CardHeader>
 <CardContent className="text-center space-y-4">
 <div className="flex items-center justify-center gap-8 text-sm">
 <div className="flex items-center gap-2">
 <Check className="w-4 h-4 text-green-500" />
 <span>Unlimited everything</span>
 </div>
 <div className="flex items-center gap-2">
 <Check className="w-4 h-4 text-green-500" />
 <span>API access</span>
 </div>
 <div className="flex items-center gap-2">
 <Check className="w-4 h-4 text-green-500" />
 <span>Priority support</span>
 </div>
 <div className="flex items-center gap-2">
 <Check className="w-4 h-4 text-green-500" />
 <span>Data export</span>
 </div>
 </div>
 <Button 
 className="bg-primary text-primary-foreground hover:opacity-90"
 onClick={() => window.location.href = 'mailto:enterprise@twealth.com?subject=Enterprise Plan Inquiry'}
 >
 Contact Sales Team
 </Button>
 </CardContent>
 </Card>
 </div>

 {/* Enhanced Value Proposition */}
 <Card className="relative overflow-hidden border-0 shadow-2xl">
 <div className="absolute inset-0 bg-green-500/20" />
 <div className="absolute inset-0 bg-white dark:bg-gray-900 backdrop-blur-xl" />
 <CardContent className="relative p-8">
 <div className="text-center space-y-6">
 <div className="flex items-center justify-center gap-4">
 <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
 <Zap className="h-10 w-10 text-white" />
 </div>
 <div>
 <h3 className="text-2xl md:text-3xl font-bold text-foreground">
 Why Choose Twealth AI?
 </h3>
 <p className="text-lg text-muted-foreground">
 Advanced AI technology at unbeatable prices
 </p>
 </div>
 </div>
 
 <div className="grid gap-6 md:grid-cols-3">
 <div className="text-center space-y-3 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-green-200/50 dark:border-green-800/50">
 <div className="text-3xl md:text-4xl font-bold text-green-600">25x</div>
 <div className="font-semibold">More Cost-Effective</div>
 <div className="text-sm text-muted-foreground">Than traditional financial advisors</div>
 </div>
 
 <div className="text-center space-y-3 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
 <div className="text-3xl md:text-4xl font-bold text-blue-600">24/7</div>
 <div className="font-semibold">AI Assistant</div>
 <div className="text-sm text-muted-foreground">Always available when you need help</div>
 </div>
 
 <div className="text-center space-y-3 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
 <div className="text-3xl md:text-4xl font-bold text-purple-600">$25</div>
 <div className="font-semibold">Affordable Premium</div>
 <div className="text-sm text-muted-foreground">Less than a coffee per day</div>
 </div>
 </div>
 
 <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
 <div className="flex items-center justify-center gap-3 mb-4">
 <Zap className="w-8 h-8 text-blue-500" />
 <h4 className="text-xl font-bold">Powered by Groq & Llama 4 Scout</h4>
 <Sparkles className="w-6 h-6 text-yellow-500" />
 </div>
 <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
 Lightning-fast AI responses powered by Groq's cutting-edge infrastructure and Meta's Llama 4 Scout model. 
 <span className="font-semibold text-foreground">You get enterprise-level AI intelligence without enterprise-level prices!</span>
 </p>
 </div>
 
 <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
 <div className="flex items-center gap-1">
 <Check className="w-4 h-4 text-green-500" />
 <span>No hidden fees</span>
 </div>
 <div className="flex items-center gap-1">
 <Check className="w-4 h-4 text-green-500" />
 <span>Cancel anytime</span>
 </div>
 <div className="flex items-center gap-1">
 <Check className="w-4 h-4 text-green-500" />
 <span>Instant AI access</span>
 </div>
 <div className="flex items-center gap-1">
 <Check className="w-4 h-4 text-green-500" />
 <span>30-day money-back guarantee</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 
 {/* Call to Action Banner */}
 <Card className="relative overflow-hidden border-0 bg-primary text-white">
 <CardContent className="relative p-8 text-center">
 <div className="absolute inset-0 bg-black/10" />
 <div className="relative space-y-4">
 <h3 className="text-2xl md:text-3xl font-bold">Ready to Transform Your Financial Future?</h3>
 <p className="text-xl opacity-90 max-w-2xl mx-auto">
 Join thousands of users who are already saving money and reaching their financial goals with AI-powered insights.
 </p>
 <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
 <Button 
 size="lg" 
 className="bg-white text-primary hover:bg-gray-100 font-bold px-8 py-4 text-lg shadow-xl transform transition-all"
 onClick={() => setLocation('/ai-assistant')}
 >
 <Sparkles className="w-5 h-5 mr-2" />
 Try AI Assistant Now
 </Button>
 <Button 
 size="lg" 
 variant="outline" 
 className="border-white text-white hover:bg-white/10 font-bold px-8 py-4 text-lg transform transition-all"
 onClick={() => setLocation('/dashboard')}
 >
 <TrendingUp className="w-5 h-5 mr-2" />
 View Dashboard
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}