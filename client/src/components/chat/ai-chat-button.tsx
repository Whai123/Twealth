import { useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatConversation {
  id: string;
  title: string | null;
  messages?: ChatMessage[];
}

interface APIResponse {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  actionsPerformed?: Array<{
    type: 'goal_created' | 'event_created' | 'transaction_added' | 'error';
    data?: any;
    tool?: string;
    error?: string;
  }>;
  error?: string;
}

export default function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [] } = useQuery<ChatConversation[]>({
    queryKey: ["/api/chat/conversations"],
    enabled: isOpen
  });

  // Fetch current conversation with messages
  const { data: currentConversation } = useQuery<ChatConversation>({
    queryKey: ["/api/chat/conversations", currentConversationId],
    enabled: !!currentConversationId
  });

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (): Promise<ChatConversation> => {
      const response = await apiRequest("POST", "/api/chat/conversations", { 
        title: "New Conversation" 
      });
      return await response.json();
    },
    onSuccess: (conversation: ChatConversation) => {
      setCurrentConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    }
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/chat/conversations/${conversationId}/messages`, { 
        content 
      });
      return await response.json();
    },
    onSuccess: (data: APIResponse) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", currentConversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      
      // Invalidate related data if AI performed actions
      if (data.actionsPerformed && data.actionsPerformed.length > 0) {
        data.actionsPerformed.forEach(action => {
          if (action.type === 'goal_created') {
            queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
          } else if (action.type === 'event_created') {
            queryClient.invalidateQueries({ queryKey: ["/api/events"] });
          } else if (action.type === 'transaction_added') {
            queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          }
        });
      }
      
      setCurrentMessage("");
    }
  });

  const handleStartNewChat = () => {
    createConversationMutation.mutate();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    if (!currentConversationId) {
      // Create new conversation first
      const response = await apiRequest("POST", "/api/chat/conversations", { 
        title: "New Conversation" 
      });
      const conversation: ChatConversation = await response.json();
      setCurrentConversationId(conversation.id);
      
      // Send message to new conversation
      sendMessageMutation.mutate({
        conversationId: conversation.id,
        content: currentMessage
      });
    } else {
      sendMessageMutation.mutate({
        conversationId: currentConversationId,
        content: currentMessage
      });
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 text-white border-0 ring-2 ring-blue-400/30 ring-offset-2 ring-offset-background"
          style={{ 
            boxShadow: '0 10px 25px -5px rgb(59 130 246 / 0.4), 0 10px 10px -5px rgb(59 130 246 / 0.1)',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6)'
          }}
          data-testid="button-open-chat"
        >
          <div className="relative">
            <MessageCircle className="h-7 w-7 transition-transform group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </Button>
        
        {/* Enhanced Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm rounded-lg px-4 py-2 whitespace-nowrap">
            💬 Chat with AI Assistant
            <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Twealth AI Assistant
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Conversation selector */}
        <div className="flex gap-2 mt-2">
          <Button
            onClick={handleStartNewChat}
            size="sm"
            variant="outline"
            disabled={createConversationMutation.isPending}
            data-testid="button-new-chat"
          >
            New Chat
          </Button>
          {conversations.length > 0 && (
            <Badge variant="secondary">{conversations.length} conversations</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4">
          {!currentConversationId ? (
            <div className="text-center text-muted-foreground py-8" data-testid="text-welcome">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm font-medium mb-2">Welcome to Twealth AI Assistant!</p>
              <p className="text-xs mb-4">Get personalized financial advice and insights</p>
              <div className="space-y-2 text-xs">
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2">
                  <p className="font-medium text-blue-700 dark:text-blue-300">Try asking:</p>
                  <p className="text-blue-600 dark:text-blue-400">"How can I optimize my budget?"</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                  <p className="text-green-600 dark:text-green-400">"What's my best savings strategy?"</p>
                </div>
              </div>
              <p className="text-xs mt-2">I can help with budgeting, savings goals, and time management.</p>
            </div>
          ) : currentConversation?.messages ? (
            <div className="space-y-4">
              {currentConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading conversation...</p>
            </div>
          )}
        </ScrollArea>

        {/* Message input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Ask about your finances or time management..."
              disabled={sendMessageMutation.isPending}
              className="flex-1"
              data-testid="input-chat-message"
            />
            <Button
              type="submit"
              disabled={!currentMessage.trim() || sendMessageMutation.isPending}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}