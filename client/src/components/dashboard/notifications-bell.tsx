import { useState, useEffect } from"react";
import { 
 Bell, 
 Check, 
 Trash2, 
 Target, 
 Wallet, 
 AlertTriangle, 
 Trophy, 
 Lightbulb,
 Sparkles,
 X
} from"lucide-react";
import { useQuery, useMutation } from"@tanstack/react-query";
import { Button } from"@/components/ui/button";
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from"@/components/ui/popover";
import { ScrollArea } from"@/components/ui/scroll-area";
import { apiRequest, queryClient } from"@/lib/queryClient";
import { useToast } from"@/hooks/use-toast";
import NotificationActions from"./notification-actions";
import { cn } from"@/lib/utils";
import { motion, AnimatePresence } from"framer-motion";

interface Notification {
 id: string;
 type: string;
 title: string;
 message: string;
 priority:"low" |"normal" |"high" |"urgent";
 category:"goals" |"transactions" |"budget" |"achievements" |"suggestions";
 isRead: boolean;
 actionType?: string;
 actionData?: any;
 data?: any;
 createdAt: string;
}

interface NotificationAction {
 type: string;
 data: any;
}

export default function NotificationsBell() {
 const [isOpen, setIsOpen] = useState(false);
 const { toast } = useToast();

 const { data: notifications = [], isLoading } = useQuery<Notification[]>({
  queryKey: ["/api/notifications"],
  queryFn: () => 
   fetch("/api/notifications?includeRead=true&limit=20")
    .then(res => res.json()),
  refetchInterval: 5 * 60 * 1000,
 });

 const { data: unreadData } = useQuery<{count: number}>({
  queryKey: ["/api/notifications/unread-count"],
  refetchInterval: 2 * 60 * 1000,
 });

 const unreadCount = unreadData?.count || 0;

 const markAsReadMutation = useMutation({
  mutationFn: (notificationId: string) =>
   apiRequest("PUT", `/api/notifications/${notificationId}/read`),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
   queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
  },
 });

 const markAllAsReadMutation = useMutation({
  mutationFn: () =>
   apiRequest("PUT","/api/notifications/mark-all-read"),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
   queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
   toast({ title:"All caught up!", description:"Notifications marked as read", variant:"success" });
  },
 });

 const deleteNotificationMutation = useMutation({
  mutationFn: (notificationId: string) =>
   apiRequest("DELETE", `/api/notifications/${notificationId}`),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
   queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
  },
 });

 const generateNotificationsMutation = useMutation({
  mutationFn: () =>
   apiRequest("POST","/api/notifications/generate"),
  onSuccess: (data: any) => {
   queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
   queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
   if (data.generated > 0) {
    toast({ 
     title:`${data.generated} new insights`,
     description:"Fresh financial suggestions for you",
     variant:"info"
    });
   }
  },
 });

 useEffect(() => {
  const timer = setTimeout(() => {
   generateNotificationsMutation.mutate();
  }, 3000);
  return () => clearTimeout(timer);
 }, []);

 const createHandleNotificationClick = (handlers: any) => (notification: Notification) => {
  if (!notification.isRead) {
   markAsReadMutation.mutate(notification.id);
  }
  if (notification.actionType && notification.actionData) {
   const handleNotificationAction = createHandleNotificationAction(handlers);
   handleNotificationAction({
    type: notification.actionType,
    data: notification.actionData
   });
  }
 };

 const createHandleNotificationAction = (handlers: any) => (action: NotificationAction) => {
  switch (action.type) {
   case 'add_transaction':
    handlers.openTransactionForm(action.data);
    break;
   case 'create_goal':
    handlers.openGoalForm(action.data);
    break;
   case 'view_goal':
    if (action.data?.goalId) {
     handlers.navigateToGoal(action.data.goalId);
    }
    break;
   case 'view_transactions':
    handlers.navigateToTransactions(action.data?.category);
    break;
   case 'add_funds':
    if (action.data?.goalId) {
     handlers.openTransactionForm({
      type: 'transfer',
      category: 'goal_contribution',
      goalId: action.data.goalId
     });
    }
    break;
   default:
    break;
  }
 };

 const getCategoryIcon = (category: string) => {
  switch (category) {
   case 'goals':
    return <Target className="w-4 h-4" />;
   case 'transactions':
    return <Wallet className="w-4 h-4" />;
   case 'budget':
    return <AlertTriangle className="w-4 h-4" />;
   case 'achievements':
    return <Trophy className="w-4 h-4" />;
   case 'suggestions':
    return <Lightbulb className="w-4 h-4" />;
   default:
    return <Bell className="w-4 h-4" />;
  }
 };

 const getCategoryColor = (category: string, priority: string) => {
  if (priority === 'urgent') return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
  if (priority === 'high') return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
  
  switch (category) {
   case 'goals':
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
   case 'transactions':
    return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
   case 'budget':
    return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
   case 'achievements':
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
   case 'suggestions':
    return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400';
   default:
    return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
 };

 const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  return `${Math.floor(diffInDays / 7)}w`;
 };

 const recentNotifications = notifications.slice(0, 10);
 const hasUnreadNotifications = unreadCount > 0;

 return (
  <NotificationActions>
   {(handlers) => {
    const handleNotificationClick = createHandleNotificationClick(handlers);
    
    return (
     <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
       <Button
        variant="ghost"
        size="icon"
        className={cn(
         "relative h-10 w-10 rounded-full transition-all",
         hasUnreadNotifications && "bg-primary/10 hover:bg-primary/20"
        )}
        data-testid="button-notifications"
       >
        <Bell className={cn(
         "w-5 h-5 transition-colors",
         hasUnreadNotifications ? "text-primary" : "text-muted-foreground"
        )} />
        <AnimatePresence>
         {unreadCount > 0 && (
          <motion.span
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           exit={{ scale: 0 }}
           className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm"
           data-testid="badge-unread-count"
          >
           {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
         )}
        </AnimatePresence>
       </Button>
      </PopoverTrigger>
      
      <PopoverContent 
       align="end" 
       className="w-[360px] p-0 rounded-2xl shadow-xl border-border/50"
       sideOffset={8}
       data-testid="dropdown-notifications"
      >
       <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
         <div>
          <h3 className="font-semibold text-base">Notifications</h3>
          {unreadCount > 0 && (
           <p className="text-xs text-muted-foreground mt-0.5">
            {unreadCount} unread
           </p>
          )}
         </div>
         <div className="flex items-center gap-1">
          {unreadCount > 0 && (
           <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="h-8 px-2 text-xs hover:bg-primary/10"
            data-testid="button-mark-all-read"
           >
            <Check className="w-3.5 h-3.5 mr-1" />
            Mark read
           </Button>
          )}
          <Button
           variant="ghost"
           size="icon"
           onClick={() => generateNotificationsMutation.mutate()}
           disabled={generateNotificationsMutation.isPending}
           className="h-8 w-8 hover:bg-primary/10"
           data-testid="button-generate-notifications"
          >
           <Sparkles className={cn(
            "w-4 h-4",
            generateNotificationsMutation.isPending && "animate-spin"
           )} />
          </Button>
         </div>
        </div>
       </div>

       <ScrollArea className="h-[380px]">
        {isLoading ? (
         <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
         </div>
        ) : recentNotifications.length === 0 ? (
         <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
           <Bell className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-sm">All caught up!</p>
          <p className="text-xs text-muted-foreground mt-1">No new notifications</p>
         </div>
        ) : (
         <div className="p-2">
          <AnimatePresence mode="popLayout">
           {recentNotifications.map((notification, index) => (
            <motion.div
             key={notification.id}
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, x: 50 }}
             transition={{ delay: index * 0.03 }}
             className={cn(
              "group relative p-3 rounded-xl mb-1.5 cursor-pointer transition-all",
              "hover:bg-muted/50 active:scale-[0.99]",
              !notification.isRead && "bg-primary/5"
             )}
             onClick={() => handleNotificationClick(notification)}
             data-testid={`notification-${index}`}
            >
             <div className="flex items-start gap-3">
              <div className={cn(
               "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
               getCategoryColor(notification.category, notification.priority)
              )}>
               {getCategoryIcon(notification.category)}
              </div>
              
              <div className="flex-1 min-w-0 pr-6">
               <div className="flex items-start justify-between gap-2">
                <h4 className={cn(
                 "text-sm leading-snug line-clamp-1",
                 !notification.isRead ? "font-semibold" : "font-medium"
                )}>
                 {notification.title}
                </h4>
                <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                 {formatTimeAgo(notification.createdAt)}
                </span>
               </div>
               
               <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                {notification.message}
               </p>

               {notification.actionType && (
                <Button
                 size="sm"
                 variant="ghost"
                 className="h-7 px-2 mt-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary"
                 onClick={(e) => {
                  e.stopPropagation();
                  const handleNotificationAction = createHandleNotificationAction(handlers);
                  handleNotificationAction({
                   type: notification.actionType!,
                   data: notification.actionData
                  });
                  setIsOpen(false);
                 }}
                 data-testid={`button-action-${notification.actionType}`}
                >
                 {notification.actionType === 'add_transaction' && 'Add Transaction'}
                 {notification.actionType === 'create_goal' && 'Create Goal'}
                 {notification.actionType === 'view_goal' && 'View Goal'}
                 {notification.actionType === 'view_transactions' && 'View All'}
                 {notification.actionType === 'add_funds' && 'Add Funds'}
                </Button>
               )}

               {!notification.isRead && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
               )}
              </div>

              <Button
               variant="ghost"
               size="icon"
               className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
               onClick={(e) => {
                e.stopPropagation();
                deleteNotificationMutation.mutate(notification.id);
               }}
               data-testid={`button-delete-${index}`}
              >
               <X className="w-3.5 h-3.5" />
              </Button>
             </div>
            </motion.div>
           ))}
          </AnimatePresence>
         </div>
        )}
       </ScrollArea>
      </PopoverContent>
     </Popover>
    );
   }}
  </NotificationActions>
 );
}
