import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Users, Clock, CheckCircle, XCircle, TrendingUp, Brain, Sparkles, MoreHorizontal, Settings, UserPlus, Trash2, Copy, Share, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GroupForm from "@/components/forms/group-form";
import EventForm from "@/components/forms/event-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserId } from "@/lib/userContext";

export default function Groups() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Check for create query parameter and open dialog automatically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === '1') {
      setIsCreateDialogOpen(true);
      // Clean up URL by removing the query parameter
      window.history.replaceState({}, '', '/groups');
    }
  }, []);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [calendarShareDialogOpen, setCalendarShareDialogOpen] = useState(false);
  const [isEventDetailsDialogOpen, setIsEventDetailsDialogOpen] = useState(false);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedGroupForEvent, setSelectedGroupForEvent] = useState<any>(null);
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviteExpiry, setInviteExpiry] = useState<string>("7");
  const [calendarShareExpiry, setCalendarShareExpiry] = useState<string>("30");
  const [generatedInvite, setGeneratedInvite] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = useUserId();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: () => fetch("/api/groups").then(res => res.json()),
  });

  const { data: events } = useQuery({
    queryKey: ["/api/events"],
    queryFn: () => fetch("/api/events").then(res => res.json()),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => apiRequest("DELETE", `/api/groups/${groupId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Group deleted",
        description: "The group has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: async ({ groupId, role, expiry }: { groupId: string; role: string; expiry: string }) => {
      const expiryDays = parseInt(expiry);
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
      const response = await apiRequest("POST", `/api/groups/${groupId}/invites`, {
        role,
        expiresAt: expiresAt.toISOString(),
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedInvite(data);
      toast({
        title: "Invite created",
        description: "Invite link has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCalendarShareMutation = useMutation({
    mutationFn: async ({ groupId, expiry }: { groupId: string; expiry: string }) => {
      const expiryDays = parseInt(expiry);
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
      const response = await apiRequest('POST', '/api/calendar/shares', {
        scope: 'group',
        groupId,
        expiresAt,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      const shareUrl = `${window.location.origin}/shared/calendar/${data.share.token}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Calendar shared successfully!",
        description: "The calendar share link has been copied to your clipboard.",
      });
      setCalendarShareDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating calendar share",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) =>
      apiRequest("POST", `/api/events/${eventId}/rsvp`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "RSVP updated",
        description: "Your RSVP has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteGroup = (groupId: string) => {
    if (confirm("Are you sure you want to delete this group?")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const handleViewEventDetails = (eventId: string, groupId: string) => {
    const event = events?.find((e: any) => e.id === eventId);
    const group = groups?.find((g: any) => g.id === groupId);
    if (event && group) {
      setSelectedEvent(event);
      setSelectedGroupForEvent(group);
      setIsEventDetailsDialogOpen(true);
    }
  };

  const handleCreateEvent = (group: any) => {
    setSelectedGroupForEvent(group);
    setIsCreateEventDialogOpen(true);
  };

  const handleCreateInvite = (groupId: string) => {
    setSelectedGroupId(groupId);
    setGeneratedInvite(null);
    setInviteDialogOpen(true);
  };

  const handleCreateCalendarShare = (groupId: string) => {
    setSelectedGroupId(groupId);
    setCalendarShareDialogOpen(true);
  };

  const handleGenerateInvite = () => {
    if (selectedGroupId) {
      createInviteMutation.mutate({
        groupId: selectedGroupId,
        role: inviteRole,
        expiry: inviteExpiry,
      });
    }
  };

  const handleGenerateCalendarShare = () => {
    if (selectedGroupId) {
      createCalendarShareMutation.mutate({
        groupId: selectedGroupId,
        expiry: calendarShareExpiry,
      });
    }
  };

  const handleCopyInviteLink = () => {
    if (generatedInvite?.invite?.token) {
      const inviteUrl = `${window.location.origin}/invite/${generatedInvite.invite.token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Link copied",
        description: "Invite link has been copied to clipboard.",
      });
    } else {
      toast({
        title: "Error",
        description: "No invite link available to copy.",
        variant: "destructive",
      });
    }
  };

  const handleRSVP = (eventId: string, status: string) => {
    rsvpMutation.mutate({ eventId, status });
  };

  // Group events by group
  const getGroupEvents = (groupId: string) => {
    return events?.filter((event: any) => event.groupId === groupId) || [];
  };

  // Get RSVP data for an event
  const getEventRSVPData = (event: any) => {
    const attendees = event.attendees || [];
    const rsvpYes = attendees.filter((a: any) => a.status === 'yes').length;
    const rsvpMaybe = attendees.filter((a: any) => a.status === 'maybe').length;
    const rsvpNo = attendees.filter((a: any) => a.status === 'no').length;
    return { rsvpYes, rsvpMaybe, rsvpNo, totalInvited: attendees.length };
  };

  // Get user's RSVP status for an event
  const getUserRSVPStatus = (event: any) => {
    const attendees = event.attendees || [];
    const userAttendee = attendees.find((a: any) => a.userId === userId);
    return userAttendee?.status || null;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Groups</h1>
            <p className="text-muted-foreground">Manage your group memberships and create new groups</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="flex -space-x-2 mb-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="w-8 h-8 bg-muted rounded-full"></div>
                  ))}
                </div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const userGroups = groups || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Professional Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                    Team Collaboration & Groups
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">Professional team management and group coordination</p>
                </div>
              </div>
              
              {/* Professional Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Groups</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{userGroups.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Your teams</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Events</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{events?.length || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">This month</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activity Rate</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">High</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Team engagement</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Management</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">Active</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Professional tools</div>
                </div>
              </div>
            </div>
            
            {/* Professional Action Button */}
            <div className="flex items-center gap-3 ml-6">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 h-12" 
                    data-testid="button-create-group"
                  >
                    <Plus size={18} className="mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <GroupForm onSuccess={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Professional Service Message */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Professional Team Management</h2>
                <p className="text-gray-600 dark:text-gray-400">Comprehensive group coordination tools for optimal team collaboration and planning.</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-6 py-8">

      {/* Professional Empty State */}
      {userGroups.length === 0 ? (
        <div className="text-center py-20">
          <div className="mb-12">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto flex items-center justify-center border border-gray-200 dark:border-gray-700 mb-8">
              <Users className="h-16 w-16 text-gray-400" />
            </div>
          </div>
          
          <h3 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">
            Start Team Collaboration
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4 max-w-2xl mx-auto">
            Create professional groups to organize your team and manage collaborative projects effectively
          </p>
          <p className="text-gray-500 dark:text-gray-500 mb-12 max-w-xl mx-auto">
            Professional tools for team coordination, project planning, and group management
          </p>
          
          {/* Professional Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Team Building</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Invite members, assign roles, and organize professional teams</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Event Planning</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Professional event scheduling with comprehensive planning tools</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Progress Analytics</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track team engagement and optimize group performance</p>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="bg-gray-600 hover:bg-gray-700 text-white text-lg px-8 py-4 h-14 font-semibold" 
                data-testid="button-create-first-group"
              >
                <Plus size={20} className="mr-2" />
                Create Your First Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <GroupForm onSuccess={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userGroups.map((group: any) => {
            const groupEvents = getGroupEvents(group.id);
            const nextEvent = groupEvents.find((e: any) => new Date(e.startTime) > new Date());
            
            
            let eventData;
            if (nextEvent) {
              const rsvpData = getEventRSVPData(nextEvent);
              const userRSVPStatus = getUserRSVPStatus(nextEvent);
              eventData = {
                nextEvent: nextEvent.title,
                eventDate: new Date(nextEvent.startTime),
                eventId: nextEvent.id,
                userRSVPStatus,
                ...rsvpData,
                viabilityScore: rsvpData.totalInvited > 0 ? Math.round((rsvpData.rsvpYes / rsvpData.totalInvited) * 100) : 0,
                totalMembers: group.memberCount || rsvpData.totalInvited
              };
            } else {
              eventData = {
                nextEvent: "No upcoming events",
                eventDate: null,
                eventId: null,
                userRSVPStatus: null,
                rsvpYes: 0,
                rsvpMaybe: 0,
                rsvpNo: 0,
                viabilityScore: 0,
                totalMembers: group.memberCount || 0,
                totalInvited: 0
              };
            }
            
            const getViabilityColor = (score: number) => {
              if (score >= 80) return { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", indicator: "high" };
              if (score >= 60) return { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-300", indicator: "medium" };
              return { bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", indicator: "low" };
            };
            
            const viability = getViabilityColor(eventData.viabilityScore);
            
            return (
              <Card key={group.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle 
                            className="text-xl font-semibold text-gray-900 dark:text-white truncate" 
                            data-testid={`text-group-name-${group.id}`}
                            title={group.name}
                          >
                            {group.name}
                          </CardTitle>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            data-testid={`button-group-menu-${group.id}`}
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings size={16} className="mr-2" />
                            Group Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCreateInvite(group.id)}>
                            <UserPlus size={16} className="mr-2" />
                            Create Invite Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCreateCalendarShare(group.id)}>
                            <Calendar size={16} className="mr-2" />
                            Share Group Calendar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {group.description && (
                      <p 
                        className="text-muted-foreground line-clamp-2" 
                        style={{ 
                          fontSize: 'var(--text-sm)', 
                          marginTop: 'var(--space-2)' 
                        }}
                        title={group.description}
                      >
                        {group.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {/* Next Event Info - Simplified */}
                    <div 
                      className="bg-muted/50 rounded-lg border border-border/50" 
                      style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
                    >
                      <div className="flex items-center" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium" style={{ fontSize: 'var(--text-sm)' }}>Next Event</span>
                      </div>
                      <p 
                        className="font-semibold text-foreground" 
                        style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}
                      >
                        {eventData.nextEvent}
                      </p>
                      {eventData.eventDate && (
                        <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)' }}>
                          {eventData.eventDate.toLocaleDateString()} at {eventData.eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    
                    {/* Event Content - Simplified for Mobile */}
                    {eventData.eventId ? (
                      <div style={{ marginBottom: 'var(--space-4)' }}>
                        {/* Simplified RSVP Summary */}
                        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
                          <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-medium" style={{ fontSize: 'var(--text-sm)' }}>
                              {eventData.rsvpYes} going, {eventData.rsvpMaybe} maybe
                            </span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`${viability.bg} ${viability.text}`}
                            style={{ fontSize: 'var(--text-xs)' }}
                          >
                            {eventData.viabilityScore}% viable
                          </Badge>
                        </div>
                        
                        {/* Progress Bar */}
                        <Progress 
                          value={eventData.totalInvited > 0 ? (eventData.rsvpYes / eventData.totalInvited) * 100 : 0} 
                          className="h-2"
                          style={{ marginBottom: 'var(--space-3)' }}
                        />
                      </div>
                    ) : (
                      <div 
                        className="bg-muted/30 rounded-lg text-center" 
                        style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
                      >
                        <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)' }}>
                          Ready to plan something? Create an event to get started.
                        </p>
                      </div>
                    )}
                    
                    {/* Members Info - Simplified */}
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
                      <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)' }}>
                          {eventData.totalMembers} members
                        </span>
                      </div>
                      <span className="text-muted-foreground" style={{ fontSize: 'var(--text-xs)' }}>
                        Created {new Date(group.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Action Buttons - Simplified */}
                    {eventData.eventId ? (
                      <div style={{ gap: 'var(--space-2)' }} className="flex flex-col">
                        {/* RSVP Buttons - Simplified Grid */}
                        <div className="grid grid-cols-3" style={{ gap: 'var(--space-2)' }}>
                          <Button
                            variant={eventData.userRSVPStatus === 'yes' ? 'default' : 'outline'}
                            size="sm"
                            className={eventData.userRSVPStatus === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={() => handleRSVP(eventData.eventId, 'yes')}
                            data-testid={`button-rsvp-yes-${group.id}`}
                            disabled={rsvpMutation.isPending}
                            style={{ fontSize: 'var(--text-xs)' }}
                          >
                            Going
                          </Button>
                          <Button
                            variant={eventData.userRSVPStatus === 'maybe' ? 'default' : 'outline'}
                            size="sm"
                            className={eventData.userRSVPStatus === 'maybe' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                            onClick={() => handleRSVP(eventData.eventId, 'maybe')}
                            data-testid={`button-rsvp-maybe-${group.id}`}
                            disabled={rsvpMutation.isPending}
                            style={{ fontSize: 'var(--text-xs)' }}
                          >
                            Maybe
                          </Button>
                          <Button
                            variant={eventData.userRSVPStatus === 'no' ? 'default' : 'outline'}
                            size="sm"
                            className={eventData.userRSVPStatus === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                            onClick={() => handleRSVP(eventData.eventId, 'no')}
                            data-testid={`button-rsvp-no-${group.id}`}
                            disabled={rsvpMutation.isPending}
                            style={{ fontSize: 'var(--text-xs)' }}
                          >
                            Can't Go
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full flex items-center" 
                          style={{ gap: 'var(--space-2)' }}
                          onClick={() => handleViewEventDetails(eventData.eventId, group.id)}
                          data-testid={`button-view-event-${group.id}`}
                        >
                          <Calendar size={14} />
                          View Details
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center" 
                        style={{ gap: 'var(--space-2)' }}
                        onClick={() => handleCreateEvent(group)}
                        data-testid={`button-create-event-${group.id}`}
                      >
                        <Plus size={14} />
                        Create Event
                      </Button>
                    )}
                  </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group Invite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!generatedInvite ? (
              <>
                <div>
                  <Label htmlFor="role">Invite Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expiry">Expires in</Label>
                  <Select value={inviteExpiry} onValueChange={setInviteExpiry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleGenerateInvite} 
                  disabled={createInviteMutation.isPending}
                  className="w-full"
                >
                  {createInviteMutation.isPending ? 'Generating...' : 'Generate Invite Link'}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label>Invite Link</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={generatedInvite?.invite?.token ? `${window.location.origin}/invite/${generatedInvite.invite.token}` : ''}
                      readOnly
                      className="flex-1"
                    />
                    <Button onClick={handleCopyInviteLink} size="sm" disabled={!generatedInvite?.invite?.token}>
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {generatedInvite?.invite?.expiresAt ? 
                    `This link will expire on ${new Date(generatedInvite.invite.expiresAt).toLocaleDateString()}` :
                    'Expiry date not available'
                  }
                </div>
                <Button 
                  onClick={() => setInviteDialogOpen(false)} 
                  className="w-full"
                >
                  Done
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Calendar Share Dialog */}
      <Dialog open={calendarShareDialogOpen} onOpenChange={setCalendarShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Group Calendar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="calendar-expiry">Link expires in</Label>
              <Select value={calendarShareExpiry} onValueChange={setCalendarShareExpiry}>
                <SelectTrigger data-testid="select-calendar-expiry">
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
              onClick={handleGenerateCalendarShare} 
              disabled={createCalendarShareMutation.isPending}
              className="w-full"
              data-testid="button-generate-calendar-share"
            >
              {createCalendarShareMutation.isPending ? (
                <>
                  <Clock size={16} className="mr-2 animate-spin" />
                  Creating Share Link...
                </>
              ) : (
                <>
                  <Calendar size={16} className="mr-2" />
                  Generate Calendar Share Link
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsDialogOpen} onOpenChange={setIsEventDetailsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {selectedEvent && selectedGroupForEvent && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedEvent.title}</h3>
                  <p className="text-muted-foreground mb-2">Group: {selectedGroupForEvent.name}</p>
                  {selectedEvent.description && (
                    <p className="text-muted-foreground">{selectedEvent.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm text-muted-foreground">Start Time</h4>
                    <p className="text-lg font-medium">
                      {new Date(selectedEvent.startTime).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm text-muted-foreground">End Time</h4>
                    <p className="text-lg font-medium">
                      {new Date(selectedEvent.endTime).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedEvent.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                {selectedEvent.location && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm text-muted-foreground">Location</h4>
                    <p className="text-lg">{selectedEvent.location}</p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsEventDetailsDialogOpen(false)}
                    className="flex-1"
                    data-testid="button-close-event-details"
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsEventDetailsDialogOpen(false);
                      // Navigate to calendar with event selected
                      window.location.href = '/calendar';
                    }}
                    className="flex-1"
                    data-testid="button-view-in-calendar"
                  >
                    <Calendar size={16} className="mr-2" />
                    View in Calendar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Create Event Dialog */}
      <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedGroupForEvent && (
            <EventForm 
              onSuccess={() => {
                setIsCreateEventDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/events'] });
                queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
