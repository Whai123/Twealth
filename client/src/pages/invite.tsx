import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function InvitePage() {
  const [, params] = useRoute("/invite/:token");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const token = params?.token;

  const { data: invite, isLoading, error } = useQuery({
    queryKey: ["/api/invites", token],
    queryFn: () => fetch(`/api/invites/${token}`).then(res => {
      if (!res.ok) throw new Error("Invalid or expired invite");
      return res.json();
    }),
    enabled: !!token,
  });

  const acceptInviteMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/invites/${token}/accept`, {}),
    onSuccess: () => {
      toast({
        title: "Invite accepted!",
        description: `You've successfully joined ${invite?.group?.name}`,
      });
      setLocation("/groups");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invite",
        variant: "destructive",
      });
    },
  });

  const handleAccept = () => {
    acceptInviteMutation.mutate();
  };

  const handleDecline = () => {
    setLocation("/groups");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-center">Invalid Invite</CardTitle>
            <CardDescription className="text-center">
              This invite link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/groups")} 
              className="w-full"
              data-testid="button-back-to-groups"
            >
              Back to Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invite.expiresAt) < new Date();

  if (isExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
              <Calendar className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-center">Invite Expired</CardTitle>
            <CardDescription className="text-center">
              This invite link has expired. Please request a new invite from the group owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/groups")} 
              className="w-full"
              data-testid="button-back-to-groups"
            >
              Back to Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-lg w-full shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 mx-auto mb-4">
            <Users className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl text-center">You're Invited!</CardTitle>
          <CardDescription className="text-center text-base">
            You've been invited to join a group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h3 className="text-xl font-bold mb-2 text-foreground">{invite.group.name}</h3>
            {invite.group.description && (
              <p className="text-muted-foreground mb-4">{invite.group.description}</p>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {invite.role} Role
              </Badge>
              <Badge variant="outline">
                Expires {new Date(invite.expiresAt).toLocaleDateString()}
              </Badge>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleDecline} 
              variant="outline" 
              className="flex-1"
              disabled={acceptInviteMutation.isPending}
              data-testid="button-decline-invite"
            >
              Decline
            </Button>
            <Button 
              onClick={handleAccept} 
              className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
              disabled={acceptInviteMutation.isPending}
              data-testid="button-accept-invite"
            >
              {acceptInviteMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Invite
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
