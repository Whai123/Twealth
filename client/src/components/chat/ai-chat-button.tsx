import { useState } from"react";
import { MessageCircle, X, Send, Loader2 } from"lucide-react";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Input } from"@/components/ui/input";
import { ScrollArea } from"@/components/ui/scroll-area";
import { Badge } from"@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { apiRequest } from"@/lib/queryClient";

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
   const response = await apiRequest("POST","/api/chat/conversations", { 
    title:"New Conversation" 
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
   const response = await apiRequest("POST","/api/chat/conversations", { 
    title:"New Conversation" 
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
   <div className="fixed bottom-24 left-4 md:bottom-6 md:right-6 md:left-auto z-50 group" style={{ bottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom)))' }}>
    <Button
     onClick={() => setIsOpen(true)}
     className="h-14 w-14 md:h-16 md:w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
     data-testid="button-open-chat"
    >
     <MessageCircle className="h-6 w-6 text-gray-900 dark:text-gray-100" />
    </Button>
    
    {/* Tooltip */}
    <div className="hidden md:block absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
     <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded-md px-3 py-1.5 whitespace-nowrap shadow-lg">
      AI Assistant
     </div>
    </div>
   </div>
  );
 }

 return (
  <Card className="fixed inset-4 md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[500px] shadow-sm border z-50 flex flex-col max-h-[90vh] md:max-h-[500px]" style={{ 
   maxHeight: 'calc(90vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
   bottom: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))'
  }}>
   <CardHeader className="pb-2 shrink-0 border-b">
    <div className="flex items-center justify-between">
     <CardTitle className="text-sm md:text-base flex items-center gap-2 font-semibold">
      <MessageCircle className="h-4 w-4 text-black dark:text-white" />
      Twealth AI
     </CardTitle>
     <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsOpen(false)}
      data-testid="button-close-chat"
      className="h-11 w-11 md:h-9 md:w-9"
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
      className="h-11 md:h-9 text-xs"
     >
      New Chat
     </Button>
     {conversations.length > 0 && (
      <Badge variant="secondary" className="text-xs">{conversations.length} chats</Badge>
     )}
    </div>
   </CardHeader>

   <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
    {/* Messages area */}
    <ScrollArea className="flex-1 p-3 md:p-4">
     {!currentConversationId ? (
      <div className="text-center text-muted-foreground py-4 md:py-8" data-testid="text-welcome">
       <MessageCircle className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-3 text-muted-foreground/50" />
       <p className="text-sm font-medium mb-2">Chat with Twealth AI</p>
       <p className="text-xs mb-3 md:mb-4">Get expert financial advice</p>
       <div className="space-y-2 text-xs text-left">
        <div className="border border-border rounded-lg p-2">
         <p className="text-muted-foreground">How can I optimize my budget?</p>
        </div>
        <div className="border border-border rounded-lg p-2">
         <p className="text-muted-foreground">What's my best savings strategy?</p>
        </div>
       </div>
      </div>
     ) : currentConversation?.messages ? (
      <div className="space-y-3 md:space-y-4">
       {currentConversation.messages.map((message) => (
        <div
         key={message.id}
         className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
         data-testid={`message-${message.role}-${message.id}`}
        >
         <div
          className={`max-w-[85%] md:max-w-[80%] rounded-lg p-2.5 md:p-3 ${
           message.role === 'user'
            ? 'bg-black dark:bg-white text-white dark:text-black'
            : 'bg-muted'
          }`}
         >
          <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{message.content}</p>
          <p className="text-xs opacity-70 mt-1">
           {formatMessageTime(message.createdAt)}
          </p>
         </div>
        </div>
       ))}
       {sendMessageMutation.isPending && (
        <div className="flex justify-start">
         <div className="bg-muted rounded-lg p-2.5 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5" />
          <span className="text-xs text-muted-foreground">Thinking...</span>
         </div>
        </div>
       )}
      </div>
     ) : (
      <div className="text-center text-muted-foreground py-4">
       <Loader2 className="h-6 w-6 mx-auto mb-2" />
       <p className="text-sm">Loading...</p>
      </div>
     )}
    </ScrollArea>

    {/* Message input */}
    <div className="border-t p-3 md:p-4 shrink-0">
     <form onSubmit={handleSendMessage} className="flex gap-2">
      <Input
       value={currentMessage}
       onChange={(e) => setCurrentMessage(e.target.value)}
       placeholder="Ask about your finances..."
       disabled={sendMessageMutation.isPending}
       className="flex-1 text-sm h-11 md:h-10"
       data-testid="input-chat-message"
      />
      <Button
       type="submit"
       disabled={!currentMessage.trim() || sendMessageMutation.isPending}
       className="shrink-0 h-11 w-11 md:h-10 md:w-10"
       size="icon"
       data-testid="button-send-message"
      >
       <Send className="h-4 w-4 md:h-3.5 md:w-3.5" />
      </Button>
     </form>
    </div>
   </CardContent>
  </Card>
 );
}