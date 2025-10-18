import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Users, Check, X, Loader2, UserMinus, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function Friends() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [friendRequestMessage, setFriendRequestMessage] = useState("");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<User[]>({
    queryKey: ["/api/friends"],
  });

  // Fetch pending friend requests
  const { data: pendingRequests = [], isLoading: pendingLoading } = useQuery<any[]>({
    queryKey: ["/api/friend-requests/pending"],
  });

  // Fetch sent friend requests
  const { data: sentRequests = [], isLoading: sentLoading } = useQuery<any[]>({
    queryKey: ["/api/friend-requests/sent"],
  });

  // Search users
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<User[]>({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!res.ok) {
        return [];
      }
      
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: searchQuery.length >= 2,
  });

  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async ({ toUserId, message }: { toUserId: string; message?: string }) => {
      const response = await apiRequest("POST", "/api/friend-requests", { toUserId, message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/sent"] });
      setIsRequestDialogOpen(false);
      setSelectedUser(null);
      setFriendRequestMessage("");
      toast({
        title: t('common.success'),
        description: t('common.success'),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    },
  });

  // Respond to friend request
  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'accepted' | 'declined' }) => {
      const response = await apiRequest("PUT", `/api/friend-requests/${requestId}/respond`, { status });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: variables.status === 'accepted' ? t('common.success') : t('common.success'),
        description: variables.status === 'accepted' 
          ? "You are now friends!" 
          : "Friend request declined.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to friend request",
        variant: "destructive",
      });
    },
  });

  // Remove friend
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend removed",
        description: "You are no longer friends with this user.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive",
      });
    },
  });

  // Cancel friend request
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await apiRequest("DELETE", `/api/friend-requests/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/sent"] });
      toast({
        title: "Friend request cancelled",
        description: "Your friend request has been cancelled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel friend request",
        variant: "destructive",
      });
    },
  });

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  const openRequestDialog = (user: User) => {
    setSelectedUser(user);
    setIsRequestDialogOpen(true);
  };

  const handleSendRequest = () => {
    if (selectedUser) {
      sendRequestMutation.mutate({
        toUserId: selectedUser.id,
        message: friendRequestMessage.trim() || undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-blue-900/30">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 max-w-7xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">👥 Friends</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Connect with friends to collaborate on groups and events</p>
        </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="friends" data-testid="tab-friends">
            <Users className="h-4 w-4 mr-2" />
            My Friends {friends?.length > 0 && `(${friends.length})`}
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            <Mail className="h-4 w-4 mr-2" />
            Requests {pendingRequests?.length > 0 && `(${pendingRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="search" data-testid="tab-search">
            <Search className="h-4 w-4 mr-2" />
            Find Friends
          </TabsTrigger>
        </TabsList>

        {/* Friends Tab */}
        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>My Friends</CardTitle>
            </CardHeader>
            <CardContent>
              {friendsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : friends?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>You don't have any friends yet.</p>
                  <p className="text-sm mt-1">Search for people to add as friends!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {friends?.map((friend: any) => (
                    <Card key={friend.id} className="p-4" data-testid={`friend-card-${friend.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(friend.firstName, friend.lastName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold" data-testid={`friend-name-${friend.id}`}>
                              {friend.firstName} {friend.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{friend.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFriendMutation.mutate(friend.id)}
                          disabled={removeFriendMutation.isPending}
                          data-testid={`button-remove-friend-${friend.id}`}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <div className="space-y-6">
            {/* Pending Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : pendingRequests?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No pending friend requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests?.map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`request-${request.id}`}>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(request.fromUser.firstName, request.fromUser.lastName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {request.fromUser.firstName} {request.fromUser.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{request.fromUser.email}</p>
                            {request.message && (
                              <p className="text-sm mt-1 text-muted-foreground flex items-center">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {request.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => respondToRequestMutation.mutate({ requestId: request.id, status: 'accepted' })}
                            disabled={respondToRequestMutation.isPending}
                            data-testid={`button-accept-${request.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => respondToRequestMutation.mutate({ requestId: request.id, status: 'declined' })}
                            disabled={respondToRequestMutation.isPending}
                            data-testid={`button-decline-${request.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sent Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Sent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {sentLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : sentRequests?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No sent friend requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentRequests?.map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(request.toUser.firstName, request.toUser.lastName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {request.toUser.firstName} {request.toUser.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{request.toUser.email}</p>
                            <Badge variant="secondary" className="mt-1">Pending</Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelRequestMutation.mutate(request.id)}
                          disabled={cancelRequestMutation.isPending}
                          data-testid={`button-cancel-${request.id}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                </div>

                {searchQuery.length < 2 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Enter at least 2 characters to search for users</p>
                  </div>
                ) : searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : searchResults?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchResults?.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`search-result-${user.id}`}>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => openRequestDialog(user)}
                          disabled={sendRequestMutation.isPending}
                          data-testid={`button-add-friend-${user.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add Friend
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Friend Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Friend Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <Avatar>
                  <AvatarFallback>{getInitials(selectedUser.firstName, selectedUser.lastName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="message">Add a message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Hi! I'd like to connect with you..."
                value={friendRequestMessage}
                onChange={(e) => setFriendRequestMessage(e.target.value)}
                className="mt-2"
                rows={3}
                data-testid="textarea-friend-request-message"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRequestDialogOpen(false);
                  setSelectedUser(null);
                  setFriendRequestMessage("");
                }}
                data-testid="button-cancel-request"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendRequest}
                disabled={sendRequestMutation.isPending}
                data-testid="button-send-request"
              >
                {sendRequestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
