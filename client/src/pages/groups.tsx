import { useState } from "react";
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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [calendarShareDialogOpen, setCalendarShareDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              🚀 Collaborative Events
            </h1>
            <p className="text-muted-foreground text-lg mt-2">Plan together, grow together - AI-powered event scheduling</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg" data-testid="button-create-group">
                <Sparkles size={18} className="mr-2" />
                🎯 Create Event
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <EventForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Events Grid */}
      {userGroups.length === 0 ? (
        <div className="text-center py-16">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-green-500/20 rounded-full blur-3xl"></div>
            <div className="relative bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-6 w-32 h-32 mx-auto flex items-center justify-center">
              <Calendar className="h-16 w-16 text-white" />
            </div>
          </div>
          
          <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            🎯 Ready to Plan Together?
          </h3>
          <p className="text-muted-foreground text-lg mb-2">
            Create collaborative events where everyone can RSVP
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg mx-auto">
            🤖 Our AI analyzes attendance to give you instant feedback on plan viability and success probability
          </p>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6 mb-8 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-sm">Smart Event Planning</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Real-time RSVP tracking
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI viability analysis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Optimal scheduling suggestions
              </li>
            </ul>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 hover:from-purple-700 hover:via-blue-700 hover:to-green-700 shadow-xl text-lg px-8 py-3" data-testid="button-create-first-group">
                <Sparkles size={20} className="mr-2" />
                🚀 Create Your First Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <EventForm onSuccess={() => setIsCreateDialogOpen(false)} />
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
              if (score >= 80) return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-200", icon: "🟢" };
              if (score >= 60) return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-200", icon: "🟡" };
              return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-200", icon: "🔴" };
            };
            
            const viability = getViabilityColor(eventData.viabilityScore);
            
            return (
              <Card key={group.id} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                {/* Gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-green-500/20 rounded-lg"></div>
                <div className="relative bg-background m-[1px] rounded-lg p-6">
                  
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" data-testid={`text-group-name-${group.id}`}>
                        📅 {group.name}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-group-menu-${group.id}`}>
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
                      <p className="text-sm text-muted-foreground mb-2">📋 {group.description}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {/* Next Event Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-sm">Next Event:</span>
                      </div>
                      <p className="font-bold text-lg mb-1">{eventData.nextEvent}</p>
                      {eventData.eventDate && (
                        <p className="text-sm text-muted-foreground">
                          📅 {eventData.eventDate.toLocaleDateString()} at {eventData.eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    
                    {/* Conditional Event Content - only show if there's an upcoming event */}
                    {eventData.eventId ? (
                      <>
                        {/* AI Viability Score */}
                        <div className="flex items-center justify-between mb-4">
                          <div className={`${viability.bg} ${viability.text} px-3 py-2 rounded-lg flex items-center gap-2 font-semibold`}>
                            <Brain size={14} />
                            {viability.icon} {eventData.viabilityScore}% Viable
                          </div>
                          <span className="text-sm text-muted-foreground">{eventData.totalMembers} invited</span>
                        </div>
                        
                        {/* RSVP Status */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-sm">RSVP Status</span>
                            <span className="text-xs text-muted-foreground">Real-time updates</span>
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Going</span>
                              </div>
                              <span className="font-semibold text-green-600">{eventData.rsvpYes}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">Maybe</span>
                              </div>
                              <span className="font-semibold text-yellow-600">{eventData.rsvpMaybe}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm">Can't go</span>
                              </div>
                              <span className="font-semibold text-red-600">{eventData.rsvpNo}</span>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <Progress 
                            value={eventData.totalInvited > 0 ? (eventData.rsvpYes / eventData.totalInvited) * 100 : 0} 
                            className="h-2"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20 rounded-xl p-4 mb-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          📋 Ready to plan something together? Create an event to start collecting RSVPs!
                        </p>
                      </div>
                    )}
                    
                    {/* Member Avatars */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(4, eventData.totalMembers))].map((_, index) => (
                          <Avatar key={index} className="w-8 h-8 border-2 border-background">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                              {String.fromCharCode(65 + index)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {eventData.totalMembers > 4 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-background flex items-center justify-center">
                            <span className="text-xs font-semibold">+{eventData.totalMembers - 4}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(group.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    {eventData.eventId ? (
                      <div className="space-y-3">
                        {/* RSVP Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={eventData.userRSVPStatus === 'yes' ? 'default' : 'outline'}
                            size="sm"
                            className={eventData.userRSVPStatus === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={() => handleRSVP(eventData.eventId, 'yes')}
                            data-testid={`button-rsvp-yes-${group.id}`}
                            disabled={rsvpMutation.isPending}
                          >
                            ✅ Yes
                          </Button>
                          <Button
                            variant={eventData.userRSVPStatus === 'maybe' ? 'default' : 'outline'}
                            size="sm"
                            className={eventData.userRSVPStatus === 'maybe' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                            onClick={() => handleRSVP(eventData.eventId, 'maybe')}
                            data-testid={`button-rsvp-maybe-${group.id}`}
                            disabled={rsvpMutation.isPending}
                          >
                            🤔 Maybe
                          </Button>
                          <Button
                            variant={eventData.userRSVPStatus === 'no' ? 'default' : 'outline'}
                            size="sm"
                            className={eventData.userRSVPStatus === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                            onClick={() => handleRSVP(eventData.eventId, 'no')}
                            data-testid={`button-rsvp-no-${group.id}`}
                            disabled={rsvpMutation.isPending}
                          >
                            ❌ No
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full flex items-center gap-2" 
                          data-testid={`button-view-event-${group.id}`}
                        >
                          <Calendar size={14} />
                          View Event Details
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center gap-2" 
                        data-testid={`button-create-event-${group.id}`}
                      >
                        <Plus size={14} />
                        Create Event
                      </Button>
                    )}
                  </CardContent>
                </div>
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
    </div>
  );
}
