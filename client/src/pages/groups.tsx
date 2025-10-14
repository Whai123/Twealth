import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
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
import { Checkbox } from "@/components/ui/checkbox";
import GroupForm from "@/components/forms/group-form";
import EventForm from "@/components/forms/event-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserId } from "@/lib/userContext";

export default function Groups() {
  const { t } = useTranslation();
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
  const [bulkInviteDialogOpen, setBulkInviteDialogOpen] = useState(false);
  const [isEventDetailsDialogOpen, setIsEventDetailsDialogOpen] = useState(false);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedGroupForEvent, setSelectedGroupForEvent] = useState<any>(null);
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviteExpiry, setInviteExpiry] = useState<string>("7");
  const [calendarShareExpiry, setCalendarShareExpiry] = useState<string>("30");
  const [generatedInvite, setGeneratedInvite] = useState<any>(null);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [bulkInviteRole, setBulkInviteRole] = useState<string>("member");
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

  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
    enabled: bulkInviteDialogOpen,
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => apiRequest("DELETE", `/api/groups/${groupId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: t('groups.actions.delete'),
        description: t('groups.empty.description'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
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
        title: t('groups.actions.invite'),
        description: t('groups.empty.description'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
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
        title: t('common.success'),
        description: t('referrals.copiedDescription'),
      });
      setCalendarShareDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkInviteMutation = useMutation({
    mutationFn: ({ groupId, friendIds, role }: { groupId: string; friendIds: string[]; role: string }) =>
      apiRequest("POST", `/api/groups/${groupId}/bulk-invite-friends`, { friendIds, role }),
    onSuccess: (data: any) => {
      toast({
        title: "Friends invited",
        description: `Successfully invited ${data.invitations?.length || 0} friends to the group.`,
      });
      setBulkInviteDialogOpen(false);
      setSelectedFriendIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
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
        title: t('calendar.rsvpStatus.going'),
        description: t('common.success'),
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
    if (confirm(t('common.confirm'))) {
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

  const handleBulkInvite = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedFriendIds([]);
    setBulkInviteDialogOpen(true);
  };

  const handleConfirmBulkInvite = () => {
    if (selectedGroupId && selectedFriendIds.length > 0) {
      bulkInviteMutation.mutate({
        groupId: selectedGroupId,
        friendIds: selectedFriendIds,
        role: bulkInviteRole,
      });
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
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
        title: t('common.copied'),
        description: t('referrals.copiedDescription'),
      });
    } else {
      toast({
        title: "Error",
        description: t('common.error'),
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
            <h1 className="text-2xl font-bold">{t('groups.title')}</h1>
            <p className="text-muted-foreground">{t('groups.subtitle')}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/30 dark:via-blue-900/30 dark:to-purple-900/30">
      {/* Spectacular Header */}
      <header className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/50 dark:via-blue-900/50 dark:to-purple-900/50 border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    🚀 {t('groups.title')}
                  </h1>
                  <p className="text-xl text-muted-foreground">{t('groups.subtitle')}</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium">{t('dashboard.stats.activeGroups')}</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{userGroups.length}</div>
                  <div className="text-xs text-muted-foreground">{t('dashboard.stats.yourTeams')}</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Events</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{events?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">This month</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium">Success Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">85%</div>
                  <div className="text-xs text-muted-foreground">Event viability</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    <span className="text-sm font-medium">AI Insights</span>
                  </div>
                  <div className="text-2xl font-bold text-pink-600">12</div>
                  <div className="text-xs text-muted-foreground">This week</div>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="flex items-center gap-3 ml-6">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-3 h-12 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl" 
                    data-testid="button-create-group"
                  >
                    <Sparkles size={18} className="mr-2" />
                    🎯 {t('groups.createGroup')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <GroupForm onSuccess={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-white/80 to-emerald-50/80 dark:from-gray-800/80 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-emerald-500" />
              <div>
                <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Smart Team Management 🤝</h2>
                <p className="text-emerald-600 dark:text-emerald-300">AI analyzes your group dynamics and suggests optimal planning strategies for maximum success.</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-6 py-8">

      {/* Enhanced Empty State */}
      {userGroups.length === 0 ? (
        <div className="text-center py-20">
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-3xl p-8 w-40 h-40 mx-auto flex items-center justify-center shadow-2xl animate-pulse">
              <div className="relative">
                <Users className="h-20 w-20 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-yellow-800" />
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🚀 Ready to Build Teams?
          </h3>
          <p className="text-muted-foreground text-xl mb-4 max-w-2xl mx-auto">
            Create collaborative groups where amazing things happen together
          </p>
          <p className="text-base text-muted-foreground mb-12 max-w-xl mx-auto">
            🤖 Our AI analyzes team dynamics and provides insights to maximize collaboration success
          </p>
          
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl p-8 border border-emerald-200/50 dark:border-emerald-700/50">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-3 text-emerald-800 dark:text-emerald-200">🤝 Team Building</h4>
              <p className="text-sm text-emerald-600 dark:text-emerald-300">Invite members, assign roles, and build amazing teams</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-700/50">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-3 text-blue-800 dark:text-blue-200">📅 Smart Planning</h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">AI-powered event scheduling with optimal timing suggestions</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-2xl p-8 border border-purple-200/50 dark:border-purple-700/50">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-3 text-purple-800 dark:text-purple-200">📊 Success Analytics</h4>
              <p className="text-sm text-purple-600 dark:text-purple-300">Track engagement and optimize group performance</p>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 shadow-2xl text-xl px-12 py-4 h-16 font-bold transition-all duration-300 hover:scale-105 hover:-translate-y-1" 
                data-testid="button-create-first-group"
              >
                <Sparkles size={24} className="mr-3" />
                🚀 Create Your First Team
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
                nextEvent: t('dashboard.empty.events'),
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
              <Card key={group.id} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-white/90 to-gray-50/50 dark:from-gray-800/90 dark:to-gray-900/50 backdrop-blur-sm border border-white/20 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  
                  <CardHeader className="p-6 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle 
                            className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent truncate" 
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
                          <DropdownMenuItem onClick={() => handleBulkInvite(group.id)}>
                            <Users size={16} className="mr-2" />
                            Bulk Invite Friends
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
                  
                  <CardContent className="p-0 relative z-10">
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
              groupId={selectedGroupForEvent.id}
              onSuccess={() => {
                setIsCreateEventDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/events'] });
                queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Invite Dialog */}
      <Dialog open={bulkInviteDialogOpen} onOpenChange={setBulkInviteDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Invite Friends to Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-role">Role for all invited friends</Label>
              <Select value={bulkInviteRole} onValueChange={setBulkInviteRole}>
                <SelectTrigger data-testid="select-bulk-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Friends ({selectedFriendIds.length} selected)</Label>
              {friends && friends.length > 0 ? (
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  {(friends as any[]).map((friend: any) => (
                    <div 
                      key={friend.id} 
                      className="flex items-center space-x-2 p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleFriendSelection(friend.id)}
                    >
                      <Checkbox 
                        checked={selectedFriendIds.includes(friend.id)}
                        onCheckedChange={() => toggleFriendSelection(friend.id)}
                        data-testid={`checkbox-friend-${friend.id}`}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(friend.displayName || friend.email || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{friend.displayName || friend.email}</p>
                          {friend.displayName && (
                            <p className="text-xs text-muted-foreground">{friend.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                  No friends available to invite. Add friends first!
                </p>
              )}
            </div>

            <Button 
              onClick={handleConfirmBulkInvite} 
              disabled={selectedFriendIds.length === 0 || bulkInviteMutation.isPending}
              className="w-full"
              data-testid="button-confirm-bulk-invite"
            >
              {bulkInviteMutation.isPending ? (
                <>
                  <Clock size={16} className="mr-2 animate-spin" />
                  Inviting...
                </>
              ) : (
                <>
                  <Users size={16} className="mr-2" />
                  Invite {selectedFriendIds.length} Friend{selectedFriendIds.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      </div>
    </div>
  );
}
