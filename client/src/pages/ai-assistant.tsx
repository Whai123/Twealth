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
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      if (error.message.includes("limit exceeded") || error.message.includes("Quota")) {
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
    if (!currentMessage.trim() || sendMessageMutation.isPending) return;
    
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
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Analyze my budget",
      prompt: "Can you analyze my current budget and suggest improvements?"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Create savings goal",
      prompt: "Help me create a realistic savings goal based on my income"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Investment advice",
      prompt: "What are the best investment strategies for my financial situation?"
    },
    {
      icon: <PiggyBank className="w-5 h-5" />,
      title: "Emergency fund plan",
      prompt: "Help me build an emergency fund. How much should I save?"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Reduce expenses",
      prompt: "Review my recent expenses and suggest ways to cut costs"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Financial health check",
      prompt: "Give me a complete financial health assessment"
    }
  ];

  const messages = currentConversation?.messages || [];
  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-semibold">Twealth AI</h1>
              </div>
              
              {/* Mode Selector */}
              <Select value={analysisMode} onValueChange={(v: 'quick' | 'deep') => setAnalysisMode(v)}>
                <SelectTrigger className="w-[160px] h-9" data-testid="select-analysis-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Quick Chat
                    </div>
                  </SelectItem>
                  <SelectItem value="deep">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Deep Analysis
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Usage Counter */}
            {usage && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{usage.chatUsage.used}/{usage.chatUsage.limit}</span> chats used
              </div>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="max-w-3xl mx-auto py-8">
            {!hasMessages ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Welcome to Twealth AI</h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-md">
                  Your personal CFO worth $150/hour. Get expert financial advice powered by AI.
                </p>

                {/* Starter Prompts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl">
                  {starterPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMessage(prompt.prompt)}
                      className="flex items-start gap-3 p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                      data-testid={`starter-prompt-${index}`}
                    >
                      <div className="text-primary group-hover:scale-110 transition-transform">
                        {prompt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1">{prompt.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{prompt.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.createdAt}
                    isLatest={index === messages.length - 1 && message.role === 'assistant'}
                    onRegenerate={() => {
                      // Find the last user message and resend it
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
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Twealth AI..."
                className="min-h-[52px] max-h-[200px] resize-none pr-12"
                rows={1}
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Twealth AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
