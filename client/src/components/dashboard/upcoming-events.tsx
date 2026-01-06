import { useQuery } from"@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Avatar, AvatarFallback } from"@/components/ui/avatar";
import { Plus, Calendar } from"lucide-react";
import { Link } from"wouter";
import { SkeletonEvent } from"@/components/ui/skeleton";

// Helper function to get user initials
const getUserInitials = (user: any): string => {
 if (user.firstName && user.lastName) {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
 }
 if (user.firstName) {
  return user.firstName[0].toUpperCase();
 }
 if (user.email) {
  return user.email.slice(0, 2).toUpperCase();
 }
 return"U";
};

export default function UpcomingEvents() {
 const { data: events, isLoading } = useQuery({
  queryKey: ["/api/events/upcoming"],
  queryFn: () => fetch("/api/events/upcoming?limit=5").then(res => res.json()),
 });

 if (isLoading) {
  return (
   <Card className="p-6 shadow-sm">
    <div className="space-y-4">
     {[...Array(3)].map((_, i) => (
      <SkeletonEvent key={i} />
     ))}
    </div>
   </Card>
  );
 }

 const upcomingEvents = events || [];

 return (
  <Card className="p-6 shadow-sm">
   <CardHeader className="p-0 mb-6">
    <div className="flex items-center justify-between">
     <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
     <Button variant="ghost" size="sm" data-testid="button-view-calendar" asChild>
      <Link href="/calendar">View Calendar</Link>
     </Button>
    </div>
   </CardHeader>
   
   <CardContent className="p-0">
    {upcomingEvents.length === 0 ? (
     <div className="text-center py-8">
      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4">No upcoming events</p>
      <Button data-testid="button-schedule-first-event" asChild>
       <Link href="/calendar?create=1">
        <Plus size={16} className="mr-2" />
        Schedule Event
       </Link>
      </Button>
     </div>
    ) : (
     <div className="space-y-4">
      {upcomingEvents.slice(0, 3).map((event: any) => (
       <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border">
        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
        <div className="flex-1">
         <h4 className="font-medium text-sm text-foreground" data-testid={`text-event-${event.id}`}>
          {event.title}
         </h4>
         <p className="text-xs text-muted-foreground">
          {event.groupId ?"Group Event" :"Personal"} • {new Date(event.startTime).toLocaleString()}
         </p>
         {event.attendeesWithUsers && event.attendeesWithUsers.length > 0 && (
          <div className="flex items-center mt-2 space-x-2">
           <div className="flex -space-x-1">
            {event.attendeesWithUsers.slice(0, 3).map((attendee: any, index: number) => (
             <Avatar key={index} className="w-6 h-6 border-2 border-background">
              <AvatarFallback className="text-xs">
               {getUserInitials(attendee.user)}
              </AvatarFallback>
             </Avatar>
            ))}
            {event.attendeesWithUsers.length > 3 && (
             <Avatar className="w-6 h-6 border-2 border-background">
              <AvatarFallback className="text-xs">
               +{event.attendeesWithUsers.length - 3}
              </AvatarFallback>
             </Avatar>
            )}
           </div>
          </div>
         )}
        </div>
       </div>
      ))}
     </div>
    )}

    <Button variant="outline" className="w-full mt-4" data-testid="button-schedule-new-event" asChild>
     <Link href="/calendar?create=1">
      <Plus size={16} className="mr-2" />
      Schedule New Event
     </Link>
    </Button>
   </CardContent>
  </Card>
 );
}
