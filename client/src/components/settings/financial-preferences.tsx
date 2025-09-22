import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Target, 
  PiggyBank, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  CreditCard,
  Percent,
  Calculator,
  BarChart3,
  Settings
} from "lucide-react";

export default function FinancialPreferences() {
  const [budgetSettings, setBudgetSettings] = useState({
    monthlyBudget: "5000",
    savingsGoal: "20",
    alertThreshold: "80",
    autoSavings: true
  });

  const [categorySettings, setCategorySettings] = useState({
    maxCategories: "10",
    customCategories: ["Coffee", "Subscriptions", "Travel"],
    hideSmallExpenses: false,
    groupSimilar: true
  });

  const [goalDefaults, setGoalDefaults] = useState({
    defaultDuration: "12",
    autoContribute: false,
    contributionAmount: "100",
    remindFrequency: "weekly"
  });

  const [newCategory, setNewCategory] = useState("");

  const addCustomCategory = () => {
    if (newCategory.trim() && !categorySettings.customCategories.includes(newCategory.trim())) {
      setCategorySettings(prev => ({
        ...prev,
        customCategories: [...prev.customCategories, newCategory.trim()]
      }));
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setCategorySettings(prev => ({
      ...prev,
      customCategories: prev.customCategories.filter(cat => cat !== category)
    }));
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Monthly Budget Limit</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  type="number"
                  value={budgetSettings.monthlyBudget}
                  onChange={(e) => setBudgetSettings(prev => ({ ...prev, monthlyBudget: e.target.value }))}
                  className="pl-10"
                  placeholder="5000"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Savings Goal (%)</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  type="number"
                  value={budgetSettings.savingsGoal}
                  onChange={(e) => setBudgetSettings(prev => ({ ...prev, savingsGoal: e.target.value }))}
                  className="pl-10"
                  placeholder="20"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Budget Alert Threshold (%)</label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  type="number"
                  value={budgetSettings.alertThreshold}
                  onChange={(e) => setBudgetSettings(prev => ({ ...prev, alertThreshold: e.target.value }))}
                  className="pl-10"
                  placeholder="80"
                  min="0"
                  max="100"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Get notified when spending reaches this percentage of your budget
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <PiggyBank className="text-green-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Auto-Savings</p>
                  <p className="text-sm text-muted-foreground">Automatically save spare change</p>
                </div>
              </div>
              <Switch 
                checked={budgetSettings.autoSavings}
                onCheckedChange={(checked) => setBudgetSettings(prev => ({ ...prev, autoSavings: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Category Management
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Custom Categories</label>
            <div className="flex gap-2 mb-3">
              <Input 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add custom category..."
                onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
              />
              <Button onClick={addCustomCategory} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categorySettings.customCategories.map((category) => (
                <Badge 
                  key={category} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeCategory(category)}
                >
                  {category} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Settings className="text-blue-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Hide Small Expenses</p>
                  <p className="text-sm text-muted-foreground">Hide transactions under $5</p>
                </div>
              </div>
              <Switch 
                checked={categorySettings.hideSmallExpenses}
                onCheckedChange={(checked) => setCategorySettings(prev => ({ ...prev, hideSmallExpenses: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <Calculator className="text-purple-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Group Similar</p>
                  <p className="text-sm text-muted-foreground">Auto-group similar merchant transactions</p>
                </div>
              </div>
              <Switch 
                checked={categorySettings.groupSimilar}
                onCheckedChange={(checked) => setCategorySettings(prev => ({ ...prev, groupSimilar: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goal Defaults */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Target className="mr-2" size={20} />
            Goal Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Default Duration (months)</label>
              <Select 
                value={goalDefaults.defaultDuration} 
                onValueChange={(value) => setGoalDefaults(prev => ({ ...prev, defaultDuration: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                  <SelectItem value="36">36 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reminder Frequency</label>
              <Select 
                value={goalDefaults.remindFrequency} 
                onValueChange={(value) => setGoalDefaults(prev => ({ ...prev, remindFrequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="text-green-600 mr-3" size={20} />
                <div>
                  <p className="font-medium">Auto-Contribute</p>
                  <p className="text-sm text-muted-foreground">Automatically contribute to new goals</p>
                </div>
              </div>
              <Switch 
                checked={goalDefaults.autoContribute}
                onCheckedChange={(checked) => setGoalDefaults(prev => ({ ...prev, autoContribute: checked }))}
              />
            </div>

            {goalDefaults.autoContribute && (
              <div>
                <label className="text-sm font-medium mb-2 block">Default Contribution Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    type="number"
                    value={goalDefaults.contributionAmount}
                    onChange={(e) => setGoalDefaults(prev => ({ ...prev, contributionAmount: e.target.value }))}
                    className="pl-10"
                    placeholder="100"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center">
            <Calculator className="mr-2" size={20} />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <PiggyBank className="text-green-600 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-green-600">
                ${(parseFloat(budgetSettings.monthlyBudget) * parseFloat(budgetSettings.savingsGoal) / 100).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Monthly Savings Target</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CreditCard className="text-blue-600 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-blue-600">
                ${(parseFloat(budgetSettings.monthlyBudget) * (100 - parseFloat(budgetSettings.savingsGoal)) / 100).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Spending Budget</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <AlertCircle className="text-orange-600 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-orange-600">
                ${(parseFloat(budgetSettings.monthlyBudget) * parseFloat(budgetSettings.alertThreshold) / 100).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Alert Threshold</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}