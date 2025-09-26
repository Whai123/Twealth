import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Crown, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Calendar, 
  Target, 
  ArrowRight, 
  Globe,
  Zap,
  DollarSign,
  MessageCircle
} from "lucide-react";
import { getLocalizedPrice, CURRENCIES } from "@/lib/currency";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  route?: string;
}

export default function WelcomePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  
  const { data: userPreferences } = useQuery<{ currency?: string }>({
    queryKey: ["/api/user-preferences"],
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/user-preferences", { 
        hasCompletedOnboarding: true 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      setLocation("/");
    }
  });

  // Get user's currency and localized value propositions
  const userCurrency = userPreferences?.currency || 'USD';
  const currencyData = CURRENCIES[userCurrency] || CURRENCIES.USD;
  const localizedPrice = getLocalizedPrice(2.99, userCurrency); // Base $2.99 USD price
  
  // Localized value propositions by region
  const getValueProposition = () => {
    const emergingMarkets = ['IDR', 'INR', 'BRL', 'MXN', 'THB'];
    const isEmergingMarket = emergingMarkets.includes(userCurrency);
    
    if (isEmergingMarket) {
      const discount = Math.round((1 - localizedPrice.amount / localizedPrice.originalAmount!) * 100);
      return {
        title: `Financial Success Made Affordable`,
        subtitle: `AI-powered financial planning designed for ${currencyData.name}`,
        price: `${localizedPrice.currency.symbol}${Math.round(localizedPrice.amount)}/month`,
        originalPrice: localizedPrice.originalAmount ? `${localizedPrice.currency.symbol}${Math.round(localizedPrice.originalAmount)}` : null,
        discount: localizedPrice.isDiscounted ? `${discount}% OFF` : null,
        benefits: [
          "25x more affordable than traditional financial advisors",
          "Designed for mobile-first users",
          "AI insights in your local currency",
          "Build wealth with small, smart steps"
        ]
      };
    }
    
    return {
      title: "AI-Powered Financial Intelligence",
      subtitle: "Transform your financial future with smart technology",
      price: `${localizedPrice.currency.symbol}${localizedPrice.amount}/month`,
      originalPrice: null,
      discount: null,
      benefits: [
        "Advanced AI financial assistant",
        "Comprehensive goal tracking",
        "Group financial planning",
        "Professional-grade insights"
      ]
    };
  };

  const valueProposition = getValueProposition();

  const onboardingSteps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to Twealth",
      description: "Your AI-powered financial companion for achieving life goals",
      icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
      action: "Get Started"
    },
    {
      id: "ai-assistant", 
      title: "Meet Your AI Assistant",
      description: "Get instant financial advice, budget optimization, and goal strategies",
      icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
      action: "Try AI Chat",
      route: "/ai-assistant"
    },
    {
      id: "track-money",
      title: "Track Your Finances",
      description: "Add transactions and see smart spending insights automatically",
      icon: <DollarSign className="w-8 h-8 text-green-500" />,
      action: "Add First Transaction",
      route: "/money-tracking?add=1"
    },
    {
      id: "set-goals",
      title: "Set Financial Goals",
      description: "Define your dreams and get AI-powered strategies to achieve them",
      icon: <Target className="w-8 h-8 text-purple-500" />,
      action: "Create First Goal",
      route: "/financial-goals?create=1"
    },
    {
      id: "plan-together",
      title: "Plan with Others",
      description: "Create groups for family budgets, trips, and shared financial goals",
      icon: <Users className="w-8 h-8 text-orange-500" />,
      action: "Create Group",
      route: "/groups?create=1"
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboardingMutation.mutate();
    }
  };

  const handleSkip = () => {
    completeOnboardingMutation.mutate();
  };

  const handleActionClick = (step: OnboardingStep) => {
    if (step.route) {
      setLocation(step.route);
    } else {
      handleNext();
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Skip */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Twealth</h1>
          </div>
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={completeOnboardingMutation.isPending}
            data-testid="button-skip-onboarding"
          >
            Skip Tour
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-primary scale-110' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 0 ? (
            // Welcome Screen with Value Proposition
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                  <span className="text-lg font-medium flex items-center gap-2">
                    {currencyData.flag} {currencyData.name}
                  </span>
                </div>
                
                <h2 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {valueProposition.title}
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {valueProposition.subtitle}
                </p>
              </div>

              {/* Pricing Card */}
              <Card className="max-w-md mx-auto border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-800/50">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <Badge className="bg-yellow-500 text-black">
                      AI-Powered
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-4xl font-bold text-primary">
                        {valueProposition.price}
                      </span>
                      {valueProposition.originalPrice && (
                        <span className="text-xl text-muted-foreground line-through">
                          {valueProposition.originalPrice}
                        </span>
                      )}
                    </div>
                    {valueProposition.discount && (
                      <Badge className="bg-green-500 text-white">
                        {valueProposition.discount}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {valueProposition.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button
                  onClick={handleNext}
                  className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  data-testid="button-start-onboarding"
                >
                  {currentStepData.action}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            // Feature Steps
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-3xl flex items-center justify-center border border-primary/20">
                  {currentStepData.icon}
                </div>
                <h2 className="text-4xl font-bold text-foreground">
                  {currentStepData.title}
                </h2>
                <p className="text-xl text-muted-foreground max-w-md mx-auto">
                  {currentStepData.description}
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => handleActionClick(currentStepData)}
                  className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  data-testid={`button-${currentStepData.id}`}
                >
                  {currentStepData.action}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                
                {currentStep < onboardingSteps.length - 1 && (
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    className="px-6 py-6 text-lg"
                    data-testid="button-next-step"
                  >
                    Skip This Step
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Join thousands of users building their financial future with AI</p>
        </div>
      </div>
    </div>
  );
}