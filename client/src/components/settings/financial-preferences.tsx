import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  Settings,
  Plus,
  Minus,
  CheckCircle,
  Loader2
} from "lucide-react";

interface FinancialPreferencesProps {
  // Add props as needed
}

type FinancialPreferences = {
  id: string;
  userId: string;
  defaultBudgetPeriod: "weekly" | "monthly" | "yearly";
  budgetWarningThreshold: number;
  autoSavingsEnabled: boolean;
  autoSavingsAmount: string;
  autoSavingsFrequency: "weekly" | "monthly";
  defaultGoalPriority: "low" | "medium" | "high";
  expenseCategories: string[];
  incomeCategories: string[];
  createdAt: string;
  updatedAt: string;
};

export default function FinancialPreferences({ }: FinancialPreferencesProps) {
  const { toast } = useToast();

  // Fetch financial preferences
  const { data: preferences, isLoading } = useQuery<FinancialPreferences>({
    queryKey: ['/api/financial-preferences'],
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (updates: Partial<FinancialPreferences>) =>
      apiRequest('PUT', '/api/financial-preferences', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-preferences'] });
      toast({
        title: "Financial preferences updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update financial preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const budgetPeriods = [
    { value: "weekly", label: "Weekly", description: "Track spending week by week" },
    { value: "monthly", label: "Monthly", description: "Monthly budget cycles" },
    { value: "yearly", label: "Yearly", description: "Annual budget planning" }
  ];

  const goalPriorities = [
    { value: "low", label: "Low Priority", color: "bg-gray-100 text-gray-800" },
    { value: "medium", label: "Medium Priority", color: "bg-blue-100 text-blue-800" },
    { value: "high", label: "High Priority", color: "bg-red-100 text-red-800" }
  ];

  const savingsFrequencies = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" }
  ];

  const handleBudgetPeriodChange = (period: "weekly" | "monthly" | "yearly") => {
    updatePreferencesMutation.mutate({ defaultBudgetPeriod: period });
  };

  const handleAutoSavingsToggle = () => {
    if (!preferences) return;
    updatePreferencesMutation.mutate({ 
      autoSavingsEnabled: !preferences.autoSavingsEnabled 
    });
  };

  const handleAutoSavingsAmountChange = (amount: string) => {
    updatePreferencesMutation.mutate({ autoSavingsAmount: amount });
  };

  const handleWarningThresholdChange = (threshold: number) => {
    updatePreferencesMutation.mutate({ budgetWarningThreshold: threshold });
  };

  const handleGoalPriorityChange = (priority: "low" | "medium" | "high") => {
    updatePreferencesMutation.mutate({ defaultGoalPriority: priority });
  };

  const handleSavingsFrequencyChange = (frequency: "weekly" | "monthly") => {
    updatePreferencesMutation.mutate({ autoSavingsFrequency: frequency });
  };

  const addExpenseCategory = (category: string) => {
    if (!preferences || !category.trim()) return;
    const newCategories = [...preferences.expenseCategories, category.trim()];
    updatePreferencesMutation.mutate({ expenseCategories: newCategories });
  };

  const removeExpenseCategory = (index: number) => {
    if (!preferences) return;
    const newCategories = preferences.expenseCategories.filter((_, i) => i !== index);
    updatePreferencesMutation.mutate({ expenseCategories: newCategories });
  };

  const addIncomeCategory = (category: string) => {
    if (!preferences || !category.trim()) return;
    const newCategories = [...preferences.incomeCategories, category.trim()];
    updatePreferencesMutation.mutate({ incomeCategories: newCategories });
  };

  const removeIncomeCategory = (index: number) => {
    if (!preferences) return;
    const newCategories = preferences.incomeCategories.filter((_, i) => i !== index);
    updatePreferencesMutation.mutate({ incomeCategories: newCategories });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2" size={24} />
        Loading financial preferences...
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load financial preferences</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Settings */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2" size={20} />
            Budget Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          {/* Budget Period */}
          <div className="space-y-3">
            <h4 className="font-medium">Default Budget Period</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {budgetPeriods.map((period) => (
                <button
                  key={period.value}
                  data-testid={`budget-period-${period.value}`}
                  onClick={() => handleBudgetPeriodChange(period.value as "weekly" | "monthly" | "yearly")}
                  disabled={updatePreferencesMutation.isPending}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    preferences.defaultBudgetPeriod === period.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  } ${updatePreferencesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <h4 className="font-medium">{period.label}</h4>
                  <p className="text-sm text-muted-foreground">{period.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Warning Threshold */}
          <div className="space-y-3">
            <h4 className="font-medium">Budget Warning Threshold</h4>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  data-testid="input-warning-threshold"
                  type="number"
                  min="50"
                  max="100"
                  value={preferences.budgetWarningThreshold}
                  onChange={(e) => handleWarningThresholdChange(parseInt(e.target.value))}
                  disabled={updatePreferencesMutation.isPending}
                  className="w-full"
                />
              </div>
              <div className="flex items-center">
                <AlertTriangle className="text-yellow-500 mr-2" size={20} />
                <span className="text-sm text-muted-foreground">% of budget</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Get notified when spending reaches {preferences.budgetWarningThreshold}% of your budget
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Savings */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Target className="mr-2" size={20} />
            Auto-Savings Options
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">Enable Auto-Savings</p>
              <p className="text-sm text-muted-foreground">Automatically save toward your goals</p>
            </div>
            <Switch 
              data-testid="switch-auto-savings"
              checked={preferences.autoSavingsEnabled}
              onCheckedChange={handleAutoSavingsToggle}
              disabled={updatePreferencesMutation.isPending}
            />
          </div>

          {preferences.autoSavingsEnabled && (
            <div className="space-y-4 ml-4 border-l-2 border-primary/20 pl-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Auto-Savings Amount</label>
                  <Input
                    data-testid="input-auto-savings-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={preferences.autoSavingsAmount}
                    onChange={(e) => handleAutoSavingsAmountChange(e.target.value)}
                    disabled={updatePreferencesMutation.isPending}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Frequency</label>
                  <Select 
                    value={preferences.autoSavingsFrequency} 
                    onValueChange={handleSavingsFrequencyChange}
                    disabled={updatePreferencesMutation.isPending}
                  >
                    <SelectTrigger data-testid="select-savings-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {savingsFrequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Defaults */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Goal Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Default Goal Priority</label>
            <Select 
              value={preferences.defaultGoalPriority} 
              onValueChange={handleGoalPriorityChange}
              disabled={updatePreferencesMutation.isPending}
            >
              <SelectTrigger data-testid="select-goal-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goalPriorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <div className="flex items-center">
                      <Badge className={`mr-2 ${priority.color}`}>
                        {priority.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Settings className="mr-2" size={20} />
            Category Management
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          {/* Expense Categories */}
          <div className="space-y-3">
            <h4 className="font-medium">Expense Categories</h4>
            <div className="flex flex-wrap gap-2">
              {preferences.expenseCategories.map((category, index) => (
                <Badge
                  key={index}
                  data-testid={`expense-category-${index}`}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{category}</span>
                  <button
                    data-testid={`remove-expense-category-${index}`}
                    onClick={() => removeExpenseCategory(index)}
                    disabled={updatePreferencesMutation.isPending}
                    className="ml-1 hover:text-red-500"
                  >
                    <Minus size={14} />
                  </button>
                </Badge>
              ))}
              <Button
                data-testid="add-expense-category"
                variant="outline"
                size="sm"
                onClick={() => {
                  const category = prompt("Enter new expense category:");
                  if (category) addExpenseCategory(category);
                }}
                disabled={updatePreferencesMutation.isPending}
              >
                <Plus size={14} className="mr-1" />
                Add Category
              </Button>
            </div>
          </div>

          {/* Income Categories */}
          <div className="space-y-3">
            <h4 className="font-medium">Income Categories</h4>
            <div className="flex flex-wrap gap-2">
              {preferences.incomeCategories.map((category, index) => (
                <Badge
                  key={index}
                  data-testid={`income-category-${index}`}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{category}</span>
                  <button
                    data-testid={`remove-income-category-${index}`}
                    onClick={() => removeIncomeCategory(index)}
                    disabled={updatePreferencesMutation.isPending}
                    className="ml-1 hover:text-red-500"
                  >
                    <Minus size={14} />
                  </button>
                </Badge>
              ))}
              <Button
                data-testid="add-income-category"
                variant="outline"
                size="sm"
                onClick={() => {
                  const category = prompt("Enter new income category:");
                  if (category) addIncomeCategory(category);
                }}
                disabled={updatePreferencesMutation.isPending}
              >
                <Plus size={14} className="mr-1" />
                Add Category
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Financial Settings</h4>
            <p className="text-sm text-muted-foreground">
              {updatePreferencesMutation.isPending ? 'Saving...' : 'Settings are saved automatically'}
            </p>
          </div>
          <Button 
            data-testid="button-save-financial-preferences"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/financial-preferences'] });
              toast({
                title: "Financial preferences synchronized",
                description: "All settings are up to date.",
              });
            }}
            disabled={updatePreferencesMutation.isPending}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
          >
            {updatePreferencesMutation.isPending ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <CheckCircle className="mr-2" size={16} />
            )}
            {updatePreferencesMutation.isPending ? 'Saving...' : 'Sync Settings'}
          </Button>
        </div>
      </Card>
    </div>
  );
}