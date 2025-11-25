import { useState, useEffect } from"react";
import { Bell, Check, Trash2, Archive, Eye } from"lucide-react";
import { useQuery, useMutation } from"@tanstack/react-query";
import { Button } from"@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuTrigger,
 DropdownMenuItem,
 DropdownMenuSeparator,
} from"@/components/ui/dropdown-menu";
import { Badge } from"@/components/ui/badge";
import { ScrollArea } from"@/components/ui/scroll-area";
import { Card } from"@/components/ui/card";
import { apiRequest, queryClient } from"@/lib/queryClient";
import { useToast } from"@/hooks/use-toast";
import NotificationActions from"./notification-actions";

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

 // Fetch notifications
 const { data: notifications = [], isLoading } = useQuery<Notification[]>({
 queryKey: ["/api/notifications"],
 queryFn: () => 
 fetch("/api/notifications?includeRead=true&limit=20")
 .then(res => res.json()),
 refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
 });

 // Fetch unread count
 const { data: unreadData } = useQuery<{count: number}>({
 queryKey: ["/api/notifications/unread-count"],
 refetchInterval: 2 * 60 * 1000, // Check unread count every 2 minutes
 });

 const unreadCount = unreadData?.count || 0;

 // Mark notification as read mutation
 const markAsReadMutation = useMutation({
 mutationFn: (notificationId: string) =>
 apiRequest("PUT", `/api/notifications/${notificationId}/read`),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
 queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
 },
 });

 // Mark all as read mutation
 const markAllAsReadMutation = useMutation({
 mutationFn: () =>
 apiRequest("PUT","/api/notifications/mark-all-read"),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
 queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
 toast({ title:"All notifications marked as read" });
 },
 });

 // Delete notification mutation
 const deleteNotificationMutation = useMutation({
 mutationFn: (notificationId: string) =>
 apiRequest("DELETE", `/api/notifications/${notificationId}`),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
 queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
 },
 });

 // Generate smart notifications mutation
 const generateNotificationsMutation = useMutation({
 mutationFn: () =>
 apiRequest("POST","/api/notifications/generate"),
 onSuccess: (data: any) => {
 queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
 queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
 if (data.generated > 0) {
 toast({ 
 title: `Generated ${data.generated} new notifications`,
 description:"Check your notification bell for smart suggestions!"
 });
 }
 },
 });

 // Auto-generate notifications on component mount
 useEffect(() => {
 // Generate notifications after a short delay
 const timer = setTimeout(() => {
 generateNotificationsMutation.mutate();
 }, 3000);

 return () => clearTimeout(timer);
 }, []);

 const createHandleNotificationClick = (handlers: any) => (notification: Notification) => {
 // Mark as read if not already read
 if (!notification.isRead) {
 markAsReadMutation.mutate(notification.id);
 }

 // Handle action if present
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
 // Need to fetch goal data for add funds - this is a simplified version
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

 const getPriorityColor = (priority: string) => {
 switch (priority) {
 case 'urgent':
 return 'bg-red-500';
 case 'high':
 return 'bg-orange-500';
 case 'normal':
 return 'bg-blue-500';
 case 'low':
 return 'bg-gray-500';
 default:
 return 'bg-blue-500';
 }
 };

 const getCategoryIcon = (category: string) => {
 switch (category) {
 case 'goals':
 return 'Long-term';
 case 'transactions':
 return"Money";
 case 'budget':
 return"Warning";
 case 'achievements':
 return"Success";
 case 'suggestions':
 return"Insight";
 default:
 return '📋';
 }
 };

 const formatTimeAgo = (dateString: string) => {
 const date = new Date(dateString);
 const now = new Date();
 const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
 
 if (diffInHours < 1) {
 return 'Just now';
 } else if (diffInHours < 24) {
 return `${diffInHours}h ago`;
 } else {
 const diffInDays = Math.floor(diffInHours / 24);
 return `${diffInDays}d ago`;
 }
 };

 const recentNotifications = notifications.slice(0, 10);
 const hasUnreadNotifications = unreadCount > 0;

 return (
 <NotificationActions>
 {(handlers) => {
 const handleNotificationClick = createHandleNotificationClick(handlers);
 
 return (
 <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
 <DropdownMenuTrigger asChild>
 <Button
 variant="outline"
 size="icon"
 className={`relative ${
 hasUnreadNotifications ? 'ring-2 ring-primary/20' : ''
 }`}
 style={{
 minWidth: '44px',
 minHeight: '44px',
 borderRadius: 'var(--radius)'
 }}
 data-testid="button-notifications"
 >
 <Bell size={16} className={hasUnreadNotifications ? 'animate-pulse' : ''} />
 {unreadCount > 0 && (
 <Badge
 variant="destructive"
 className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
 data-testid="badge-unread-count"
 >
 {unreadCount > 99 ? '99+' : unreadCount}
 </Badge>
 )}
 </Button>
 </DropdownMenuTrigger>
 
 <DropdownMenuContent 
 align="end" 
 className="w-96 p-0"
 data-testid="dropdown-notifications"
 >
 <div className="p-4 border-b border-border">
 <div className="flex items-center justify-between">
 <h3 className="font-semibold text-lg">Notifications</h3>
 <div className="flex items-center gap-2">
 {unreadCount > 0 && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => markAllAsReadMutation.mutate()}
 disabled={markAllAsReadMutation.isPending}
 data-testid="button-mark-all-read"
 >
 <Check size={14} className="mr-1" />
 Mark all read
 </Button>
 )}
 <Button
 variant="ghost"
 size="sm"
 onClick={() => generateNotificationsMutation.mutate()}
 disabled={generateNotificationsMutation.isPending}
 data-testid="button-generate-notifications"
 >
 Smart Check
 </Button>
 </div>
 </div>
 {unreadCount > 0 && (
 <p className="text-sm text-muted-foreground mt-1">
 {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
 </p>
 )}
 </div>

 <ScrollArea className="h-[384px]">
 {isLoading ? (
 <div className="p-4 text-center text-muted-foreground">
 Loading notifications...
 </div>
 ) : recentNotifications.length === 0 ? (
 <div className="p-6 text-center text-muted-foreground">
 <Bell size={32} className="mx-auto mb-2 opacity-50" />
 <p className="font-medium">No notifications yet</p>
 <p className="text-sm">We'll notify you of important updates</p>
 </div>
 ) : (
 <div className="p-2">
 {recentNotifications.map((notification, index) => (
 <Card
 key={notification.id}
 className={`p-3 mb-2 cursor-pointer hover:bg-muted/50 border-l-4 ${
 !notification.isRead ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'
 }`}
 onClick={() => handleNotificationClick(notification)}
 data-testid={`notification-${index}`}
 >
 <div className="flex items-start gap-3">
 <div className="flex-shrink-0">
 <div className="flex items-center gap-1">
 <span className="text-lg">
 {getCategoryIcon(notification.category)}
 </span>
 <div
 className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}
 />
 </div>
 </div>
 
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <h4 className={`font-medium text-sm truncate ${
 !notification.isRead ? 'font-semibold' : ''
 }`}>
 {notification.title}
 </h4>
 <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
 {formatTimeAgo(notification.createdAt)}
 </span>
 </div>
 
 <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
 {notification.message}
 </p>

 {notification.actionType && (
 <div className="flex items-center gap-2">
 <Button
 size="sm"
 variant="outline"
 className="h-6 text-xs px-2"
 onClick={(e) => {
 e.stopPropagation();
 const handleNotificationAction = createHandleNotificationAction(handlers);
 handleNotificationAction({
 type: notification.actionType!,
 data: notification.actionData
 });
 }}
 data-testid={`button-action-${notification.actionType}`}
 >
 {notification.actionType === 'add_transaction' && 'Add Transaction'}
 {notification.actionType === 'create_goal' && 'Create Goal'}
 {notification.actionType === 'view_goal' && (
  <>
   <Eye size={12} className="mr-1" />
   View Goal
  </>
 )}
 {notification.actionType === 'view_transactions' && 'View Transactions'}
 </Button>
 </div>
 )}
 </div>

 <div className="flex-shrink-0">
 <Button
 variant="ghost"
 size="sm"
 className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive transition-colors"
 onClick={(e) => {
 e.stopPropagation();
 deleteNotificationMutation.mutate(notification.id);
 }}
 data-testid={`button-delete-${index}`}
 >
 <Trash2 size={12} />
 </Button>
 </div>
 </div>
 </Card>
 ))}
 </div>
 )}
 </ScrollArea>

 </DropdownMenuContent>
 </DropdownMenu>
 );
 }}
 </NotificationActions>
 );
}