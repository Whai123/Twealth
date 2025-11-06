import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
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
 MessageCircle,
 Brain,
 Smartphone
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
 const { t } = useTranslation();
 const [currentStep, setCurrentStep] = useState(0);
 const [, setLocation] = useLocation();
 
 const { data: userPreferences } = useQuery<{ currency?: string }>({
 queryKey: ["/api/user-preferences"],
 });

 const completeOnboardingMutation = useMutation({
 mutationFn: async () => {
 const response = await apiRequest("PUT", "/api/user-preferences", { 
 hasCompletedOnboarding: true 
 });
 return response.json();
 },
 onSuccess: async (data) => {
 // Update cache immediately
 queryClient.setQueryData(["/api/user-preferences"], data);
 // Invalidate to ensure all instances are updated
 await queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
 // Small delay to ensure React Query propagates changes
 await new Promise(resolve => setTimeout(resolve, 100));
 // Navigate to dashboard
 setLocation("/");
 }
 });

 // Get user's currency and localized value propositions
 const userCurrency = userPreferences?.currency || 'USD';
 const currencyData = CURRENCIES[userCurrency] || CURRENCIES.USD;
 const localizedPrice = getLocalizedPrice(25, userCurrency); // Base $25 USD Pro plan price
 
 // Localized value propositions by region
 const getValueProposition = () => {
 const emergingMarkets = ['IDR', 'INR', 'BRL', 'MXN', 'THB'];
 const isEmergingMarket = emergingMarkets.includes(userCurrency);
 
 if (isEmergingMarket) {
 const discount = Math.round((1 - localizedPrice.amount / localizedPrice.originalAmount!) * 100);
 return {
 title: `CFO-Level Financial Advice Made Affordable`,
 subtitle: `Try 10 free AI chats, then upgrade for unlimited access`,
 price: `${localizedPrice.currency.symbol}${Math.round(localizedPrice.amount)}/month`,
 originalPrice: localizedPrice.originalAmount ? `${localizedPrice.currency.symbol}${Math.round(localizedPrice.originalAmount)}` : null,
 discount: localizedPrice.isDiscounted ? `${discount}% OFF` : null,
 benefits: [
 "Start free: 10 lifetime trial AI chats",
 "Expert financial advice in your currency",
 "Pro: 500 monthly AI chats + all features",
 "Build wealth with personalized insights"
 ]
 };
 }
 
 return {
 title: "CFO-Level AI Financial Intelligence",
 subtitle: "Try 10 free AI chats, then unlock premium features",
 price: `${localizedPrice.currency.symbol}${localizedPrice.amount}/month`,
 originalPrice: null,
 discount: null,
 benefits: [
 "Free trial: 10 lifetime AI chats",
 "Pro plan: 500 monthly AI chats",
 "Professional financial tracking",
 "Advanced analytics & insights"
 ]
 };
 };

 const valueProposition = getValueProposition();

 const onboardingSteps: OnboardingStep[] = [
 {
 id: "welcome",
 title: t('onboarding.welcome.title'),
 description: t('onboarding.welcome.description'),
 icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
 action: t('onboarding.actions.getStarted')
 },
 {
 id: "ai-assistant", 
 title: t('onboarding.aiAssistant.title'),
 description: t('onboarding.aiAssistant.description'),
 icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
 action: t('onboarding.actions.tryAiChat'),
 route: "/ai-assistant"
 },
 {
 id: "track-money",
 title: t('onboarding.trackMoney.title'),
 description: t('onboarding.trackMoney.description'),
 icon: <DollarSign className="w-8 h-8 text-green-500" />,
 action: t('onboarding.actions.addFirstTransaction'),
 route: "/money-tracking?add=1"
 },
 {
 id: "set-goals",
 title: t('onboarding.setGoals.title'),
 description: t('onboarding.setGoals.description'),
 icon: <Target className="w-8 h-8 text-purple-500" />,
 action: t('onboarding.actions.createFirstGoal'),
 route: "/financial-goals?create=1"
 },
 {
 id: "plan-together",
 title: t('onboarding.groupPlanning.title'),
 description: t('onboarding.groupPlanning.description'),
 icon: <Users className="w-8 h-8 text-orange-500" />,
 action: t('onboarding.actions.createGroup'),
 route: "/groups?create=1"
 },
 {
 id: "pro-tips",
 title: t('onboarding.proTips.title'),
 description: t('onboarding.proTips.description'),
 icon: <Zap className="w-8 h-8 text-yellow-500" />,
 action: t('onboarding.actions.finish')
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
 <div className="min-h-screen bg-purple-50 dark:bg-purple-900/10 relative overflow-hidden">
 
 <div className="container mx-auto px-4 py-8 relative z-10">
 {/* Clean Professional Header with Skip */}
 <div className="flex justify-between items-center mb-8">
 <div className="flex items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold text-foreground">
 Twealth
 </h1>
 <p className="text-sm text-muted-foreground">Your AI Financial Assistant</p>
 </div>
 </div>
 <Button
 variant="ghost"
 onClick={handleSkip}
 disabled={completeOnboardingMutation.isPending}
 className="hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm transition-all"
 data-testid="button-skip-onboarding"
 >
 {completeOnboardingMutation.isPending ? t('common.loading') : t('onboarding.actions.skip')}
 </Button>
 </div>

 {/* Clean Progress Indicator */}
 <div className="flex justify-center mb-12">
 <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
 <div className="flex items-center gap-3">
 {onboardingSteps.map((_, index) => (
 <div key={index} className="flex items-center">
 <div
 className={`w-3 h-3 rounded-full ${
 index <= currentStep 
 ? 'bg-white dark:bg-gray-900 
 : 'bg-muted'
 }`}
 />
 {index < onboardingSteps.length - 1 && (
 <div className={`w-8 h-0.5 mx-1 ${
 index < currentStep 
 ? 'bg-white dark:bg-gray-900 
 : 'bg-muted'
 }`} />
 )}
 </div>
 ))}
 </div>
 <div className="text-center mt-2">
 <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
 {t('onboarding.stepIndicator', { current: currentStep + 1, total: onboardingSteps.length })}
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
 <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
 <Globe className="w-6 h-6 text-white" />
 </div>
 <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 shadow-lg">
 <span className="text-lg font-semibold flex items-center gap-2">
 {currencyData.name}
 </span>
 </div>
 </div>
 
 <h2 className="text-6xl font-bold text-indigo-600 dark:text-indigo-400  leading-tight">
 {valueProposition.title}
 </h2>
 <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
 {valueProposition.subtitle}
 </p>
 
 {/* Feature Highlights */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
 <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 transition-all">
 <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-3">
 <MessageCircle className="w-6 h-6 text-white" />
 </div>
 <h3 className="font-semibold text-lg mb-2">{t('onboarding.aiAssistant.cardTitle')}</h3>
 <p className="text-sm text-muted-foreground">{t('onboarding.aiAssistant.cardDescription')}</p>
 </div>
 
 <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 transition-all">
 <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-3">
 <Target className="w-6 h-6 text-white" />
 </div>
 <h3 className="font-semibold text-lg mb-2">{t('onboarding.setGoals.cardTitle')}</h3>
 <p className="text-sm text-muted-foreground">{t('onboarding.setGoals.cardDescription')}</p>
 </div>
 
 <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 transition-all">
 <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-3">
 <Users className="w-6 h-6 text-white" />
 </div>
 <h3 className="font-semibold text-lg mb-2">{t('onboarding.groupPlanning.cardTitle')}</h3>
 <p className="text-sm text-muted-foreground">{t('onboarding.groupPlanning.cardDescription')}</p>
 </div>
 </div>
 </div>

 {/* Pricing Card */}
 <Card className="max-w-md mx-auto border-2 border-primary/20 bg-white dark:bg-gray-900 dark:from-gray-800 dark:to-gray-800/50">
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
 disabled={completeOnboardingMutation.isPending}
 className="px-8 py-6 text-lg font-semibold bg-primary text-primary-foreground rounded-xl shadow-lg "
 data-testid="button-start-onboarding"
 >
 {completeOnboardingMutation.isPending ? "Starting..." : currentStepData.action}
 <ArrowRight className="ml-2 w-5 h-5" />
 </Button>
 </div>
 </div>
 ) : currentStep === onboardingSteps.length - 1 ? (
 // Pro Tips Step - Final step with shortcuts and navigation guide
 <div className="max-w-4xl mx-auto space-y-8">
 <div className="text-center space-y-4">
 <div className="mx-auto w-20 h-20 bg-white dark:bg-gray-900 rounded-3xl flex items-center justify-center border border-primary/20">
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
 <Card className="bg-white dark:bg-gray-900 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
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
 <span className="text-sm">Add Event</span>
 <kbd className="px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white rounded text-xs font-mono">E</kbd>
 </div>
 </CardContent>
 </Card>

 {/* Navigation Tips */}
 <Card className="bg-white dark:bg-gray-900 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
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
 <Card className="bg-white dark:bg-gray-900 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Brain className="w-6 h-6 text-green-600" />
 {t('onboarding.aiProTip.title')}
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <p className="text-sm">{t('onboarding.aiProTip.description')}</p>
 <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
 <p className="text-sm italic">"Create a goal to save $5,000 for vacation by December"</p>
 </div>
 </CardContent>
 </Card>

 {/* Mobile Tip */}
 <Card className="bg-white dark:bg-gray-900 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Smartphone className="w-6 h-6 text-orange-600" />
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
 disabled={completeOnboardingMutation.isPending}
 className="px-8 py-6 text-lg font-semibold bg-primary text-primary-foreground rounded-xl shadow-lg "
 data-testid={`button-${currentStepData.id}`}
 >
 {completeOnboardingMutation.isPending ? "Loading..." : currentStepData.action}
 <ArrowRight className="ml-2 w-5 h-5" />
 </Button>
 </div>
 </div>
 ) : (
 // Feature Steps
 <div className="max-w-2xl mx-auto text-center space-y-8">
 <div className="space-y-4">
 <div className="mx-auto w-20 h-20 bg-white dark:bg-gray-900 rounded-3xl flex items-center justify-center border border-primary/20">
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
 disabled={completeOnboardingMutation.isPending}
 className="px-8 py-6 text-lg font-semibold bg-primary text-primary-foreground rounded-xl shadow-lg "
 data-testid={`button-${currentStepData.id}`}
 >
 {currentStepData.action}
 <ArrowRight className="ml-2 w-5 h-5" />
 </Button>
 
 {currentStep < onboardingSteps.length - 1 && (
 <Button
 variant="outline"
 onClick={handleNext}
 disabled={completeOnboardingMutation.isPending}
 className="px-6 py-6 text-lg"
 data-testid="button-next-step"
 >
 {completeOnboardingMutation.isPending ? "Loading..." : "Skip This Step"}
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