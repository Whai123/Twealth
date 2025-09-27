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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Professional Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                  Subscription Plans
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-lg text-gray-600 dark:text-gray-400">Professional AI financial advisory service</span>
                </div>
              </div>
            </div>
            
            {/* Professional Service Features */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost Effective</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Value
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Proven results</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Technology</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Advanced
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Google Gemini AI</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Flexibility</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Assured
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Cancel anytime</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Service</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Instant
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Immediate access</div>
              </div>
            </div>
            
            {/* Professional Service Description */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Professional Financial Advisory Service</h2>
                  <p className="text-gray-600 dark:text-gray-400">Reliable AI-powered insights, comprehensive budget analysis, and strategic goal achievement support.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-6 space-y-10">

      {/* Professional Current Plan Status */}
      {currentPlan && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <Crown className="h-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Current Subscription
                  </h2>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{currentPlan.displayName}</p>
                </div>
              </div>
              <Badge className="bg-gray-600 text-white px-3 py-1 text-sm font-medium">
                Active
              </Badge>
            </CardTitle>
            <CardDescription className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {currentPlan.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {usage && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">AI Consultations</span>
                    </div>
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                      {usage.chatUsage.used} / {usage.chatUsage.limit}
                    </span>
                  </div>
                  <div>
                    <Progress 
                      value={(usage.chatUsage.used / usage.chatUsage.limit) * 100} 
                      className="h-2 bg-gray-200 dark:bg-gray-700"
                    />
                  </div>
                  {usage.chatUsage.used >= usage.chatUsage.limit * 0.8 && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="font-medium">Usage approaching limit - consider upgrading</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">Deep Analysis</span>
                    </div>
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                      {usage.analysisUsage.used} / {usage.analysisUsage.limit}
                    </span>
                  </div>
                  <div>
                    <Progress 
                      value={(usage.analysisUsage.used / usage.analysisUsage.limit) * 100} 
                      className="h-2 bg-gray-200 dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {usage?.insights || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Insights Generated</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {usage?.totalTokens?.toLocaleString() || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Tokens Processed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${usage?.estimatedCost || '0.000'}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Service Costs This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional Pricing Plans */}
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Service Plans
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Transparent pricing for reliable financial advisory services. Start with our free tier, upgrade as needed.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gray-600" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gray-600" />
              <span>Instant activation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gray-600" />
              <span>No setup fees</span>
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans?.map((plan, index) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isPremium = plan.name !== 'Free';
            const isMostPopular = plan.name === 'Premium';
            
            return (
              <Card 
                key={plan.id} 
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-lg ${
                  isMostPopular 
                    ? 'border-gray-400 dark:border-gray-600 shadow-md' 
                    : ''
                } ${isCurrentPlan ? 'border-gray-600 dark:border-gray-500 bg-gray-50 dark:bg-gray-800' : ''}`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {isMostPopular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-600 text-white px-3 py-1 text-sm font-medium">
                    Most Popular
                  </Badge>
                )}
                {isPremium && !isMostPopular && (
                  <Badge className="absolute -top-2 left-4 bg-gray-500 text-white px-3 py-1 text-xs font-medium">
                    Recommended
                  </Badge>
                )}
                
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {plan.displayName}
                    </CardTitle>
                    {isCurrentPlan && (
                      <Badge className="bg-gray-600 text-white px-3 py-1 text-xs font-medium">
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base leading-relaxed text-gray-600 dark:text-gray-400">{plan.description}</CardDescription>
                  
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
                              <span className="text-4xl font-semibold text-gray-900 dark:text-white">
                                {localizedPrice.currency.symbol}{Math.round(localizedPrice.amount)}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 text-lg">/month</span>
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

                <CardContent className="space-y-6">
                  {/* Professional AI Features */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                      <Crown className="w-5 h-5 text-gray-600" />
                      AI Advisory Services
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900 dark:text-white">AI Consultations</span>
                        </div>
                        <span className="font-semibold text-lg text-gray-900 dark:text-white">
                          {plan.aiChatLimit === 999999 ? 'Unlimited' : plan.aiChatLimit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Deep Analysis</span>
                        </div>
                        <span className="font-semibold text-lg text-gray-900 dark:text-white">
                          {plan.aiDeepAnalysisLimit === 999999 ? 'Unlimited' : plan.aiDeepAnalysisLimit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900 dark:text-white">AI Insights</span>
                        </div>
                        <span className="font-semibold text-lg text-gray-900 dark:text-white capitalize">
                          {plan.aiInsightsFrequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Core Features */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2 text-gray-900 dark:text-white">
                      <Check className="w-5 h-5 text-gray-600" />
                      Service Features
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3 text-sm">
                          <div className="w-5 h-5 bg-gray-600 rounded-sm flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{formatFeatureName(feature)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Professional Action Button */}
                  <Button
                    className={`w-full h-12 text-base font-semibold transition-colors hover:shadow-md ${
                      isCurrentPlan 
                        ? 'bg-gray-500 hover:bg-gray-600 text-white cursor-default' 
                        : isMostPopular 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                        : isPremium 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                    disabled={isCurrentPlan || upgradeMutation.isPending}
                    onClick={() => upgradeMutation.mutate(plan.id)}
                    data-testid={`button-upgrade-${plan.name.toLowerCase()}`}
                  >
                    {upgradeMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : isCurrentPlan ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Current Plan
                      </>
                    ) : plan.name === 'Free' ? (
                      <>
                        <span>Start Free</span>
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        <span>Select {plan.name}</span>
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  {isMostPopular && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Recommended for professional use
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Professional Service Information */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Professional AI Financial Advisory
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Enterprise-grade technology at accessible pricing
                </p>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center space-y-3 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-semibold text-gray-900 dark:text-white">Proven</div>
                <div className="font-semibold text-gray-900 dark:text-white">Cost-Effective</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Compared to traditional advisors</div>
              </div>
              
              <div className="text-center space-y-3 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-semibold text-gray-900 dark:text-white">24/7</div>
                <div className="font-semibold text-gray-900 dark:text-white">AI Assistant</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Always available when needed</div>
              </div>
              
              <div className="text-center space-y-3 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-semibold text-gray-900 dark:text-white">Professional</div>
                <div className="font-semibold text-gray-900 dark:text-white">Service Quality</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reliable financial guidance</div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Powered by Google Gemini AI</h4>
              </div>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                Our integration with Google's advanced AI technology enables us to provide professional-grade financial advisory services at accessible prices. 
                <span className="font-semibold text-gray-900 dark:text-white">Enterprise-level intelligence, transparent pricing.</span>
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-600" />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-600" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-600" />
                <span>Instant access</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-600" />
                <span>Service guarantee</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Professional Service Call to Action */}
      <Card className="bg-gray-600 text-white border border-gray-500">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Ready to Start Professional Financial Planning?</h3>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Join professionals who trust our AI-powered financial advisory service for reliable insights and strategic planning.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 py-3 text-base"
                onClick={() => setLocation('/ai-assistant')}
                data-testid="button-try-ai-assistant"
              >
                <Crown className="w-4 h-4 mr-2" />
                Start AI Advisory
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 font-semibold px-6 py-3 text-base"
                onClick={() => setLocation('/dashboard')}
                data-testid="button-view-dashboard"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
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