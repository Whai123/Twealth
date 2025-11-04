import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Send,
  Brain,
  Zap,
  BarChart3,
  Crown,
  Sparkles,
  TrendingUp,
  PiggyBank,
  Target,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiRequest, queryClient, RateLimitError } from "@/lib/queryClient";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { MessageBubble, TypingIndicator } from "@/components/chat/message-bubble";

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

interface StarterPrompt {
  icon: React.ReactNode;
  title: string;
  prompt: string;
}

export default function AIAssistantPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'deep'>('quick');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitRetryAfter > 0) {
      const timer = setInterval(() => {
        setRateLimitRetryAfter(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rateLimitRetryAfter]);

  // Fetch usage data
  const { data: usage } = useQuery<UsageInfo>({
    queryKey: ["/api/subscription/usage"],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Fetch current conversation with messages
  const { data: currentConversation, isLoading: messagesLoading } = useQuery<ChatConversation>({
    queryKey: ["/api/chat/conversations", currentConversationId],
    enabled: !!currentConversationId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (currentConversation?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [currentMessage]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      let conversationId = currentConversationId;
      
      if (!conversationId) {
        const response = await apiRequest("POST", "/api/chat/conversations", { 
          title: content.slice(0, 50) + (content.length > 50 ? '...' : '')
        });
        const conversation = await response.json();
        conversationId = conversation.id;
        setCurrentConversationId(conversationId);
      }
      
      const messageResponse = await apiRequest("POST", `/api/chat/conversations/${conversationId}/messages`, { 
        content,
        isDeepAnalysis: analysisMode === 'deep'
      });
      
      if (messageResponse.status === 429) {
        const errorData = await messageResponse.json();
        throw new Error(errorData.message || 'Quota exceeded');
      }
      
      return await messageResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", currentConversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      setCurrentMessage("");
    },
    onError: (error: any) => {
      if (error instanceof RateLimitError) {
        setRateLimitRetryAfter(error.retryAfter);
        toast({
          title: "Rate Limit Exceeded",
          description: `Too many requests. Please wait ${error.retryAfter} seconds before trying again.`,
          variant: "destructive",
          duration: error.retryAfter * 1000,
        });
      } else if (error.message.includes("limit exceeded") || error.message.includes("Quota")) {
        toast({
          title: "Upgrade Required",
          description: "You've reached your AI chat limit. Upgrade to continue.",
          variant: "destructive",
          duration: 8000,
          action: (
            <ToastAction 
              altText="Upgrade"
              onClick={() => window.location.href = '/subscription'}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade
            </ToastAction>
          )
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive"
        });
      }
    }
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim() || sendMessageMutation.isPending || rateLimitRetryAfter > 0) return;
    
    const isLimitExceeded = usage && usage.chatUsage.used >= usage.chatUsage.limit;
    
    if (isLimitExceeded) {
      toast({
        title: "Upgrade Required",
        description: "You've reached your AI chat limit. Upgrade to continue.",
        variant: "destructive",
        action: (
          <ToastAction 
            altText="Upgrade"
            onClick={() => window.location.href = '/subscription'}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade
          </ToastAction>
        )
      });
      return;
    }

    sendMessageMutation.mutate(currentMessage);
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setCurrentMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const starterPrompts: StarterPrompt[] = [
    {
      icon: <Target className="w-5 h-5" />,
      title: "Buy a Car",
      prompt: "I want to buy a $35,000 car in 2 years. Can you help me create a savings plan?"
    },
    {
      icon: <PiggyBank className="w-5 h-5" />,
      title: "Emergency Fund",
      prompt: "How much should I have in my emergency fund? What's realistic for my situation?"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Investment Strategy",
      prompt: "I have $10,000 to invest. What's the best allocation for someone my age?"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Retirement Planning",
      prompt: "Help me calculate how much I need to save monthly to retire comfortably at 65"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Reduce Debt",
      prompt: "I have $20,000 in credit card debt. What's the fastest way to pay it off?"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Full Financial Checkup",
      prompt: "Give me a comprehensive analysis of my financial health with specific recommendations"
    }
  ];

  const messages = currentConversation?.messages || [];
  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen bg-background" style={{ height: '100dvh' }}>
      {/* Sidebar */}
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="shrink-0 border-b border-border bg-white dark:bg-black">
          <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white shrink-0" />
                <h1 className="text-sm sm:text-lg font-semibold truncate">Twealth AI</h1>
              </div>
              
              {/* Mode Selector */}
              <Select value={analysisMode} onValueChange={(v: 'quick' | 'deep') => setAnalysisMode(v)}>
                <SelectTrigger className="w-[120px] sm:w-[160px] h-11 sm:h-9 text-xs sm:text-sm" data-testid="select-analysis-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Quick Chat</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deep">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Deep Analysis</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Usage Counter */}
            {usage && (
              <div className="text-xs sm:text-sm text-muted-foreground shrink-0">
                <span className="font-medium">{usage.chatUsage.used}/{usage.chatUsage.limit}</span>
                <span className="hidden sm:inline"> chats used</span>
              </div>
            )}
          </div>
        </header>

        {/* Messages Area - Scrollable flex-grow container */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4">
          <div className="max-w-3xl mx-auto py-4 sm:py-8 pb-4 sm:pb-6">
            {!hasMessages ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black dark:bg-white rounded-lg flex items-center justify-center mb-4 sm:mb-6 border border-border">
                  <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white dark:text-black" />
                </div>
                <h2 className="text-xl sm:text-3xl font-bold mb-2">Your Personal CFO</h2>
                <p className="text-muted-foreground text-sm sm:text-lg mb-1 sm:mb-2 max-w-md">
                  Expert financial advice powered by AI
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 max-w-md">
                  Ask me anything about budgeting, investing, debt payoff, retirement, or financial planning
                </p>

                {/* Starter Prompts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full max-w-4xl">
                  {starterPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMessage(prompt.prompt)}
                      className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-muted/50 min-h-[44px] active:scale-[0.98] transition-all"
                      data-testid={`starter-prompt-${index}`}
                    >
                      <div className="text-black dark:text-white shrink-0">
                        {prompt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">{prompt.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{prompt.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <div className="space-y-4 sm:space-y-6">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.createdAt}
                    isLatest={index === messages.length - 1 && message.role === 'assistant'}
                    onRegenerate={() => {
                      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                      if (lastUserMessage) {
                        sendMessageMutation.mutate(lastUserMessage.content);
                      }
                    }}
                  />
                ))}
                
                {/* Typing Indicator */}
                {sendMessageMutation.isPending && <TypingIndicator />}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Flex item at bottom, always visible */}
        <div className="shrink-0 border-t border-border bg-white dark:bg-black" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-3 sm:pb-0">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Twealth AI..."
                className="min-h-[48px] sm:min-h-[52px] max-h-[120px] sm:max-h-[200px] resize-none pr-12 sm:pr-14 text-sm sm:text-base w-full"
                rows={1}
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || sendMessageMutation.isPending || rateLimitRetryAfter > 0}
                size="icon"
                className="absolute right-2 bottom-2 h-11 w-11 sm:h-10 sm:w-10"
                data-testid="button-send-message"
                title={rateLimitRetryAfter > 0 ? `Wait ${rateLimitRetryAfter}s` : undefined}
              >
                {rateLimitRetryAfter > 0 ? (
                  <span className="text-xs font-medium">{rateLimitRetryAfter}s</span>
                ) : (
                  <Send className="w-4 h-4 sm:w-4 sm:h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
              Twealth AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
