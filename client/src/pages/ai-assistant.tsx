import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  ArrowRight,
  Sparkles,
  TrendingUp,
  PiggyBank,
  Target,
  Crown,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiRequest, queryClient, RateLimitError } from "@/lib/queryClient";
import { MessageBubble, TypingIndicator } from "@/components/chat/message-bubble";

interface UsageInfo {
  scoutUsage: { used: number; limit: number; remaining: number; allowed: boolean; };
  sonnetUsage: { used: number; limit: number; remaining: number; allowed: boolean; };
  chatUsage: { used: number; limit: number; remaining: number; allowed: boolean; };
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

// Suggested prompts data
const suggestedPrompts = [
  { icon: Target, title: "Savings Plan", prompt: "Help me create a monthly savings plan" },
  { icon: PiggyBank, title: "Emergency Fund", prompt: "How much should I save for emergencies?" },
  { icon: TrendingUp, title: "Investments", prompt: "What's a good investment strategy for me?" },
  { icon: Sparkles, title: "Financial Health", prompt: "Analyze my overall financial health" },
];

export default function AIAssistantPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'deep'>('quick');
  const [inputFocused, setInputFocused] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: usage } = useQuery<UsageInfo>({
    queryKey: ["/api/subscription/usage"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: currentConversation } = useQuery<ChatConversation>({
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [currentMessage]);

  const tier = usage?.sonnetUsage?.limit && usage.sonnetUsage.limit > 0 ? 'pro' : 'free';

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
        throw { isQuotaError: true, message: errorData.message };
      }

      return await messageResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", currentConversationId] });
      setCurrentMessage("");
    },
    onError: (error: any) => {
      if (error instanceof RateLimitError) {
        toast({
          title: "Rate Limit",
          description: `Please wait ${error.retryAfter} seconds.`,
          variant: "destructive",
        });
      } else if (error.isQuotaError) {
        toast({
          title: "Upgrade to Pro",
          description: "Unlock deep analysis with Claude.",
          variant: "destructive",
          action: (
            <ToastAction altText="Upgrade" onClick={() => setLocation('/subscription')}>
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
    if (!currentMessage.trim() || sendMessageMutation.isPending || isStreaming) return;

    if (analysisMode === 'quick') {
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

      if (!response.ok) throw new Error('Streaming failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setStreamingContent(prev => prev + data.content);
              }
            } catch { }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", conversationId] });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({ title: "Error", description: "Streaming failed", variant: "destructive" });
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const messages = currentConversation?.messages || [];
  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Hero Header */}
      <header className="border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Twealth AI</p>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Your Personal CFO</h1>
            </div>

            {/* Pill Toggle */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full">
              <button
                onClick={() => setAnalysisMode('quick')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${analysisMode === 'quick'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
              >
                Quick
              </button>
              <button
                onClick={() => setAnalysisMode('deep')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-1.5 ${analysisMode === 'deep'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
              >
                Deep
                {tier === 'free' && <Crown className="w-3 h-3 text-amber-500" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Chat Card - Left Side (2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden h-[600px] flex flex-col">

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-6">
                {!hasMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center mb-6">
                      <MessageSquare className="w-8 h-8 text-white dark:text-zinc-900" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
                      Ask me anything about budgeting, investing, or financial planning.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {messages.map((message, index) => (
                        <MessageBubble
                          key={message.id}
                          role={message.role}
                          content={message.content}
                          timestamp={message.createdAt}
                          isLatest={index === messages.length - 1 && message.role === 'assistant'}
                        />
                      ))}
                    </AnimatePresence>

                    {sendMessageMutation.isPending && <TypingIndicator isDeepAnalysis={analysisMode === 'deep'} />}

                    {isStreaming && streamingContent && (
                      <MessageBubble role="assistant" content={streamingContent} isStreaming={true} />
                    )}

                    {isStreaming && !streamingContent && <TypingIndicator isDeepAnalysis={false} />}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 p-4">
                <div className={`relative rounded-2xl transition-all ${inputFocused
                    ? 'ring-2 ring-zinc-900 dark:ring-white ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-900'
                    : ''
                  }`}>
                  <Textarea
                    ref={textareaRef}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Ask anything..."
                    className="min-h-[52px] max-h-[150px] resize-none pr-14 text-base w-full rounded-2xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-3.5 px-4 placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus:border-zinc-200 dark:focus:border-zinc-700"
                    rows={1}
                  />
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || sendMessageMutation.isPending || isStreaming}
                    className={`absolute right-2 bottom-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentMessage.trim()
                        ? 'bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100'
                        : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {sendMessageMutation.isPending || isStreaming ? (
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <Send className={`w-4 h-4 ${currentMessage.trim() ? 'text-white dark:text-zinc-900' : 'text-zinc-400'}`} />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Prompts & Summary */}
          <div className="space-y-6">

            {/* Suggested Prompts */}
            <div>
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Suggested</h3>
              <div className="space-y-3">
                {suggestedPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentMessage(prompt.prompt)}
                    className="w-full p-4 text-left bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-sm transition-all group"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors">
                        <prompt.icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors" />
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-white">{prompt.title}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Weekly Summary Card */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 rounded-3xl p-6 text-white dark:text-zinc-900">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium opacity-80">Weekly Insight</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Financial Summary</h3>
              <p className="text-sm opacity-70 mb-6">
                Get a comprehensive analysis of your spending, savings, and goals from the past 7 days.
              </p>
              <Button
                onClick={() => setCurrentMessage("Give me a detailed weekly financial summary")}
                className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl h-11 font-medium"
              >
                View Summary
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Upgrade Card (for free users) */}
            {tier === 'free' && (
              <motion.button
                onClick={() => setLocation('/subscription')}
                className="w-full p-5 text-left bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all group"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white mb-1">Upgrade to Pro</p>
                    <p className="text-sm text-zinc-500">Unlock deep analysis with Claude</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                  </div>
                </div>
              </motion.button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
