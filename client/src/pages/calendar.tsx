import { useState, useEffect, useMemo, useCallback } from"react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Share2, Users, Globe, Clock, DollarSign, TrendingUp, Edit, Trash2, BarChart3, Filter, ChevronDown, Sparkles } from"lucide-react";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from"@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { Label } from"@/components/ui/label";
import { Badge } from"@/components/ui/badge";
import EventForm from"@/components/forms/event-form";
import { TimeTracker } from"@/components/time-tracker";
import { apiRequest } from"@/lib/queryClient";
import { useToast } from"@/hooks/use-toast";
import { useIsMobile } from"@/hooks/use-mobile";
import AdvancedFilters, { type FilterOptions } from"@/components/calendar/advanced-filters";
import SmartCalendarInsights from"@/components/calendar/smart-calendar-insights";

const DAYS_SHORT = ["S","M","T","W","T","F","S"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = [
"January","February","March","April","May","June",
"July","August","September","October","November","December"
];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Calendar() {
 const { t } = useTranslation();
 const isMobile = useIsMobile();
 const [currentDate, setCurrentDate] = useState(new Date());
 const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
 const [showEventForm, setShowEventForm] = useState(false);
 const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
 const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
 const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
 const [shareScope, setShareScope] = useState<'user' | 'group'>('user');
 const [selectedGroupId, setSelectedGroupId] = useState<string>('');
 const [shareExpiry, setShareExpiry] = useState<string>('30');
 const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
 const [eventToEdit, setEventToEdit] = useState<any>(null);
 const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
 const [eventToDelete, setEventToDelete] = useState<any>(null);
 const [currentView, setCurrentView] = useState<'month' | 'agenda'>('month');
 const [isFiltersOpen, setIsFiltersOpen] = useState(false);
 const [filters, setFilters] = useState<FilterOptions>({
 categories: [],
 timeValueRange: [0, 2000],
 budgetRange: [0, 5000],
 roiThreshold: 0,
 hasROI: false,
 hasTimeTracking: false,
 isUpcoming: false,
 groupId: null
 });
 const { toast } = useToast();
 const queryClient = useQueryClient();

 // Check for create query parameter
 useEffect(() => {
 const urlParams = new URLSearchParams(window.location.search);
 if (urlParams.get('create') === '1') {
 setIsCreateDialogOpen(true);
 setShowEventForm(true);
 window.history.replaceState({}, '', '/calendar');
 }
 }, []);

 const { data: events = [], isLoading } = useQuery<any[]>({
 queryKey: ["/api/events"],
 });

 const { data: groups = [] } = useQuery<any[]>({
 queryKey: ["/api/groups"],
 });

 const { data: eventFinancials } = useQuery({
 queryKey: ["/api/events", selectedEventId,"financial-summary"],
 queryFn: () => selectedEventId ? fetch(`/api/events/${selectedEventId}/financial-summary`).then(res => res.json()) : null,
 enabled: !!selectedEventId,
 });

 const { data: eventExpenses } = useQuery({
 queryKey: ["/api/events", selectedEventId,"expenses"],
 queryFn: () => selectedEventId ? fetch(`/api/events/${selectedEventId}/expenses`).then(res => res.json()) : [],
 enabled: !!selectedEventId,
 });

 const { data: eventTimeValue } = useQuery({
 queryKey: ["/api/events", selectedEventId,"time-value"],
 queryFn: () => selectedEventId ? fetch(`/api/events/${selectedEventId}/time-value`).then(res => res.json()) : null,
 enabled: !!selectedEventId,
 });

 const createShareMutation = useMutation({
 mutationFn: async (shareData: { scope: 'user' | 'group', groupId?: string, expiresAt?: Date }) => {
 const response = await apiRequest('POST', '/api/calendar/shares', shareData);
 return await response.json();
 },
 onSuccess: (data: any) => {
 const shareUrl = `${window.location.origin}/shared/calendar/${data.share.token}`;
 navigator.clipboard.writeText(shareUrl);
 toast({
 title:"Calendar shared successfully!",
 description:"The share link has been copied to your clipboard.",
 });
 setIsShareDialogOpen(false);
 queryClient.invalidateQueries({ queryKey: ["/api/calendar/shares"] });
 },
 onError: (error: any) => {
 toast({
 title:"Error creating share",
 description: error.message,
 variant:"destructive",
 });
 },
 });

 const updateEventMutation = useMutation({
 mutationFn: async ({ eventId, data }: { eventId: string, data: any }) => {
 const response = await apiRequest("PUT", `/api/events/${eventId}`, data);
 return response.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/events"] });
 queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
 toast({
 title:"Event Updated!",
 description:"Your event has been updated successfully.",
 });
 setIsEditDialogOpen(false);
 setEventToEdit(null);
 },
 onError: (error: any) => {
 toast({
 title:"Failed to update event",
 description: error.message ||"Please try again",
 variant:"destructive",
 });
 },
 });

 const deleteEventMutation = useMutation({
 mutationFn: async (eventId: string) => {
 await apiRequest("DELETE", `/api/events/${eventId}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/events"] });
 queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
 toast({
 title:"Event Deleted!",
 description:"Your event has been deleted successfully.",
 });
 setIsDeleteDialogOpen(false);
 setEventToDelete(null);
 },
 onError: (error: any) => {
 toast({
 title:"Failed to delete event",
 description: error.message ||"Please try again",
 variant:"destructive",
 });
 },
 });

 const handleCreateShare = () => {
 const expiresAt = new Date(Date.now() + parseInt(shareExpiry) * 24 * 60 * 60 * 1000);
 const shareData: any = {
 scope: shareScope,
 expiresAt,
 };
 
 if (shareScope === 'group' && selectedGroupId) {
 shareData.groupId = selectedGroupId;
 }
 
 createShareMutation.mutate(shareData);
 };

 const handleViewEventDetails = (eventId: string) => {
 setSelectedEventId(eventId);
 setIsEventDetailsOpen(true);
 };

 const handleEditEvent = (event: any) => {
 setEventToEdit(event);
 setIsEditDialogOpen(true);
 };

 const handleDeleteEvent = (event: any) => {
 setEventToDelete(event);
 setIsDeleteDialogOpen(true);
 };

 const navigateMonth = (direction: 'prev' | 'next') => {
 const newDate = new Date(currentDate);
 newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
 setCurrentDate(newDate);
 };

 const goToToday = () => {
 setCurrentDate(new Date());
 };

 const handleDayClick = (date: Date | null) => {
 if (date && currentView === 'month') {
 setSelectedEventId(null);
 setShowEventForm(true);
 }
 };

 const days = useMemo(() => {
 const year = currentDate.getFullYear();
 const month = currentDate.getMonth();
 const firstDay = new Date(year, month, 1);
 const lastDay = new Date(year, month + 1, 0);
 const daysInMonth = lastDay.getDate();
 const startingDayOfWeek = firstDay.getDay();

 const result = [];
 for (let i = 0; i < startingDayOfWeek; i++) {
 result.push(null);
 }
 for (let day = 1; day <= daysInMonth; day++) {
 result.push(new Date(year, month, day));
 }
 return result;
 }, [currentDate]);

 const filteredEvents = useMemo(() => {
 if (!events || !Array.isArray(events)) return [];
 
 return events.filter((event: any) => {
 if (filters.categories.length > 0 && !filters.categories.includes(event.category)) return false;
 
 const duration = event.actualDurationMinutes || event.plannedDurationMinutes || 0;
 const timeValue = (duration / 60) * 50;
 if (timeValue < filters.timeValueRange[0] || timeValue > filters.timeValueRange[1]) return false;
 
 const budget = parseFloat(event.budget || '0');
 if (budget > 0 && (budget < filters.budgetRange[0] || budget > filters.budgetRange[1])) return false;
 
 if (filters.hasROI) {
 const actualCost = parseFloat(event.actualCost || '0');
 if (actualCost === 0 || budget === 0) return false;
 const roi = ((timeValue - actualCost) / actualCost) * 100;
 if (roi < filters.roiThreshold) return false;
 }
 
 if (filters.hasTimeTracking && (!event.actualDurationMinutes || event.actualDurationMinutes === 0)) return false;
 if (filters.isUpcoming && new Date(event.startTime) <= new Date()) return false;
 if (filters.groupId && event.groupId !== filters.groupId) return false;
 
 return true;
 });
 }, [events, filters]);

 const eventsGroupedByDate = useMemo(() => {
 const map = new Map<string, any[]>();
 filteredEvents.forEach((event: any) => {
 const eventDate = new Date(event.startTime);
 const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
 if (!map.has(key)) {
 map.set(key, []);
 }
 map.get(key)!.push(event);
 });
 return map;
 }, [filteredEvents]);
 
 const getEventsForDate = useCallback((date: Date) => {
 const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
 return eventsGroupedByDate.get(key) || [];
 }, [eventsGroupedByDate]);

 const availableCategories: string[] = useMemo(() => 
 Array.from(new Set(events.map((event: any) => event.category).filter(Boolean))),
 [events]);

 return (
 <div className="min-h-screen bg-background">
 {/* Clean Professional Header - Compact on mobile */}
 <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
 <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-6">
 <div className="flex items-center justify-between gap-2 sm:gap-4">
 <div className="flex-1 min-w-0">
 <h1 className="text-lg sm:text-3xl font-semibold tracking-tight text-foreground">
 Calendar
 </h1>
 <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Manage your schedule and events</p>
 </div>
 
 {/* Action Buttons - Touch-friendly */}
 <div className="flex items-center gap-2 flex-shrink-0">
 <AdvancedFilters
 onFiltersChange={setFilters}
 availableCategories={availableCategories}
 availableGroups={groups}
 open={isFiltersOpen}
 onOpenChange={setIsFiltersOpen}
 />
 
 <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
 <DialogTrigger asChild>
 <Button 
 variant="outline" 
 className="min-h-[44px]"
 data-testid="button-share-calendar"
 >
 <Share2 size={18} className={isMobile ?"" :"mr-2"} />
 {!isMobile && <span className="hidden sm:inline">Share</span>}
 </Button>
 </DialogTrigger>
 <DialogContent className="w-[95vw] max-w-lg">
 <DialogHeader>
 <DialogTitle>Share Your Calendar</DialogTitle>
 <DialogDescription>
 Create a shareable link to let others view your calendar or group events.
 </DialogDescription>
 </DialogHeader>
 
 <div className="space-y-4">
 <div>
 <Label htmlFor="share-scope">Share Type</Label>
 <Select value={shareScope} onValueChange={(value: 'user' | 'group') => setShareScope(value)}>
 <SelectTrigger className="h-12" data-testid="select-share-scope">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="user">
 <div className="flex items-center">
 <Globe size={16} className="mr-2" />
 My Personal Calendar
 </div>
 </SelectItem>
 <SelectItem value="group">
 <div className="flex items-center">
 <Users size={16} className="mr-2" />
 Group Calendar
 </div>
 </SelectItem>
 </SelectContent>
 </Select>
 </div>
 
 {shareScope === 'group' && (
 <div>
 <Label htmlFor="group-select">Select Group</Label>
 <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
 <SelectTrigger className="h-12" data-testid="select-group">
 <SelectValue placeholder="Choose a group..." />
 </SelectTrigger>
 <SelectContent>
 {groups?.map((group: any) => (
 <SelectItem key={group.id} value={group.id}>
 <div className="flex items-center">
 <CalendarIcon size={16} className="mr-2" />
 {group.name}
 </div>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 )}
 
 <Button 
 onClick={handleCreateShare} 
 disabled={shareScope === 'group' && !selectedGroupId}
 className="w-full h-12 sm:h-14 text-base font-medium"
 data-testid="button-generate-share-link"
 >
 Generate Share Link
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 
 <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
 <DialogTrigger asChild>
 <Button 
 className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm min-h-[44px]"
 data-testid="button-create-event"
 >
 <Plus size={18} className="mr-2" />
 <span className="hidden sm:inline">New Event</span>
 <span className="sm:hidden">New</span>
 </Button>
 </DialogTrigger>
 <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
 <EventForm onSuccess={() => setShowEventForm(false)} />
 </DialogContent>
 </Dialog>
 </div>
 </div>
 
 {/* Stats Cards - Responsive Grid */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
 <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
 <div className="flex items-center gap-2 mb-1">
 <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
 <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">Events</span>
 </div>
 <div className="text-xl sm:text-2xl font-bold text-blue-600">{filteredEvents?.length || 0}</div>
 <div className="text-xs text-blue-700 dark:text-blue-300">This month</div>
 </div>
 
 <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
 <div className="flex items-center gap-2 mb-1">
 <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
 <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">Value</span>
 </div>
 <div className="text-xl sm:text-2xl font-bold text-blue-600">
 ${Math.round(filteredEvents?.reduce((sum: number, event: any) => {
 const duration = (event.actualDurationMinutes || event.plannedDurationMinutes || 0) / 60;
 return sum + (duration * 50);
 }, 0) || 0)}
 </div>
 <div className="text-xs text-blue-700 dark:text-blue-300">Time value</div>
 </div>
 
 <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 dark:border-green-800">
 <div className="flex items-center gap-2 mb-1">
 <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
 <span className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">ROI</span>
 </div>
 <div className="text-xl sm:text-2xl font-bold text-green-600">+185%</div>
 <div className="text-xs text-green-700 dark:text-green-300">Avg return</div>
 </div>
 
 <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200 dark:border-amber-800">
 <div className="flex items-center gap-2 mb-1">
 <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
 <span className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-100">Efficiency</span>
 </div>
 <div className="text-xl sm:text-2xl font-bold text-amber-600">92%</div>
 <div className="text-xs text-amber-700 dark:text-amber-300">Optimized</div>
 </div>
 </div>
 </div>
 </header>
 
 <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8">
 {/* Smart Insights - Desktop Only */}
 <div className="mb-6 hidden lg:block">
 <SmartCalendarInsights 
 events={filteredEvents}
 timeRange="month"
 />
 </div>

 {/* Calendar Navigation */}
 <Card className="mb-6 shadow-lg">
 <CardContent className="p-4 sm:p-6">
 {/* Navigation Row - Mobile Optimized */}
 <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
 {/* Month Navigation */}
 <div className="flex items-center gap-1 sm:gap-2">
 <Button 
 variant="outline" 
 size="icon"
 onClick={() => navigateMonth('prev')}
 className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl"
 data-testid="button-prev-month"
 >
 <ChevronLeft className="w-5 h-5" />
 </Button>
 
 <div className="min-w-[140px] sm:min-w-[180px] text-center">
 <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
 {isMobile ? MONTHS_SHORT[currentDate.getMonth()] : MONTHS[currentDate.getMonth()]}
 </h2>
 <p className="text-xs sm:text-sm text-muted-foreground">
 {currentDate.getFullYear()}
 </p>
 </div>
 
 <Button 
 variant="outline" 
 size="icon"
 onClick={() => navigateMonth('next')}
 className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl"
 data-testid="button-next-month"
 >
 <ChevronRight className="w-5 h-5" />
 </Button>
 </div>

 {/* Today & View Switcher */}
 <div className="flex items-center gap-2">
 <Button 
 variant="ghost" 
 size={isMobile ?"sm" :"default"}
 onClick={goToToday}
 className="h-11 sm:h-12 px-3 sm:px-4 font-medium"
 data-testid="button-today"
 >
 Today
 </Button>
 </div>
 </div>

 {/* View Switcher */}
 <div className="flex justify-center mb-4">
 <div className="inline-flex bg-muted p-1 rounded-lg sm:rounded-xl">
 {(['month', 'agenda'] as const).map((view) => (
 <Button
 key={view}
 variant={currentView === view ?"default" :"ghost"}
 size={isMobile ?"sm" :"default"}
 onClick={() => setCurrentView(view)}
 className="h-10 sm:h-11 px-4 sm:px-6 capitalize font-medium transition-all"
 data-testid={`button-view-${view}`}
 >
 {view}
 </Button>
 ))}
 </div>
 </div>

 {/* Calendar Views */}
 {currentView === 'month' && (
 <>
 {/* Desktop Calendar Grid */}
 <div className="hidden md:block">
 {/* Day Headers */}
 <div className="grid grid-cols-7 gap-2 mb-2">
 {DAYS.map((day) => (
 <div key={day} className="p-3 text-center">
 <span className="text-sm font-semibold text-muted-foreground">
 {day}
 </span>
 </div>
 ))}
 </div>
 
 {/* Calendar Days */}
 <div className="grid grid-cols-7 gap-2">
 {days.map((date, index) => {
 const dayEvents = date ? getEventsForDate(date) : [];
 const isToday = date && date.toDateString() === new Date().toDateString();
 
 return (
 <div
 key={index}
 className={`
 min-h-[100px] lg:min-h-[120px] p-2 lg:p-3 border-2 rounded-xl transition-all
 ${date 
 ? 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer ' 
 : 'bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed'
 }
 ${isToday 
 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg' 
 : 'border-gray-200 dark:border-gray-700'
 }
 `}
 onClick={() => handleDayClick(date)}
 data-testid={date ? `calendar-day-${date.getDate()}` : undefined}
 >
 {date && (
 <>
 <div className={`
 text-sm lg:text-base font-semibold mb-2
 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
 `}>
 {date.getDate()}
 </div>
 <div className="space-y-1">
 {dayEvents.slice(0, 3).map((event: any) => {
 const duration = (event.actualDurationMinutes || event.plannedDurationMinutes || 0) / 60;
 const timeValue = Math.round(duration * 50);
 
 return (
 <div
 key={event.id}
 className="text-xs p-2 bg-white dark:bg-gray-900 text-blue-900 dark:text-blue-100 rounded-lg cursor-pointer group"
 title={`${event.title} - $${timeValue}`}
 onClick={(e) => {
 e.stopPropagation();
 handleViewEventDetails(event.id);
 }}
 data-testid={`calendar-event-${event.id}`}
 >
 <div className="flex items-center justify-between gap-1">
 <span className="truncate font-medium">{event.title}</span>
 {timeValue > 0 && (
 <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
 ${timeValue}
 </Badge>
 )}
 </div>
 </div>
 );
 })}
 
 {dayEvents.length > 3 && (
 <div className="text-xs text-center text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded py-1 font-medium">
 +{dayEvents.length - 3} more
 </div>
 )}
 </div>
 </>
 )}
 </div>
 );
 })}
 </div>
 </div>
 
 {/* Mobile Calendar Grid */}
 <div className="md:hidden">
 {/* Day Headers */}
 <div className="grid grid-cols-7 gap-1 mb-2">
 {DAYS_SHORT.map((day) => (
 <div key={day} className="p-2 text-center">
 <span className="text-xs font-semibold text-muted-foreground">
 {day}
 </span>
 </div>
 ))}
 </div>
 
 {/* Calendar Days - Touch Optimized */}
 <div className="grid grid-cols-7 gap-1">
 {days.map((date, index) => {
 const dayEvents = date ? getEventsForDate(date) : [];
 const isToday = date && date.toDateString() === new Date().toDateString();
 
 return (
 <div
 key={index}
 className={`
 relative aspect-square border-2 rounded-lg transition-all
 ${date 
 ? 'bg-white dark:bg-gray-800 active:bg-blue-100 dark:active:bg-blue-900/40' 
 : 'bg-gray-50 dark:bg-gray-900/50'
 }
 ${isToday 
 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md' 
 : 'border-gray-200 dark:border-gray-700'
 }
 `}
 onClick={() => handleDayClick(date)}
 data-testid={date ? `mobile-calendar-day-${date.getDate()}` : undefined}
 >
 {date && (
 <>
 <div className={`
 absolute top-1 left-0 right-0 text-center text-sm font-semibold
 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
 `}>
 {date.getDate()}
 </div>
 
 {dayEvents.length > 0 && (
 <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-0.5">
 {dayEvents.slice(0, 3).map((event, i) => {
 const duration = (event.actualDurationMinutes || event.plannedDurationMinutes || 0) / 60;
 const timeValue = Math.round(duration * 50);
 const color = timeValue > 200 ? 'bg-blue-500' : timeValue > 100 ? 'bg-blue-500' : 'bg-green-500';
 
 return (
 <div 
 key={event.id}
 className={`w-1 h-1.5 rounded-full ${color}`}
 onClick={(e) => {
 e.stopPropagation();
 handleViewEventDetails(event.id);
 }}
 />
 );
 })}
 {dayEvents.length > 3 && (
 <div className="w-1 h-1.5 rounded-full bg-gray-400" />
 )}
 </div>
 )}
 </>
 )}
 </div>
 );
 })}
 </div>
 
 {/* Mobile Event List Below Calendar */}
 <div className="mt-6 space-y-3">
 <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
 <Clock className="w-4 h-4" />
 Upcoming Events
 </h3>
 {filteredEvents
 .filter((event: any) => new Date(event.startTime) >= new Date())
 .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
 .slice(0, 5)
 .map((event: any) => (
 <Card
 key={event.id}
 className="border-l-4 border-l-blue-500 cursor-pointer"
 onClick={() => handleViewEventDetails(event.id)}
 data-testid={`mobile-event-card-${event.id}`}
 >
 <CardContent className="p-4">
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1 min-w-0">
 <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
 {event.title}
 </h4>
 <p className="text-sm text-muted-foreground">
 {new Date(event.startTime).toLocaleDateString('en-US', { 
 weekday: 'short', 
 month: 'short', 
 day: 'numeric' 
 })}
 </p>
 <p className="text-sm text-muted-foreground">
 {new Date(event.startTime).toLocaleTimeString('en-US', { 
 hour: 'numeric', 
 minute: '2-digit' 
 })}
 </p>
 </div>
 <div className="flex flex-col items-end gap-1">
 {(() => {
 const duration = (event.actualDurationMinutes || event.plannedDurationMinutes || 0) / 60;
 const timeValue = Math.round(duration * 50);
 return timeValue > 0 && (
 <Badge className="bg-blue-500 text-white">
 ${timeValue}
 </Badge>
 );
 })()}
 <ChevronRight className="w-5 h-5 text-muted-foreground" />
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 </>
 )}

 {/* Agenda View */}
 {currentView === 'agenda' && (
 <div className="space-y-3">
 <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">This Week's Events</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {Array.from({ length: 7 }, (_, i) => {
 const date = new Date();
 date.setDate(date.getDate() + i);
 const dayEvents = getEventsForDate(date);
 
 if (dayEvents.length === 0) return null;
 
 return (
 <Card key={date.toISOString()} className="border-l-4 border-l-blue-500 transition-all">
 <CardContent className="p-4 sm:p-5">
 <div className="flex items-center justify-between mb-3">
 <div>
 <h4 className="font-semibold text-gray-900 dark:text-gray-100">
 {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
 </h4>
 <p className="text-sm text-muted-foreground">{dayEvents.length} events</p>
 </div>
 <Button 
 variant="ghost" 
 size="icon"
 onClick={() => handleDayClick(date)}
 className="h-10 w-10"
 data-testid={`button-add-event-${date.getDate()}`}
 >
 <Plus size={18} />
 </Button>
 </div>
 <div className="space-y-2">
 {dayEvents.map((event: any) => (
 <div 
 key={event.id}
 className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg cursor-pointer"
 onClick={() => handleViewEventDetails(event.id)}
 data-testid={`agenda-event-${event.id}`}
 >
 <div className="flex-1 min-w-0">
 <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{event.title}</p>
 <p className="text-sm text-muted-foreground">
 {new Date(event.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
 </p>
 </div>
 <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 );
 }).filter(Boolean)}
 
 {Array.from({ length: 7 }, (_, i) => {
 const date = new Date();
 date.setDate(date.getDate() + i);
 return getEventsForDate(date);
 }).flat().length === 0 && (
 <div className="col-span-full text-center py-16">
 <div className="relative mb-10">
 <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl"></div>
 <div className="relative bg-blue-500 rounded-3xl p-6 w-32 h-32 mx-auto flex items-center justify-center shadow-2xl">
 <CalendarIcon className="h-16 w-16 text-white" />
 </div>
 </div>
 
 <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-3">
 Master Your Time
 </h3>
 <p className="text-muted-foreground text-lg mb-4 max-w-lg mx-auto">
 Plan, track, and optimize every moment with AI-powered scheduling
 </p>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
 <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
 <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
 <Clock className="h-6 w-6 text-white" />
 </div>
 <h4 className="font-bold mb-2 text-blue-800 dark:text-blue-200">Time Tracking</h4>
 <p className="text-sm text-blue-600 dark:text-blue-300">Log actual vs planned time</p>
 </div>
 
 <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
 <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
 <BarChart3 className="h-6 w-6 text-white" />
 </div>
 <h4 className="font-bold mb-2 text-blue-800 dark:text-blue-200">Event Analytics</h4>
 <p className="text-sm text-blue-600 dark:text-blue-300">Productivity insights & trends</p>
 </div>
 
 <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-pink-200/50 dark:border-pink-700/50">
 <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
 <Sparkles className="h-6 w-6 text-white" />
 </div>
 <h4 className="font-bold mb-2 text-pink-800 dark:text-pink-200">Smart Scheduling</h4>
 <p className="text-sm text-pink-600 dark:text-pink-300">AI optimizes your calendar</p>
 </div>
 </div>
 
 <Button 
 onClick={() => setShowEventForm(true)}
 size="lg"
 className="bg-blue-500 text-white font-semibold px-8 h-14 text-lg shadow-lg transition-all"
 data-testid="button-create-first-event"
 >
 <Plus size={20} className="mr-2" />
 Create Your First Event
 </Button>
 </div>
 )}
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 </div>

 {/* Event Details Dialog */}
 <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
 <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-event-details">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-xl">
 <BarChart3 className="text-primary" size={20} />
 Event Analysis
 </DialogTitle>
 <DialogDescription>
 Financial and productivity insights
 </DialogDescription>
 </DialogHeader>
 
 {selectedEventId && (() => {
 const selectedEvent = Array.isArray(events) ? events.find((event: any) => event.id === selectedEventId) : null;
 
 return selectedEvent && (
 <div className="space-y-6">
 {/* Event Info */}
 <Card>
 <CardHeader>
 <CardTitle className="text-lg">{selectedEvent.title}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 <div className="flex items-center gap-2 text-sm">
 <Clock className="w-4 h-4" />
 {new Date(selectedEvent.startTime).toLocaleString()}
 </div>
 {selectedEvent.description && (
 <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
 )}
 {selectedEvent.location && (
 <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
 )}
 </CardContent>
 </Card>

 {/* Time Tracker */}
 <TimeTracker
 eventId={selectedEvent.id}
 eventTitle={selectedEvent.title}
 plannedDurationMinutes={selectedEvent.plannedDurationMinutes}
 actualDurationMinutes={selectedEvent.actualDurationMinutes}
 onTimeUpdate={(minutes: number) => {
 queryClient.invalidateQueries({ queryKey: ['/api/events'] });
 queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEventId] });
 }}
 />

 {/* Action Buttons */}
 <div className="flex gap-3">
 <Button 
 onClick={() => handleEditEvent(selectedEvent)}
 className="flex-1 h-12 sm:h-14"
 data-testid="button-edit-event"
 >
 <Edit size={18} className="mr-2" />
 Edit Event
 </Button>
 <Button 
 variant="destructive"
 onClick={() => handleDeleteEvent(selectedEvent)}
 className="flex-1 h-12 sm:h-14"
 data-testid="button-delete-event"
 >
 <Trash2 size={18} className="mr-2" />
 Delete
 </Button>
 </div>
 </div>
 );
 })()}
 </DialogContent>
 </Dialog>

 {/* Edit Event Dialog */}
 <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
 <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
 {eventToEdit && <EventForm eventToEdit={eventToEdit} onSuccess={() => setIsEditDialogOpen(false)} />}
 </DialogContent>
 </Dialog>

 {/* Delete Confirmation Dialog */}
 <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
 <DialogContent className="w-[95vw] max-w-md">
 <DialogHeader>
 <DialogTitle>Delete Event?</DialogTitle>
 <DialogDescription>
 This action cannot be undone. The event will be permanently deleted.
 </DialogDescription>
 </DialogHeader>
 <div className="flex gap-3 mt-4">
 <Button 
 variant="outline" 
 onClick={() => setIsDeleteDialogOpen(false)}
 className="flex-1 h-12"
 data-testid="button-cancel-delete"
 >
 Cancel
 </Button>
 <Button 
 variant="destructive"
 onClick={() => eventToDelete && deleteEventMutation.mutate(eventToDelete.id)}
 className="flex-1 h-12"
 data-testid="button-confirm-delete"
 >
 Delete
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
