import { useState, useEffect, useRef } from"react";
import { useQuery, useMutation } from"@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Button } from"@/components/ui/button";
import { Textarea } from"@/components/ui/textarea";
import { ScrollArea } from"@/components/ui/scroll-area";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from"@/components/ui/select";
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
 Gem
} from"lucide-react";
import { useToast } from"@/hooks/use-toast";
import { ToastAction } from"@/components/ui/toast";
import { apiRequest, queryClient, RateLimitError } from"@/lib/queryClient";
import { ConversationSidebar } from"@/components/chat/conversation-sidebar";
import { MessageBubble, TypingIndicator } from"@/components/chat/message-bubble";
import { Badge } from"@/components/ui/badge";
import { Progress } from"@/components/ui/progress";
import { Card } from"@/components/ui/card";

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

 // Mobile keyboard fix: Scroll input into view when focused
 useEffect(() => {
 const textarea = textareaRef.current;
 if (!textarea) return;

 const handleFocus = () => {
 // Delay to account for keyboard animation
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

 // Helper function to determine current tier
 const getCurrentTier = () => {
 if (!usage) return 'Free';
 if (usage.opusUsage && usage.opusUsage.limit > 0) return 'Enterprise';
 if (usage.sonnetUsage && usage.sonnetUsage.limit > 0) return 'Pro';
 return 'Free';
 };

 // Helper function to get upgrade benefits based on exceeded model
 const getUpgradeMessage = (exceededModel?: string) => {
 const tier = getCurrentTier();
 
 if (exceededModel === 'opus' || tier === 'Enterprise') {
 return {
 title: "Opus Quota Exceeded",
 description: "You've used all your Enterprise Opus queries. Your queries will use Sonnet until quota resets.",
 benefits: "Opus provides the most advanced analysis for complex financial decisions."
 };
 }
 
 if (exceededModel === 'sonnet' || tier === 'Pro') {
 return {
 title: "Upgrade to Enterprise",
 description: "Unlock Opus for the most sophisticated financial analysis and unlimited queries.",
 benefits: "Enterprise includes: Unlimited Opus queries, Priority support, Advanced portfolio optimization"
 };
 }
 
 return {
 title: "Upgrade to Pro",
 description: "Get access to Sonnet for deeper financial analysis with 50 queries/month.",
 benefits: "Pro includes: Sonnet AI (50/mo), Advanced insights, Goal optimization, Priority responses"
 };
 };

 // Send message mutation
 const sendMessageMutation = useMutation({
 mutationFn: async (content: string) => {
 let conversationId = currentConversationId;
 
 if (!conversationId) {
 const response = await apiRequest("POST","/api/chat/conversations", { 
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
 title:"Rate Limit Exceeded",
 description: `Too many requests. Please wait ${error.retryAfter} seconds before trying again.`,
 variant:"destructive",
 duration: error.retryAfter * 1000,
 });
 } else if (error.isQuotaError) {
 const upgradeMsg = getUpgradeMessage(error.exceededModel);
 const tier = getCurrentTier();
 const needsUpgrade = tier === 'Free' || (tier === 'Pro' && error.exceededModel === 'sonnet');
 
 toast({
 title: upgradeMsg.title,
 description: upgradeMsg.description,
 variant:"destructive",
 duration: 10000,
 action: needsUpgrade ? (
 <ToastAction 
 altText="Upgrade"
 onClick={() => window.location.href = '/subscription'}
 >
 <Crown className="w-4 h-4 mr-2" />
 Upgrade
 </ToastAction>
 ) : undefined
 });
 } else {
 toast({
 title:"Error",
 description: error.message ||"Failed to send message",
 variant:"destructive"
 });
 }
 }
 });

 const handleSendMessage = () => {
 if (!currentMessage.trim() || sendMessageMutation.isPending || rateLimitRetryAfter > 0) return;
 
 const isLimitExceeded = usage && usage.chatUsage.used >= usage.chatUsage.limit;
 
 if (isLimitExceeded) {
 toast({
 title:"Upgrade Required",
 description:"You've reached your AI chat limit. Upgrade to continue.",
 variant:"destructive",
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
 title:"Buy a Car",
 prompt:"I want to buy a $35,000 car in 2 years. Can you help me create a savings plan?"
 },
 {
 icon: <PiggyBank className="w-5 h-5" />,
 title:"Emergency Fund",
 prompt:"How much should I have in my emergency fund? What's realistic for my situation?"
 },
 {
 icon: <TrendingUp className="w-5 h-5" />,
 title:"Investment Strategy",
 prompt:"I have $10,000 to invest. What's the best allocation for someone my age?"
 },
 {
 icon: <BarChart3 className="w-5 h-5" />,
 title:"Retirement Planning",
 prompt:"Help me calculate how much I need to save monthly to retire comfortably at 65"
 },
 {
 icon: <DollarSign className="w-5 h-5" />,
 title:"Reduce Debt",
 prompt:"I have $20,000 in credit card debt. What's the fastest way to pay it off?"
 },
 {
 icon: <Sparkles className="w-5 h-5" />,
 title:"Full Financial Checkup",
 prompt:"Give me a comprehensive analysis of my financial health with specific recommendations"
 }
 ];

 const messages = currentConversation?.messages || [];
 const hasMessages = messages.length > 0;

 const tier = getCurrentTier();
 const totalUsed = usage ? (usage.scoutUsage?.used || 0) + (usage.sonnetUsage?.used || 0) + (usage.opusUsage?.used || 0) : 0;
 const totalLimit = usage ? (usage.scoutUsage?.limit || 0) + (usage.sonnetUsage?.limit || 0) + (usage.opusUsage?.limit || 0) : 0;
 const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

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
 <header className="shrink-0 border-b border-border/40 bg-white dark:bg-black">
 <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
 <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
 <div className="flex items-center gap-2 min-w-0">
 <Brain className="w-5 h-5 text-black dark:text-white shrink-0" />
 <h1 className="text-base sm:text-xl font-semibold truncate">Twealth AI</h1>
 </div>
 
 {/* Mode Selector */}
 <Select value={analysisMode} onValueChange={(v: 'quick' | 'deep') => setAnalysisMode(v)}>
 <SelectTrigger className="w-[130px] sm:w-[160px] h-9 text-xs sm:text-sm" data-testid="select-analysis-mode">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="quick">
 <div className="flex items-center gap-2">
 <Zap className="w-4 h-4" />
 <span className="text-sm">Quick Chat</span>
 </div>
 </SelectItem>
 <SelectItem value="deep">
 <div className="flex items-center gap-2">
 <BarChart3 className="w-4 h-4" />
 <span className="text-sm">Deep Analysis</span>
 </div>
 </SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Tier Badge & Quota Indicator */}
 {usage && (
 <div className="flex items-center gap-3 shrink-0">
 <Badge 
 variant={tier === 'Enterprise' ? 'default' : tier === 'Pro' ? 'secondary' : 'outline'}
 className={`
 text-xs font-medium px-2.5 py-0.5
 ${tier === 'Enterprise' ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0' : ''}
 ${tier === 'Pro' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0' : ''}
 ${tier === 'Free' ? 'border-border/50' : ''}
 `}
 data-testid="badge-tier"
 >
 {tier === 'Enterprise' && <Gem className="w-3 h-3 mr-1" />}
 {tier === 'Pro' && <Crown className="w-3 h-3 mr-1" />}
 {tier === 'Free' && <Shield className="w-3 h-3 mr-1" />}
 {tier}
 </Badge>
 <div className="hidden sm:flex flex-col gap-1 min-w-[100px]" data-testid="quota-indicator">
 <div className="flex items-center justify-between text-xs">
 <span className="text-muted-foreground">Quota</span>
 <span className="font-medium">{totalLimit - totalUsed}/{totalLimit}</span>
 </div>
 <Progress 
 value={100 - usagePercentage} 
 className="h-1.5"
 />
 </div>
 </div>
 )}
 </div>
 </header>

 {/* Messages Area - Scrollable flex-grow container */}
 <div className="flex-1 overflow-y-auto px-4 sm:px-6">
 <div className="max-w-3xl mx-auto py-6 sm:py-8 space-y-6">
 {/* Model Quota Display */}
 {usage && (
 <Card className="border border-border/40 bg-white dark:bg-black" data-testid="quota-display">
 <div className="p-4 sm:p-6">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-base font-semibold">AI Model Quotas</h3>
 <Button
 variant="ghost"
 size="sm"
 className="text-xs h-8 px-3"
 onClick={() => window.location.href = '/subscription'}
 data-testid="button-view-plans"
 >
 View Plans
 </Button>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
 {/* Scout - Always visible */}
 <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-blue-200/30 dark:border-blue-800/30 bg-white dark:bg-gray-900" data-testid="quota-scout">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
 <div>
 <p className="text-sm font-medium">Scout</p>
 <p className="text-xs text-muted-foreground">Fast responses</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-base font-bold text-blue-600">{usage.scoutUsage?.remaining || 0}</p>
 <p className="text-xs text-muted-foreground">remaining</p>
 </div>
 </div>

 {/* Sonnet - Only if limit > 0 */}
 {usage.sonnetUsage && usage.sonnetUsage.limit > 0 ? (
 <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-purple-200/30 dark:border-purple-800/30 bg-white dark:bg-gray-900" data-testid="quota-sonnet">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-purple-500"></div>
 <div>
 <p className="text-sm font-medium">Sonnet</p>
 <p className="text-xs text-muted-foreground">Deep analysis</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-base font-bold text-purple-600">{usage.sonnetUsage.remaining}</p>
 <p className="text-xs text-muted-foreground">remaining</p>
 </div>
 </div>
 ) : (
 <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-dashed border-border/50 bg-muted/10 opacity-60" data-testid="quota-sonnet-locked">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-purple-300"></div>
 <div>
 <p className="text-sm font-medium text-muted-foreground">Sonnet</p>
 <p className="text-xs text-muted-foreground">Pro tier</p>
 </div>
 </div>
 <Crown className="w-4 h-4 text-muted-foreground" />
 </div>
 )}

 {/* Opus - Only if limit > 0 */}
 {usage.opusUsage && usage.opusUsage.limit > 0 ? (
 <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-amber-200/30 dark:border-amber-800/30 bg-white dark:bg-gray-900" data-testid="quota-opus">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
 <div>
 <p className="text-sm font-medium">Opus</p>
 <p className="text-xs text-muted-foreground">Advanced CFO</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-base font-bold text-amber-600">{usage.opusUsage.remaining}</p>
 <p className="text-xs text-muted-foreground">remaining</p>
 </div>
 </div>
 ) : (
 <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-dashed border-border/50 bg-muted/10 opacity-60" data-testid="quota-opus-locked">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-amber-300"></div>
 <div>
 <p className="text-sm font-medium text-muted-foreground">Opus</p>
 <p className="text-xs text-muted-foreground">Enterprise</p>
 </div>
 </div>
 <Gem className="w-4 h-4 text-muted-foreground" />
 </div>
 )}
 </div>
 </div>
 </Card>
 )}

 {!hasMessages ? (
 <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
 <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black dark:bg-white rounded-xl flex items-center justify-center mb-6 border border-border/40">
 <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-white dark:text-black" />
 </div>
 <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Your Personal CFO</h2>
 <p className="text-muted-foreground text-base mb-2 max-w-md">
 Expert financial advice powered by AI
 </p>
 <p className="text-sm text-muted-foreground mb-8 max-w-md">
 Ask me anything about budgeting, investing, debt payoff, retirement, or financial planning
 </p>

 {/* Starter Prompts Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl">
 {starterPrompts.map((prompt, index) => (
 <button
 key={index}
 onClick={() => setCurrentMessage(prompt.prompt)}
 className="flex items-start gap-3 p-4 text-left rounded-lg border border-border/40 hover:border-border hover:bg-muted/30 min-h-[44px] transition-all"
 data-testid={`starter-prompt-${index}`}
 >
 <div className="text-black dark:text-white shrink-0">
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
 <div className="shrink-0 border-t border-border/40 bg-white dark:bg-black pb-20 sm:pb-4" style={{ paddingBottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))' }}>
 <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
 <div className="relative">
 <Textarea
 ref={textareaRef}
 value={currentMessage}
 onChange={(e) => setCurrentMessage(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder="Message Twealth AI..."
 className="min-h-[52px] max-h-[150px] sm:max-h-[200px] resize-none pr-14 text-base w-full"
 rows={1}
 data-testid="input-message"
 />
 <Button
 onClick={handleSendMessage}
 disabled={!currentMessage.trim() || sendMessageMutation.isPending || rateLimitRetryAfter > 0}
 size="icon"
 className="absolute right-2 bottom-2 h-10 w-10"
 data-testid="button-send-message"
 title={rateLimitRetryAfter > 0 ? `Wait ${rateLimitRetryAfter}s` : undefined}
 >
 {rateLimitRetryAfter > 0 ? (
 <span className="text-xs font-medium">{rateLimitRetryAfter}s</span>
 ) : (
 <Send className="w-4 h-4" />
 )}
 </Button>
 </div>
 <p className="text-xs text-muted-foreground mt-3 text-center hidden sm:block">
 Twealth AI can make mistakes. Consider checking important information.
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}
