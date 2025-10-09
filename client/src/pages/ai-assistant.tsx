import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  MessageCircle, 
  TrendingUp, 
  PiggyBank, 
  Calendar,
  AlertTriangle,
  Lightbulb,
  Zap,
  Crown,
  ArrowRight,
  Send,
  Sparkles,
  Target,
  BarChart3,
  Clock,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

interface AIInsights {
  insight: string;
  error?: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  isActive: boolean;
  lastMessageAt: string;
  createdAt: string;
  messages?: ChatMessage[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
  category: string;
  requiresAnalysis?: boolean;
}

export default function AIAssistantPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Fetch usage data
  const { data: usage } = useQuery<UsageInfo>({
    queryKey: ["/api/subscription/usage"],
    refetchInterval: 30 * 1000
  });

  // Fetch current subscription
  const { data: currentData } = useQuery({
    queryKey: ["/api/subscription/current"],
  });

  // Fetch AI insights
  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights } = useQuery<AIInsights>({
    queryKey: ["/api/ai/insights"],
    refetchInterval: 5 * 60 * 1000
  });

  // Quick AI actions
  const quickActions: QuickAction[] = [
    {
      id: "budget-analysis",
      title: t('aiAssistant.quickActions.budgetAnalysis.title'),
      description: t('aiAssistant.quickActions.budgetAnalysis.description'),
      icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
      prompt: t('aiAssistant.quickActions.budgetAnalysis.prompt'),
      category: t('aiAssistant.quickActions.budgetAnalysis.category')
    },
    {
      id: "savings-goal",
      title: t('aiAssistant.quickActions.savingsGoal.title'),
      description: t('aiAssistant.quickActions.savingsGoal.description'),
      icon: <Target className="w-5 h-5 text-green-500" />,
      prompt: t('aiAssistant.quickActions.savingsGoal.prompt'),
      category: t('aiAssistant.quickActions.savingsGoal.category')
    },
    {
      id: "expense-review",
      title: t('aiAssistant.quickActions.expenseReview.title'),
      description: t('aiAssistant.quickActions.expenseReview.description'),
      icon: <DollarSign className="w-5 h-5 text-yellow-500" />,
      prompt: t('aiAssistant.quickActions.expenseReview.prompt'),
      category: t('aiAssistant.quickActions.expenseReview.category')
    },
    {
      id: "investment-advice",
      title: t('aiAssistant.quickActions.investmentAdvice.title'),
      description: t('aiAssistant.quickActions.investmentAdvice.description'),
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
      prompt: t('aiAssistant.quickActions.investmentAdvice.prompt'),
      category: t('aiAssistant.quickActions.investmentAdvice.category')
    },
    {
      id: "debt-strategy",
      title: t('aiAssistant.quickActions.debtStrategy.title'),
      description: t('aiAssistant.quickActions.debtStrategy.description'),
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      prompt: t('aiAssistant.quickActions.debtStrategy.prompt'),
      category: t('aiAssistant.quickActions.debtStrategy.category')
    },
    {
      id: "cash-flow",
      title: t('aiAssistant.quickActions.cashFlow.title'),
      description: t('aiAssistant.quickActions.cashFlow.description'),
      icon: <Clock className="w-5 h-5 text-indigo-500" />,
      prompt: t('aiAssistant.quickActions.cashFlow.prompt'),
      category: t('aiAssistant.quickActions.cashFlow.category'),
      requiresAnalysis: true
    }
  ];

  // Fetch current conversation with messages
  const { data: currentConversation } = useQuery<ChatConversation>({
    queryKey: ["/api/chat/conversations", currentConversationId],
    enabled: !!currentConversationId,
    refetchInterval: 2000, // Poll for new messages every 2 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      let conversationId = currentConversationId;
      
      // Create new conversation if none exists
      if (!conversationId) {
        const response = await apiRequest("POST", "/api/chat/conversations", { 
          title: t('aiAssistant.title') 
        });
        const conversation = await response.json();
        conversationId = conversation.id;
        setCurrentConversationId(conversationId);
      }
      
      const messageResponse = await apiRequest("POST", `/api/chat/conversations/${conversationId}/messages`, { 
        content 
      });
      
      // Handle quota exceeded error
      if (messageResponse.status === 429) {
        const errorData = await messageResponse.json();
        throw new Error(errorData.message || t('aiAssistant.quotaExceeded'));
      }
      
      return await messageResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", currentConversationId] });
      setCurrentMessage("");
      setSelectedQuickAction(null);
    },
    onError: (error: any) => {
      if (error.message.includes("limit exceeded")) {
        toast({
          title: t('aiAssistant.upgradeRequired'),
          description: t('aiAssistant.quotaExceeded'),
          variant: "destructive",
          duration: 8000,
          action: (
            <ToastAction 
              altText={t('aiAssistant.upgradeButton')}
              onClick={() => window.location.href = '/subscription'}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-300"
            >
              <Crown className="w-4 h-4 mr-2" />
              {t('aiAssistant.upgradeButton')}
            </ToastAction>
          )
        });
      } else {
        toast({
          title: t('common.error'),
          description: error.message || t('aiAssistant.errors.failedToSend'),
          variant: "destructive"
        });
      }
    }
  });

  const handleQuickAction = (action: QuickAction) => {
    if (isLimitExceeded) {
      toast({
        title: t('aiAssistant.upgradeRequired'),
        description: t('aiAssistant.quotaExceeded'),
        variant: "destructive",
        duration: 8000,
        action: (
          <ToastAction 
            altText={t('aiAssistant.upgradeButton')}
            onClick={() => window.location.href = '/subscription'}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-300"
          >
            <Crown className="w-4 h-4 mr-2" />
            {t('aiAssistant.upgradeButton')}
          </ToastAction>
        )
      });
      return;
    }
    
    setSelectedQuickAction(action.id);
    setCurrentMessage(action.prompt);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    // Check if user has exceeded their limit
    const isLimitExceeded = usage && usage.chatUsage.used >= usage.chatUsage.limit;
    
    if (isLimitExceeded) {
      toast({
        title: t('aiAssistant.upgradeRequired'),
        description: t('aiAssistant.quotaExceeded'),
        variant: "destructive",
        duration: 8000,
        action: (
          <ToastAction 
            altText={t('aiAssistant.upgradeButton')}
            onClick={() => window.location.href = '/subscription'}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-300"
          >
            <Crown className="w-4 h-4 mr-2" />
            {t('aiAssistant.upgradeButton')}
          </ToastAction>
        )
      });
      return;
    }

    sendMessageMutation.mutate(currentMessage);
  };

  const currentPlan = (currentData as any)?.subscription?.plan;
  const isFreePlan = currentPlan?.name === 'Free';
  const isLimitExceeded = usage && usage.chatUsage.used >= usage.chatUsage.limit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-pink-900/30">
      {/* Spectacular Header */}
      <header className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-purple-900/50 dark:via-blue-900/50 dark:to-pink-900/50 border-b border-border/50 sticky top-0 z-30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                  🤖 {t('aiAssistant.title')}
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Sparkles className="w-5 h-5 text-yellow-500 animate-bounce" />
                  <span className="text-lg text-muted-foreground">Advanced AI-powered financial advisor</span>
                  <Sparkles className="w-5 h-5 text-yellow-500 animate-bounce delay-300" />
                </div>
              </div>
            </div>
            
            {/* AI Stats Dashboard */}
            {usage && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium">Chat Usage</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {usage.chatUsage.used}/{usage.chatUsage.limit}
                  </div>
                  <div className="text-xs text-muted-foreground">AI conversations</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Analysis</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {usage.analysisUsage.used}/{usage.analysisUsage.limit}
                  </div>
                  <div className="text-xs text-muted-foreground">Deep insights</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium">Insights</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {usage.insights}
                  </div>
                  <div className="text-xs text-muted-foreground">Generated</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {isLimitExceeded ? "⚠️" : "✅"}
                  </div>
                  <div className="text-xs text-muted-foreground">{isLimitExceeded ? t('aiAssistant.stats.limitReached') : t('aiAssistant.stats.active')}</div>
                </div>
              </div>
            )}
            
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-gray-800/80 dark:to-purple-900/20 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-500" />
                <div>
                  <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-200">Intelligent Financial Assistant 🧠</h2>
                  <p className="text-purple-600 dark:text-purple-300">{t('aiAssistant.subtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-6 max-w-6xl space-y-8">

      {/* Enhanced Usage Summary */}
      {usage && (
        <Card className="relative overflow-hidden border-0 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 backdrop-blur-3xl" />
          <CardContent className="relative p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">{t('aiAssistant.usageTitle')}</h2>
              <p className="text-sm text-muted-foreground">Track your AI assistant activity this month</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg">AI Chats</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="font-bold text-lg">{usage.chatUsage.used} / {usage.chatUsage.limit}</span>
                    </div>
                    <div className="relative">
                      <Progress value={(usage.chatUsage.used / usage.chatUsage.limit) * 100} className="h-3 bg-blue-100 dark:bg-blue-900/30" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-20 animate-pulse" />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {usage.chatUsage.remaining} remaining
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-green-200/50 dark:border-green-800/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg">Deep Analysis</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="font-bold text-lg">{usage.analysisUsage.used} / {usage.analysisUsage.limit}</span>
                    </div>
                    <div className="relative">
                      <Progress value={(usage.analysisUsage.used / usage.analysisUsage.limit) * 100} className="h-3 bg-green-100 dark:bg-green-900/30" />
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full opacity-20 animate-pulse" />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {usage.analysisUsage.remaining} remaining
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-yellow-200/50 dark:border-yellow-800/50 backdrop-blur-sm text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg">Insights</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold bg-gradient-to-br from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                      {usage.insights}
                    </div>
                    <div className="text-sm text-muted-foreground">Generated this month</div>
                    <div className="flex items-center justify-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                      <Sparkles className="w-3 h-3" />
                      <span>Keep exploring!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dynamic quota status messages */}
            {usage.chatUsage.used >= usage.chatUsage.limit && (
              <div className="mt-8 p-6 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl border-2 border-red-300 dark:border-red-700 animate-in slide-in-from-top duration-500 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg">
                      <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
                    </div>
                    <div>
                      <div className="font-bold text-xl text-red-700 dark:text-red-300 mb-1">🚫 AI Chat Limit Reached!</div>
                      <div className="text-red-600 dark:text-red-400 mb-2">You've used all {usage.chatUsage.limit} AI chats for this month</div>
                      <div className="text-sm text-red-600 dark:text-red-400">Upgrade to Premium for unlimited AI assistance</div>
                    </div>
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => window.location.href = '/subscription'}
                    data-testid="button-upgrade-from-quota"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            )}
            
            {(usage.chatUsage.used >= usage.chatUsage.limit * 0.8 && usage.chatUsage.used < usage.chatUsage.limit) && (
              <div className="mt-8 p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-200 dark:border-orange-800 animate-in slide-in-from-top duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-orange-700 dark:text-orange-300">⚠️ Running Low on AI Quota!</div>
                      <div className="text-sm text-orange-600 dark:text-orange-400">Only {usage.chatUsage.remaining} AI chats remaining. Upgrade for unlimited access!</div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 shadow-lg"
                    onClick={() => window.location.href = '/subscription'}
                    data-testid="button-upgrade-warning"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade
                  </Button>
                </div>
              </div>
            )}
            
            {usage.chatUsage.used < usage.chatUsage.limit * 0.8 && isFreePlan && (
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-200 dark:border-blue-800 animate-in slide-in-from-top duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-blue-700 dark:text-blue-300">✨ Loving the AI Assistant?</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Upgrade to Premium for unlimited chats and advanced features!</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => window.location.href = '/subscription'}
                    data-testid="button-upgrade-promotion"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    See Plans
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Latest AI Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-foreground leading-relaxed" data-testid="text-ai-insight">
                {insights?.insight || "Focus on tracking your spending patterns this week to identify potential savings opportunities."}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchInsights()}
                data-testid="button-refresh-insights"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Get New Insight
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick AI Actions */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Quick AI Actions</h2>
          <p className="text-muted-foreground">
            Get instant AI assistance with these common financial tasks
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card 
              key={action.id} 
              className={`group transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-500 ${
                isLimitExceeded 
                  ? 'cursor-not-allowed opacity-60 grayscale hover:grayscale-0 hover:opacity-80 bg-gradient-to-br from-red-50/30 to-pink-50/30 dark:from-red-950/10 dark:to-pink-950/10 border-red-200 dark:border-red-800' 
                  : selectedQuickAction === action.id 
                    ? 'ring-2 ring-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg scale-105 -translate-y-1 cursor-pointer' 
                    : 'cursor-pointer hover:shadow-xl hover:scale-105 hover:-translate-y-2 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleQuickAction(action)}
              data-testid={`card-quick-action-${action.id}`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-inner group-hover:shadow-lg transition-all duration-300">
                        {action.icon}
                      </div>
                      {selectedQuickAction === action.id && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-30 animate-pulse" />
                      )}
                      {isLimitExceeded && (
                        <div className="absolute -inset-1 bg-red-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            <span>Upgrade</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-medium transition-colors duration-300 ${
                        isLimitExceeded 
                          ? 'border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30' 
                          : 'group-hover:bg-primary/10'
                      }`}
                    >
                      {action.category}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors duration-300">{action.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    {action.requiresAnalysis && (
                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Deep Analysis
                      </Badge>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Chat with AI Assistant
          </CardTitle>
          <CardDescription>
            Ask any financial question or use the quick actions above
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages Display - Enhanced Chat UI */}
          {currentConversation?.messages && currentConversation.messages.length > 0 && (
            <div className="relative border-2 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-xl p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 max-h-96 overflow-y-auto space-y-4 backdrop-blur-sm">
              <div className="sticky top-0 bg-background/80 backdrop-blur-md rounded-lg p-2 mb-4">
                <h4 className="text-sm font-bold text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  AI Conversation
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </h4>
              </div>
              {currentConversation.messages.map((message: ChatMessage, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-500`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`relative rounded-2xl p-4 shadow-md transition-all duration-300 hover:shadow-lg ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-sm'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-bl-sm'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-primary to-purple-600 rounded-full animate-pulse" />
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">You</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                      <Brain className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm p-4 flex items-center gap-3 shadow-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                      </div>
                      <span className="text-sm text-muted-foreground font-medium">AI is analyzing your request...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Input Area */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-sm" />
              <Textarea
                placeholder={isLimitExceeded ? 
                  t('aiAssistant.quotaExceeded') :
                  t('aiAssistant.chatPlaceholder')
                }
                value={currentMessage}
                onChange={(e) => !isLimitExceeded && setCurrentMessage(e.target.value)}
                disabled={isLimitExceeded}
                className={`relative min-h-[120px] resize-none border-2 rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-primary transition-all duration-300 text-base leading-relaxed ${
                  isLimitExceeded 
                    ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 dark:border-red-700 text-red-600 dark:text-red-400 placeholder-red-400 dark:placeholder-red-500 cursor-not-allowed opacity-70' 
                    : 'border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 bg-white/50 dark:bg-gray-900/50 focus:border-transparent'
                }`}
                data-testid="textarea-ai-message"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 rounded-full px-2 py-1">
                  <span className={currentMessage.length > 800 ? 'text-orange-500 font-medium' : ''}>
                    {currentMessage.length}
                  </span>
                  <span>/1000</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  <span>Powered by AI</span>
                </div>
                {selectedQuickAction && (
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 animate-pulse">
                    <Zap className="w-3 h-3 mr-1" />
                    Quick Action Selected
                  </Badge>
                )}
              </div>
              
              <Button
                onClick={isLimitExceeded ? () => window.location.href = '/subscription' : handleSendMessage}
                disabled={(!currentMessage.trim() || sendMessageMutation.isPending) && !isLimitExceeded}
                className={`shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-2 ${
                  isLimitExceeded 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
                    : 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90'
                }`}
                data-testid="button-send-ai-message"
              >
                {isLimitExceeded ? (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    {t('aiAssistant.upgradeToChat')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : sendMessageMutation.isPending ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                    {t('aiAssistant.send')}
                    <Sparkles className="w-3 h-3 ml-2 animate-pulse" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedQuickAction && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
                <Zap className="w-4 h-4" />
                <span>Quick action selected: {quickActions.find(a => a.id === selectedQuickAction)?.title}</span>
              </div>
            </div>
          )}
          
          {!usage?.chatUsage.allowed && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <Crown className="w-4 h-4" />
                    <span className="font-medium">Upgrade Required</span>
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    You've reached your {isFreePlan ? 'free plan' : 'current plan'} AI chat limit. Upgrade to continue chatting with your AI assistant.
                  </p>
                </div>
                <Button size="sm" data-testid="button-upgrade-for-ai">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Available AI Features</CardTitle>
          <CardDescription>
            Explore all the ways AI can help improve your financial management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Smart Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Budget Analysis</div>
                    <div className="text-sm text-muted-foreground">AI reviews your spending patterns and suggests optimizations</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Investment Guidance</div>
                    <div className="text-sm text-muted-foreground">Personalized investment recommendations based on your goals</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Goal Optimization</div>
                    <div className="text-sm text-muted-foreground">Smart strategies to reach your financial goals faster</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Proactive Insights</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Daily Insights</div>
                    <div className="text-sm text-muted-foreground">Personalized financial tips based on your activity</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Smart Alerts</div>
                    <div className="text-sm text-muted-foreground">Early warnings about budget overruns or goal delays</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Planning Assistance</div>
                    <div className="text-sm text-muted-foreground">AI-powered financial planning and scheduling</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}