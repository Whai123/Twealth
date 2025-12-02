import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, MoreHorizontal, UserPlus, Trash2, Copy, DollarSign, Home, Car, Target, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GroupForm from "@/components/forms/group-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserId } from "@/lib/userContext";

export default function Groups() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviteExpiry, setInviteExpiry] = useState<string>("7");
  const [generatedInvite, setGeneratedInvite] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = useUserId();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === '1') {
      setIsCreateDialogOpen(true);
      window.history.replaceState({}, '', '/groups');
    }
  }, []);

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
        description: "The group has been removed",
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
        description: "Share the link with your group members",
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

  const handleGenerateInvite = () => {
    if (selectedGroupId) {
      createInviteMutation.mutate({
        groupId: selectedGroupId,
        role: inviteRole,
        expiry: inviteExpiry,
      });
    }
  };

  const handleCopyInviteLink = () => {
    if (generatedInvite?.invite?.token) {
      const inviteUrl = `${window.location.origin}/invite/${generatedInvite.invite.token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Link copied",
        description: "Share this link to invite members",
      });
    }
  };

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'house': return Home;
      case 'car': return Car;
      case 'savings': return PiggyBank;
      default: return Target;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background/95 backdrop-blur border-b border-border/40 sticky top-0 z-30">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
            <div className="h-8 bg-muted/50 rounded w-48 mb-2" />
            <div className="h-4 bg-muted/50 rounded w-64" />
          </div>
        </header>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="h-6 bg-muted/50 rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted/50 rounded w-1/2 mb-4" />
                <div className="h-2 bg-muted/50 rounded w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const userGroups = groups || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background/95 backdrop-blur border-b border-border/40 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-3xl font-semibold tracking-tight text-foreground">
                Shared Goals
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                Split costs and track contributions with your group
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="min-h-[44px]"
                  data-testid="button-create-group"
                >
                  <Plus size={18} className="mr-2" />
                  <span className="hidden sm:inline">New Group</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Shared Goal Group</DialogTitle>
                  <DialogDescription>
                    Create a group to track shared expenses like a house, car, or savings goal
                  </DialogDescription>
                </DialogHeader>
                <GroupForm onSuccess={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {userGroups.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
            </div>
            
            <h3 className="text-xl sm:text-2xl font-semibold mb-3">
              Start a Shared Goal
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm sm:text-base">
              Create a group to split costs for big purchases like a house, car, or vacation. 
              Track everyone's contributions in one place.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              <Card className="p-4 text-center">
                <Home className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium text-sm">House Down Payment</h4>
                <p className="text-xs text-muted-foreground">Split with partner or family</p>
              </Card>
              <Card className="p-4 text-center">
                <Car className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium text-sm">Car Purchase</h4>
                <p className="text-xs text-muted-foreground">Share with co-buyers</p>
              </Card>
              <Card className="p-4 text-center">
                <PiggyBank className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium text-sm">Group Savings</h4>
                <p className="text-xs text-muted-foreground">Vacation, event, or gift</p>
              </Card>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="min-h-[48px]" data-testid="button-create-first-group">
                  <Plus size={20} className="mr-2" />
                  Create Your First Group
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Shared Goal Group</DialogTitle>
                  <DialogDescription>
                    Create a group to track shared expenses like a house, car, or savings goal
                  </DialogDescription>
                </DialogHeader>
                <GroupForm onSuccess={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userGroups.map((group: any) => {
              const targetAmount = parseFloat(group.budget || '0');
              const currentAmount = parseFloat(group.currentAmount || '0');
              const progress = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;
              const memberCount = group.memberCount || 1;
              const GroupIcon = getGroupIcon(group.category);
              
              return (
                <Card key={group.id} className="overflow-hidden" data-testid={`card-group-${group.id}`}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GroupIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base font-semibold truncate" data-testid={`text-group-name-${group.id}`}>
                            {group.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCreateInvite(group.id)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Members
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2">
                    {targetAmount > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>${currentAmount.toLocaleString()}</span>
                          <span>of ${targetAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    
                    {group.description && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 min-h-[40px]"
                        onClick={() => handleCreateInvite(group.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Invite
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 min-h-[40px]"
                        data-testid={`button-contribute-${group.id}`}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Contribute
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Generate a link to invite others to this group
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role" className="h-11" data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="invite-expiry">Link Expires In</Label>
              <Select value={inviteExpiry} onValueChange={setInviteExpiry}>
                <SelectTrigger id="invite-expiry" className="h-11" data-testid="select-invite-expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {generatedInvite ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Invite Link</p>
                  <p className="text-sm font-mono break-all">
                    {`${window.location.origin}/invite/${generatedInvite.invite?.token}`}
                  </p>
                </div>
                <Button onClick={handleCopyInviteLink} className="w-full min-h-[44px]">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleGenerateInvite} 
                className="w-full min-h-[44px]"
                disabled={createInviteMutation.isPending}
              >
                {createInviteMutation.isPending ? "Creating..." : "Generate Invite Link"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
