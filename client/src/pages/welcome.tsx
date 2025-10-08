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
    },
    {
      id: "pro-tips",
      title: "⚡ Pro Tips for Power Users",
      description: "Master Twealth with keyboard shortcuts and helpful tooltips",
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      action: "Start Using Twealth"
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Enhanced Header with Skip */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                💎 Twealth
              </h1>
              <p className="text-sm text-muted-foreground">Your AI Financial Assistant</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={completeOnboardingMutation.isPending}
            className="hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm transition-all duration-300"
            data-testid="button-skip-onboarding"
          >
            ⚡ Skip Tour
          </Button>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3">
              {onboardingSteps.map((_, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-500 ${
                      index <= currentStep 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 scale-125 shadow-lg' 
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  />
                  {index < onboardingSteps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 transition-all duration-500 ${
                      index < currentStep 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600' 
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                Step {currentStep + 1} of {onboardingSteps.length}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 0 ? (
            // Enhanced Welcome Screen with Value Proposition
            <div className="text-center space-y-12">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 shadow-lg">
                    <span className="text-lg font-semibold flex items-center gap-2">
                      {currencyData.flag} {currencyData.name}
                    </span>
                  </div>
                </div>
                
                <h2 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                  {valueProposition.title}
                </h2>
                <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {valueProposition.subtitle}
                </p>
                
                {/* Feature Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">🤖 AI Assistant</h3>
                    <p className="text-sm text-muted-foreground">Chat with AI for instant financial advice</p>
                  </div>
                  
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">🎯 Smart Goals</h3>
                    <p className="text-sm text-muted-foreground">AI-powered goal tracking and strategies</p>
                  </div>
                  
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">👥 Group Planning</h3>
                    <p className="text-sm text-muted-foreground">Collaborate on shared financial goals</p>
                  </div>
                </div>
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
          ) : currentStep === onboardingSteps.length - 1 ? (
            // Pro Tips Step - Final step with shortcuts and navigation guide
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-3xl flex items-center justify-center border border-primary/20">
                  {currentStepData.icon}
                </div>
                <h2 className="text-4xl font-bold text-foreground">
                  {currentStepData.title}
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {currentStepData.description}
                </p>
              </div>

              {/* Shortcuts & Tips Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Keyboard Shortcuts */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">⌨️</span>
                      Keyboard Shortcuts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-sm">Create Goal</span>
                      <kbd className="px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white rounded text-xs font-mono">G</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-sm">Add Transaction</span>
                      <kbd className="px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white rounded text-xs font-mono">T</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-sm">Schedule Event</span>
                      <kbd className="px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white rounded text-xs font-mono">E</kbd>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation Tips */}
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🧭</span>
                      Navigation Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-sm"><strong>Organized Sidebar:</strong> Features grouped into Main, Finance, Social, and More sections</p>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-sm"><strong>Hover for Help:</strong> Hover over any navigation item to see helpful tooltips</p>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-sm"><strong>Quick Actions:</strong> Dashboard has fast access to most common tasks</p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Assistant Tip */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🤖</span>
                      AI Assistant Pro Tip
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">Don't remember how to do something? Just ask the AI! It can create goals, add transactions, schedule events, and more through natural conversation.</p>
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <p className="text-sm italic">"Create a goal to save $5,000 for vacation by December"</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Tip */}
                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">📱</span>
                      Mobile Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">On mobile, use the bottom navigation bar for quick access to key features.</p>
                    <p className="text-sm">Tap the <strong className="text-primary">+ button</strong> in the bottom-right corner for quick actions!</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => handleActionClick(currentStepData)}
                  className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  data-testid={`button-${currentStepData.id}`}
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