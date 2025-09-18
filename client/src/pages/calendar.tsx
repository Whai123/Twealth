import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Share2, Copy, Users, Globe, Clock, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import EventForm from "@/components/forms/event-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [shareScope, setShareScope] = useState<'user' | 'group'>('user');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [shareExpiry, setShareExpiry] = useState<string>('30');
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
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

  const getEventsForDate = (date: Date) => {
    if (!events || !Array.isArray(events)) return [];
    return events.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const days = getDaysInMonth();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <CalendarIcon className="mr-2" size={24} />
            Calendar
          </h1>
          <p className="text-muted-foreground">Schedule and manage your events</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-event">
                <Plus size={16} className="mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <EventForm onSuccess={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-share-calendar">
                <Share2 size={16} className="mr-2" />
                Share Calendar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: group.color }}
                              />
                              {group.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="expiry-select">Link Expires In</Label>
                  <Select value={shareExpiry} onValueChange={setShareExpiry}>
                    <SelectTrigger data-testid="select-expiry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">3 months</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleCreateShare} 
                  className="w-full"
                  disabled={createShareMutation.isPending || (shareScope === 'group' && !selectedGroupId)}
                  data-testid="button-create-share"
                >
                  {createShareMutation.isPending ? (
                    <>
                      <Clock size={16} className="mr-2 animate-spin" />
                      Creating Share Link...
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="mr-2" />
                      Create & Copy Link
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('prev')}
              data-testid="button-prev-month"
            >
              <ChevronLeft size={16} />
            </Button>
            <h2 className="text-xl font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('next')}
              data-testid="button-next-month"
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
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
                className={`min-h-[100px] p-2 border border-border rounded-lg ${
                  date ? 'bg-card hover:bg-muted cursor-pointer' : 'bg-muted/50'
                } ${
                  date && date.toDateString() === new Date().toDateString()
                    ? 'bg-primary/10 border-primary'
                    : ''
                }`}
                data-testid={date ? `calendar-day-${date.getDate()}` : undefined}
              >
                {date && (
                  <>
                    <div className="text-sm font-medium mb-1">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {getEventsForDate(date).slice(0, 2).map((event: any) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 bg-primary/20 text-primary rounded truncate"
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {getEventsForDate(date).length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{getEventsForDate(date).length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-event-details">
          <DialogHeader>
            <DialogTitle>Event Financial Details</DialogTitle>
            <DialogDescription>
              Manage expenses and track costs for this event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEventId && (
            <div className="space-y-6">
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
                              Paid by: {expense.paidBy} {/* TODO: Get user name */}
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
                .map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium" data-testid={`text-event-${event.id}`}>
                          {event.title}
                        </h4>
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewEventDetails(event.id)}
                      data-testid={`button-view-details-${event.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
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
                <DialogContent className="max-w-md">
                  <EventForm onSuccess={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
