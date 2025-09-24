import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
      icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
      prompt: "Please analyze my current budget and spending patterns. What areas should I focus on to improve my financial health?",
      category: "Budget"
    },
    {
      id: "savings-goal",
      title: "Savings Strategy",
      description: "Get recommendations for achieving your financial goals faster",
      icon: <Target className="w-5 h-5 text-green-500" />,
      prompt: "Based on my financial situation, what's the best strategy to reach my savings goals? How much should I save each month?",
      category: "Goals"
    },
    {
      id: "expense-review",
      title: "Expense Review",
      description: "Identify unnecessary expenses and potential savings",
      icon: <DollarSign className="w-5 h-5 text-yellow-500" />,
      prompt: "Review my recent expenses and identify areas where I could cut costs or save money. What subscriptions or expenses should I reconsider?",
      category: "Expenses"
    },
    {
      id: "investment-advice",
      title: "Investment Guidance",
      description: "Get advice on investment opportunities and portfolio allocation",
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
      prompt: "Given my current financial situation and goals, what investment strategies would you recommend? How should I allocate my portfolio?",
      category: "Investment"
    },
    {
      id: "debt-strategy",
      title: "Debt Management",
      description: "Create a plan to pay off debts efficiently",
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      prompt: "Help me create an efficient debt payoff strategy. What's the best approach to minimize interest and pay off my debts quickly?",
      category: "Debt"
    },
    {
      id: "cash-flow",
      title: "Cash Flow Analysis",
      description: "Understand your money flow and optimize timing",
      icon: <Clock className="w-5 h-5 text-indigo-500" />,
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
      return await messageResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", currentConversationId] });
      setCurrentMessage("");
      setSelectedQuickAction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const handleQuickAction = (action: QuickAction) => {
    setSelectedQuickAction(action.id);
    setCurrentMessage(action.prompt);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    // Only block if usage is loaded and explicitly not allowed
    if (usage && !usage.chatUsage.allowed) {
      toast({
        title: "Upgrade Required",
        description: "You've reached your AI chat limit. Upgrade your plan to continue.",
        variant: "destructive"
      });
      return;
    }

    sendMessageMutation.mutate(currentMessage);
  };

  const currentPlan = (currentData as any)?.subscription?.plan;
  const isFreePlan = currentPlan?.name === 'Free';

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Brain className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold">AI Financial Assistant</h1>
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get personalized financial advice, budget analysis, and smart recommendations powered by advanced AI
        </p>
      </div>

      {/* Usage Summary */}
      {usage && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">AI Chats</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span className="font-medium">{usage.chatUsage.used} / {usage.chatUsage.limit}</span>
                  </div>
                  <Progress value={(usage.chatUsage.used / usage.chatUsage.limit) * 100} className="h-2" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Deep Analysis</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span className="font-medium">{usage.analysisUsage.used} / {usage.analysisUsage.limit}</span>
                  </div>
                  <Progress value={(usage.analysisUsage.used / usage.analysisUsage.limit) * 100} className="h-2" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">Insights Generated</span>
                </div>
                <div className="text-2xl font-bold text-primary">{usage.insights}</div>
                <div className="text-xs text-muted-foreground">This month</div>
              </div>
            </div>
            
            {(usage.chatUsage.used >= usage.chatUsage.limit * 0.8 || usage.analysisUsage.used >= usage.analysisUsage.limit * 0.8) && (
              <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    You're running low on AI quota. Consider upgrading your plan for unlimited access.
                  </span>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card 
              key={action.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedQuickAction === action.id ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleQuickAction(action)}
              data-testid={`card-quick-action-${action.id}`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    {action.icon}
                    <Badge variant="outline" className="text-xs">
                      {action.category}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  {action.requiresAnalysis && (
                    <Badge variant="secondary" className="text-xs">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Deep Analysis
                    </Badge>
                  )}
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
          {/* Messages Display */}
          {currentConversation?.messages && currentConversation.messages.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/20 max-h-80 overflow-y-auto space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Conversation</h4>
              {currentConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-background border rounded-lg p-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 animate-pulse text-primary" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Textarea
              placeholder="Ask about your budget, savings goals, investment strategies, or any financial question..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid="textarea-ai-message"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {currentMessage.length}/1000 characters
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                data-testid="button-send-ai-message"
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
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
  );
}