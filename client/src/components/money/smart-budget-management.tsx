import { useState } from"react";
import { useQuery, useMutation } from"@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import EmptyState from"@/components/ui/empty-state";
import { Badge } from"@/components/ui/badge";
import { Progress } from"@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from"@/components/ui/dialog";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { useToast } from"@/hooks/use-toast";
import { queryClient, apiRequest } from"@/lib/queryClient";
import { 
 Target, 
 PiggyBank,
 AlertTriangle, 
 CheckCircle,
 Zap,
 Plus,
 Pencil,
 Trash2,
 TrendingUp,
 Brain,
 Award,
 Loader2
} from"lucide-react";
import { format, startOfMonth, endOfMonth } from"date-fns";

interface SmartBudgetManagementProps {
 transactions: any[];
 timeRange: string;
}

const availableCategories = [
 { value:"dining", label:"Dining Out" },
 { value:"groceries", label:"Groceries" },
 { value:"transport", label:"Transportation" },
 { value:"utilities", label:"Utilities" },
 { value:"entertainment", label:"Entertainment" },
 { value:"shopping", label:"Shopping" },
 { value:"healthcare", label:"Healthcare" },
 { value:"education", label:"Education" },
 { value:"insurance", label:"Insurance" },
 { value:"rent", label:"Rent/Mortgage" },
 { value:"subscriptions", label:"Subscriptions" },
 { value:"other", label:"Other" },
];

export default function SmartBudgetManagement({ transactions, timeRange }: SmartBudgetManagementProps) {
 const { toast } = useToast();
 const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
 const [editingBudget, setEditingBudget] = useState<any>(null);
 const [formData, setFormData] = useState({ category:"", monthlyLimit:"" });

 // Fetch budgets
 const { data: budgets = [], isLoading } = useQuery<any[]>({
 queryKey: ["/api/budgets"],
 });

 // Calculate current month spending by category
 const now = new Date();
 const monthStart = startOfMonth(now);
 const monthEnd = endOfMonth(now);
 
 const currentMonthTransactions = transactions.filter(t => {
 const tDate = new Date(t.date);
 return t.type === 'expense' && tDate >= monthStart && tDate <= monthEnd;
 });

 const categorySpending = currentMonthTransactions.reduce((acc: any, transaction) => {
 const category = (transaction.category || 'other').toLowerCase();
 acc[category] = (acc[category] || 0) + parseFloat(transaction.amount);
 return acc;
 }, {});

 // Merge budgets with spending
 const budgetData = budgets.map(budget => {
 const spent = categorySpending[budget.category] || 0;
 const limit = parseFloat(budget.monthlyLimit);
 const percentage = limit > 0 ? (spent / limit) * 100 : 0;
 const status = percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good';
 
 return {
 ...budget,
 spent,
 limit,
 percentage,
 status,
 remaining: Math.max(0, limit - spent)
 };
 }).sort((a, b) => b.percentage - a.percentage);

 // Calculate totals
 const totalBudget = budgetData.reduce((sum, b) => sum + b.limit, 0);
 const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
 const budgetUsedPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

 // Mutations
 const createBudgetMutation = useMutation({
 mutationFn: async (data: any) => {
 return await apiRequest("POST","/api/budgets", data);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
 toast({ title:"Budget Created", description:"Your budget has been added successfully." });
 setIsAddDialogOpen(false);
 setFormData({ category:"", monthlyLimit:"" });
 },
 onError: (error: any) => {
 toast({ title:"Error", description: error.message, variant:"destructive" });
 }
 });

 const updateBudgetMutation = useMutation({
 mutationFn: async ({ id, data }: any) => {
 return await apiRequest("PUT", `/api/budgets/${id}`, data);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
 toast({ title:"Budget Updated", description:"Your budget has been updated successfully." });
 setEditingBudget(null);
 },
 onError: (error: any) => {
 toast({ title:"Error", description: error.message, variant:"destructive" });
 }
 });

 const deleteBudgetMutation = useMutation({
 mutationFn: async (id: string) => {
 return await apiRequest("DELETE", `/api/budgets/${id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
 toast({ title:"Budget Deleted", description:"Budget has been removed." });
 },
 onError: (error: any) => {
 toast({ title:"Error", description: error.message, variant:"destructive" });
 }
 });

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 
 // Validate form data
 if (!formData.category || !formData.monthlyLimit) {
 toast({ 
 title:"Validation Error", 
 description:"Please fill in all fields", 
 variant:"destructive" 
 });
 return;
 }
 
 if (editingBudget) {
 updateBudgetMutation.mutate({ id: editingBudget.id, data: { monthlyLimit: formData.monthlyLimit } });
 } else {
 createBudgetMutation.mutate(formData);
 }
 };

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'over': return 'text-red-600';
 case 'warning': return 'text-yellow-600';
 default: return 'text-green-600';
 }
 };

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'over': return <Badge variant="destructive">Over Budget</Badge>;
 case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">Near Limit</Badge>;
 default: return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">On Track</Badge>;
 }
 };

 const getCategoryLabel = (category: string) => {
 const cat = availableCategories.find(c => c.value === category);
 return cat ? cat.label : category.charAt(0).toUpperCase() + category.slice(1);
 };

 // Smart recommendations
 const recommendations = [];
 const overspent = budgetData.filter(b => b.status === 'over');
 if (overspent.length > 0) {
 recommendations.push({
 type: 'warning',
 title: 'Reduce Overspending',
 description: `Cut back on ${overspent[0].category} by $${(overspent[0].spent - overspent[0].limit).toFixed(0)}`,
 impact: `Get back on track this month`
 });
 }

 if (budgets.length === 0) {
 recommendations.push({
 type: 'opportunity',
 title: 'Start Budget Tracking',
 description: 'Create budgets for your top spending categories',
 impact: 'Take control of your finances'
 });
 }

 const onTrack = budgetData.filter(b => b.status === 'good').length;
 const totalCategories = budgetData.length;

 return (
 <div className="space-y-6">
 {/* Budget Overview */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">Total Budget</p>
 <p className="text-2xl font-bold text-blue-600">
 ${totalBudget.toLocaleString()}
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 {budgets.length} {budgets.length === 1 ? 'category' : 'categories'}
 </p>
 </div>
 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
 <Target className="text-blue-600" size={24} />
 </div>
 </div>
 </Card>

 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">Budget Used</p>
 <p className="text-2xl font-bold text-orange-600">
 {budgetUsedPercentage.toFixed(0)}%
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 ${totalSpent.toLocaleString()} spent
 </p>
 </div>
 <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
 <TrendingUp className="text-orange-600" size={24} />
 </div>
 </div>
 </Card>

 <Card className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-muted-foreground">Remaining</p>
 <p className="text-2xl font-bold text-green-600">
 ${(totalBudget - totalSpent).toLocaleString()}
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 for this month
 </p>
 </div>
 <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
 <PiggyBank className="text-green-600" size={24} />
 </div>
 </div>
 </Card>
 </div>

 {/* Budgets List */}
 <Card className="p-6">
 <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
 <CardTitle className="flex items-center">
 <Brain className="mr-2" size={20} />
 Your Budgets
 </CardTitle>
 <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
 <DialogTrigger asChild>
 <Button size="sm" data-testid="button-add-budget">
 <Plus className="mr-1" size={16} />
 Add Budget
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Create Budget</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <Label htmlFor="budget-category">Category</Label>
 <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})} required>
 <SelectTrigger id="budget-category" data-testid="select-budget-category">
 <SelectValue placeholder="Select category" />
 </SelectTrigger>
 <SelectContent>
 {availableCategories.map(cat => (
 <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div>
 <Label htmlFor="budget-limit">Monthly Limit ($)</Label>
 <Input
 id="budget-limit"
 type="number"
 step="0.01"
 min="0"
 placeholder="500.00"
 value={formData.monthlyLimit}
 onChange={(e) => setFormData({...formData, monthlyLimit: e.target.value})}
 data-testid="input-budget-limit"
 required
 />
 </div>
 <Button type="submit" disabled={createBudgetMutation.isPending} data-testid="button-submit-budget">
 {createBudgetMutation.isPending && <Loader2 className="mr-2 h-4 w-4" />}
 {createBudgetMutation.isPending ?"Creating..." :"Create Budget"}
 </Button>
 </form>
 </DialogContent>
 </Dialog>
 </CardHeader>
 <CardContent className="px-0">
 {isLoading ? (
 <p className="text-muted-foreground">Loading budgets...</p>
 ) : budgetData.length === 0 ? (
 <EmptyState
  illustration="budgets"
  title="No Budgets Created Yet"
  description="Set up your first budget to track spending and stay on top of your finances."
  actionLabel="Create Your First Budget"
  onAction={() => setIsAddDialogOpen(true)}
  actionTestId="button-create-first-budget"
 />
 ) : (
 <div className="space-y-4">
 {budgetData.map((budget) => (
 <div key={budget.id} className="space-y-2 p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 hover:shadow-md">
 <div className="flex items-center justify-between">
 <div className="flex items-center flex-1">
 <div className="flex-1">
 <p className="font-medium">{getCategoryLabel(budget.category)}</p>
 <p className="text-xs text-muted-foreground">
 ${budget.spent.toLocaleString()} of ${budget.limit.toLocaleString()}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="text-right mr-2">
 <p className={`font-bold ${getStatusColor(budget.status)}`}>
 {budget.percentage.toFixed(0)}%
 </p>
 {getStatusBadge(budget.status)}
 </div>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => {
 setEditingBudget(budget);
 setFormData({ category: budget.category, monthlyLimit: budget.monthlyLimit });
 }}
 data-testid={`button-edit-budget-${budget.id}`}
 >
 <Pencil size={16} />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => deleteBudgetMutation.mutate(budget.id)}
 data-testid={`button-delete-budget-${budget.id}`}
 >
 <Trash2 size={16} className="text-red-600" />
 </Button>
 </div>
 </div>
 <Progress value={Math.min(budget.percentage, 100)} className="h-2" />
 {budget.status === 'good' && budget.remaining > 0 && (
 <p className="text-xs text-green-600">
 ${budget.remaining.toFixed(0)} remaining this month
 </p>
 )}
 {budget.status === 'over' && (
 <p className="text-xs text-red-600">
 Over budget by ${(budget.spent - budget.limit).toFixed(0)}
 </p>
 )}
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Edit Budget Dialog */}
 {editingBudget && (
 <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Edit Budget - {getCategoryLabel(editingBudget.category)}</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <Label>Monthly Limit</Label>
 <Input
 type="number"
 step="0.01"
 value={formData.monthlyLimit}
 onChange={(e) => setFormData({...formData, monthlyLimit: e.target.value})}
 data-testid="input-edit-budget-limit"
 />
 </div>
 <Button type="submit" disabled={updateBudgetMutation.isPending} data-testid="button-update-budget">
 {updateBudgetMutation.isPending && <Loader2 className="mr-2 h-4 w-4" />}
 {updateBudgetMutation.isPending ?"Updating..." :"Update Budget"}
 </Button>
 </form>
 </DialogContent>
 </Dialog>
 )}

 {/* Smart Recommendations */}
 {recommendations.length > 0 && (
 <Card className="p-6">
 <CardHeader className="px-0 pt-0">
 <CardTitle className="flex items-center">
 <Zap className="mr-2" size={20} />
 Smart Recommendations
 </CardTitle>
 </CardHeader>
 <CardContent className="px-0">
 <div className="space-y-4">
 {recommendations.map((rec, index) => (
 <div key={index} className="flex items-start p-4 bg-muted/30 rounded-lg">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
 rec.type === 'warning' ? 'bg-red-100 dark:bg-red-900/20' :
 rec.type === 'opportunity' ? 'bg-green-100 dark:bg-green-900/20' :
 'bg-blue-100 dark:bg-blue-900/20'
 }`}>
 {rec.type === 'warning' ? (
 <AlertTriangle className="text-red-600" size={20} />
 ) : rec.type === 'opportunity' ? (
 <TrendingUp className="text-green-600" size={20} />
 ) : (
 <Award className="text-blue-600" size={20} />
 )}
 </div>
 <div>
 <h4 className="font-semibold">{rec.title}</h4>
 <p className="text-sm text-muted-foreground">{rec.description}</p>
 <p className="text-xs text-green-600 font-medium mt-1">{rec.impact}</p>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* Budget Health */}
 {budgetData.length > 0 && (
 <Card className="p-6">
 <CardHeader className="px-0 pt-0">
 <CardTitle className="flex items-center">
 <CheckCircle className="mr-2" size={20} />
 Budget Performance
 </CardTitle>
 </CardHeader>
 <CardContent className="px-0">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
 <div className="text-3xl font-bold text-green-600">
 {totalCategories > 0 ? Math.round((onTrack / totalCategories) * 100) : 0}%
 </div>
 <p className="text-sm text-muted-foreground">On Track</p>
 <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 mt-2">
 {onTrack}/{totalCategories} Categories
 </Badge>
 </div>
 
 <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
 <div className="text-3xl font-bold text-blue-600">{totalCategories}</div>
 <p className="text-sm text-muted-foreground">Active Budgets</p>
 <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 mt-2">
 Tracking
 </Badge>
 </div>
 
 <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
 <div className="text-3xl font-bold text-blue-600">
 ${(totalBudget - totalSpent > 0 ? totalBudget - totalSpent : 0).toLocaleString()}
 </div>
 <p className="text-sm text-muted-foreground">Left to Spend</p>
 <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 mt-2">
 This Month
 </Badge>
 </div>
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 );
}
