import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, TrendingUp, GraduationCap } from "lucide-react";

const getGroupIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("team") || lowerName.includes("work")) return Briefcase;
  if (lowerName.includes("finance") || lowerName.includes("money")) return TrendingUp;
  if (lowerName.includes("learn") || lowerName.includes("study")) return GraduationCap;
  return Briefcase;
};

const getGroupColor = (status: string) => {
  switch (status) {
    case "active":
      return { bg: "bg-green-100", text: "text-green-800" };
    case "planning":
      return { bg: "bg-amber-100", text: "text-amber-800" };
    case "archived":
      return { bg: "bg-gray-100", text: "text-gray-800" };
    default:
      return { bg: "bg-blue-100", text: "text-blue-800" };
  }
};

export default function GroupsOverview() {
  const { data: groups, isLoading } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: () => fetch("/api/groups").then(res => res.json()),
  });

  if (isLoading) {
    return (
      <Card className="p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                <div className="flex -space-x-2 mb-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="w-8 h-8 bg-muted rounded-full"></div>
                  ))}
                </div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const userGroups = groups || [];

  return (
    <Card className="p-6 shadow-sm">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">My Groups</CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-manage-groups">
            Manage
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {userGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No groups yet</p>
            <Button data-testid="button-create-first-group">
              <Plus size={16} className="mr-2" />
              Create Group
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {userGroups.slice(0, 3).map((group: any) => {
              const Icon = getGroupIcon(group.name);
              const statusColors = getGroupColor(group.status);
              
              return (
                <div key={group.id} className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Icon className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 
                          className="font-medium text-foreground truncate" 
                          data-testid={`text-group-${group.id}`}
                          title={group.name}
                        >
                          {group.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          6 members {/* This would be from group members query */}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text}`}>
                      {group.status}
                    </Badge>
                  </div>
                  
                  <div className="flex -space-x-2 mb-3">
                    {/* Mock member avatars - in real app would fetch group members */}
                    {[...Array(Math.min(5, 6))].map((_, index) => (
                      <Avatar key={index} className="w-8 h-8 border-2 border-background">
                        <AvatarFallback className="text-xs">
                          {index < 4 ? `U${index + 1}` : `+${6 - 4}`}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Next meeting: Schedule pending
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <Button variant="outline" className="w-full mt-4" data-testid="button-create-new-group">
          <Plus size={16} className="mr-2" />
          Create New Group
        </Button>
      </CardContent>
    </Card>
  );
}
