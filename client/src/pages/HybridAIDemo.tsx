import { useState } from "react";
import { Brain, Zap, Send, Loader2, TrendingUp, DollarSign, PiggyBank, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { PremiumGateModal } from "@/components/modals/PremiumGateModal";
import { motion } from "framer-motion";

interface HybridAIResponse {
  answer: string;
  modelUsed: 'scout' | 'reasoning';
  tokensIn: number;
  tokensOut: number;
  cost: number;
  escalated: boolean;
  escalationReason?: string;
  orchestratorUsed?: string;
  structuredData?: any;
}

const sampleQueries = [
  {
    icon: DollarSign,
    title: "Quick Budget Check",
    query: "What's a good monthly budget for someone earning $5,000?",
    complexity: "simple"
  },
  {
    icon: CreditCard,
    title: "Debt Strategy",
    query: "I have 3 credit cards: Card A $5,000 @ 18% APR, Card B $3,000 @ 22% APR, Card C $2,000 @ 15% APR. Should I pay them off smallest to largest or highest interest first?",
    complexity: "complex"
  },
  {
    icon: TrendingUp,
    title: "Retirement Planning",
    query: "I'm 35 years old with $50,000 saved. How much should I save monthly to retire at 65 with $1.5M?",
    complexity: "complex"
  },
  {
    icon: PiggyBank,
    title: "Tax Optimization",
    query: "Should I contribute to a Roth IRA or Traditional IRA if I earn $80,000 per year?",
    complexity: "complex"
  }
];

export default function HybridAIDemo() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<HybridAIResponse | null>(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);

  // Check subscription status
  const { data: subscription, refetch: refetchSubscription } = useQuery<{ tier?: string }>({
    queryKey: ["/api/subscription/current"],
  });

  const isPremium = subscription?.tier === 'premium' || subscription?.tier === 'pro';

  const adviceMutation = useMutation({
    mutationFn: async (message: string): Promise<HybridAIResponse> => {
      const res = await apiRequest("POST", "/api/ai/advise", { message });
      return await res.json();
    },
    onSuccess: (data) => {
      setResponse(data);
      setPendingQuery(null);
      
      // Show premium gate if non-premium user got escalated
      if (data.escalated && !isPremium) {
        setShowPremiumGate(true);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Detect if this would likely escalate (simple heuristic)
    const wouldEscalate = detectLikelyEscalation(query);
    
    if (wouldEscalate && !isPremium) {
      // Show premium gate before making request
      setPendingQuery(query);
      setShowPremiumGate(true);
      return;
    }
    
    setResponse(null);
    adviceMutation.mutate(query);
  };

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
    
    // Detect if this would likely escalate
    const wouldEscalate = detectLikelyEscalation(sampleQuery);
    
    if (wouldEscalate && !isPremium) {
      // Show premium gate before making request
      setPendingQuery(sampleQuery);
      setShowPremiumGate(true);
      return;
    }
    
    setResponse(null);
    adviceMutation.mutate(sampleQuery);
  };

  // Simple heuristic to detect likely escalation (client-side preview)
  const detectLikelyEscalation = (text: string): boolean => {
    const lower = text.toLowerCase();
    const triggers = [
      'debt', 'debts', 'credit card', 
      'retire', 'retirement', '401k', 'ira',
      'tax', 'roth', 'traditional',
      'portfolio', 'asset allocation', 'rebalance',
      'multi-year', 'invest vs pay'
    ];
    return triggers.some(trigger => lower.includes(trigger)) || text.length > 200;
  };

  return (
    <motion.div 
      className="container mx-auto py-8 px-4 max-w-5xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-black dark:text-white" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-black to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Hybrid AI System
          </h1>
        </div>
        <p className="text-muted-foreground">
          Scout (Llama 3.1) handles fast queries. Claude 3.5 Sonnet provides deep CFO-level analysis for complex scenarios.
        </p>
      </motion.div>

      {/* Sample Queries */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="mb-6 border-2 hover:border-black/20 dark:hover:border-white/20 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Try Sample Queries</CardTitle>
            <CardDescription>Click to test Scout vs Reasoning routing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sampleQueries.map((sample, idx) => {
                const Icon = sample.icon;
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleSampleQuery(sample.query)}
                    disabled={adviceMutation.isPending}
                    className="text-left p-4 border border-border rounded-lg hover:bg-muted/50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid={`sample-query-${idx}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{sample.title}</p>
                        {sample.complexity === 'complex' ? (
                          <Badge variant="secondary" className="text-xs">
                            <Brain className="h-3 w-3 mr-1" />
                            Deep
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Fast
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{sample.query}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
        </Card>
      </motion.div>

      {/* Query Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="mb-6 border-2 hover:border-black/20 dark:hover:border-white/20 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Ask Your Question</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about debt payoff, retirement planning, tax optimization, or portfolio allocation..."
              className="min-h-[100px]"
              disabled={adviceMutation.isPending}
              data-testid="input-hybrid-query"
            />
            <Button
              type="submit"
              disabled={!query.trim() || adviceMutation.isPending}
              className="w-full"
              data-testid="button-submit-query"
            >
              {adviceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Get AI Advice
                </>
              )}
            </Button>
          </form>
        </CardContent>
        </Card>
      </motion.div>

      {/* Loading State */}
      {adviceMutation.isPending && (
        <Card className="mb-6">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <Brain className="h-12 w-12 text-muted-foreground animate-pulse" />
                <Loader2 className="h-6 w-6 absolute -top-1 -right-1 animate-spin text-black dark:text-white" />
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">Analyzing your query...</p>
                <p className="text-sm text-muted-foreground">
                  Determining optimal AI routing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response */}
      {response && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6 border-2 border-black/10 dark:border-white/10 shadow-lg" data-testid="response-card">
            <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-lg">AI Response</CardTitle>
              <div className="flex items-center gap-2">
                {response.modelUsed === 'scout' ? (
                  <Badge variant="outline" className="gap-1.5 border-2" data-testid="badge-model-scout">
                    <Zap className="h-3.5 w-3.5 text-yellow-500" />
                    Scout ⚡
                  </Badge>
                ) : (
                  <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-black to-gray-700 dark:from-white dark:to-gray-300 text-white dark:text-black border-2" data-testid="badge-model-reasoning">
                    <Brain className="h-3.5 w-3.5" />
                    Reasoning 🧠
                  </Badge>
                )}
              </div>
            </div>
            {response.escalated && response.escalationReason && (
              <div className="flex items-start gap-2 bg-muted p-3 rounded-lg" data-testid="escalation-reason">
                <Brain className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">Escalated to Deep Analysis</p>
                  <p className="text-xs text-muted-foreground">{response.escalationReason}</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Answer */}
            <div>
              <h3 className="font-semibold mb-2 text-sm">Answer</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-answer">
                  {response.answer}
                </p>
              </div>
            </div>

            {/* Structured Data */}
            {response.orchestratorUsed && response.structuredData && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {response.orchestratorUsed.toUpperCase()}
                    </Badge>
                    Structured Analysis
                  </h3>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-xs overflow-x-auto" data-testid="structured-data">
                      {JSON.stringify(response.structuredData, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Tokens In</p>
                <p className="font-mono font-medium" data-testid="text-tokens-in">{response.tokensIn.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Tokens Out</p>
                <p className="font-mono font-medium" data-testid="text-tokens-out">{response.tokensOut.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Cost</p>
                <p className="font-mono font-medium" data-testid="text-cost">${response.cost.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Escalated</p>
                <p className="font-medium">{response.escalated ? '✓ Yes' : '✗ No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}

      {/* Error State */}
      {adviceMutation.isError && (
        <Card className="mb-6 border-destructive">
          <CardContent className="py-8">
            <div className="text-center text-destructive">
              <p className="font-medium mb-1">Error</p>
              <p className="text-sm">
                {(adviceMutation.error as any)?.message || "Failed to get AI advice"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Gate Modal */}
      <PremiumGateModal
        isOpen={showPremiumGate}
        onClose={async () => {
          setShowPremiumGate(false);
          
          // If we have a pending query, refetch subscription to check if user upgraded
          if (pendingQuery) {
            const { data: freshSubscription } = await refetchSubscription();
            const isNowPremium = freshSubscription?.tier === 'premium' || freshSubscription?.tier === 'pro';
            
            // Execute pending query if user is now premium
            if (isNowPremium) {
              setResponse(null);
              adviceMutation.mutate(pendingQuery);
            }
          }
          
          setPendingQuery(null);
        }}
        trigger="deep_analysis"
        orchestratorType={response?.orchestratorUsed}
      />

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium mb-1">Scout (Llama 3.1 70B via Groq)</p>
              <p className="text-muted-foreground text-xs">
                Handles 90-95% of queries. Fast, cost-effective answers for simple questions. ~$0.0007 per query.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium mb-1">Deep Analysis (Claude 3.5 Sonnet via Anthropic)</p>
              <p className="text-muted-foreground text-xs">
                CFO-level analysis for complex scenarios: multi-year plans, 3+ debts, tax strategy, portfolio optimization, retirement planning. ~$0.01 per query.
              </p>
            </div>
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Auto-escalation triggers:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>3+ debts (automatic regardless of keywords)</li>
              <li>Multi-year financial planning</li>
              <li>Invest vs. pay-off scenarios</li>
              <li>Tax optimization strategy</li>
              <li>Portfolio analysis & rebalancing</li>
              <li>Retirement glidepath planning</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
