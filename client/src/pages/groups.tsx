import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Users, MoreHorizontal, UserPlus, Trash2, Copy,
  Home, Car, Target, PiggyBank, Search, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GroupForm from "@/components/forms/group-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserCurrency } from "@/lib/userContext";

const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = { house: Home, car: Car, savings: PiggyBank };
  return icons[category] || Target;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    house: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    car: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    savings: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  };
  return colors[category] || "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400";
};

export default function Groups() {
  const { formatAmount } = useUserCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteExpiry, setInviteExpiry] = useState("7");
  const [generatedInvite, setGeneratedInvite] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rawGroups, isLoading } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/groups");
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch { return []; }
    },
  });

  const groups: any[] = Array.isArray(rawGroups) ? rawGroups : [];

  // Filter groups
  const filteredGroups = useMemo(() => {
    let filtered = [...groups];
    if (searchQuery) {
      filtered = filtered.filter(g => g.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeTab === 'archived') {
      filtered = filtered.filter(g => g.status === 'archived');
    } else if (activeTab === 'active') {
      filtered = filtered.filter(g => g.status !== 'archived');
    }
    return filtered;
  }, [groups, searchQuery, activeTab]);

  // Stats
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalMembers = groups.reduce((sum, g) => sum + (g.memberCount || 1), 0);
    const totalSaved = groups.reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0);
    return { totalGroups, totalMembers, totalSaved };
  }, [groups]);

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => apiRequest("DELETE", `/api/groups/${groupId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Group deleted" });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: async ({ groupId, role, expiry }: any) => {
      const expiresAt = new Date(Date.now() + parseInt(expiry) * 24 * 60 * 60 * 1000);
      const response = await apiRequest("POST", `/api/groups/${groupId}/invites`, { role, expiresAt: expiresAt.toISOString() });
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedInvite(data);
      toast({ title: "Invite link created" });
    },
  });

  const handleInvite = (groupId: string) => {
    setSelectedGroupId(groupId);
    setGeneratedInvite(null);
    setInviteDialogOpen(true);
  };

  const handleCopyLink = () => {
    if (generatedInvite?.invite?.token) {
      navigator.clipboard.writeText(`${window.location.origin}/invite/${generatedInvite.invite.token}`);
      toast({ title: "Link copied!" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Your Groups</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Collaborate on shared savings goals</p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-5 font-medium shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {groups.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No groups yet</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-md mb-8">
              Create a group to track shared savings for a house, car, or vacation with friends and family.
            </p>

            {/* Examples */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mb-8">
              {[
                { icon: Home, label: "House", color: "blue" },
                { icon: Car, label: "Car", color: "amber" },
                { icon: PiggyBank, label: "Savings", color: "emerald" },
              ].map((item) => (
                <div key={item.label} className={`p-4 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/30 text-center`}>
                  <item.icon className={`w-8 h-8 mx-auto mb-2 text-${item.color}-600 dark:text-${item.color}-400`} />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.label}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-8 font-medium"
            >
              Create your first group
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Groups", value: stats.totalGroups, icon: Target },
                { label: "Members", value: stats.totalMembers, icon: Users },
                { label: "Total Saved", value: formatAmount(stats.totalSaved), icon: PiggyBank },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800"
                  whileHover={{ y: -2, boxShadow: '0 8px 30px -12px rgba(0,0,0,0.1)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Tabs + Search */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                {(['all', 'active', 'archived'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all capitalize ${activeTab === tab
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-[200px] rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            {/* Group Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredGroups.map((group, index) => {
                  const Icon = getCategoryIcon(group.category);
                  const progress = group.budget > 0 ? Math.min((parseFloat(group.currentAmount || 0) / parseFloat(group.budget)) * 100, 100) : 0;

                  return (
                    <motion.div
                      key={group.id}
                      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 hover:shadow-md transition-all"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(group.category)}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white">{group.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                              <Users className="w-3 h-3" />
                              <span>{group.memberCount || 1} member{(group.memberCount || 1) !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                              <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleInvite(group.id)}>
                              <UserPlus className="w-4 h-4 mr-2" /> Invite
                            </DropdownMenuItem>
                            <DropdownMenuItem><Settings className="w-4 h-4 mr-2" /> Settings</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteGroupMutation.mutate(group.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Progress */}
                      {group.budget > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-zinc-900 dark:text-white">
                              {formatAmount(parseFloat(group.currentAmount || 0))}
                            </span>
                            <span className="text-sm text-zinc-500">of {formatAmount(parseFloat(group.budget))}</span>
                          </div>
                          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-blue-600 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Member Avatars */}
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(group.memberCount || 1, 4))].map((_, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-300"
                            >
                              {String.fromCharCode(65 + i)}
                            </div>
                          ))}
                          {(group.memberCount || 1) > 4 && (
                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-medium text-zinc-500">
                              +{(group.memberCount || 1) - 4}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg h-8 border-zinc-200 dark:border-zinc-700"
                          onClick={() => handleInvite(group.id)}
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                          Invite
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>Start a shared savings goal with friends or family</DialogDescription>
          </DialogHeader>
          <GroupForm onSuccess={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>Generate a link to share with others</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expires in</Label>
              <Select value={inviteExpiry} onValueChange={setInviteExpiry}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {generatedInvite ? (
              <div className="space-y-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-xs text-zinc-400 mb-1">Invite Link</p>
                  <p className="text-sm font-mono break-all">{`${window.location.origin}/invite/${generatedInvite.invite?.token}`}</p>
                </div>
                <Button onClick={handleCopyLink} className="w-full rounded-xl">
                  <Copy className="w-4 h-4 mr-2" /> Copy Link
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => selectedGroupId && createInviteMutation.mutate({ groupId: selectedGroupId, role: inviteRole, expiry: inviteExpiry })}
                disabled={createInviteMutation.isPending}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                {createInviteMutation.isPending ? "Creating..." : "Generate Link"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
