import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Crown, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PaymentForm from "@/components/payment-form";

// Initialize Stripe (will use environment variable when available)
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export default function UpgradePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'upgrade' | 'payment'>('upgrade');

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription/plans'],
  }) as { data: any[], isLoading: boolean };

  // Fetch current subscription
  const { data: currentData } = useQuery({
    queryKey: ['/api/subscription/current'],
  });

  // Upgrade mutation (for free plans or when Stripe not configured)
  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/subscription/upgrade", { planId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresPayment) {
        toast({
          title: "Payment Required",
          description: "This upgrade requires payment. Redirecting to payment form...",
        });
        initiatePayment(selectedPlan!);
      } else {
        toast({
          title: "Upgraded Successfully!",
          description: `Your subscription has been upgraded to ${data.subscription?.plan?.displayName}`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
        setLocation('/subscription');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Payment intent mutation
  const paymentMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/subscription/create-payment-intent", { planId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresSetup) {
        toast({
          title: "Payment Setup Required",
          description: "Payment processing is not yet configured. Contact support to enable payments.",
          variant: "destructive",
        });
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentMode('payment');
    },
    onError: (error: any) => {
      toast({
        title: "Payment Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const initiatePayment = (planId: string) => {
    if (!stripePromise) {
      // Fallback to direct upgrade if Stripe not configured
      upgradeMutation.mutate(planId);
      return;
    }
    paymentMutation.mutate(planId);
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    const plan = plans.find((p: any) => p.id === planId);
    
    // If it's the free plan, upgrade directly
    if (plan?.name === 'Free' || parseFloat(plan?.priceThb || '0') === 0) {
      upgradeMutation.mutate(planId);
    } else {
      // For paid plans, check if payment is needed
      if (stripePromise) {
        initiatePayment(planId);
      } else {
        // Fallback for development without Stripe
        upgradeMutation.mutate(planId);
      }
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Free': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'Standard': return <Zap className="w-6 h-6 text-blue-500" />;
      case 'Pro': return <Crown className="w-6 h-6 text-purple-500" />;
      default: return <CheckCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatPrice = (priceThb: string, billingInterval: string) => {
    const price = parseFloat(priceThb);
    if (price === 0) return 'Free';
    return `฿${price}/${billingInterval === 'monthly' ? 'month' : 'year'}`;
  };

  const isCurrentPlan = (planId: string) => {
    return (currentData as any)?.subscription?.planId === planId;
  };

  if (paymentMode === 'payment' && clientSecret && stripePromise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => {
              setPaymentMode('upgrade');
              setClientSecret(null);
            }}
            className="mb-6 hover:bg-white/50 dark:hover:bg-gray-800/50"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>

          <div className="max-w-md mx-auto">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Complete Payment
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Secure payment powered by Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#0570de',
                        colorBackground: '#ffffff',
                        colorText: '#30313d',
                        colorDanger: '#df1b41',
                        fontFamily: '"Inter", system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '8px',
                      },
                    },
                  }}
                >
                  <PaymentForm 
                    onSuccess={() => {
                      toast({
                        title: "Payment Successful!",
                        description: "Your subscription has been upgraded.",
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/subscription/usage'] });
                      setLocation('/subscription');
                    }}
                    onError={(error: string) => {
                      toast({
                        title: "Payment Failed",
                        description: error,
                        variant: "destructive",
                      });
                    }}
                  />
                </Elements>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-cyan-900/30">
      {/* Spectacular Header */}
      <header className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/50 dark:via-teal-900/50 dark:to-cyan-900/50 border-b border-border/50 sticky top-0 z-30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/subscription')}
            className="mb-6 hover:bg-white/50 dark:hover:bg-gray-800/50"
            data-testid="button-back-subscription"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subscription
          </Button>

          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  🚀 Choose Your Plan
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Zap className="w-5 h-5 text-yellow-500 animate-bounce" />
                  <span className="text-lg text-muted-foreground">Unlock powerful AI features to supercharge your finances</span>
                  <Zap className="w-5 h-5 text-yellow-500 animate-bounce delay-300" />
                </div>
              </div>
            </div>
            
            {/* Upgrade Benefits Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">AI-Powered</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  Unlimited
                </div>
                <div className="text-xs text-muted-foreground">Analysis & insights</div>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Smart</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  Advanced
                </div>
                <div className="text-xs text-muted-foreground">Budget optimization</div>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium">Premium</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  Priority
                </div>
                <div className="text-xs text-muted-foreground">Support & features</div>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                  <span className="text-sm font-medium">Secure</span>
                </div>
                <div className="text-2xl font-bold text-teal-600">
                  🔒
                </div>
                <div className="text-xs text-muted-foreground">Stripe payments</div>
              </div>
            </div>
            
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-white/80 to-emerald-50/80 dark:from-gray-800/80 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-emerald-500" />
                <div>
                  <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Premium Upgrade Experience ⚡</h2>
                  <p className="text-emerald-600 dark:text-emerald-300">Join thousands who've transformed their financial future with AI-powered insights and advanced features.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">

        {plansLoading ? (
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/50 dark:bg-gray-800/50 animate-pulse">
                <CardHeader className="h-32"></CardHeader>
                <CardContent className="h-48"></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan: any) => (
              <Card
                key={plan.id}
                className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                  plan.name === 'Standard' ? 'ring-2 ring-blue-500 scale-105' : ''
                } ${isCurrentPlan(plan.id) ? 'ring-2 ring-green-500' : ''}`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.name === 'Standard' && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                
                {isCurrentPlan(plan.id) && (
                  <Badge className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1">
                    Current Plan
                  </Badge>
                )}

                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plan.displayName}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 mb-4">
                    {plan.description}
                  </CardDescription>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plan.priceThb, plan.billingInterval)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {plan.aiChatLimit > 0 ? `${plan.aiChatLimit} AI chats/month` : 'No AI chats'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {plan.aiDeepAnalysisLimit > 0 ? `${plan.aiDeepAnalysisLimit} deep analysis/month` : 'No deep analysis'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {plan.aiInsightsFrequency === 'never' ? 'No AI insights' : `${plan.aiInsightsFrequency} AI insights`}
                      </span>
                    </div>

                    {plan.features?.map((feature: string) => (
                      <div key={feature} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          {feature.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full mt-6"
                    variant={plan.name === 'Standard' ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan(plan.id) || upgradeMutation.isPending || paymentMutation.isPending}
                    data-testid={`button-upgrade-${plan.name.toLowerCase()}`}
                  >
                    {upgradeMutation.isPending || paymentMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : isCurrentPlan(plan.id) ? (
                      'Current Plan'
                    ) : parseFloat(plan.priceThb) === 0 ? (
                      'Get Started'
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            🔒 Secure payments powered by Stripe • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}