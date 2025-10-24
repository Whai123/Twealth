import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Brain, User } from "lucide-react";

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  onRegenerate?: () => void;
  isLatest?: boolean;
}

export function MessageBubble({ role, content, timestamp, onRegenerate, isLatest }: MessageBubbleProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Message copied successfully",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === 'user') {
    return (
      <div className="flex justify-end gap-3 group" data-testid="message-user">
        <div className="flex flex-col items-end max-w-[80%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3">
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          </div>
          {timestamp && (
            <span className="text-xs text-muted-foreground mt-1">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group" data-testid="message-assistant">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content}</p>
        </div>
        
        {/* Message Actions */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2"
            data-testid="button-copy-message"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
          
          {isLatest && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-7 px-2"
              data-testid="button-regenerate-response"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            data-testid="button-feedback-positive"
          >
            <ThumbsUp className="w-3 h-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            data-testid="button-feedback-negative"
          >
            <ThumbsDown className="w-3 h-3" />
          </Button>
          
          {timestamp && (
            <span className="text-xs text-muted-foreground ml-2">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3" data-testid="typing-indicator">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
