import { useState, useEffect, useRef, type ReactNode } from "react";
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
  ChevronRight,
  Mic,
  MicOff,
  Bookmark,
  BookmarkCheck,
  Search,
  Download,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiRequest, queryClient, RateLimitError } from "@/lib/queryClient";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { MessageBubble, TypingIndicator } from "@/components/chat/message-bubble";
import { ProactiveInsightsPanel } from "@/components/chat/proactive-insights-panel";
import { WeeklySummaryCard } from "@/components/weekly-summary-card";
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
  icon: ReactNode;
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
  const clampedValue = Math.max(0, Math.min(value, max));
  const percentage = max > 0 ? Math.min((clampedValue / max) * 100, 100) : 0;
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
  const remaining = Math.max(0, limit - used);

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
        className="flex flex-col sm:flex-row items-center sm:justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-dashed border-border/40 bg-muted/5 gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted/30 flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/50" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{name}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/60">{lockText}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <CircularProgress
            value={isUnlimited ? 100 : remaining}
            max={isUnlimited ? 100 : limit}
            color={color}
            size={36}
            strokeWidth={3}
          />
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm font-semibold">{name}</p>
            <Badge className={`${colors.badge} text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0 font-medium`}>{badge}</Badge>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <p className={`text-lg sm:text-xl font-bold ${colors.text}`}>
            {isUnlimited ? (
              <span className="text-xl sm:text-2xl">∞</span>
            ) : (
              <AnimatedNumber value={remaining} />
            )}
          </p>
          <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [useStreaming, setUseStreaming] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    if (!usage) return 'free';
    if (usage.opusUsage && usage.opusUsage.limit > 0) return 'enterprise';
    if (usage.sonnetUsage && usage.sonnetUsage.limit > 0) return 'pro';
    return 'free';
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
      if (tier === 'enterprise') {
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

    if (tier === 'pro') {
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
        const needsUpgrade = tier === 'free' || (tier === 'pro' && error.exceededModel === 'sonnet');

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
    if (!currentMessage.trim() || sendMessageMutation.isPending || isStreaming || rateLimitRetryAfter > 0) return;

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

    if (useStreaming && analysisMode === 'quick') {
      sendStreamingMessage(currentMessage);
    } else {
      sendMessageMutation.mutate(currentMessage);
    }
  };

  const sendStreamingMessage = async (content: string) => {
    let conversationId = currentConversationId;

    try {
      setIsStreaming(true);
      setStreamingContent("");
      setCurrentMessage("");

      if (!conversationId) {
        const response = await apiRequest("POST", "/api/chat/conversations", {
          title: content.slice(0, 50) + (content.length > 50 ? '...' : '')
        });
        const conversation = await response.json();
        conversationId = conversation.id;
        setCurrentConversationId(conversationId);
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(`/api/chat/conversations/${conversationId}/messages/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include',
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Streaming failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            continue;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setStreamingContent(prev => prev + data.content);
              }
            } catch {
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Error",
          description: error.message || "Streaming failed",
          variant: "destructive"
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      abortControllerRef.current = null;
    }
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

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser",
        variant: "destructive"
      });
      return;
    }

    // Stop if already listening
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    // Create new recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCurrentMessage(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Export conversation as text/markdown
  const handleExportConversation = () => {
    const exportMessages = currentConversation?.messages || [];
    if (!currentConversation || exportMessages.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Start a conversation first",
        variant: "destructive"
      });
      return;
    }

    const title = currentConversation.title || 'AI Conversation';
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let content = `# ${title}\n`;
    content += `**Exported:** ${date}\n\n---\n\n`;

    exportMessages.forEach((msg) => {
      const time = new Date(msg.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      if (msg.role === 'user') {
        content += `### You (${time})\n${msg.content}\n\n`;
      } else {
        content += `### Twealth AI (${time})\n${msg.content}\n\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Conversation downloaded as markdown file"
    });
  };

  // Quick action chips
  const quickActions = [
    { label: "Budget", prompt: "Show me my spending by category this month" },
    { label: "Goals", prompt: "How are my financial goals progressing?" },
    { label: "Spending", prompt: "Any unusual spending patterns I should know about?" },
    { label: "Save", prompt: "How can I save more money this month?" },
  ];

  // Saved prompts functionality
  const [savedPrompts, setSavedPrompts] = useState<string[]>(() => {
    const saved = localStorage.getItem('twealth_saved_prompts');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSavedPrompts, setShowSavedPrompts] = useState(false);

  const toggleSavePrompt = (prompt: string) => {
    const newSaved = savedPrompts.includes(prompt)
      ? savedPrompts.filter(p => p !== prompt)
      : [...savedPrompts, prompt].slice(-10); // Keep max 10
    setSavedPrompts(newSaved);
    localStorage.setItem('twealth_saved_prompts', JSON.stringify(newSaved));
    toast({
      title: savedPrompts.includes(prompt) ? "Removed" : "Saved",
      description: savedPrompts.includes(prompt) ? "Prompt removed from favorites" : "Prompt saved to favorites"
    });
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

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

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

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
    <div className="flex h-screen-mobile md:h-screen bg-gradient-to-b from-gray-50/50 to-white dark:from-zinc-950 dark:to-black" style={{ height: 'var(--app-height, 100dvh)' }}>
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="shrink-0 border-b border-border/30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <motion.div
                className="flex items-center gap-3 min-w-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Animated gradient orb background */}
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-500/30 rounded-2xl blur-xl"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.7, 0.5]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Twealth AI</h1>
                  <p className="text-[10px] text-muted-foreground/70 font-medium hidden sm:block tracking-wide">Your Personal CFO</p>
                </div>
              </motion.div>

              {/* Sleeker mode toggle */}
              <div className="flex items-center bg-muted/40 rounded-xl p-1 border border-border/30">
                <button
                  onClick={() => setAnalysisMode('quick')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${analysisMode === 'quick'
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  data-testid="mode-quick"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Quick</span>
                </button>
                <button
                  onClick={() => setAnalysisMode('deep')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${analysisMode === 'deep'
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  data-testid="mode-deep"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Deep</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasMessages && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSearch(!showSearch)}
                    className="h-9 w-9"
                    data-testid="button-search-messages"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExportConversation}
                    className="h-9 w-9"
                    data-testid="button-export-conversation"
                    title="Export conversation"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSavedPrompts(!showSavedPrompts)}
                className="h-9 w-9"
                data-testid="button-saved-prompts"
              >
                <Bookmark className="w-4 h-4" />
              </Button>

              {usage && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Badge
                    className={`
                      text-xs font-semibold px-3 py-1 rounded-full shadow-sm
                      ${tier === 'enterprise' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0' : ''}
                      ${tier === 'pro' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-0' : ''}
                      ${tier === 'free' ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-border/50' : ''}
                    `}
                    data-testid="badge-tier"
                  >
                    {tier === 'enterprise' && <Gem className="w-3 h-3 mr-1.5" />}
                    {tier === 'pro' && <Crown className="w-3 h-3 mr-1.5" />}
                    {tier === 'free' && <Shield className="w-3 h-3 mr-1.5" />}
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </Badge>
                </motion.div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border/40 overflow-hidden"
              >
                <div className="px-4 sm:px-6 py-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                    data-testid="input-search-messages"
                    autoFocus
                  />
                  {searchQuery && (
                    <span className="text-xs text-muted-foreground">
                      {filteredMessages.length} found
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                    className="h-7 w-7"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Saved prompts dropdown */}
          <AnimatePresence>
            {showSavedPrompts && savedPrompts.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border/40 overflow-hidden"
              >
                <div className="px-4 sm:px-6 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Saved Prompts</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSavedPrompts(false)}
                      className="h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {savedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentMessage(prompt);
                          setShowSavedPrompts(false);
                        }}
                        className="group flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors"
                        data-testid={`saved-prompt-${idx}`}
                      >
                        <BookmarkCheck className="w-3 h-3" />
                        <span className="max-w-[150px] truncate">{prompt}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSavePrompt(prompt); }}
                          className="opacity-0 group-hover:opacity-100 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto py-6 sm:py-8 space-y-6">

            {/* Premium AI Model Cards */}
            {usage && !hasMessages && (
              <motion.div
                className="flex justify-center gap-4 sm:gap-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                data-testid="quota-display"
              >
                {/* Gemini Card - Free */}
                <motion.div
                  className="relative group"
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                  <div className="relative px-6 py-4 bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Gemini</p>
                        <p className="text-xs text-blue-400">Unlimited</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded-full">FREE</span>
                      <span className="text-xs text-white/60">⚡ Instant responses</span>
                    </div>
                  </div>
                </motion.div>

                {/* Claude Card - Pro */}
                <motion.div
                  className="relative group cursor-pointer"
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => sonnetLimit === 0 && setLocation('/subscription')}
                >
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur ${sonnetLimit === 0 ? 'opacity-20' : 'opacity-30 group-hover:opacity-60'} transition duration-500`} />
                  <div className={`relative px-6 py-4 bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-white/10 ${sonnetLimit === 0 ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sonnetLimit === 0 ? 'bg-zinc-700' : 'bg-gradient-to-br from-emerald-500 to-teal-500'}`}>
                        {sonnetLimit === 0 ? <Crown className="w-5 h-5 text-zinc-400" /> : <Brain className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Claude</p>
                        <p className={`text-xs ${sonnetLimit === 0 ? 'text-zinc-500' : 'text-emerald-400'}`}>
                          {sonnetLimit === 0 ? 'Locked' : `${sonnetLimit - sonnetUsed} remaining`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${sonnetLimit === 0 ? 'bg-zinc-700/50 text-zinc-500' : 'bg-emerald-500/20 text-emerald-400'}`}>PRO</span>
                      <span className="text-xs text-white/60">{sonnetLimit === 0 ? '🔒 Upgrade to unlock' : '🔬 Deep analysis'}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {!hasMessages ? (
              <motion.div
                className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Large animated gradient orb */}
                <motion.div
                  className="relative mb-10"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <motion.div
                    className="absolute -inset-8 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/20 rounded-full blur-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                      opacity: [0.4, 0.6, 0.4]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div
                    className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/15 via-blue-500/20 to-indigo-500/15 rounded-full blur-2xl"
                    animate={{
                      scale: [1.1, 1, 1.1],
                      rotate: [360, 180, 0],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                    <motion.div
                      animate={{
                        rotateY: [0, 360],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Brain className="w-12 h-12 text-white" />
                    </motion.div>
                  </div>
                </motion.div>

                <motion.h2
                  className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Your Personal CFO
                </motion.h2>
                <motion.p
                  className="text-muted-foreground text-lg sm:text-xl mb-3 max-w-md font-medium"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Expert financial advice powered by AI
                </motion.p>
                <motion.p
                  className="text-sm text-muted-foreground/60 mb-12 max-w-lg leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Ask me anything about budgeting, investing, debt payoff, retirement, or financial planning
                </motion.p>

                <motion.div
                  className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full max-w-4xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {starterPrompts.map((prompt, index) => {
                    // Color mapping for each card type
                    const colorMap: Record<string, { icon: string; hover: string; border: string }> = {
                      'Buy a Car': { icon: 'from-blue-500 to-blue-600', hover: 'group-hover:text-blue-500', border: 'hover:border-blue-500/50' },
                      'Emergency Fund': { icon: 'from-emerald-500 to-emerald-600', hover: 'group-hover:text-emerald-500', border: 'hover:border-emerald-500/50' },
                      'Investment Strategy': { icon: 'from-violet-500 to-violet-600', hover: 'group-hover:text-violet-500', border: 'hover:border-violet-500/50' },
                      'Retirement Planning': { icon: 'from-amber-500 to-amber-600', hover: 'group-hover:text-amber-500', border: 'hover:border-amber-500/50' },
                      'Reduce Debt': { icon: 'from-rose-500 to-rose-600', hover: 'group-hover:text-rose-500', border: 'hover:border-rose-500/50' },
                      'Full Financial Checkup': { icon: 'from-cyan-500 to-cyan-600', hover: 'group-hover:text-cyan-500', border: 'hover:border-cyan-500/50' },
                    };
                    const colors = colorMap[prompt.title] || colorMap['Buy a Car'];

                    return (
                      <motion.button
                        key={index}
                        onClick={() => setCurrentMessage(prompt.prompt)}
                        className={`group relative flex flex-col items-start gap-3 p-5 sm:p-6 text-left rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl ${colors.border} hover:bg-zinc-800/80 hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 touch-target overflow-hidden`}
                        data-testid={`starter-prompt-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        whileHover={{ y: -6 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Gradient glow on hover */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${prompt.gradient} rounded-2xl`} />

                        <div className="relative flex items-start gap-4 w-full">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.icon} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                            <span className="text-white [&>svg]:w-5 [&>svg]:h-5">
                              {prompt.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm sm:text-base mb-1.5 text-white ${colors.hover} transition-colors`}>{prompt.title}</p>
                            <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed group-hover:text-zinc-300 transition-colors">{prompt.prompt}</p>
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        <motion.div
                          className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300"
                          initial={{ x: -5 }}
                          whileHover={{ x: 0 }}
                        >
                          <ChevronRight className={`w-5 h-5 ${colors.hover.replace('group-hover:', '')}`} />
                        </motion.div>
                      </motion.button>
                    );
                  })}
                </motion.div>

                <motion.div
                  className="w-full max-w-4xl mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <ProactiveInsightsPanel
                    maxItems={3}
                    onAskAbout={(prompt) => {
                      setCurrentMessage(prompt);
                      setTimeout(() => sendMessageMutation.mutate(prompt), 100);
                    }}
                  />
                  <WeeklySummaryCard />
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
              <div className="space-y-4 sm:space-y-6 pb-4">
                <AnimatePresence mode="popLayout">
                  {(searchQuery ? filteredMessages : messages).map((message, index) => (
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

                {sendMessageMutation.isPending && <TypingIndicator isDeepAnalysis={analysisMode === 'deep'} />}

                {isStreaming && streamingContent && (
                  <MessageBubble
                    role="assistant"
                    content={streamingContent}
                    isStreaming={true}
                  />
                )}

                {isStreaming && !streamingContent && <TypingIndicator isDeepAnalysis={false} />}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Fixed bottom input area - positioned above mobile nav on small screens */}
        <div
          className="shrink-0 border-t border-border/40 bg-white/95 dark:bg-black/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Quick action chips - compact on mobile, full on desktop */}
          <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-2 sm:pt-3">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1.5 sm:pb-2 -mx-1 px-1">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => {
                    setCurrentMessage(action.prompt);
                    sendMessageMutation.mutate(action.prompt);
                  }}
                  className="shrink-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-100 dark:border-blue-900/50 min-h-[32px] sm:min-h-[36px] touch-target"
                  data-testid={`quick-action-${action.label.toLowerCase()}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {action.label}
                </motion.button>
              ))}
              {currentMessage.trim() && (
                <motion.button
                  onClick={() => toggleSavePrompt(currentMessage)}
                  className={`shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded-full transition-colors min-h-[32px] sm:min-h-[36px] touch-target border ${savedPrompts.includes(currentMessage)
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                    }`}
                  data-testid="button-save-current-prompt"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {savedPrompts.includes(currentMessage) ? (
                    <>
                      <BookmarkCheck className="w-3 h-3" />
                      <span className="hidden sm:inline">Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3 h-3" />
                      <span className="hidden sm:inline">Save</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>

          {/* Input box - Enhanced */}
          <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-2 sm:pb-4">
            <motion.div
              className={`relative rounded-2xl transition-all duration-300 ${inputFocused
                ? 'ring-2 ring-blue-500/40 shadow-xl shadow-blue-500/15'
                : 'shadow-lg hover:shadow-xl'
                }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Model indicator badge */}
              <div className="absolute -top-3 left-4 z-10">
                <motion.div
                  className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full shadow-sm ${analysisMode === 'deep'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                    }`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={analysisMode}
                >
                  {analysisMode === 'deep' ? '🔬 Deep Analysis' : '⚡ Quick Chat'}
                </motion.div>
              </div>

              <Textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ask anything about your finances..."
                className="min-h-[56px] sm:min-h-[64px] max-h-[120px] sm:max-h-[160px] resize-none pr-24 sm:pr-32 text-sm sm:text-base w-full rounded-2xl border-border/30 bg-white dark:bg-zinc-900 py-4 sm:py-5 px-4 sm:px-5 placeholder:text-muted-foreground/50 focus:outline-none"
                rows={1}
                data-testid="input-message"
              />

              {/* Voice and Send buttons */}
              <div className="absolute right-3 sm:right-4 bottom-3 sm:bottom-4 flex items-center gap-1.5">
                {speechSupported && (
                  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                    <Button
                      onClick={handleVoiceInput}
                      type="button"
                      size="icon"
                      variant="ghost"
                      className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl transition-all ${isListening
                        ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 animate-pulse'
                        : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                      data-testid="button-voice-input"
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </motion.div>
                )}

                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || sendMessageMutation.isPending || isStreaming || rateLimitRetryAfter > 0}
                    size="icon"
                    className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-300 touch-target ${currentMessage.trim()
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/40'
                      : 'bg-gray-200 dark:bg-zinc-800'
                      }`}
                    data-testid="button-send-message"
                    title={rateLimitRetryAfter > 0 ? `Wait ${rateLimitRetryAfter}s` : undefined}
                  >
                    {rateLimitRetryAfter > 0 ? (
                      <span className="text-xs font-bold">{rateLimitRetryAfter}</span>
                    ) : sendMessageMutation.isPending || isStreaming ? (
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <Send className={`w-4 h-4 sm:w-5 sm:h-5 ${currentMessage.trim() ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
