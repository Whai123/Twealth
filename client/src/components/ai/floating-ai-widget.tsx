import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface QuickAction {
  label: string;
  prompt: string;
}

const quickActions: QuickAction[] = [
  { label: "Add transaction", prompt: "Help me log a transaction" },
  { label: "Create goal", prompt: "I want to create a savings goal" },
  { label: "Budget advice", prompt: "Give me budget advice based on my spending" },
  { label: "Savings tips", prompt: "How can I save more money?" },
];

export default function FloatingAIWidget() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Guard to prevent multiple conversation creation attempts
  const isCreatingConversation = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Create conversation mutation - defined before useEffect that uses it
  const createConversation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chat/conversations", {
        title: "Quick Chat"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setConversationId(data.id);
      isCreatingConversation.current = false;
    },
    onError: () => {
      isCreatingConversation.current = false;
    },
  });

  // Fetch or create conversation
  const { data: conversations = [], isFetched } = useQuery<any[]>({
    queryKey: ["/api/chat/conversations"],
    enabled: isOpen,
    staleTime: 30000, // Cache for 30 seconds to prevent excessive refetches
  });

  // Get or create conversation on open - with proper guards
  useEffect(() => {
    // Only run when widget is open and data has been fetched
    if (!isOpen || !isFetched) return;
    
    // If we already have a conversation ID, don't do anything
    if (conversationId) return;
    
    // If conversations exist, use the first one
    if (conversations.length > 0) {
      setConversationId(conversations[0].id);
      return;
    }
    
    // Only create if not already creating and mutation not pending
    if (!isCreatingConversation.current && !createConversation.isPending) {
      isCreatingConversation.current = true;
      createConversation.mutate();
    }
  }, [isOpen, isFetched, conversations.length, conversationId, createConversation.isPending]);

  // Fetch messages
  const { data: currentConversation } = useQuery<any>({
    queryKey: ["/api/chat/conversations", conversationId],
    enabled: !!conversationId && isOpen,
  });

  const messages = currentConversation?.messages || [];

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) throw new Error("No conversation");
      const response = await apiRequest("POST", `/api/chat/conversations/${conversationId}/messages`, {
        content,
        mode: "quick"
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setMessage("");
      scrollToBottom();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (message.trim() && !sendMessage.isPending) {
      sendMessage.mutate(message.trim());
    }
  };

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt);
    if (!sendMessage.isPending) {
      sendMessage.mutate(prompt);
    }
  };

  // Hide widget on AI Assistant page (after all hooks are called)
  if (location?.startsWith('/ai-assistant')) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          data-testid="button-open-ai-widget"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96">
      <Card className="shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <CardDescription className="text-xs">Ask me anything</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-ai-widget"
              aria-label="Close AI assistant"
              className="min-w-[44px] min-h-[44px]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="p-3 text-left border rounded-lg hover:bg-muted transition-colors text-sm"
                    data-testid={`quick-action-${idx}`}
                  >
                    <div className="font-medium">{action.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="h-96 overflow-y-auto px-4 pb-4 space-y-3">
            {messages.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything..."
                disabled={sendMessage.isPending}
                className="flex-1"
                data-testid="input-ai-message"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessage.isPending}
                size="sm"
                data-testid="button-send-ai-message"
                aria-label="Send message"
                className="min-w-[44px] min-h-[44px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
