import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Crown, Sparkles, Building2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  enterpriseUsers: number;
  activeSubscriptions: number;
}

interface AdminUser {
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
  } | null;
  planName: string | null;
}

interface AdminUsersResponse {
  totalUsers: number;
  users: AdminUser[];
}

export default function AdminPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery<AdminUsersResponse>({
    queryKey: ["/api/admin/users"],
  });

  if (statsError || usersError) {
    const error = statsError || usersError;
    const errorMessage = error instanceof Error ? error.message : "Access denied";
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          {errorMessage.includes("403") || errorMessage.includes("Admin") 
            ? "You don't have permission to view this page. Admin access is required."
            : errorMessage}
        </p>
      </div>
    );
  }

  const getPlanBadge = (planName: string | null) => {
    switch (planName) {
      case "enterprise":
        return <Badge className="bg-purple-600"><Building2 className="h-3 w-3 mr-1" />Enterprise</Badge>;
      case "pro":
        return <Badge className="bg-blue-600"><Sparkles className="h-3 w-3 mr-1" />Pro</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">Active</Badge>;
      case "canceled":
        return <Badge variant="destructive">Canceled</Badge>;
      case "past_due":
        return <Badge className="bg-orange-500">Past Due</Badge>;
      default:
        return <Badge variant="outline">No Sub</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-yellow-500" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Free Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.freeUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">{stats?.proUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enterprise Users</CardTitle>
            <Building2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-purple-600">{stats?.enterpriseUsers || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData?.users.map((item) => (
                  <TableRow key={item.user.id} data-testid={`row-user-${item.user.id}`}>
                    <TableCell className="font-medium" data-testid={`text-email-${item.user.id}`}>
                      {item.user.email || "No email"}
                    </TableCell>
                    <TableCell data-testid={`text-name-${item.user.id}`}>
                      {item.user.firstName || ""} {item.user.lastName || ""}
                    </TableCell>
                    <TableCell>
                      {getPlanBadge(item.planName)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.subscription?.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.user.createdAt 
                        ? format(new Date(item.user.createdAt), "MMM d, yyyy")
                        : "Unknown"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
