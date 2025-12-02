import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  Check,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Trophy,
  Lightbulb,
  Calculator,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Brain, User } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  onRegenerate?: () => void;
  isLatest?: boolean;
  isRegenerating?: boolean;
  onFollowUp?: (prompt: string) => void;
}

interface ParsedInsight {
  type: 'warning' | 'opportunity' | 'milestone';
  title: string;
  message: string;
}

interface ParsedCalculation {
  title: string;
  items: Array<{ label: string; value: string; highlight?: boolean }>;
  result?: { label: string; value: string };
}

interface ParsedProgress {
  title: string;
  current: number;
  target: number;
  unit?: string;
}

interface ParsedContent {
  mainContent: string;
  insight?: ParsedInsight;
  calculations: ParsedCalculation[];
  progressBars: ParsedProgress[];
  suggestions: string[];
}

const parseAIResponse = (content: string): ParsedContent => {
  let mainContent = content;
  let insight: ParsedInsight | undefined;
  const suggestions: string[] = [];
  const calculations: ParsedCalculation[] = [];
  const progressBars: ParsedProgress[] = [];
  
  // Extract insight section
  const insightMatch = content.match(/---INSIGHT---\s*\n?([\s\S]*?)(?=---SUGGESTIONS---|---CALCULATION---|---PROGRESS---|$)/i);
  if (insightMatch) {
    const insightBlock = insightMatch[1].trim();
    const typeMatch = insightBlock.match(/type:\s*(warning|opportunity|milestone)/i);
    const titleMatch = insightBlock.match(/title:\s*(.+?)(?:\n|$)/i);
    const messageMatch = insightBlock.match(/message:\s*([\s\S]+?)(?=\n\n|$)/i);
    
    if (typeMatch && titleMatch && messageMatch) {
      insight = {
        type: typeMatch[1].toLowerCase() as 'warning' | 'opportunity' | 'milestone',
        title: titleMatch[1].trim(),
        message: messageMatch[1].trim()
      };
    }
  }
  
  // Extract calculation sections (can have multiple)
  const calcMatches = content.matchAll(/---CALCULATION---\s*\n?([\s\S]*?)(?=---CALCULATION---|---SUGGESTIONS---|---PROGRESS---|---INSIGHT---|$)/gi);
  for (const match of calcMatches) {
    const calcBlock = match[1].trim();
    const titleMatch = calcBlock.match(/title:\s*(.+?)(?:\n|$)/i);
    const itemsMatch = calcBlock.match(/items:\s*([\s\S]*?)(?=result:|$)/i);
    const resultMatch = calcBlock.match(/result:\s*(.+?)\s*=\s*(.+?)(?:\n|$)/i);
    
    if (titleMatch) {
      const items: Array<{ label: string; value: string; highlight?: boolean }> = [];
      if (itemsMatch) {
        const itemLines = itemsMatch[1].trim().split('\n');
        itemLines.forEach(line => {
          const itemMatch = line.match(/[-*]?\s*(.+?):\s*(.+)/);
          if (itemMatch) {
            items.push({
              label: itemMatch[1].trim(),
              value: itemMatch[2].trim(),
              highlight: line.includes('*') || line.includes('**')
            });
          }
        });
      }
      
      calculations.push({
        title: titleMatch[1].trim(),
        items,
        result: resultMatch ? { label: resultMatch[1].trim(), value: resultMatch[2].trim() } : undefined
      });
    }
  }
  
  // Extract progress bar sections
  const progressMatches = content.matchAll(/---PROGRESS---\s*\n?([\s\S]*?)(?=---PROGRESS---|---SUGGESTIONS---|---CALCULATION---|---INSIGHT---|$)/gi);
  for (const match of progressMatches) {
    const progBlock = match[1].trim();
    const titleMatch = progBlock.match(/title:\s*(.+?)(?:\n|$)/i);
    const currentMatch = progBlock.match(/current:\s*(\d+(?:\.\d+)?)/i);
    const targetMatch = progBlock.match(/target:\s*(\d+(?:\.\d+)?)/i);
    const unitMatch = progBlock.match(/unit:\s*(.+?)(?:\n|$)/i);
    
    if (titleMatch && currentMatch && targetMatch) {
      progressBars.push({
        title: titleMatch[1].trim(),
        current: parseFloat(currentMatch[1]),
        target: parseFloat(targetMatch[1]),
        unit: unitMatch?.[1]?.trim()
      });
    }
  }
  
  // Extract suggestions section
  const suggestionsMatch = content.match(/---SUGGESTIONS---\s*\n?([\s\S]*?)$/i);
  if (suggestionsMatch) {
    const suggestionsBlock = suggestionsMatch[1].trim();
    const lines = suggestionsBlock.split('\n');
    lines.forEach(line => {
      const cleaned = line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim();
      if (cleaned && cleaned.length > 5 && cleaned.length < 100) {
        suggestions.push(cleaned);
      }
    });
  }
  
  // Remove all special sections from main content
  mainContent = content
    .replace(/---INSIGHT---[\s\S]*?(?=---SUGGESTIONS---|---CALCULATION---|---PROGRESS---|$)/gi, '')
    .replace(/---CALCULATION---[\s\S]*?(?=---CALCULATION---|---SUGGESTIONS---|---PROGRESS---|---INSIGHT---|$)/gi, '')
    .replace(/---PROGRESS---[\s\S]*?(?=---PROGRESS---|---SUGGESTIONS---|---CALCULATION---|---INSIGHT---|$)/gi, '')
    .replace(/---SUGGESTIONS---[\s\S]*$/i, '')
    .trim();
  
  // Fallback suggestions if none parsed
  if (suggestions.length === 0) {
    if (content.toLowerCase().includes('budget') || content.toLowerCase().includes('spending')) {
      suggestions.push("Show my spending breakdown", "How can I reduce expenses?");
    } else if (content.toLowerCase().includes('save') || content.toLowerCase().includes('goal')) {
      suggestions.push("Create a savings goal", "Best strategies for me");
    } else if (content.toLowerCase().includes('debt') || content.toLowerCase().includes('loan')) {
      suggestions.push("Debt payoff strategies", "Should I pay debt or invest?");
    } else {
      suggestions.push("Tell me more", "What should I do next?");
    }
  }
  
  return {
    mainContent,
    insight,
    calculations,
    progressBars,
    suggestions: suggestions.slice(0, 3)
  };
};

const CalculationBlock = ({ calculation }: { calculation: ParsedCalculation }) => {
  return (
    <motion.div
      className="my-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200/60 dark:border-slate-700/40 shadow-sm"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">{calculation.title}</h4>
      </div>
      
      <div className="space-y-2 mb-3">
        {calculation.items.map((item, idx) => (
          <div 
            key={idx} 
            className={`flex justify-between items-center text-sm ${item.highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
          >
            <span>{item.label}</span>
            <span className={item.highlight ? 'text-blue-600 dark:text-blue-400' : ''}>{item.value}</span>
          </div>
        ))}
      </div>
      
      {calculation.result && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">{calculation.result.label}</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{calculation.result.value}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ProgressBarBlock = ({ progress }: { progress: ParsedProgress }) => {
  const percentage = Math.min(100, Math.max(0, (progress.current / progress.target) * 100));
  const isComplete = percentage >= 100;
  
  return (
    <motion.div
      className="my-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/60 dark:border-blue-800/40 shadow-sm"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isComplete ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
            <Target className={`w-4 h-4 ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`} />
          </div>
          <h4 className="text-sm font-semibold text-foreground">{progress.title}</h4>
        </div>
        <span className={`text-sm font-bold ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={percentage} 
          className={`h-3 ${isComplete ? '[&>div]:bg-emerald-500' : '[&>div]:bg-blue-500'}`}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{progress.unit ? `${progress.current.toLocaleString()} ${progress.unit}` : progress.current.toLocaleString()}</span>
        <span>Target: {progress.unit ? `${progress.target.toLocaleString()} ${progress.unit}` : progress.target.toLocaleString()}</span>
      </div>
    </motion.div>
  );
};

const InsightCard = ({ insight }: { insight: ParsedInsight }) => {
  const iconMap = {
    warning: AlertTriangle,
    opportunity: TrendingUp,
    milestone: Trophy
  };
  const colorMap = {
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-600 dark:text-amber-400',
      title: 'text-amber-800 dark:text-amber-200'
    },
    opportunity: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'text-emerald-600 dark:text-emerald-400',
      title: 'text-emerald-800 dark:text-emerald-200'
    },
    milestone: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-200'
    }
  };
  
  const Icon = iconMap[insight.type];
  const colors = colorMap[insight.type];
  
  return (
    <motion.div
      className={`mt-4 p-4 rounded-xl border ${colors.bg} ${colors.border}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`w-4 h-4 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${colors.title}`}>{insight.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
        </div>
      </div>
    </motion.div>
  );
};

function StreamingText({ content, onComplete }: { content: string; onComplete?: () => void }) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const contentRef = useRef(content);
  
  useEffect(() => {
    if (content !== contentRef.current) {
      contentRef.current = content;
      setDisplayedContent("");
      setIsComplete(false);
    }
  }, [content]);

  useEffect(() => {
    if (isComplete) return;
    
    const words = content.split(' ');
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedContent(words.slice(0, currentIndex + 1).join(' '));
        currentIndex++;
      } else {
        setIsComplete(true);
        onComplete?.();
        clearInterval(interval);
      }
    }, 25);
    
    return () => clearInterval(interval);
  }, [content, isComplete, onComplete]);

  return <>{displayedContent || content}</>;
}

export function MessageBubble({ role, content, timestamp, onRegenerate, isLatest, isRegenerating, onFollowUp }: MessageBubbleProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  const [streamComplete, setStreamComplete] = useState(!isLatest);
  
  // Parse AI response to extract main content, insights, and suggestions
  const parsedContent = role === 'assistant' ? parseAIResponse(content) : null;
  
  useEffect(() => {
    if (isLatest && role === 'assistant') {
      const timer = setTimeout(() => setShowActions(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowActions(true);
    }
  }, [isLatest, role]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(parsedContent?.mainContent || content);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Message copied successfully",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedbackGiven(type);
    toast({
      title: type === 'positive' ? "Thanks for the feedback" : "We'll do better",
      description: type === 'positive' ? "Glad this was helpful" : "Your feedback helps us improve",
    });
  };

  const followUpSuggestions = isLatest && role === 'assistant' && parsedContent ? parsedContent.suggestions : [];

  if (role === 'user') {
    return (
      <motion.div 
        className="flex justify-end gap-3 group" 
        data-testid="message-user"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
          <motion.div 
            className="relative bg-black dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg shadow-black/5"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed font-medium">{content}</p>
          </motion.div>
          {timestamp && (
            <motion.span 
              className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </motion.span>
          )}
        </div>
        <motion.div 
          className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <User className="w-4 h-4 text-white dark:text-black" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex gap-3 group" 
      data-testid="message-assistant"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <Brain className="w-4 h-4 text-white" />
      </motion.div>
      <div className="flex-1 min-w-0 space-y-3">
        <motion.div 
          className="relative bg-white dark:bg-zinc-900 rounded-2xl rounded-tl-sm px-5 py-4 border border-border/50 shadow-lg shadow-black/[0.03]"
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent rounded-2xl rounded-tl-sm pointer-events-none" />
          <div className="relative text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-li:my-0.5">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <div className="my-4 rounded-xl bg-zinc-950 overflow-hidden border border-zinc-800/50 shadow-lg">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                          </div>
                          <span className="text-xs text-zinc-500 font-medium ml-2">{match?.[1] || 'code'}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                          onClick={() => {
                            navigator.clipboard.writeText(String(children));
                            toast({ title: "Code copied" });
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1.5" />
                          Copy
                        </Button>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <code className="text-xs font-mono text-zinc-100 block whitespace-pre" {...props}>
                          {String(children).replace(/\n$/, '')}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <code className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md text-xs font-mono font-medium" {...props}>
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0 text-foreground/90 leading-relaxed">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-none ml-0 mb-3 space-y-2">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-outside ml-4 mb-3 space-y-2">{children}</ol>;
                },
                li({ children }) {
                  return (
                    <li className="text-foreground/90 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <span>{children}</span>
                    </li>
                  );
                },
                strong({ children }) {
                  return <strong className="font-semibold text-foreground">{children}</strong>;
                },
                em({ children }) {
                  return <em className="italic text-foreground/80">{children}</em>;
                },
                h1({ children }) {
                  return <h1 className="text-lg font-bold text-foreground border-b border-border/30 pb-2 mb-3">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-base font-semibold text-foreground">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-blue-500 pl-4 my-4 py-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-r-lg text-foreground/80">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="my-4 overflow-x-auto rounded-xl border border-border/50 shadow-sm">
                      <table className="w-full text-sm">{children}</table>
                    </div>
                  );
                },
                th({ children }) {
                  return <th className="px-4 py-3 bg-muted/50 font-semibold text-left border-b text-xs uppercase tracking-wide">{children}</th>;
                },
                td({ children }) {
                  return <td className="px-4 py-3 border-b border-border/30">{children}</td>;
                },
              }}
            >
              {parsedContent?.mainContent || content}
            </ReactMarkdown>
          </div>
          
          {/* Calculation Blocks - displayed for financial calculations */}
          {parsedContent?.calculations && parsedContent.calculations.length > 0 && (
            <div className="space-y-2">
              {parsedContent.calculations.map((calc, idx) => (
                <CalculationBlock key={idx} calculation={calc} />
              ))}
            </div>
          )}
          
          {/* Progress Bars - displayed for goal/budget progress */}
          {parsedContent?.progressBars && parsedContent.progressBars.length > 0 && (
            <div className="space-y-2">
              {parsedContent.progressBars.map((prog, idx) => (
                <ProgressBarBlock key={idx} progress={prog} />
              ))}
            </div>
          )}
          
          {/* Insight Card - displayed when AI detects something important */}
          {parsedContent?.insight && (
            <InsightCard insight={parsedContent.insight} />
          )}
        </motion.div>
        
        <AnimatePresence>
          {followUpSuggestions.length > 0 && onFollowUp && showActions && (
            <motion.div 
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {followUpSuggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-medium rounded-full border-border/60 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group/btn shadow-sm"
                    onClick={() => onFollowUp(suggestion)}
                    data-testid={`follow-up-${idx}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2 text-blue-500 group-hover/btn:text-blue-600" />
                    {suggestion}
                    <ArrowRight className="w-3 h-3 ml-2 opacity-0 -translate-x-1 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-200" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div 
          className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: showActions ? undefined : 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0 rounded-full hover:bg-muted/80 transition-colors"
            data-testid="button-copy-message"
            aria-label={copied ? "Copied to clipboard" : "Copy message"}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
          
          {isLatest && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="h-8 w-8 p-0 rounded-full hover:bg-muted/80 transition-colors"
              data-testid="button-regenerate-response"
              aria-label="Regenerate response"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedback('positive')}
            disabled={feedbackGiven !== null}
            className={`h-8 w-8 p-0 rounded-full transition-colors ${feedbackGiven === 'positive' ? 'bg-green-100 dark:bg-green-900/30' : 'hover:bg-muted/80'}`}
            data-testid="button-feedback-positive"
            aria-label="Mark as helpful"
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${feedbackGiven === 'positive' ? 'text-green-500' : 'text-muted-foreground hover:text-green-500'}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedback('negative')}
            disabled={feedbackGiven !== null}
            className={`h-8 w-8 p-0 rounded-full transition-colors ${feedbackGiven === 'negative' ? 'bg-red-100 dark:bg-red-900/30' : 'hover:bg-muted/80'}`}
            data-testid="button-feedback-negative"
            aria-label="Mark as not helpful"
          >
            <ThumbsDown className={`w-3.5 h-3.5 ${feedbackGiven === 'negative' ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`} />
          </Button>
          
          {timestamp && (
            <span className="text-[10px] text-muted-foreground/60 ml-2 font-medium">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div 
      className="flex gap-3" 
      data-testid="typing-indicator"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Brain className="w-4 h-4 text-white" />
      </motion.div>
      <motion.div 
        className="relative bg-white dark:bg-zinc-900 rounded-2xl rounded-tl-sm px-5 py-4 border border-border/50 shadow-lg shadow-black/[0.03] overflow-hidden"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 dark:via-blue-900/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        <div className="relative flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <motion.div 
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            />
            <motion.div 
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div 
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <motion.span 
            className="text-xs text-muted-foreground font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Twealth is thinking...
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}
