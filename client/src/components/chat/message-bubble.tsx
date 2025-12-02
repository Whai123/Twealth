import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  Check,
  Sparkles
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

const extractFollowUpSuggestions = (content: string): string[] => {
  const suggestions: string[] = [];
  
  if (content.toLowerCase().includes('budget') || content.toLowerCase().includes('spending')) {
    suggestions.push("Show my spending breakdown");
    suggestions.push("How can I reduce expenses?");
  }
  if (content.toLowerCase().includes('save') || content.toLowerCase().includes('saving')) {
    suggestions.push("Create a savings goal");
    suggestions.push("Best savings strategies for me");
  }
  if (content.toLowerCase().includes('invest') || content.toLowerCase().includes('portfolio')) {
    suggestions.push("Explain index funds");
    suggestions.push("Risk assessment for my situation");
  }
  if (content.toLowerCase().includes('debt') || content.toLowerCase().includes('loan')) {
    suggestions.push("Debt payoff strategies");
    suggestions.push("Should I pay debt or invest?");
  }
  if (content.toLowerCase().includes('retirement') || content.toLowerCase().includes('401k')) {
    suggestions.push("Retirement calculator");
    suggestions.push("Optimize my 401k contributions");
  }
  if (content.toLowerCase().includes('emergency') || content.toLowerCase().includes('fund')) {
    suggestions.push("How much emergency fund?");
    suggestions.push("Where to keep emergency fund");
  }
  
  if (suggestions.length === 0) {
    suggestions.push("Tell me more");
    suggestions.push("What should I do next?");
  }
  
  return suggestions.slice(0, 3);
};

export function MessageBubble({ role, content, timestamp, onRegenerate, isLatest, isRegenerating, onFollowUp }: MessageBubbleProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  useEffect(() => {
    if (isLatest && role === 'assistant') {
      const timer = setTimeout(() => setShowActions(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isLatest, role]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Message copied successfully",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const followUpSuggestions = isLatest && role === 'assistant' ? extractFollowUpSuggestions(content) : [];

  if (role === 'user') {
    return (
      <motion.div 
        className="flex justify-end gap-3 group" 
        data-testid="message-user"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content}</p>
          </div>
          {timestamp && (
            <span className="text-[10px] text-muted-foreground mt-1.5 opacity-60">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex gap-3 group" 
      data-testid="message-assistant"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/10">
        <Brain className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl rounded-tl-md px-4 py-3 border border-border/30 shadow-sm">
          <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-li:my-0.5">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <div className="my-3 rounded-lg bg-gray-900 dark:bg-gray-950 overflow-hidden border border-gray-800">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                        <span className="text-xs text-gray-400 font-medium">{match?.[1] || 'code'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                          onClick={() => {
                            navigator.clipboard.writeText(String(children));
                            toast({ title: "Code copied" });
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <code className="text-xs font-mono text-gray-100 block whitespace-pre" {...props}>
                          {String(children).replace(/\n$/, '')}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono font-medium" {...props}>
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0 text-foreground/90">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-outside ml-4 mb-3 space-y-1.5">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-outside ml-4 mb-3 space-y-1.5">{children}</ol>;
                },
                li({ children }) {
                  return <li className="text-foreground/90">{children}</li>;
                },
                strong({ children }) {
                  return <strong className="font-semibold text-foreground">{children}</strong>;
                },
                em({ children }) {
                  return <em className="italic text-foreground/80">{children}</em>;
                },
                h1({ children }) {
                  return <h1 className="text-lg font-bold text-foreground">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-base font-semibold text-foreground">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-3 border-primary/40 pl-4 my-3 py-1 bg-primary/5 rounded-r-lg italic text-foreground/80">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="my-3 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">{children}</table>
                    </div>
                  );
                },
                th({ children }) {
                  return <th className="px-4 py-2 bg-muted font-semibold text-left border-b">{children}</th>;
                },
                td({ children }) {
                  return <td className="px-4 py-2 border-b border-border/50">{children}</td>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
        
        {followUpSuggestions.length > 0 && onFollowUp && showActions && (
          <motion.div 
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {followUpSuggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium rounded-full border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => onFollowUp(suggestion)}
                data-testid={`follow-up-${idx}`}
              >
                <Sparkles className="w-3 h-3 mr-1.5 text-primary" />
                {suggestion}
              </Button>
            ))}
          </motion.div>
        )}
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
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
              className="h-7 w-7 p-0 rounded-full hover:bg-muted"
              data-testid="button-regenerate-response"
              aria-label="Regenerate response"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
            data-testid="button-feedback-positive"
            aria-label="Mark as helpful"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground hover:text-green-500" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
            data-testid="button-feedback-negative"
            aria-label="Mark as not helpful"
          >
            <ThumbsDown className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
          </Button>
          
          {timestamp && (
            <span className="text-[10px] text-muted-foreground ml-2">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div 
      className="flex gap-3" 
      data-testid="typing-indicator"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/10">
        <Brain className="w-4 h-4 text-primary" />
      </div>
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl rounded-tl-md px-5 py-4 border border-border/30 shadow-sm">
        <div className="flex items-center gap-1.5">
          <motion.div 
            className="w-2 h-2 bg-primary/60 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.div 
            className="w-2 h-2 bg-primary/60 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div 
            className="w-2 h-2 bg-primary/60 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
