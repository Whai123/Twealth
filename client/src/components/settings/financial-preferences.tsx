import { useQuery, useMutation } from"@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Switch } from"@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { Input } from"@/components/ui/input";
import { useToast } from"@/hooks/use-toast";
import { apiRequest, queryClient } from"@/lib/queryClient";
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
 Loader2,
 X
} from"lucide-react";

interface FinancialPreferencesProps {}

type FinancialPreferences = {
 id: string;
 userId: string;
 defaultBudgetPeriod:"weekly" |"monthly" |"yearly";
 budgetWarningThreshold: number;
 autoSavingsEnabled: boolean;
 autoSavingsAmount: string;
 autoSavingsFrequency:"weekly" |"monthly";
 defaultGoalPriority:"low" |"medium" |"high";
 expenseCategories: string[];
 incomeCategories: string[];
 createdAt: string;
 updatedAt: string;
};

export default function FinancialPreferences({ }: FinancialPreferencesProps) {
 const { toast } = useToast();

 const { data: preferences, isLoading } = useQuery<FinancialPreferences>({
  queryKey: ['/api/financial-preferences'],
 });

 const updatePreferencesMutation = useMutation({
  mutationFn: (updates: Partial<FinancialPreferences>) =>
   apiRequest('PUT', '/api/financial-preferences', updates),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['/api/financial-preferences'] });
   toast({
    title:"Financial preferences updated",
    description:"Your settings have been saved successfully.",
   });
  },
  onError: () => {
   toast({
    title:"Error",
    description:"Failed to update financial preferences. Please try again.",
    variant:"destructive",
   });
  },
 });

 const budgetPeriods = [
  { value:"weekly", label:"Weekly", description:"Track spending week by week", icon: Calendar },
  { value:"monthly", label:"Monthly", description:"Monthly budget cycles", icon: Calendar },
  { value:"yearly", label:"Yearly", description:"Annual budget planning", icon: Calendar }
 ];

 const goalPriorities = [
  { value:"low", label:"Low Priority", color:"bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
  { value:"medium", label:"Medium Priority", color:"bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  { value:"high", label:"High Priority", color:"bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" }
 ];

 const savingsFrequencies = [
  { value:"weekly", label:"Weekly" },
  { value:"monthly", label:"Monthly" }
 ];

 const handleBudgetPeriodChange = (period:"weekly" |"monthly" |"yearly") => {
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

 const handleGoalPriorityChange = (priority:"low" |"medium" |"high") => {
  updatePreferencesMutation.mutate({ defaultGoalPriority: priority });
 };

 const handleSavingsFrequencyChange = (frequency:"weekly" |"monthly") => {
  updatePreferencesMutation.mutate({ autoSavingsFrequency: frequency });
 };

 if (isLoading) {
  return (
   <div className="flex items-center justify-center p-8 sm:p-12">
    <Loader2 className="animate-spin mr-2 w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
    <span className="text-base sm:text-lg text-slate-600 dark:text-slate-400">Loading financial preferences...</span>
   </div>
  );
 }

 if (!preferences) {
  return (
   <div className="text-center p-8 sm:p-12">
    <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">Failed to load financial preferences</p>
   </div>
  );
 }

 return (
  <div className="space-y-4 sm:space-y-6">
   {/* Budget Settings */}
   <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="p-4 sm:p-6">
     <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
      Budget Settings
     </CardTitle>
     <CardDescription className="text-sm sm:text-base mt-1">
      Configure your budget tracking and warning preferences
     </CardDescription>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 space-y-6">
     <div className="space-y-3 sm:space-y-4">
      <h4 className="font-medium text-sm sm:text-base text-slate-700 dark:text-slate-300">Default Budget Period</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
       {budgetPeriods.map((period) => (
        <button
         key={period.value}
         data-testid={`budget-period-${period.value}`}
         onClick={() => handleBudgetPeriodChange(period.value as"weekly" |"monthly" |"yearly")}
         disabled={updatePreferencesMutation.isPending}
         className={`min-h-[88px] p-4 rounded-xl border-2 transition-all text-left ${
          preferences.defaultBudgetPeriod === period.value 
           ? 'border-green-600 bg-green-50 dark:bg-green-950/30 shadow-md' 
           : 'border-slate-200 dark:border-slate-700 hover:border-green-400 dark:hover:border-green-600 bg-white dark:bg-slate-800/50'
         } ${updatePreferencesMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer[1.02]'}`}
        >
         <div className="flex items-center gap-2 mb-2">
          <period.icon className={`w-5 h-5 ${preferences.defaultBudgetPeriod === period.value ? 'text-green-600' : 'text-slate-400'}`} />
          <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">{period.label}</h4>
         </div>
         <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{period.description}</p>
        </button>
       ))}
      </div>
     </div>

     <div className="space-y-3 sm:space-y-4">
      <h4 className="font-medium text-sm sm:text-base text-slate-700 dark:text-slate-300">Budget Warning Threshold</h4>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
       <div className="flex-1 w-full">
        <Input
         data-testid="input-warning-threshold"
         type="number"
         min="50"
         max="100"
         value={preferences.budgetWarningThreshold}
         onChange={(e) => handleWarningThresholdChange(parseInt(e.target.value))}
         disabled={updatePreferencesMutation.isPending}
         className="h-12 sm:h-14 text-base w-full bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
        />
       </div>
       <div className="flex items-center gap-2">
        <AlertTriangle className="text-yellow-600 w-5 h-5" />
        <span className="text-sm sm:text-base text-slate-600 dark:text-slate-400">% of budget</span>
       </div>
      </div>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
       Get notified when spending reaches {preferences.budgetWarningThreshold}% of your budget
      </p>
     </div>
    </CardContent>
   </Card>

   {/* Auto-Savings */}
   <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="p-4 sm:p-6">
     <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
      Auto-Savings Options
     </CardTitle>
     <CardDescription className="text-sm sm:text-base mt-1">
      Automatically save toward your financial goals
     </CardDescription>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 space-y-4">
     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[60px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="mb-3 sm:mb-0">
       <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">Enable Auto-Savings</p>
       <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Automatically save toward your goals</p>
      </div>
      <Switch 
       data-testid="switch-auto-savings"
       checked={preferences.autoSavingsEnabled}
       onCheckedChange={handleAutoSavingsToggle}
       disabled={updatePreferencesMutation.isPending}
       className="scale-110"
      />
     </div>

     {preferences.autoSavingsEnabled && (
      <div className="space-y-4-50 border-l-4 border-blue-500 pl-4 ml-2">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
         <label className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 block">Auto-Savings Amount</label>
         <Input
          data-testid="input-auto-savings-amount"
          type="number"
          min="0"
          step="0.01"
          value={preferences.autoSavingsAmount}
          onChange={(e) => handleAutoSavingsAmountChange(e.target.value)}
          disabled={updatePreferencesMutation.isPending}
          placeholder="0.00"
          className="h-12 sm:h-14 text-base w-full bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
         />
        </div>

        <div className="space-y-2">
         <label className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 block">Frequency</label>
         <Select 
          value={preferences.autoSavingsFrequency} 
          onValueChange={handleSavingsFrequencyChange}
          disabled={updatePreferencesMutation.isPending}
         >
          <SelectTrigger className="h-12 sm:h-14 text-base bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" data-testid="select-savings-frequency">
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
   <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="p-4 sm:p-6">
     <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
      Goal Defaults
     </CardTitle>
     <CardDescription className="text-sm sm:text-base mt-1">
      Set default priority level for new financial goals
     </CardDescription>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 space-y-4">
     <div className="space-y-2">
      <label className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 block">Default Goal Priority</label>
      <Select 
       value={preferences.defaultGoalPriority} 
       onValueChange={handleGoalPriorityChange}
       disabled={updatePreferencesMutation.isPending}
      >
       <SelectTrigger className="h-12 sm:h-14 text-base bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" data-testid="select-goal-priority">
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        {goalPriorities.map((priority) => (
         <SelectItem key={priority.value} value={priority.value}>
          <div className="flex items-center py-1">
           <Badge className={`${priority.color} font-medium`}>
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
  </div>
 );
}
