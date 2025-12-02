import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  DollarSign,
  Shield,
  Gem,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiRequest, queryClient, RateLimitError } from "@/lib/queryClient";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { MessageBubble, TypingIndicator } from "@/components/chat/message-bubble";
import { Badge } from "@/components/ui/badge";

interface UsageInfo {
  scoutUsage: {
    used: number;
    limit: number;
    remaining: number;
    allowed: boolean;
  };
  sonnetUsage: {
    used: number;
    limit: number;
    remaining: number;
    allowed: boolean;
  };
  gpt5Usage: {
    used: number;
    limit: number;
    remaining: number;
    allowed: boolean;
  };
  opusUsage: {
    used: number;
    limit: number;
    remaining: number;
    allowed: boolean;
  };
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
  gradient: string;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span className={className}>{displayValue}</span>;
}

function CircularProgress({ value, max, size = 44, strokeWidth = 3, color = "blue" }: { 
  value: number; 
  max: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const offset = circumference - (percentage / 100) * circumference;
  
  const colorMap: Record<string, string> = {
    blue: "stroke-blue-500",
    emerald: "stroke-emerald-500",
    amber: "stroke-amber-500"
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colorMap[color] || colorMap.blue}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
    </div>
  );
}

function QuotaCard({ 
  name, 
  badge, 
  used, 
  limit, 
  color,
  locked = false,
  lockText = "Pro tier"
}: { 
  name: string; 
  badge: string; 
  used: number; 
  limit: number; 
  color: string;
  locked?: boolean;
  lockText?: string;
}) {
  const isUnlimited = limit === 999999;
  const remaining = limit - used;
  
  const colorMap: Record<string, { bg: string; text: string; badge: string; border: string }> = {
    blue: { 
      bg: "bg-blue-50 dark:bg-blue-950/30", 
      text: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-600 text-white",
      border: "border-blue-200/50 dark:border-blue-800/50"
    },
    emerald: { 
      bg: "bg-emerald-50 dark:bg-emerald-950/30", 
      text: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-600 text-white",
      border: "border-emerald-200/50 dark:border-emerald-800/50"
    },
    amber: { 
      bg: "bg-amber-50 dark:bg-amber-950/30", 
      text: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-600 text-white",
      border: "border-amber-200/50 dark:border-amber-800/50"
    }
  };
  
  const colors = colorMap[color] || colorMap.blue;

  if (locked) {
    return (
      <motion.div 
        className="flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-border/40 bg-muted/5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
            <Crown className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{name}</p>
            <p className="text-xs text-muted-foreground/60">{lockText}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`relative p-4 rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CircularProgress 
            value={isUnlimited ? 100 : remaining} 
            max={isUnlimited ? 100 : limit} 
            color={color}
            size={44}
            strokeWidth={4}
          />
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <Badge className={`${colors.badge} text-[10px] px-1.5 py-0 font-medium`}>{badge}</Badge>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${colors.text}`}>
            {isUnlimited ? (
              <span className="text-2xl">∞</span>
            ) : (
              <AnimatedNumber value={remaining} />
            )}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            {isUnlimited ? 'unlimited' : 'remaining'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AIAssistantPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'deep'>('quick');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number>(0);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (rateLimitRetryAfter > 0) {
      const timer = setInterval(() => {
        setRateLimitRetryAfter(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rateLimitRetryAfter]);

  const { data: usage } = useQuery<UsageInfo>({
    queryKey: ["/api/subscription/usage"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: currentConversation, isLoading: messagesLoading } = useQuery<ChatConversation>({
    queryKey: ["/api/chat/conversations", currentConversationId],
    enabled: !!currentConversationId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (currentConversation?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [currentMessage]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleFocus = () => {
      setTimeout(() => {
        textarea.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    };

    textarea.addEventListener('focus', handleFocus);
    return () => textarea.removeEventListener('focus', handleFocus);
  }, []);

  const getCurrentTier = () => {
    if (!usage) return 'Free';
    if (usage.opusUsage && usage.opusUsage.limit > 0) return 'Enterprise';
    if (usage.sonnetUsage && usage.sonnetUsage.limit > 0) return 'Pro';
    return 'Free';
  };

  const getUpgradeMessage = (exceededModel?: string) => {
    const tier = getCurrentTier();
    
    if (exceededModel === 'opus') {
      return {
        title: "Opus Quota Exceeded",
        description: "You've used all your Enterprise Opus queries. Your queries will fall back to Sonnet until quota resets.",
        benefits: "Opus provides the most advanced analysis for complex financial decisions."
      };
    }
    
    if (exceededModel === 'gpt5') {
      if (tier === 'Enterprise') {
        return {
          title: "GPT-5 Quota Exceeded",
          description: "You've used all your GPT-5 math queries. Your queries will use Sonnet for reasoning until quota resets.",
          benefits: "GPT-5 provides advanced mathematical analysis and projections."
        };
      }
      return {
        title: "Upgrade to Enterprise",
        description: "Get more GPT-5 queries (10/month) plus Opus access for CFO-level analysis.",
        benefits: "Enterprise includes: 10 GPT-5 queries, 20 Opus queries, 60 Sonnet queries, Unlimited Scout"
      };
    }
    
    if (exceededModel === 'sonnet') {
      return {
        title: "Upgrade to Enterprise",
        description: "Unlock Opus for CFO-level analysis, more GPT-5 for math, and higher Sonnet limits.",
        benefits: "Enterprise includes: 20 Opus queries, 10 GPT-5 queries, 60 Sonnet queries, Unlimited Scout"
      };
    }
    
    if (tier === 'Pro') {
      return {
        title: "Upgrade to Enterprise",
        description: "Unlock Opus for CFO-level analysis, more GPT-5 for math, and higher Sonnet limits.",
        benefits: "Enterprise includes: 20 Opus queries, 10 GPT-5 queries, 60 Sonnet queries, Unlimited Scout"
      };
    }
    
    return {
      title: "Upgrade to Pro",
      description: "Get access to Sonnet for deep reasoning and GPT-5 for math analysis.",
      benefits: "Pro includes: Unlimited Scout, 25 Sonnet queries, 5 GPT-5 queries per month"
    };
  };

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
        const exceededModel = errorData.exceededModel;
        throw { isQuotaError: true, exceededModel, message: errorData.message };
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
      } else if (error.isQuotaError) {
        const upgradeMsg = getUpgradeMessage(error.exceededModel);
        const tier = getCurrentTier();
        const needsUpgrade = tier === 'Free' || (tier === 'Pro' && error.exceededModel === 'sonnet');
        
        toast({
          title: upgradeMsg.title,
          description: upgradeMsg.description,
          variant: "destructive",
          duration: 10000,
          action: needsUpgrade ? (
            <ToastAction 
              altText="Upgrade"
              onClick={() => setLocation('/subscription')}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade
            </ToastAction>
          ) : undefined
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
            onClick={() => setLocation('/subscription')}
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
      prompt: "I want to buy a $35,000 car in 2 years. Can you help me create a savings plan?",
      gradient: "from-blue-500/10 to-blue-600/5"
    },
    {
      icon: <PiggyBank className="w-5 h-5" />,
      title: "Emergency Fund",
      prompt: "How much should I have in my emergency fund? What's realistic for my situation?",
      gradient: "from-emerald-500/10 to-emerald-600/5"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Investment Strategy",
      prompt: "I have $10,000 to invest. What's the best allocation for someone my age?",
      gradient: "from-violet-500/10 to-violet-600/5"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Retirement Planning",
      prompt: "Help me calculate how much I need to save monthly to retire comfortably at 65",
      gradient: "from-amber-500/10 to-amber-600/5"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Reduce Debt",
      prompt: "I have $20,000 in credit card debt. What's the fastest way to pay it off?",
      gradient: "from-rose-500/10 to-rose-600/5"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Full Financial Checkup",
      prompt: "Give me a comprehensive analysis of my financial health with specific recommendations",
      gradient: "from-cyan-500/10 to-cyan-600/5"
    }
  ];

  const messages = currentConversation?.messages || [];
  const hasMessages = messages.length > 0;

  const tier = getCurrentTier();
  const scoutUsed = usage?.scoutUsage?.used || 0;
  const scoutLimit = usage?.scoutUsage?.limit || 0;
  const sonnetUsed = usage?.sonnetUsage?.used || 0;
  const sonnetLimit = usage?.sonnetUsage?.limit || 0;
  const gpt5Used = usage?.gpt5Usage?.used || 0;
  const gpt5Limit = usage?.gpt5Usage?.limit || 0;
  const opusUsed = usage?.opusUsage?.used || 0;
  const opusLimit = usage?.opusUsage?.limit || 0;

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-50/50 to-white dark:from-zinc-950 dark:to-black" style={{ height: '100dvh' }}>
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="shrink-0 border-b border-border/40 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <motion.div 
                className="flex items-center gap-2.5 min-w-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold">Twealth AI</h1>
                  <p className="text-[10px] text-muted-foreground font-medium hidden sm:block">Your Personal CFO</p>
                </div>
              </motion.div>
              
              <Select value={analysisMode} onValueChange={(v: 'quick' | 'deep') => setAnalysisMode(v)}>
                <SelectTrigger className="w-[120px] sm:w-[150px] h-9 text-xs sm:text-sm bg-muted/30 border-border/50" data-testid="select-analysis-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Quick Chat</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deep">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">Deep Analysis</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {usage && (
              <motion.div 
                className="flex items-center gap-3 shrink-0"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Badge 
                  className={`
                    text-xs font-semibold px-3 py-1 rounded-full shadow-sm
                    ${tier === 'Enterprise' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0' : ''}
                    ${tier === 'Pro' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-0' : ''}
                    ${tier === 'Free' ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-border/50' : ''}
                  `}
                  data-testid="badge-tier"
                >
                  {tier === 'Enterprise' && <Gem className="w-3 h-3 mr-1.5" />}
                  {tier === 'Pro' && <Crown className="w-3 h-3 mr-1.5" />}
                  {tier === 'Free' && <Shield className="w-3 h-3 mr-1.5" />}
                  {tier}
                </Badge>
              </motion.div>
            )}
          </div>
        </header>

        <div className="shrink-0 border-b border-border/40 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <motion.div 
              className={`relative rounded-2xl transition-all duration-300 ${
                inputFocused 
                  ? 'ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10' 
                  : 'shadow-md hover:shadow-lg'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ask anything about your finances..."
                className="min-h-[56px] max-h-[140px] resize-none pr-16 text-base w-full rounded-2xl border-border/50 bg-white dark:bg-zinc-900 py-4 px-5 placeholder:text-muted-foreground/60"
                rows={1}
                data-testid="input-message"
              />
              <motion.div
                className="absolute right-3 bottom-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || sendMessageMutation.isPending || rateLimitRetryAfter > 0}
                  size="icon"
                  className={`h-10 w-10 rounded-xl transition-all duration-300 ${
                    currentMessage.trim() 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30' 
                      : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                  data-testid="button-send-message"
                  title={rateLimitRetryAfter > 0 ? `Wait ${rateLimitRetryAfter}s` : undefined}
                >
                  {rateLimitRetryAfter > 0 ? (
                    <span className="text-xs font-bold">{rateLimitRetryAfter}</span>
                  ) : sendMessageMutation.isPending ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <Send className={`w-4 h-4 ${currentMessage.trim() ? 'text-white' : 'text-gray-400'}`} />
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto py-6 sm:py-8 space-y-6">
            
            {usage && !hasMessages && (
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                data-testid="quota-display"
              >
                <QuotaCard
                  name="Scout"
                  badge="Fast"
                  used={scoutUsed}
                  limit={scoutLimit}
                  color="blue"
                />
                <QuotaCard
                  name="Sonnet"
                  badge="Smart"
                  used={sonnetUsed}
                  limit={sonnetLimit}
                  color="blue"
                  locked={sonnetLimit === 0}
                  lockText="Pro tier"
                />
                <QuotaCard
                  name="GPT-5"
                  badge="Math"
                  used={gpt5Used}
                  limit={gpt5Limit}
                  color="emerald"
                  locked={gpt5Limit === 0}
                  lockText="Pro tier"
                />
                <QuotaCard
                  name="Opus"
                  badge="CFO"
                  used={opusUsed}
                  limit={opusLimit}
                  color="amber"
                  locked={opusLimit === 0}
                  lockText="Enterprise"
                />
              </motion.div>
            )}

            {!hasMessages ? (
              <motion.div 
                className="flex flex-col items-center justify-center min-h-[45vh] text-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.div 
                  className="relative mb-8"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-3xl blur-2xl" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                
                <motion.h2 
                  className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Your Personal CFO
                </motion.h2>
                <motion.p 
                  className="text-muted-foreground text-base sm:text-lg mb-2 max-w-md font-medium"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Expert financial advice powered by AI
                </motion.p>
                <motion.p 
                  className="text-sm text-muted-foreground/70 mb-10 max-w-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Ask me anything about budgeting, investing, debt payoff, retirement, or financial planning
                </motion.p>

                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {starterPrompts.map((prompt, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentMessage(prompt.prompt)}
                      className={`group relative flex items-start gap-3 p-4 text-left rounded-xl border border-border/50 bg-gradient-to-br ${prompt.gradient} hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300`}
                      data-testid={`starter-prompt-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center shrink-0 group-hover:shadow-md transition-shadow">
                        <span className="text-blue-600 dark:text-blue-400">
                          {prompt.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{prompt.title}</p>
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">{prompt.prompt}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </motion.button>
                  ))}
                </motion.div>

                <motion.div
                  className="mt-8 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-blue-600"
                    onClick={() => setLocation('/subscription')}
                    data-testid="button-view-plans"
                  >
                    View Plans
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <AnimatePresence mode="popLayout">
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
                      onFollowUp={(prompt) => {
                        setCurrentMessage(prompt);
                        setTimeout(() => sendMessageMutation.mutate(prompt), 100);
                      }}
                    />
                  ))}
                </AnimatePresence>
                
                {sendMessageMutation.isPending && <TypingIndicator />}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
