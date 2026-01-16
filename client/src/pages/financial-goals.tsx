import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Target, Edit, Trash2, TrendingUp, DollarSign,
  Calendar, PiggyBank, CheckCircle, MoreHorizontal, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GoalForm from "@/components/forms/goal-form";
import EditGoalForm from "@/components/forms/edit-goal-form";
import AddFundsForm from "@/components/forms/add-funds-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserCurrency } from "@/lib/userContext";

export default function FinancialGoals() {
  const { formatAmount, currencySymbol } = useUserCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'progress' | 'deadline'>('newest');

  const { data: rawGoals, isLoading } = useQuery({
    queryKey: ["/api/financial-goals"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/financial-goals");
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  const goals: any[] = Array.isArray(rawGoals) ? rawGoals : [];

  // Filter and sort goals
  const filteredGoals = useMemo(() => {
    let filtered = [...goals];

    if (activeFilter === 'active') {
      filtered = filtered.filter(g => g.status === 'active');
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter(g => g.status === 'completed' || parseFloat(g.currentAmount) >= parseFloat(g.targetAmount));
    }

    if (sortBy === 'progress') {
      filtered.sort((a, b) => {
        const progressA = parseFloat(a.currentAmount) / parseFloat(a.targetAmount);
        const progressB = parseFloat(b.currentAmount) / parseFloat(b.targetAmount);
        return progressB - progressA;
      });
    } else if (sortBy === 'deadline') {
      filtered.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [goals, activeFilter, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalGoals = goals.length;
    const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount || 0), 0);
    const completionRate = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    return { totalGoals, totalSaved, totalTarget, completionRate };
  }, [goals]);

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => apiRequest("DELETE", `/api/financial-goals/${goalId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      toast({ title: "Goal deleted", description: "Your goal has been removed." });
    },
  });

  const handleDelete = (goalId: string) => {
    if (confirm("Delete this goal?")) deleteGoalMutation.mutate(goalId);
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
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Goals</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track your savings progress</p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-5 font-medium shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {goals.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
              <Target className="w-10 h-10 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No goals yet</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-md mb-8">
              Start your savings journey by creating your first financial goal.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-8 font-medium"
            >
              Create your first goal
            </Button>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Goals", value: stats.totalGoals, icon: Target, color: "blue" },
                { label: "Total Saved", value: formatAmount(stats.totalSaved), icon: PiggyBank, color: "emerald" },
                { label: "Target", value: formatAmount(stats.totalTarget), icon: TrendingUp, color: "violet" },
                { label: "Completion", value: `${stats.completionRate}%`, icon: CheckCircle, color: "amber" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800"
                  whileHover={{ y: -2, boxShadow: '0 8px 30px -12px rgba(0,0,0,0.1)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${stat.color}-50 dark:bg-${stat.color}-900/30`}>
                      <stat.icon className={`w-4 h-4 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                {(['all', 'active', 'completed'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all capitalize ${activeFilter === filter
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px] h-9 text-sm border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Goal Cards */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredGoals.map((goal, index) => {
                  const progress = Math.min((parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100, 100);
                  const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isCompleted = progress >= 100;

                  return (
                    <motion.div
                      key={goal.id}
                      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{goal.title}</h3>
                            {isCompleted && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                Completed
                              </span>
                            )}
                          </div>
                          {goal.description && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{goal.description}</p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedGoal(goal); setIsEditDialogOpen(true); }}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(goal.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Progress Section */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {formatAmount(parseFloat(goal.currentAmount))}
                          </span>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            of {formatAmount(parseFloat(goal.targetAmount))}
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{Math.round(progress)}%</span>
                          <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl h-10 border-zinc-200 dark:border-zinc-700"
                          onClick={() => { setSelectedGoal(goal); setIsAddFundsDialogOpen(true); }}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Add Money
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-xl h-10 border-zinc-200 dark:border-zinc-700"
                          onClick={() => { setSelectedGoal(goal); setIsEditDialogOpen(true); }}
                        >
                          <Edit className="w-4 h-4" />
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

      {/* Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          {selectedGoal && <EditGoalForm goal={selectedGoal} onSuccess={() => setIsEditDialogOpen(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedGoal && (
            <AddFundsForm
              goalId={selectedGoal.id}
              goalTitle={selectedGoal.title}
              currentAmount={selectedGoal.currentAmount}
              targetAmount={selectedGoal.targetAmount}
              onSuccess={() => setIsAddFundsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <GoalForm onSuccess={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
