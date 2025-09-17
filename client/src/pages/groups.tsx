import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Users, Clock, CheckCircle, XCircle, TrendingUp, Brain, Sparkles, MoreHorizontal, Settings, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import GroupForm from "@/components/forms/group-form";
import EventForm from "@/components/forms/event-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserId } from "@/lib/userContext";

export default function Groups() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = useUserId();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: () => fetch("/api/groups").then(res => res.json()),
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

  const handleDeleteGroup = (groupId: string) => {
    if (confirm("Are you sure you want to delete this group?")) {
      deleteGroupMutation.mutate(groupId);
    }
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
            // Mock event data for demonstration
            const eventData = {
              nextEvent: "Finance Strategy Meeting",
              eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
              rsvpYes: Math.floor(Math.random() * 8) + 2,
              rsvpMaybe: Math.floor(Math.random() * 3),
              rsvpNo: Math.floor(Math.random() * 2),
              viabilityScore: Math.floor(Math.random() * 30) + 70,
              totalMembers: Math.floor(Math.random() * 8) + 5
            };
            
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
                            Event Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus size={16} className="mr-2" />
                            Invite People
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 size={16} className="mr-2" />
                            Cancel Event
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
                      <p className="text-sm text-muted-foreground">
                        📅 {eventData.eventDate.toLocaleDateString()} at 3:00 PM
                      </p>
                    </div>
                    
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
                        value={(eventData.rsvpYes / eventData.totalMembers) * 100} 
                        className="h-2"
                      />
                    </div>
                    
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
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid={`button-view-event-${group.id}`}>
                        <Calendar size={14} />
                        View Event
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700" data-testid={`button-rsvp-${group.id}`}>
                        ✅ RSVP
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
