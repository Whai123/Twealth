import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Users, MoreHorizontal, UserPlus, Trash2, Copy, DollarSign, 
  Home, Car, Target, PiggyBank, Calculator, TrendingUp, Clock,
  ChevronRight, Sparkles, CheckCircle, Share2, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupForm from "@/components/forms/group-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserId, useUserCurrency } from "@/lib/userContext";

function AnimatedNumber({ value, formatFn }: { value: number; formatFn: (val: number) => string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 800;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{formatFn(Math.round(displayValue))}</span>;
}

function CircularProgress({ progress, size = 60 }: { progress: number; size?: number }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedProgress / 100) * circumference;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="stroke-muted"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="stroke-primary transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold">{Math.round(animatedProgress)}%</span>
      </div>
    </div>
  );
}

function ExpenseSplitCalculator({ 
  totalAmount, 
  memberCount,
  onClose,
  formatAmount
}: { 
  totalAmount: number; 
  memberCount: number;
  onClose: () => void;
  formatAmount: (val: number) => string;
}) {
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<number, number>>({});
  
  const equalSplit = memberCount > 0 ? totalAmount / memberCount : 0;
  
  const handleCustomChange = (index: number, value: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [index]: parseFloat(value) || 0
    }));
  };
  
  const totalCustom = Object.values(customSplits).reduce((sum, val) => sum + val, 0);
  const remaining = totalAmount - totalCustom;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
        <div>
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold text-primary">{formatAmount(totalAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Members</p>
          <p className="text-2xl font-bold">{memberCount}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant={splitType === 'equal' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setSplitType('equal')}
        >
          Equal Split
        </Button>
        <Button
          variant={splitType === 'custom' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setSplitType('custom')}
        >
          Custom Split
        </Button>
      </div>
      
      {splitType === 'equal' ? (
        <div className="p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground mb-2">Each person pays:</p>
          <p className="text-3xl font-bold text-primary">{formatAmount(equalSplit)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...Array(memberCount)].map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              <Input
                type="number"
                placeholder="0.00"
                className="flex-1"
                value={customSplits[index] || ''}
                onChange={(e) => handleCustomChange(index, e.target.value)}
              />
            </div>
          ))}
          {remaining !== 0 && (
            <p className={`text-sm ${remaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {remaining > 0 
                ? `${formatAmount(remaining)} remaining to assign`
                : `${formatAmount(Math.abs(remaining))} over the total`
              }
            </p>
          )}
        </div>
      )}
      
      <Button onClick={onClose} variant="outline" className="w-full">
        Done
      </Button>
    </div>
  );
}

function GroupCard({ 
  group, 
  onInvite, 
  onDelete,
  onContribute,
  formatAmount,
  delay = 0
}: { 
  group: any; 
  onInvite: () => void; 
  onDelete: () => void;
  onContribute: () => void;
  formatAmount: (val: number) => string;
  delay?: number;
}) {
  const targetAmount = parseFloat(group.budget || '0');
  const currentAmount = parseFloat(group.currentAmount || '0');
  const progress = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;
  const remaining = Math.max(0, targetAmount - currentAmount);
  const memberCount = group.memberCount || 1;
  
  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'house': return Home;
      case 'car': return Car;
      case 'savings': return PiggyBank;
      default: return Target;
    }
  };
  
  const GroupIcon = getGroupIcon(group.category);
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'house': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'car': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      case 'savings': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default: return 'bg-primary/10 text-primary';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card 
        className="group overflow-hidden border-border/40 hover:shadow-lg hover:border-border transition-all duration-300" 
        data-testid={`card-group-${group.id}`}
      >
        <div 
          className="h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 transition-all duration-500"
          style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
        />
        
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getCategoryColor(group.category)}`}>
                <GroupIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle 
                  className="text-base sm:text-lg font-semibold truncate" 
                  data-testid={`text-group-name-${group.id}`}
                >
                  {group.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                  </div>
                  {group.category && (
                    <>
                      <span>-</span>
                      <span className="capitalize">{group.category}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onInvite}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
          {targetAmount > 0 && (
            <div className="flex items-center gap-4">
              <CircularProgress progress={progress} size={64} />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl font-bold text-primary">
                    <AnimatedNumber value={currentAmount} formatFn={formatAmount} />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatAmount(targetAmount)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatAmount(remaining)} remaining
                </p>
                {memberCount > 1 && remaining > 0 && (
                  <p className="text-xs text-primary font-medium">
                    {formatAmount(Math.ceil(remaining / memberCount))}/person needed
                  </p>
                )}
              </div>
            </div>
          )}
          
          {group.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {group.description}
            </p>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-10 text-xs sm:text-sm"
              onClick={onInvite}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Invite
            </Button>
            <Button 
              size="sm" 
              className="flex-1 h-10 text-xs sm:text-sm"
              onClick={onContribute}
              data-testid={`button-contribute-${group.id}`}
            >
              <DollarSign className="w-3.5 h-3.5 mr-1.5" />
              Contribute
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  colorClass,
  formatAmount,
  delay = 0
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  colorClass: string;
  formatAmount?: (val: number) => string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="border-border/40">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('400', '900/30')}`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className={`text-lg sm:text-xl font-bold ${colorClass}`}>
                {typeof value === 'number' && formatAmount ? <AnimatedNumber value={value} formatFn={formatAmount} /> : value}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Groups() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviteExpiry, setInviteExpiry] = useState<string>("7");
  const [generatedInvite, setGeneratedInvite] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = useUserId();
  const { formatAmount } = useUserCurrency();

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

  const handleContribute = (group: any) => {
    setSelectedGroup(group);
    setCalculatorDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background/95 backdrop-blur border-b border-border/40 sticky top-0 z-30">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="h-8 bg-muted/50 rounded-lg w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-muted/50 rounded w-64 animate-pulse" />
          </div>
        </header>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-muted/50 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-muted/50 rounded w-20 animate-pulse" />
                    <div className="h-5 bg-muted/50 rounded w-24 animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted/50 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted/50 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
                <div className="h-16 bg-muted/50 rounded-lg animate-pulse mb-4" />
                <div className="flex gap-2">
                  <div className="h-10 bg-muted/50 rounded flex-1 animate-pulse" />
                  <div className="h-10 bg-muted/50 rounded flex-1 animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const userGroups = groups || [];
  
  const totalTarget = userGroups.reduce((sum: number, g: any) => sum + parseFloat(g.budget || '0'), 0);
  const totalCurrent = userGroups.reduce((sum: number, g: any) => sum + parseFloat(g.currentAmount || '0'), 0);
  const totalMembers = userGroups.reduce((sum: number, g: any) => sum + (g.memberCount || 1), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background/95 backdrop-blur border-b border-border/40 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <motion.div 
              className="flex-1 min-w-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                Shared Goals
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                Split costs and track contributions with your group
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="min-h-[44px] shadow-sm"
                    data-testid="button-create-group"
                  >
                    <Plus size={18} className="sm:mr-2" />
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
            </motion.div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {userGroups.length === 0 ? (
          <motion.div 
            className="text-center py-12 sm:py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
            </div>
            
            <h3 className="text-xl sm:text-2xl font-semibold mb-3">
              Start a Shared Goal
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm sm:text-base">
              Create a group to split costs for big purchases like a house, car, or vacation. 
              Track everyone's contributions in one place.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              {[
                { icon: Home, title: "House Down Payment", desc: "Split with partner or family", color: "text-blue-600 dark:text-blue-400" },
                { icon: Car, title: "Car Purchase", desc: "Share with co-buyers", color: "text-amber-600 dark:text-amber-400" },
                { icon: PiggyBank, title: "Group Savings", desc: "Vacation, event, or gift", color: "text-green-600 dark:text-green-400" },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                >
                  <Card className="p-4 text-center hover:shadow-md transition-shadow border-border/40">
                    <item.icon className={`w-8 h-8 mx-auto mb-2 ${item.color}`} />
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
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
            </motion.div>
          </motion.div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <SummaryCard
                title="Total Target"
                value={totalTarget}
                icon={Target}
                colorClass="text-primary"
                formatAmount={formatAmount}
                delay={0}
              />
              <SummaryCard
                title="Total Saved"
                value={totalCurrent}
                icon={TrendingUp}
                colorClass="text-green-600 dark:text-green-400"
                formatAmount={formatAmount}
                delay={0.1}
              />
              <SummaryCard
                title="Total Members"
                value={`${totalMembers}`}
                icon={Users}
                colorClass="text-blue-600 dark:text-blue-400"
                delay={0.2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {userGroups.map((group: any, index: number) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onInvite={() => handleCreateInvite(group.id)}
                    onDelete={() => handleDeleteGroup(group.id)}
                    onContribute={() => handleContribute(group)}
                    formatAmount={formatAmount}
                    delay={index * 0.1}
                  />
                ))}
              </AnimatePresence>
            </div>
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
              <Label htmlFor="invite-role" className="text-sm font-medium">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role" className="h-11 mt-1.5" data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="invite-expiry" className="text-sm font-medium">Link Expires In</Label>
              <Select value={inviteExpiry} onValueChange={setInviteExpiry}>
                <SelectTrigger id="invite-expiry" className="h-11 mt-1.5" data-testid="select-invite-expiry">
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
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-4 bg-muted/50 rounded-xl border border-border/40">
                  <p className="text-xs text-muted-foreground mb-2">Invite Link</p>
                  <p className="text-sm font-mono break-all text-foreground">
                    {`${window.location.origin}/invite/${generatedInvite.invite?.token}`}
                  </p>
                </div>
                <Button onClick={handleCopyInviteLink} className="w-full min-h-[44px]">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </motion.div>
            ) : (
              <Button 
                onClick={handleGenerateInvite} 
                className="w-full min-h-[44px]"
                disabled={createInviteMutation.isPending}
              >
                {createInviteMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Invite Link
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={calculatorDialogOpen} onOpenChange={setCalculatorDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Split Calculator
            </DialogTitle>
            <DialogDescription>
              Calculate how much each person needs to contribute
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroup && (
            <ExpenseSplitCalculator
              totalAmount={parseFloat(selectedGroup.budget || '0') - parseFloat(selectedGroup.currentAmount || '0')}
              memberCount={selectedGroup.memberCount || 1}
              onClose={() => setCalculatorDialogOpen(false)}
              formatAmount={formatAmount}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
