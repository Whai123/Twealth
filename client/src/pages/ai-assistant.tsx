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
  Plus,
  Clock,
  Trash2,
  ChevronLeft,
  History,
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
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: usage } = useQuery<UsageInfo>({
    queryKey: ["/api/subscription/usage"],
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch all conversations for history
  const { data: conversations } = useQuery<ChatConversation[]>({
    queryKey: ["/api/chat/conversations"],
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

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/chat/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      if (currentConversationId) {
        setCurrentConversationId(null);
      }
      toast({ title: "Conversation deleted" });
    }
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", currentConversationId] });
      setCurrentMessage("");
    },
    onError: (error: any) => {
      if (error instanceof RateLimitError) {
        toast({ title: "Rate Limit", description: `Please wait ${error.retryAfter} seconds.`, variant: "destructive" });
      } else if (error.isQuotaError) {
        toast({
          title: "Upgrade to Pro", description: "Unlock deep analysis with Claude.", variant: "destructive",
          action: <ToastAction altText="Upgrade" onClick={() => setLocation('/subscription')}>Upgrade</ToastAction>
        });
      } else {
        toast({ title: "Error", description: error.message || "Failed to send message", variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
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

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setShowHistory(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const messages = currentConversation?.messages || [];
  const hasMessages = messages.length > 0;
  const sortedConversations = [...(conversations || [])].sort((a, b) =>
    new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Hero Header */}
      <header className="border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* History Button */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2.5 rounded-xl transition-colors ${showHistory
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              >
                <History className="w-5 h-5" />
              </button>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">Twealth AI</p>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Your Personal CFO</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* New Chat Button */}
              <Button
                onClick={startNewConversation}
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-zinc-200 dark:border-zinc-700"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Chat
              </Button>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full">
                <button
                  onClick={() => setAnalysisMode('quick')}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-all ${analysisMode === 'quick'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Quick
                </button>
                <button
                  onClick={() => setAnalysisMode('deep')}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-all flex items-center gap-1.5 ${analysisMode === 'deep'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Deep
                  {tier === 'free' && <Crown className="w-3 h-3 text-amber-500" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* History Sidebar */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex-shrink-0"
              >
                <div className="w-[280px] bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 h-[600px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Chat History</h3>
                    <span className="text-xs text-zinc-500">{sortedConversations.length} chats</span>
                  </div>

                  {sortedConversations.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No conversations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sortedConversations.map((conv) => (
                        <motion.button
                          key={conv.id}
                          onClick={() => selectConversation(conv.id)}
                          className={`w-full p-3 text-left rounded-xl transition-colors group ${currentConversationId === conv.id
                              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                              : 'bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${currentConversationId === conv.id
                                  ? 'text-white dark:text-zinc-900'
                                  : 'text-zinc-900 dark:text-white'
                                }`}>
                                {conv.title}
                              </p>
                              <p className={`text-xs mt-0.5 ${currentConversationId === conv.id
                                  ? 'text-zinc-300 dark:text-zinc-600'
                                  : 'text-zinc-500'
                                }`}>
                                {formatDate(conv.lastMessageAt || conv.createdAt)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversationMutation.mutate(conv.id);
                              }}
                              className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${currentConversationId === conv.id
                                  ? 'hover:bg-white/20 text-white dark:text-zinc-900'
                                  : 'hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-400'
                                }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Area */}
          <div className="flex-1">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden h-[600px] flex flex-col">

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-6">
                {!hasMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center mb-6">
                      <MessageSquare className="w-8 h-8 text-white dark:text-zinc-900" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                      {currentConversationId ? 'Continue chatting' : 'Start a conversation'}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                      Ask me anything about budgeting, investing, or financial planning.
                    </p>
                    {/* Quick Prompts */}
                    <div className="flex flex-wrap gap-2 justify-center max-w-md">
                      {suggestedPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentMessage(prompt.prompt)}
                          className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                        >
                          {prompt.title}
                        </button>
                      ))}
                    </div>
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
                  : ''}`}>
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
                      : 'bg-zinc-200 dark:bg-zinc-700'}`}
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
        </div>
      </main>
    </div>
  );
}
