import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Check, Zap, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { getLocalizedPrice, formatCurrency, getCurrencySymbol } from "@/lib/currency";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceThb: string;
  priceUsd: string;
  currency: string;
  billingInterval: string;
  aiChatLimit: number;
  aiDeepAnalysisLimit: number;
  aiInsightsFrequency: string;
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

const getFeatureIcon = (feature: string) => {
  switch (feature) {
    case 'ai_chat': return <Sparkles className="h-4 w-4" />;
    case 'advanced_goals': return <TrendingUp className="h-4 w-4" />;
    case 'priority_support': return <Crown className="h-4 w-4" />;
    case 'advanced_analytics': return <TrendingUp className="h-4 w-4" />;
    default: return <Check className="h-4 w-4" />;
  }
};

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
    refetchInterval: 30 * 1000
  });

  const { data: userPreferences } = useQuery<{ currency?: string }>({
    queryKey: ["/api/user-preferences"],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest("POST", "/api/subscription/upgrade", { planId });
    },
    onSuccess: () => {
      toast({
        title: "Subscription upgraded!",
        description: "Your subscription has been upgraded successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade failed",
        description: error.message || "Failed to upgrade subscription",
        variant: "destructive"
      });
    }
  });

  if (plansLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
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
    <div className="container mx-auto p-6 space-y-10">
      {/* Enhanced Header */}
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-green-600/20 blur-3xl animate-pulse" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="relative">
                <Crown className="w-16 h-16 text-primary animate-bounce" />
                <div className="absolute inset-0 bg-primary/20 blur-xl animate-ping" />
              </div>
              <div className="space-y-2">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-purple-600 to-green-600 bg-clip-text text-transparent animate-in slide-in-from-top duration-700">
                  Premium Plans
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500 animate-bounce" />
                  <span className="text-lg font-medium text-yellow-600 dark:text-yellow-400">Unlock AI-Powered Financial Success</span>
                  <Sparkles className="w-5 h-5 text-yellow-500 animate-bounce delay-300" />
                </div>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-in fade-in duration-1000 delay-500">
              🚀 Transform your financial future with AI-powered insights • 💰 Smart budget optimization • 🎯 Achieve your goals faster
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>25x More Cost-Effective</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span>Powered by Google Gemini</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-500" />
                <span>No Long-term Commitment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Current Plan Status */}
      {currentPlan && (
        <Card className="relative overflow-hidden border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-green-500/10" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 backdrop-blur-3xl" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Your Current Plan
                  </h2>
                  <p className="text-lg font-semibold text-foreground">{currentPlan.displayName}</p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 text-sm font-semibold animate-pulse">
                Active
              </Badge>
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {currentPlan.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-6">
            {usage && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">AI Chats</span>
                      </div>
                      <span className="font-bold text-lg">
                        {usage.chatUsage.used} / {usage.chatUsage.limit}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(usage.chatUsage.used / usage.chatUsage.limit) * 100} 
                        className="h-3 bg-blue-100 dark:bg-blue-900/30"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-20 animate-pulse" />
                    </div>
                    {usage.chatUsage.used >= usage.chatUsage.limit * 0.8 && (
                      <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 rounded-lg p-2">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-medium">Running low on quota - consider upgrading!</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-green-200/50 dark:border-green-800/50 backdrop-blur-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-bold">Deep Analysis</span>
                      </div>
                      <span className="font-bold text-lg">
                        {usage.analysisUsage.used} / {usage.analysisUsage.limit}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(usage.analysisUsage.used / usage.analysisUsage.limit) * 100} 
                        className="h-3 bg-green-100 dark:bg-green-900/30"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full opacity-20 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-xl border border-yellow-200/50 dark:border-yellow-800/50">
                <div className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  {usage?.insights || 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Insights Generated</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {usage?.totalTokens?.toLocaleString() || 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Tokens Used</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
                <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                  ${usage?.estimatedCost || '0.000'}
                </div>
                <div className="text-sm font-medium text-muted-foreground">AI Costs This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Pricing Plans */}
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
        <div className="grid gap-8 md:grid-cols-3">
          {plans?.map((plan, index) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isPremium = plan.name !== 'Free';
            const isMostPopular = plan.name === 'Premium';
            
            return (
              <Card 
                key={plan.id} 
                className={`relative group cursor-pointer transition-all duration-500 hover:scale-105 hover:-translate-y-4 ${
                  isMostPopular 
                    ? 'border-0 shadow-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 ring-2 ring-primary/50' 
                    : isPremium 
                    ? 'border-primary/30 hover:border-primary shadow-lg hover:shadow-xl' 
                    : 'hover:shadow-lg'
                } ${isCurrentPlan ? 'ring-2 ring-green-500 bg-green-50/30 dark:bg-green-950/20' : ''}
                animate-in fade-in slide-in-from-bottom duration-500`}
                style={{ animationDelay: `${index * 150}ms` }}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {isMostPopular && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-50 animate-pulse" />
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1 text-sm font-bold shadow-lg animate-bounce z-10">
                      🔥 MOST POPULAR 🔥
                    </Badge>
                  </>
                )}
                {isPremium && !isMostPopular && (
                  <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-blue-500 to-green-500 text-white px-3 py-1 text-xs font-bold shadow-md">
                    Recommended
                  </Badge>
                )}
                
                <CardHeader className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-2xl font-bold ${
                      isMostPopular ? 'bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent' : ''
                    }`}>
                      {plan.displayName}
                    </CardTitle>
                    {isCurrentPlan && (
                      <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 text-xs font-bold animate-pulse">
                        ✓ Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base leading-relaxed">{plan.description}</CardDescription>
                  
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
                                isMostPopular ? 'bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent' : ''
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

                <CardContent className="relative space-y-6">
                  {/* AI Features Highlights */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      AI Features
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">AI Chats</span>
                        </div>
                        <span className="font-bold text-lg text-primary">
                          {plan.aiChatLimit === 999999 ? 'Unlimited' : plan.aiChatLimit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="font-medium">Deep Analysis</span>
                        </div>
                        <span className="font-bold text-lg text-primary">
                          {plan.aiDeepAnalysisLimit === 999999 ? 'Unlimited' : plan.aiDeepAnalysisLimit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">AI Insights</span>
                        </div>
                        <span className="font-bold text-lg text-primary capitalize">
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
                          <div className="p-1 bg-gradient-to-br from-green-500 to-blue-500 rounded-full">
                            {getFeatureIcon(feature)}
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-medium">{formatFeatureName(feature)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Enhanced CTA Button */}
                  <Button
                    className={`w-full h-14 text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                      isCurrentPlan 
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white' 
                        : isMostPopular 
                        ? 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white' 
                        : isPremium 
                        ? 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white'
                        : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
                    }`}
                    disabled={isCurrentPlan || upgradeMutation.isPending}
                    onClick={() => upgradeMutation.mutate(plan.id)}
                    data-testid={`button-upgrade-${plan.name.toLowerCase()}`}
                  >
                    {upgradeMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Upgrading...</span>
                      </div>
                    ) : isCurrentPlan ? (
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
                        🔥 Save 60% compared to competitors
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Enhanced Value Proposition */}
      <Card className="relative overflow-hidden border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 animate-gradient-x" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-blue-600/10 backdrop-blur-xl" />
        <CardContent className="relative p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="p-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl shadow-lg animate-bounce">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Why Choose Twealth AI?
                </h3>
                <p className="text-lg text-muted-foreground">
                  Advanced AI technology at unbeatable prices
                </p>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center space-y-3 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-green-200/50 dark:border-green-800/50">
                <div className="text-4xl font-bold text-green-600">25x</div>
                <div className="font-semibold">More Cost-Effective</div>
                <div className="text-sm text-muted-foreground">Than traditional financial advisors</div>
              </div>
              
              <div className="text-center space-y-3 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                <div className="text-4xl font-bold text-blue-600">24/7</div>
                <div className="font-semibold">AI Assistant</div>
                <div className="text-sm text-muted-foreground">Always available when you need help</div>
              </div>
              
              <div className="text-center space-y-3 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                <div className="text-4xl font-bold text-purple-600">฿99</div>
                <div className="font-semibold">Affordable Premium</div>
                <div className="text-sm text-muted-foreground">Less than a coffee per day</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-xl p-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04IDEwSDI0VjIySDE4VjE2SDhWMTBaTTEwIDEyVjE0SDEyVjEySDE0VjE0SDE2VjEySDEwWk0xOCAxNFYxNkgyMFYxNEgyMlYxNkgyNFYxNEgxOFoiIGZpbGw9IiM0Mjg1RjQiLz4KPC9zdmc+" alt="Google" className="w-8 h-8" />
                <h4 className="text-xl font-bold">Powered by Google Gemini</h4>
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
              </div>
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Our partnership with Google enables us to provide cutting-edge AI financial advice at fraction of traditional costs. 
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
      <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white">
        <CardContent className="relative p-8 text-center">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative space-y-4">
            <h3 className="text-3xl font-bold">Ready to Transform Your Financial Future?</h3>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of users who are already saving money and reaching their financial goals with AI-powered insights.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100 font-bold px-8 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300"
                onClick={() => setLocation('/ai-assistant')}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Try AI Assistant Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 font-bold px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300"
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
  );
}