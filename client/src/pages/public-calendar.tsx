import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Share2, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PublicCalendar() {
  const { token } = useParams<{ token: string }>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  // Fetch shared calendar events
  const { data: events, isLoading, error } = useQuery({
    queryKey: [`/api/public/calendar/${token}`],
    queryFn: () => fetch(`/api/public/calendar/${token}`, {
      credentials: "include"
    }).then(res => {
      if (!res.ok) {
        throw new Error("Calendar not found or expired");
      }
      return res.json();
    }),
    enabled: !!token,
  });

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
    if (!events) return [];
    return events.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handleDownloadICS = () => {
    const icsUrl = `/api/public/calendar/${token}.ics`;
    const link = document.createElement('a');
    link.href = icsUrl;
    link.download = 'calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Calendar downloaded",
      description: "The calendar has been downloaded as an ICS file.",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Calendar link has been copied to clipboard.",
    });
  };

  const days = getDaysInMonth();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-xl font-semibold mb-2">Calendar Not Available</h1>
            <p className="text-muted-foreground mb-4">
              This calendar link may have expired or does not exist.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact the person who shared this calendar for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold" data-testid="text-calendar-title">
                    Shared Calendar
                  </h1>
                  <p className="text-muted-foreground">
                    View-only access to shared events
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={handleCopyLink} data-testid="button-copy-link">
                  <Share2 size={16} className="mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" onClick={handleDownloadICS} data-testid="button-download-ics">
                  <Download size={16} className="mr-2" />
                  Download ICS
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
                data-testid="button-prev-month"
              >
                <ChevronLeft size={16} />
              </Button>
              <CardTitle className="text-xl">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('next')}
                data-testid="button-next-month"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {[...Array(42)].map((_, i) => (
                  <div key={i} className="min-h-[100px] bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
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
                      date ? 'bg-card hover:bg-muted/50' : 'bg-muted/20'
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
                              className="text-xs p-1 bg-primary/20 text-primary rounded truncate cursor-pointer hover:bg-primary/30"
                              title={`${event.title} - ${new Date(event.startTime).toLocaleTimeString()} ${event.location ? `at ${event.location}` : ''}`}
                              data-testid={`event-${event.id}`}
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
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-4">
                {events
                  .filter((event: any) => new Date(event.startTime) > new Date())
                  .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 10)
                  .map((event: any) => (
                    <div key={event.id} className="p-4 border rounded-lg hover:bg-muted/50" data-testid={`upcoming-event-${event.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock size={14} className="mr-1" />
                              {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {event.location && (
                              <div className="flex items-center">
                                <MapPin size={14} className="mr-1" />
                                {event.location}
                              </div>
                            )}
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center">
                                <Users size={14} className="mr-1" />
                                {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {event.status || 'Scheduled'}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming events in this calendar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}