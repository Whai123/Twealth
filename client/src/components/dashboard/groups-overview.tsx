import { useQuery } from"@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Avatar, AvatarFallback } from"@/components/ui/avatar";
import { Badge } from"@/components/ui/badge";
import { Plus, Briefcase, TrendingUp, GraduationCap } from"lucide-react";
import { Link } from"wouter";

// Helper function to get user initials
const getUserInitials = (user: any): string => {
 if (user.firstName && user.lastName) {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
 }
 if (user.firstName) {
  return user.firstName[0].toUpperCase();
 }
 if (user.username) {
  return user.username.slice(0, 2).toUpperCase();
 }
 return"U";
};

const getGroupIcon = (name: string) => {
 const lowerName = name.toLowerCase();
 if (lowerName.includes("team") || lowerName.includes("work")) return Briefcase;
 if (lowerName.includes("finance") || lowerName.includes("money")) return TrendingUp;
 if (lowerName.includes("learn") || lowerName.includes("study")) return GraduationCap;
 return Briefcase;
};

const getGroupColor = (status: string) => {
 switch (status) {
  case"active":
   return { bg:"bg-green-100", text:"text-green-800" };
  case"planning":
   return { bg:"bg-amber-100", text:"text-amber-800" };
  case"archived":
   return { bg:"bg-gray-100", text:"text-gray-800" };
  default:
   return { bg:"bg-blue-100", text:"text-blue-800" };
 }
};

// Component to display member count
function MemberCountDisplay({ groupId }: { groupId: string }) {
 const { data: members } = useQuery({
  queryKey: ['/api/groups', groupId, 'members-with-users'],
  enabled: !!groupId,
 });

 const memberCount = Array.isArray(members) ? members.length : 0;
 const memberText = memberCount === 1 ?"member" :"members";

 return (
  <p className="text-xs text-muted-foreground">
   {memberCount} {memberText}
  </p>
 );
}

// Component to display group member avatars
function GroupMemberAvatars({ groupId }: { groupId: string }) {
 const { data: members } = useQuery({
  queryKey: ['/api/groups', groupId, 'members-with-users'],
  enabled: !!groupId,
 });

 if (!members || !Array.isArray(members)) {
  return (
   <div className="flex -space-x-2 mb-3">
    {[...Array(3)].map((_, index) => (
     <Avatar key={index} className="w-8 h-8 border-2 border-background">
      <AvatarFallback className="text-xs bg-muted">
       {index + 1}
      </AvatarFallback>
     </Avatar>
    ))}
   </div>
  );
 }

 const displayMembers = members.slice(0, 4);
 const remainingCount = Math.max(0, members.length - 4);

 return (
  <div className="flex -space-x-2 mb-3">
   {displayMembers.map((member: any) => (
    <Avatar key={member.user.id} className="w-8 h-8 border-2 border-background">
     <AvatarFallback className="text-xs">
      {getUserInitials(member.user)}
     </AvatarFallback>
    </Avatar>
   ))}
   {remainingCount > 0 && (
    <Avatar className="w-8 h-8 border-2 border-background">
     <AvatarFallback className="text-xs bg-muted">
      +{remainingCount}
     </AvatarFallback>
    </Avatar>
   )}
  </div>
 );
}

export default function GroupsOverview() {
 const { data: groups, isLoading } = useQuery({
  queryKey: ["/api/groups"],
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

 const userGroups = Array.isArray(groups) ? groups : [];

 return (
  <Card className="p-6 shadow-sm">
   <CardHeader className="p-0 mb-6">
    <div className="flex items-center justify-between">
     <CardTitle className="text-lg font-semibold">Collaborative Events</CardTitle>
     <Button variant="ghost" size="sm" data-testid="button-manage-groups" asChild>
      <Link href="/groups">View Events</Link>
     </Button>
    </div>
   </CardHeader>
   
   <CardContent className="p-0">
    {userGroups.length === 0 ? (
     <div className="text-center py-8">
      <p className="text-muted-foreground mb-4">No groups yet</p>
      <Button data-testid="button-create-first-group" asChild>
       <Link href="/groups?create=1">
        <Plus size={16} className="mr-2" />
        Create Group
       </Link>
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
          <div className="flex items-center space-x-3 min-w-0 flex-1">
           <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="text-blue-600" size={20} />
           </div>
           <div className="min-w-0 flex-1">
            <h3 
             className="font-medium text-foreground truncate" 
             data-testid={`text-group-${group.id}`}
             title={group.name}
            >
             {group.name}
            </h3>
            <MemberCountDisplay groupId={group.id} />
           </div>
          </div>
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text}`}>
           {group.status}
          </Badge>
         </div>
         
         <GroupMemberAvatars groupId={group.id} />
         
         <p className="text-xs text-muted-foreground">
          Next meeting: Schedule pending
         </p>
        </div>
       );
      })}
     </div>
    )}

    <Button variant="outline" className="w-full mt-4" data-testid="button-create-new-group" asChild>
     <Link href="/groups?create=1">
      <Plus size={16} className="mr-2" />
      Create New Group
     </Link>
    </Button>
   </CardContent>
  </Card>
 );
}
