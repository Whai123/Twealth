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
  ArrowRight,
  Send,
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
      title: "Analyze My Budget",
      description: "Get personalized insights on your spending patterns and budget optimization",
      icon: <BarChart3 className="w-5 h-5 text-gray-600" />,
      prompt: "Please analyze my current budget and spending patterns. What areas should I focus on to improve my financial health?",
      category: "Budget"
    },
    {
      id: "savings-goal",
      title: "Savings Strategy",
      description: "Get recommendations for achieving your financial goals faster",
      icon: <Target className="w-5 h-5 text-gray-600" />,
      prompt: "Based on my financial situation, what's the best strategy to reach my savings goals? How much should I save each month?",
      category: "Goals"
    },
    {
      id: "expense-review",
      title: "Expense Review",
      description: "Identify unnecessary expenses and potential savings",
      icon: <DollarSign className="w-5 h-5 text-gray-600" />,
      prompt: "Review my recent expenses and identify areas where I could cut costs or save money. What subscriptions or expenses should I reconsider?",
      category: "Expenses"
    },
    {
      id: "investment-advice",
      title: "Investment Guidance",
      description: "Get advice on investment opportunities and portfolio allocation",
      icon: <TrendingUp className="w-5 h-5 text-gray-600" />,
      prompt: "Given my current financial situation and goals, what investment strategies would you recommend? How should I allocate my portfolio?",
      category: "Investment"
    },
    {
      id: "debt-strategy",
      title: "Debt Management",
      description: "Create a plan to pay off debts efficiently",
      icon: <AlertTriangle className="w-5 h-5 text-gray-600" />,
      prompt: "Help me create an efficient debt payoff strategy. What's the best approach to minimize interest and pay off my debts quickly?",
      category: "Debt"
    },
    {
      id: "cash-flow",
      title: "Cash Flow Analysis",
      description: "Understand your money flow and optimize timing",
      icon: <Clock className="w-5 h-5 text-gray-600" />,
      prompt: "Analyze my cash flow patterns. When do I typically have surplus or shortfall, and how can I optimize my financial timing?",
      category: "Planning",
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
          title: "AI Assistant Chat" 
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
        throw new Error(errorData.message || "Usage limit exceeded");
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
          variant: "default",
          duration: 8000,
          action: (
            <ToastAction 
              altText={t('aiAssistant.upgradeButton')}
              onClick={() => window.location.href = '/subscription'}
              className="bg-gray-600 text-white border-gray-300"
            >
              {t('aiAssistant.upgradeButton')}
            </ToastAction>
          )
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "default"
        });
      }
    }
  });

  const handleQuickAction = (action: QuickAction) => {
    if (isLimitExceeded) {
      toast({
        title: t('aiAssistant.upgradeRequired'),
        description: t('aiAssistant.quotaExceeded'),
        variant: "default",
        duration: 8000,
        action: (
          <ToastAction 
            altText={t('aiAssistant.upgradeButton')}
            onClick={() => window.location.href = '/subscription'}
            className="bg-gray-600 text-white border-gray-300"
          >
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
    
    if (isLimitExceeded) {
      toast({
        title: t('aiAssistant.upgradeRequired'),
        description: t('aiAssistant.quotaExceeded'),
        variant: "default",
        duration: 8000,
        action: (
          <ToastAction 
            altText={t('aiAssistant.upgradeButton')}
            onClick={() => window.location.href = '/subscription'}
            className="bg-gray-600 text-white border-gray-300"
          >
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Professional Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-6 max-w-6xl">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                  {t('aiAssistant.title')}
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-lg text-gray-600 dark:text-gray-400">Professional AI financial advisory service</span>
                </div>
              </div>
            </div>
            
            {/* Professional Usage Dashboard */}
            {usage && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-chat-usage">Chat Sessions</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {usage.chatUsage.used}/{usage.chatUsage.limit}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Conversations used</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-analysis-usage">Analysis</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {usage.analysisUsage.used}/{usage.analysisUsage.limit}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Deep insights</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-insights-count">Insights</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {usage.insights}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Generated</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-service-status">Service Status</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {isLimitExceeded ? "Paused" : "Active"}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{isLimitExceeded ? "Limit reached" : "Ready to assist"}</div>
                </div>
              </div>
            )}
            
            {/* Professional Status */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-ai-status">AI Advisory Service Active</h2>
                  <p className="text-gray-600 dark:text-gray-400">{t('aiAssistant.subtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-6 max-w-6xl space-y-8">

      {/* Professional Usage Summary */}
      {usage && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{t('aiAssistant.usageTitle')}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track your AI assistant activity this month</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-semibold text-lg text-gray-900 dark:text-white">Chat Sessions</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Usage</span>
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">{usage.chatUsage.used} / {usage.chatUsage.limit}</span>
                  </div>
                  <div className="relative">
                    <Progress value={(usage.chatUsage.used / usage.chatUsage.limit) * 100} className="h-2 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {usage.chatUsage.remaining} sessions remaining
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-semibold text-lg text-gray-900 dark:text-white">Deep Analysis</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Usage</span>
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">{usage.analysisUsage.used} / {usage.analysisUsage.limit}</span>
                  </div>
                  <div className="relative">
                    <Progress value={(usage.analysisUsage.used / usage.analysisUsage.limit) * 100} className="h-2 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {usage.analysisUsage.remaining} analyses remaining
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-semibold text-lg text-gray-900 dark:text-white">Insights</span>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {usage.insights}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Generated this month</div>
                  <div className="text-xs text-gray-500">
                    Professional advisory insights
                  </div>
                </div>
              </div>
            </div>
            
            {/* Professional quota status messages */}
            {usage.chatUsage.used >= usage.chatUsage.limit && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-gray-900 dark:text-white mb-1">Service Limit Reached</div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">You've used all {usage.chatUsage.limit} AI consultations for this month</div>
                      <div className="text-sm text-gray-500">Upgrade your plan for continued access to professional AI advisory services</div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-gray-600 text-white"
                    onClick={() => window.location.href = '/subscription'}
                    data-testid="button-upgrade-from-quota"
                  >
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            )}
            
            {(usage.chatUsage.used >= usage.chatUsage.limit * 0.8 && usage.chatUsage.used < usage.chatUsage.limit) && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Service Usage Notice</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Only {usage.chatUsage.remaining} AI consultations remaining. Consider upgrading for continuous access.</div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-300 text-gray-700 bg-gray-50"
                    onClick={() => window.location.href = '/subscription'}
                    data-testid="button-upgrade-warning"
                  >
                    Upgrade
                  </Button>
                </div>
              </div>
            )}
            
            {usage.chatUsage.used < usage.chatUsage.limit * 0.8 && isFreePlan && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <Brain className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Enhance Your AI Experience</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Upgrade to Professional for unlimited consultations and advanced analytics.</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-300 text-gray-700 bg-gray-50"
                    onClick={() => window.location.href = '/subscription'}
                    data-testid="button-upgrade-promotion"
                  >
                    View Plans
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
            <Lightbulb className="w-5 h-5 text-gray-600" />
            Latest AI Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <div className="space-y-3">
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
                Refresh Insight
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
              className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
                isLimitExceeded 
                  ? 'cursor-not-allowed opacity-60 border-gray-300 dark:border-gray-700' 
                  : selectedQuickAction === action.id 
                    ? 'ring-1 ring-gray-500 border-gray-400 cursor-pointer' 
                    : 'cursor-pointer border-gray-300 dark:border-gray-600'
              }`}
              onClick={() => handleQuickAction(action)}
              data-testid={`card-quick-action-${action.id}`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        {action.icon}
                      </div>
                      {isLimitExceeded && (
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-gray-600 text-white text-xs px-1.5 py-0.5 rounded text-[10px]">
                            Limited
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-medium ${
                        isLimitExceeded 
                          ? 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-800' 
                          : 'bg-gray-50 dark:bg-gray-900'
                      }`}
                    >
                      {action.category}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{action.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    {action.requiresAnalysis && (
                      <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Deep Analysis
                      </Badge>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
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
            <MessageCircle className="w-5 h-5 text-gray-600" />
            Chat with AI Assistant
          </CardTitle>
          <CardDescription>
            Ask any financial question or use the quick actions above
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages Display - Enhanced Chat UI */}
          {currentConversation?.messages && currentConversation.messages.length > 0 && (
            <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 max-h-96 overflow-y-auto space-y-4">
              <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-4">
                <h4 className="text-sm font-semibold text-center text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-600" />
                  Professional Consultation
                </h4>
              </div>
              {currentConversation.messages.map((message: ChatMessage, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`relative rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">You</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="flex items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
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
                    ? 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 cursor-not-allowed opacity-70' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-gray-400'
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
                  <span>Professional Analysis</span>
                </div>
                {selectedQuickAction && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    Advisory session prepared
                  </Badge>
                )}
              </div>
              
              <Button
                onClick={isLimitExceeded ? () => window.location.href = '/subscription' : handleSendMessage}
                disabled={(!currentMessage.trim() || sendMessageMutation.isPending) && !isLimitExceeded}
                className={`px-6 py-2 ${
                  isLimitExceeded 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-600 text-white'
                }`}
                data-testid="button-send-ai-message"
              >
                {isLimitExceeded ? (
                  <>
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
                    <Send className="w-4 h-4 mr-2" />
                    {t('aiAssistant.send')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedQuickAction && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
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
                    <span className="font-medium">Upgrade Required</span>
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    You've reached your {isFreePlan ? 'free plan' : 'current plan'} AI chat limit. Upgrade to continue chatting with your AI assistant.
                  </p>
                </div>
                <Button size="sm" data-testid="button-upgrade-for-ai">
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
                  <BarChart3 className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Budget Analysis</div>
                    <div className="text-sm text-muted-foreground">AI reviews your spending patterns and suggests optimizations</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Investment Guidance</div>
                    <div className="text-sm text-muted-foreground">Personalized investment recommendations based on your goals</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-gray-600 mt-0.5" />
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
                  <Lightbulb className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Daily Insights</div>
                    <div className="text-sm text-muted-foreground">Personalized financial tips based on your activity</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Smart Alerts</div>
                    <div className="text-sm text-muted-foreground">Early warnings about budget overruns or goal delays</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
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