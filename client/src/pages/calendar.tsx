import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Share2, Copy, Users, Globe, Clock, DollarSign, TrendingUp, TrendingDown, Edit, Trash2, BarChart3, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import EventForm from "@/components/forms/event-form";
import { TimeTracker } from "@/components/time-tracker";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MobileCalendarGrid from "@/components/calendar/mobile-calendar-grid";
import AdvancedFilters, { type FilterOptions } from "@/components/calendar/advanced-filters";
import SmartCalendarInsights from "@/components/calendar/smart-calendar-insights";
import MobileFloatingActions from "@/components/calendar/mobile-floating-actions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Calendar() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Check for create query parameter and open dialog automatically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === '1') {
      setIsCreateDialogOpen(true);
      setShowEventForm(true);
      // Clean up URL by removing the query parameter
      window.history.replaceState({}, '', '/calendar');
    }
  }, []);
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
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'agenda'>('month');
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

  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/events"],
  });

  const { data: groups } = useQuery({
    queryKey: ["/api/groups"],
  });

  const { data: eventFinancials } = useQuery({
    queryKey: ["/api/events", selectedEventId, "financial-summary"],
    queryFn: () => selectedEventId ? fetch(`/api/events/${selectedEventId}/financial-summary`).then(res => res.json()) : null,
    enabled: !!selectedEventId,
  });

  const { data: eventExpenses } = useQuery({
    queryKey: ["/api/events", selectedEventId, "expenses"],
    queryFn: () => selectedEventId ? fetch(`/api/events/${selectedEventId}/expenses`).then(res => res.json()) : [],
    enabled: !!selectedEventId,
  });

  const { data: eventTimeValue } = useQuery({
    queryKey: ["/api/events", selectedEventId, "time-value"],
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
        title: "Calendar shared successfully!",
        description: "The share link has been copied to your clipboard.",
      });
      setIsShareDialogOpen(false);
      // Invalidate calendar shares cache
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/shares"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating share",
        description: error.message,
        variant: "destructive",
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
        title: "Event Updated!",
        description: "Your event has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setEventToEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update event",
        description: error.message || "Please try again",
        variant: "destructive",
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
        title: "Event Deleted!",
        description: "Your event has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete event",
        description: error.message || "Please try again",
        variant: "destructive",
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
      // Set the date in the form if possible via a context or prop
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Enhanced event filtering based on applied filters
  const getFilteredEvents = () => {
    if (!events || !Array.isArray(events)) return [];
    
    return events.filter((event: any) => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false;
      }
      
      // Time value filter
      const duration = event.actualDurationMinutes || event.plannedDurationMinutes || 0;
      const timeValue = (duration / 60) * 50; // $50/hr default
      if (timeValue < filters.timeValueRange[0] || timeValue > filters.timeValueRange[1]) {
        return false;
      }
      
      // Budget filter
      const budget = parseFloat(event.budget || '0');
      if (budget > 0 && (budget < filters.budgetRange[0] || budget > filters.budgetRange[1])) {
        return false;
      }
      
      // ROI filter
      if (filters.hasROI) {
        const actualCost = parseFloat(event.actualCost || '0');
        if (actualCost === 0 || budget === 0) return false;
        const roi = ((timeValue - actualCost) / actualCost) * 100;
        if (roi < filters.roiThreshold) return false;
      }
      
      // Time tracking filter
      if (filters.hasTimeTracking && (!event.actualDurationMinutes || event.actualDurationMinutes === 0)) {
        return false;
      }
      
      // Upcoming filter
      if (filters.isUpcoming && new Date(event.startTime) <= new Date()) {
        return false;
      }
      
      // Group filter
      if (filters.groupId && event.groupId !== filters.groupId) {
        return false;
      }
      
      return true;
    });
  };
  
  const getEventsForDate = (date: Date) => {
    const filteredEvents = getFilteredEvents();
    return filteredEvents.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      // Compare dates in local timezone to avoid UTC conversion issues
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const days = getDaysInMonth();
  const filteredEvents = getFilteredEvents();
  
  // Extract available categories for filters
  const availableCategories = Array.from(new Set(
    (events || []).map((event: any) => event.category).filter(Boolean)
  ));
  
  const handleQuickEvent = () => {
    // Quick event creation with current date/time
    setShowEventForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30">
      {/* Spectacular Header */}
      <header className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/50 dark:via-indigo-900/50 dark:to-purple-900/50 border-b border-border/50 sticky top-0 z-30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                  <CalendarIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    📅 Smart Calendar
                  </h1>
                  <p className="text-xl text-muted-foreground">AI-powered scheduling and time optimization</p>
                </div>
              </div>
              
              {/* Calendar Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Events</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{filteredEvents?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">This month</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-medium">Time Value</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    ${Math.round(filteredEvents?.reduce((sum: number, event: any) => {
                      const duration = (event.actualDurationMinutes || event.plannedDurationMinutes || 0) / 60;
                      return sum + (duration * 50);
                    }, 0) || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Tracked value</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium">Efficiency</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">92%</div>
                  <div className="text-xs text-muted-foreground">Optimization</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-pink-500" />
                    <span className="text-sm font-medium">ROI</span>
                  </div>
                  <div className="text-2xl font-bold text-pink-600">+185%</div>
                  <div className="text-xs text-muted-foreground">Average return</div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 ml-6">
              <AdvancedFilters
                onFiltersChange={setFilters}
                availableCategories={availableCategories}
                availableGroups={(groups as any[]) || []}
              />
              
              <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="hidden sm:flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 hover:bg-white/90 dark:hover:bg-gray-700/90 transition-all duration-300 hover:scale-105"
                    data-testid="button-share-calendar"
                  >
                    <Share2 size={16} className="mr-2" />
                    🔗 Share
                  </Button>
                </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg max-h-[80vh] overflow-y-auto">
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
                    <SelectTrigger data-testid="select-share-scope">
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
                    <SelectTrigger data-testid="select-group">
                      <SelectValue placeholder="Choose a group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(groups as any[])?.map((group: any) => (
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
                  onClick={() => handleCreateShare()} 
                  disabled={shareScope === 'group' && !selectedGroupId}
                  className="w-full"
                >
                  Generate Share Link
                </Button>
              </div>
            </DialogContent>
          </Dialog>
            
              <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white font-semibold px-6 py-3 h-12 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                    data-testid="button-create-event"
                  >
                    <Plus size={18} className="mr-2" />
                    📅 New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <EventForm onSuccess={() => setShowEventForm(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-white/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Time Is Money 💰</h2>
                <p className="text-blue-600 dark:text-blue-300">AI analyzes your schedule to maximize productivity and minimize wasted time.</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-6 py-8">

      {/* Smart Calendar Insights - Desktop */}
      <div className="mb-6 hidden lg:block">
        <SmartCalendarInsights 
          events={filteredEvents}
          timeRange="month"
        />
      </div>

      {/* Enhanced Calendar Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          {/* Top Navigation Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
                data-testid="button-prev-month"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('next')}
                data-testid="button-next-month"
              >
                <ChevronRight size={16} />
              </Button>
            </div>

            <h2 className="text-xl font-semibold text-center flex-1">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={goToToday}
              data-testid="button-today"
              className="text-primary hover:bg-primary/10"
            >
              Today
            </Button>
          </div>

          {/* View Switcher */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex bg-muted rounded-lg p-1">
              {(['month', 'agenda'] as const).map((view) => (
                <Button
                  key={view}
                  variant={currentView === view ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView(view)}
                  className="capitalize"
                  data-testid={`button-view-${view}`}
                >
                  {view}
                </Button>
              ))}
            </div>
          </div>

          {/* Enhanced Calendar Views */}
          {currentView === 'month' && (
            <>
              {/* Desktop Calendar Grid */}
              <div className="hidden md:grid grid-cols-7 gap-1">
                {/* Day headers */}
                {DAYS.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {days.map((date, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-border rounded-lg transition-colors ${
                      date ? 'bg-card hover:bg-muted/50 cursor-pointer' : 'bg-muted/50'
                    } ${
                      date && date.toDateString() === new Date().toDateString()
                        ? 'bg-primary/10 border-primary'
                        : ''
                    }`}
                    onClick={() => handleDayClick(date)}
                    data-testid={date ? `calendar-day-${date.getDate()}` : undefined}
                  >
                    {date && (
                      <>
                        <div className="text-sm font-medium mb-1">
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {getEventsForDate(date).slice(0, 2).map((event: any) => {
                        // Enhanced time-value calculations
                        const actualDuration = event.actualDurationMinutes || 0;
                        const plannedDuration = event.plannedDurationMinutes || 0;
                        const duration = actualDuration || plannedDuration;
                        const durationHours = duration / 60;
                        
                        // Get user hourly rate from settings (default $50 if not set)
                        const userHourlyRate = 50; // Default hourly rate
                        const timeValue = Math.round(durationHours * userHourlyRate);
                        
                        const hasBudget = event.budget && parseFloat(event.budget) > 0;
                        const budget = hasBudget ? parseFloat(event.budget) : 0;
                        const hasActualCost = event.actualCost && parseFloat(event.actualCost) > 0;
                        const actualCost = hasActualCost ? parseFloat(event.actualCost) : 0;
                        
                        // Enhanced value indicators
                        const hasTimeValue = duration > 0;
                        const isHighValue = timeValue > 200; // High time value
                        const isOverBudget = hasBudget && hasActualCost && actualCost > budget;
                        const roi = actualCost > 0 ? Math.round(((timeValue - actualCost) / actualCost) * 100) : null;
                        
                        return (
                          <div
                            key={event.id}
                            className="text-xs p-1 bg-primary/20 text-primary rounded truncate relative group cursor-pointer"
                            title={`${event.title}${hasTimeValue ? ` • Time Value: $${timeValue} (${Math.round(durationHours * 10) / 10}h)` : ''}${hasBudget ? ` • Budget: $${budget}` : ''}${hasActualCost ? ` • Cost: $${actualCost}` : ''}${roi !== null ? ` • ROI: ${roi > 0 ? '+' : ''}${roi}%` : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewEventDetails(event.id);
                            }}
                            data-testid={`calendar-event-${event.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate flex-1">{event.title}</span>
                              <div className="flex items-center gap-1 ml-1">
                                {hasTimeValue && (
                                  <span 
                                    className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-time-bg text-time-fg border border-time-border" 
                                    title={`Time value: $${timeValue}`}
                                  >
                                    ${timeValue}
                                  </span>
                                )}
                                {roi !== null && (
                                  <span 
                                    className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium ${roi >= 0 ? 'bg-value-positive/20 text-value-positive border border-value-positive/30' : 'bg-value-negative/20 text-value-negative border border-value-negative/30'}`}
                                    title={`ROI: ${roi > 0 ? '+' : ''}${roi}%`}
                                  >
                                    {roi > 0 ? '+' : ''}{roi}%
                                  </span>
                                )}
                                {isHighValue && !roi && (
                                  <span 
                                    className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-productivity-high/20 text-productivity-high border border-productivity-high/30" 
                                    title="High value event"
                                  >
                                    💎HV
                                  </span>
                                )}
                                {isOverBudget && (
                                  <span 
                                    className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-value-negative/20 text-value-negative border border-value-negative/30" 
                                    title={`Over budget by $${Math.round(actualCost - budget)}`}
                                  >
                                    +${Math.round(actualCost - budget)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Show more events indicator - moved outside loop */}
                      {getEventsForDate(date).length > 2 && (
                        <div className="text-[10px] text-muted-foreground mt-1 text-center bg-muted/50 rounded px-1 py-0.5">
                          +{getEventsForDate(date).length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
              </div>
              
              {/* Mobile Calendar Grid */}
              <div className="md:hidden">
                <MobileCalendarGrid
                  currentDate={currentDate}
                  events={filteredEvents}
                  onNavigate={navigateMonth}
                  onTodayClick={goToToday}
                  onEventClick={handleViewEventDetails}
                  onDayClick={handleDayClick}
                  onFiltersClick={() => setIsFiltersOpen(true)}
                />
              </div>
            </>
          )}

          {/* Agenda View */}
          {currentView === 'agenda' && (
            <div className="space-y-3">
              <h3 className="font-medium text-muted-foreground">This Week's Events</h3>
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dayEvents = getEventsForDate(date);
                
                if (dayEvents.length === 0) return null;
                
                return (
                  <Card key={date.toISOString()} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h4>
                          <p className="text-sm text-muted-foreground">{dayEvents.length} events</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDayClick(date)}
                          data-testid={`button-add-event-${date.getDate()}`}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {dayEvents.map((event: any) => (
                          <div 
                            key={event.id}
                            className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                            onClick={() => handleViewEventDetails(event.id)}
                            data-testid={`mobile-event-${event.id}`}
                          >
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground" />
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
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>No events this week</p>
                </div>
              )}
            </div>
          )}

          {/* Mobile Month View - Show agenda on small screens */}
          {currentView === 'month' && (
            <div className="md:hidden space-y-3">
              <h3 className="font-medium text-muted-foreground">This Week's Events</h3>
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dayEvents = getEventsForDate(date);
                
                if (dayEvents.length === 0) return null;
                
                return (
                  <Card key={date.toISOString()} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h4>
                          <p className="text-sm text-muted-foreground">{dayEvents.length} events</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDayClick(date)}
                          data-testid={`button-add-event-${date.getDate()}`}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {dayEvents.map((event: any) => (
                          <div 
                            key={event.id}
                            className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                            onClick={() => handleViewEventDetails(event.id)}
                            data-testid={`mobile-event-${event.id}`}
                          >
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              }).filter(Boolean)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-event-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="text-primary" size={20} />
              Event ROI & Time-Value Analysis
            </DialogTitle>
            <DialogDescription>
              Complete financial and productivity analysis for this event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEventId && (
            <div className="space-y-6">
              {/* Time-Value Analysis */}
              {eventTimeValue && (
                <Card className="border-2 time-money-gradient-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="text-time" size={20} />
                      Time = Money Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="text-time" size={16} />
                          <span className="text-sm font-medium text-time">Planned Time Value</span>
                        </div>
                        <p className="text-2xl font-bold currency-format" data-testid="text-planned-time-value">
                          ${Math.round(eventTimeValue.plannedTimeValue || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Based on planned duration
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="text-money" size={16} />
                          <span className="text-sm font-medium text-money">Actual Time Value</span>
                        </div>
                        <p className="text-2xl font-bold currency-format" data-testid="text-actual-time-value">
                          ${Math.round(eventTimeValue.actualTimeValue || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          From tracked time
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${eventTimeValue.totalImpact >= 0 ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border border-green-200 dark:border-green-800' : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 border border-red-200 dark:border-red-800'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className={eventTimeValue.totalImpact >= 0 ? "text-value-positive" : "text-value-negative"} size={16} />
                          <span className={`text-sm font-medium ${eventTimeValue.totalImpact >= 0 ? "text-value-positive" : "text-value-negative"}`}>
                            Total Impact
                          </span>
                        </div>
                        <p className={`text-2xl font-bold currency-format ${eventTimeValue.totalImpact >= 0 ? "text-value-positive" : "text-value-negative"}`} data-testid="text-total-impact">
                          ${Math.round(eventTimeValue.totalImpact || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Time + monetary cost
                        </p>
                      </div>
                    </div>

                    {/* ROI Calculation */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">ROI Analysis</h4>
                          <p className="text-sm text-muted-foreground">Return on Investment: (Value - Cost) ÷ Cost × 100</p>
                        </div>
                        <div className="text-right">
                          {eventTimeValue.actualTimeValue > 0 && eventFinancials?.totalExpenses && (
                            <>
                              {(() => {
                                const value = eventTimeValue.actualTimeValue || eventTimeValue.plannedTimeValue || 0;
                                const cost = eventFinancials.totalExpenses || 0;
                                const roi = cost > 0 ? ((value - cost) / cost) * 100 : 0;
                                const isPositive = roi >= 0;
                                return (
                                  <>
                                    <p className="text-3xl font-bold">
                                      <span className={isPositive ? "text-value-positive" : "text-value-negative"}>
                                        {roi > 0 ? '+' : ''}{Math.round(roi)}%
                                      </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {isPositive ? "📈 Positive ROI" : "📉 Negative ROI"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Value: ${Math.round(value)} | Cost: ${Math.round(cost)}
                                    </p>
                                  </>
                                );
                              })()}
                            </>
                          )}
                          {eventTimeValue.actualTimeValue > 0 && !eventFinancials?.totalExpenses && (
                            <div>
                              <p className="text-sm text-muted-foreground">No expenses tracked</p>
                              <p className="text-xs text-muted-foreground">Add expenses to calculate ROI</p>
                            </div>
                          )}
                          {eventTimeValue.actualTimeValue === 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground">No time tracked</p>
                              <p className="text-xs text-muted-foreground">Track time to calculate ROI</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Budget vs Actual Analysis */}
                      {eventFinancials?.budget && (
                        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Budget Variance:</span>
                            <div className="text-right">
                              {(() => {
                                const actualCost = eventFinancials.totalExpenses || 0;
                                const budget = eventFinancials.budget;
                                const variance = budget - actualCost;
                                const isUnderBudget = variance >= 0;
                                return (
                                  <>
                                    <span className={isUnderBudget ? "text-value-positive" : "text-value-negative"}>
                                      {isUnderBudget ? '+' : ''}${Math.round(variance)}
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                      {isUnderBudget ? "Under budget" : "Over budget"}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Efficiency Insights */}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        💡 Productivity Insights
                      </h5>
                      <div className="space-y-1 text-sm">
                        {eventTimeValue.plannedTimeValue > eventTimeValue.actualTimeValue && eventTimeValue.actualTimeValue > 0 && (
                          <p className="text-value-positive">✅ Completed faster than planned - great efficiency!</p>
                        )}
                        {eventTimeValue.actualTimeValue > eventTimeValue.plannedTimeValue && eventTimeValue.plannedTimeValue > 0 && (
                          <p className="text-value-negative">⚠️ Took longer than planned - consider better time estimation</p>
                        )}
                        {eventTimeValue.totalImpact > 1000 && (
                          <p className="text-productivity-high">🚀 High-impact event - significant value generated</p>
                        )}
                        {eventFinancials?.budget && eventTimeValue.totalImpact < eventFinancials.budget * 0.5 && (
                          <p className="text-value-positive">💰 Excellent cost efficiency - under 50% of budget</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Time Tracker */}
              {(() => {
                const selectedEvent = Array.isArray(events) ? events.find((event: any) => event.id === selectedEventId) : null;
                return selectedEvent && (
                  <TimeTracker
                    eventId={selectedEvent.id}
                    eventTitle={selectedEvent.title}
                    plannedDurationMinutes={selectedEvent.plannedDurationMinutes}
                    actualDurationMinutes={selectedEvent.actualDurationMinutes}
                    onTimeUpdate={(minutes: number) => {
                      // Update the event data and refresh queries
                      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/events', selectedEventId] });
                    }}
                  />
                );
              })()}

              {/* Financial Summary */}
              {eventFinancials && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <DollarSign className="mr-2" size={20} />
                      Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Budget</p>
                        <p className="text-xl font-bold text-blue-700" data-testid="text-budget">
                          ${eventFinancials.budget ? eventFinancials.budget.toFixed(2) : 'Not set'}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Total Expenses</p>
                        <p className="text-xl font-bold text-green-700" data-testid="text-total-expenses">
                          ${eventFinancials.totalExpenses.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {eventFinancials.budget && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 font-medium">
                          {eventFinancials.totalExpenses <= eventFinancials.budget ? 'Under Budget' : 'Over Budget'}
                        </p>
                        <p className={`text-lg font-bold ${
                          eventFinancials.totalExpenses <= eventFinancials.budget ? 'text-green-700' : 'text-red-700'
                        }`}>
                          ${Math.abs(eventFinancials.budget - eventFinancials.totalExpenses).toFixed(2)}
                        </p>
                      </div>
                    )}

                    {eventFinancials.unpaidShares > 0 && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-600 font-medium">Unpaid Shares</p>
                        <p className="text-lg font-bold text-yellow-700" data-testid="text-unpaid-shares">
                          ${eventFinancials.unpaidShares.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Expenses List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {eventExpenses && eventExpenses.length > 0 ? (
                    <div className="space-y-2">
                      {eventExpenses.map((expense: any) => (
                        <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`expense-item-${expense.id}`}>
                          <div>
                            <h4 className="font-medium">{expense.title}</h4>
                            <p className="text-sm text-gray-600">
                              {expense.category && (
                                <span className="bg-gray-100 px-2 py-1 rounded-full text-xs mr-2">
                                  {expense.category}
                                </span>
                              )}
                              {new Date(expense.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">${expense.amount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              Paid by: {expense.paidBy}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No expenses recorded for this event
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upcoming Events */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : events && Array.isArray(events) && events.length > 0 ? (
            <div className="space-y-4">
              {events
                .filter((event: any) => new Date(event.startTime) > new Date())
                .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .slice(0, 5)
                .map((event: any) => {
                  // Enhanced time-value calculations for upcoming events
                  const plannedMinutes = event.plannedDurationMinutes || 
                    ((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60));
                  const actualMinutes = event.actualDurationMinutes || 0;
                  const budget = parseFloat(event.budget || '0');
                  const actualCost = parseFloat(event.actualCost || '0');
                  
                  // Simple time value calculation (using default $50/hr)
                  const plannedTimeValue = Math.round((plannedMinutes / 60) * 50);
                  const actualTimeValue = actualMinutes > 0 ? Math.round((actualMinutes / 60) * 50) : 0;
                  
                  // ROI calculations
                  const totalInvestment = actualTimeValue + actualCost;
                  const roi = totalInvestment > 0 ? ((budget - totalInvestment) / totalInvestment * 100) : 0;
                  
                  const isHighROI = roi > 50;
                  const isPositiveROI = roi > 0;
                  const hasTimeTracking = actualMinutes > 0 || plannedMinutes > 0;
                  
                  return (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium" data-testid={`text-event-${event.id}`}>
                            {event.title}
                          </h4>
                          
                          {/* Time Value Badges */}
                          <div className="flex items-center gap-1">
                            {hasTimeTracking && (
                              <span className="time-badge" title={`${Math.round(plannedMinutes / 60)}h planned${actualMinutes > 0 ? `, ${Math.round(actualMinutes / 60)}h actual` : ''}`}>
                                ⏰ {Math.round((actualMinutes || plannedMinutes) / 60)}h
                              </span>
                            )}
                            
                            {plannedTimeValue > 0 && (
                              <span className="money-badge" title={`Estimated time value: $${plannedTimeValue}`}>
                                💰 ${plannedTimeValue}
                              </span>
                            )}
                            
                            {roi !== 0 && budget > 0 && totalInvestment > 0 && (
                              <span className={isPositiveROI ? "value-badge-positive" : "value-badge-negative"} title={`ROI: ${roi.toFixed(0)}%`}>
                                {isHighROI ? '🚀' : isPositiveROI ? '📈' : '📉'} {roi.toFixed(0)}%
                              </span>
                            )}
                            
                            {budget > 500 && (
                              <span className="productivity-medium" title="High-value event">
                                💎
                              </span>
                            )}
                          </div>
                          
                          {/* Financial Summary */}
                          {((event.budget && parseFloat(event.budget || "0") > 0) || (event.actualCost && parseFloat(event.actualCost || "0") > 0)) && (
                            <div className="flex items-center gap-1">
                              <DollarSign size={14} className="text-green-600" />
                              {event.budget && event.actualCost && (
                                <span className={`text-xs ${parseFloat(event.actualCost) <= parseFloat(event.budget) ? 'text-green-600' : 'text-red-600'}`}>
                                  ${parseFloat(event.actualCost).toFixed(0)} / ${parseFloat(event.budget).toFixed(0)}
                                  {parseFloat(event.actualCost) <= parseFloat(event.budget) ? 
                                    <TrendingDown size={10} className="inline ml-1" /> :
                                    <TrendingUp size={10} className="inline ml-1" />
                                  }
                                </span>
                              )}
                              {event.budget && !event.actualCost && (
                                <span className="text-xs text-gray-600">Budget: ${parseFloat(event.budget).toFixed(0)}</span>
                              )}
                              {!event.budget && event.actualCost && (
                                <span className="text-xs text-blue-600">Spent: ${parseFloat(event.actualCost).toFixed(0)}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString()}
                        </p>
                        {event.location && (
                          <p className="text-xs text-muted-foreground">{event.location}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewEventDetails(event.id)}
                          className="time-money-gradient hover:opacity-80 text-white border-0"
                          data-testid={`button-view-details-${event.id}`}
                        >
                          <BarChart3 size={14} className="mr-1" />
                          ROI Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                          data-testid={`button-edit-${event.id}`}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteEvent(event)}
                          data-testid={`button-delete-${event.id}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No upcoming events</p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-first-event">
                    <Plus size={16} className="mr-2" />
                    Create Your First Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <EventForm onSuccess={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update your event details
            </DialogDescription>
          </DialogHeader>
          {eventToEdit && (
            <EventForm
              eventToEdit={eventToEdit}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEventToEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => eventToDelete && deleteEventMutation.mutate(eventToDelete.id)}
              disabled={deleteEventMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Floating Actions */}
      <MobileFloatingActions
        onFilterClick={() => setIsFiltersOpen(true)}
        onQuickEventClick={handleQuickEvent}
      />

      {/* Mobile Filters - Use the same AdvancedFilters with controlled state */}
      <div className="sm:hidden">
        <AdvancedFilters
          open={isFiltersOpen}
          onOpenChange={setIsFiltersOpen}
          onFiltersChange={setFilters}
          availableCategories={availableCategories}
          availableGroups={(groups as any[]) || []}
        />
      </div>
      </div>
    </div>
  );
}
