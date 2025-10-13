import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Share2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ShareGoalDialogProps {
  goalId: string;
  goalTitle: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export default function ShareGoalDialog({ goalId, goalTitle, open, onOpenChange, children }: ShareGoalDialogProps) {
  const [selectedFriend, setSelectedFriend] = useState("");
  const [permission, setPermission] = useState<"view" | "contribute">("view");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch friends list
  const { data: friends = [], isLoading: friendsLoading } = useQuery<any[]>({
    queryKey: ["/api/friends"],
  });

  // Fetch current shares for this goal
  const { data: shares = [], isLoading: sharesLoading } = useQuery<any[]>({
    queryKey: ["/api/goals", goalId, "shares"],
  });

  // Share goal mutation
  const shareGoalMutation = useMutation({
    mutationFn: (data: { sharedWithUserId: string; permission: string }) =>
      apiRequest("POST", `/api/goals/${goalId}/share`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals", goalId, "shares"] });
      toast({
        title: "Goal shared successfully",
        description: `${goalTitle} has been shared with your friend.`,
      });
      setSelectedFriend("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to share goal",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Remove share mutation
  const removeShareMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest("DELETE", `/api/goals/${goalId}/share/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals", goalId, "shares"] });
      toast({
        title: "Share removed",
        description: "Access has been revoked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove share",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: ({ userId, permission }: { userId: string; permission: string }) =>
      apiRequest("PATCH", `/api/goals/${goalId}/share/${userId}`, { permission }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals", goalId, "shares"] });
      toast({
        title: "Permission updated",
        description: "Share permission has been updated successfully.",
      });
    },
  });

  const handleShare = () => {
    if (!selectedFriend) {
      toast({
        title: "No friend selected",
        description: "Please select a friend to share with.",
        variant: "destructive",
      });
      return;
    }

    shareGoalMutation.mutate({
      sharedWithUserId: selectedFriend,
      permission,
    });
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  // Filter out friends who already have access
  const availableFriends = friends.filter(
    (friend: any) => !shares.some((share: any) => share.sharedWith.id === friend.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Goal: {goalTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Share */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="font-semibold text-sm">Share with a Friend</h3>
            
            {friendsLoading ? (
              <div className="text-sm text-muted-foreground">Loading friends...</div>
            ) : availableFriends.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {friends.length === 0 
                  ? "You don't have any friends to share with yet." 
                  : "All your friends already have access to this goal."}
              </div>
            ) : (
              <div className="space-y-3">
                <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                  <SelectTrigger data-testid="select-friend">
                    <SelectValue placeholder="Select a friend" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFriends.map((friend: any) => (
                      <SelectItem key={friend.id} value={friend.id}>
                        {friend.firstName} {friend.lastName} ({friend.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-3">
                  <Select value={permission} onValueChange={(val) => setPermission(val as "view" | "contribute")}>
                    <SelectTrigger className="flex-1" data-testid="select-permission">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View Only</SelectItem>
                      <SelectItem value="contribute">Can Contribute</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleShare}
                    disabled={!selectedFriend || shareGoalMutation.isPending}
                    data-testid="button-share-goal"
                  >
                    {shareGoalMutation.isPending ? "Sharing..." : "Share"}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>View Only:</strong> Friend can see the goal and its progress</p>
                  <p><strong>Can Contribute:</strong> Friend can add funds to help reach the goal</p>
                </div>
              </div>
            )}
          </div>

          {/* Current Shares */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">People with Access</h3>
            
            {sharesLoading ? (
              <div className="text-sm text-muted-foreground">Loading shares...</div>
            ) : shares.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                This goal isn't shared with anyone yet.
              </div>
            ) : (
              <ScrollArea className="max-h-60">
                <div className="space-y-3">
                  {shares.map((share: any) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`share-item-${share.sharedWith.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={share.sharedWith.profileImageUrl} />
                          <AvatarFallback>
                            {getInitials(share.sharedWith.firstName, share.sharedWith.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {share.sharedWith.firstName} {share.sharedWith.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{share.sharedWith.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={share.permission}
                          onValueChange={(val) => updatePermissionMutation.mutate({ 
                            userId: share.sharedWith.id, 
                            permission: val 
                          })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View Only</SelectItem>
                            <SelectItem value="contribute">Can Contribute</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeShareMutation.mutate(share.sharedWith.id)}
                          disabled={removeShareMutation.isPending}
                          data-testid={`button-remove-share-${share.sharedWith.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
