import { useState, useEffect } from"react";
import { useQuery, useMutation } from"@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Switch } from"@/components/ui/switch";
import { Input } from"@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { useToast } from"@/hooks/use-toast";
import { apiRequest, queryClient } from"@/lib/queryClient";
import { useTheme } from"@/components/theme-provider";
import { UserPreferences } from"@shared/schema";
import { 
 Palette, 
 Moon, 
 Sun, 
 Monitor, 
 Bell, 
 BellOff, 
 Languages, 
 Eye,
 Smartphone,
 Layout,
 Zap,
 Settings as SettingsIcon,
 CheckCircle,
 Loader2,
 DollarSign,
 TrendingUp,
 Wallet
} from"lucide-react";

interface UserPreferencesProps {}

export default function UserPreferencesSettings({ }: UserPreferencesProps) {
 const { toast } = useToast();
 const { setTheme } = useTheme();
 const [financialData, setFinancialData] = useState({
  monthlyIncome:"",
  monthlyExpenses:"",
  currentSavings:""
 });

 const { data: preferences, isLoading } = useQuery<UserPreferences>({
  queryKey: ['/api/user-preferences'],
 });

 useEffect(() => {
  if (preferences) {
   setFinancialData({
    monthlyIncome: preferences.monthlyIncomeEstimate?.toString() ||"",
    monthlyExpenses: preferences.monthlyExpensesEstimate?.toString() ||"",
    currentSavings: preferences.currentSavingsEstimate?.toString() ||""
   });
  }
 }, [preferences]);

 const updatePreferencesMutation = useMutation({
  mutationFn: (updates: Partial<UserPreferences>) =>
   apiRequest('PUT', '/api/user-preferences', updates),
  onMutate: async (updates) => {
   await queryClient.cancelQueries({ queryKey: ['/api/user-preferences'] });
   const previousPreferences = queryClient.getQueryData<UserPreferences>(['/api/user-preferences']);
   
   if (previousPreferences) {
    queryClient.setQueryData<UserPreferences>(['/api/user-preferences'], {
     ...previousPreferences,
     ...updates,
    });
   }
   
   return { previousPreferences };
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
   toast({
    title:"Preferences updated",
    description:"Your preferences have been saved successfully.",
   });
  },
  onError: (error, variables, context) => {
   if (context?.previousPreferences) {
    queryClient.setQueryData(['/api/user-preferences'], context.previousPreferences);
   }
   toast({
    title:"Error",
    description:"Failed to update preferences. Please try again.",
    variant:"destructive",
   });
  },
 });

 const themes = [
  { value:"light", label:"Light", icon: Sun, description:"Clean, bright interface" },
  { value:"dark", label:"Dark", icon: Moon, description:"Easy on the eyes" },
  { value:"system", label:"System", icon: Monitor, description:"Follows device setting" }
 ];

 const languages = [
  { value:"en", label:"English" },
  { value:"es", label:"Español" },
  { value:"th", label:"ไทย" },
  { value:"id", label:"Bahasa Indonesia" },
  { value:"pt", label:"Português" },
  { value:"hi", label:"हिन्दी" },
  { value:"vi", label:"Tiếng Việt" },
  { value:"tl", label:"Filipino" },
  { value:"ms", label:"Bahasa Melayu" },
  { value:"tr", label:"Türkçe" }
 ];

 const currencies = [
  { value:"USD", label:"US Dollar", symbol:"$" },
  { value:"THB", label:"Thai Baht", symbol:"฿" },
  { value:"EUR", label:"Euro", symbol:"€" },
  { value:"IDR", label:"Indonesian Rupiah", symbol:"Rp" },
  { value:"VND", label:"Vietnamese Dong", symbol:"₫" },
  { value:"INR", label:"Indian Rupee", symbol:"₹" },
  { value:"PHP", label:"Philippine Peso", symbol:"₱" },
  { value:"BRL", label:"Brazilian Real", symbol:"R$" },
  { value:"MYR", label:"Malaysian Ringgit", symbol:"RM" },
  { value:"MXN", label:"Mexican Peso", symbol:"$" },
  { value:"TRY", label:"Turkish Lira", symbol:"₺" },
  { value:"GBP", label:"British Pound", symbol:"£" },
  { value:"JPY", label:"Japanese Yen", symbol:"¥" },
  { value:"CAD", label:"Canadian Dollar", symbol:"C$" },
  { value:"AUD", label:"Australian Dollar", symbol:"A$" }
 ];

 const handleThemeChange = (theme:"light" |"dark" |"system") => {
  setTheme(theme);
  queryClient.setQueryData<UserPreferences>(['/api/user-preferences'], (old) => {
   if (!old) return old;
   return { ...old, theme };
  });
  updatePreferencesMutation.mutate({ theme });
 };

 const handleNotificationToggle = (field: keyof UserPreferences) => {
  if (!preferences) return;
  updatePreferencesMutation.mutate({ 
   [field]: !preferences[field] 
  });
 };

 const handleLanguageChange = (language: string) => {
  updatePreferencesMutation.mutate({ language });
 };

 const handleCurrencyChange = (currency: string) => {
  updatePreferencesMutation.mutate({ currency });
 };

 const handleFinancialDataChange = (field: string, value: string) => {
  setFinancialData(prev => ({ ...prev, [field]: value }));
 };

 const handleSaveFinancialData = () => {
  const updates: Partial<UserPreferences> = {};
  
  if (financialData.monthlyIncome) {
   updates.monthlyIncomeEstimate = financialData.monthlyIncome;
  }
  if (financialData.monthlyExpenses) {
   updates.monthlyExpensesEstimate = financialData.monthlyExpenses;
  }
  if (financialData.currentSavings) {
   updates.currentSavingsEstimate = financialData.currentSavings;
  }

  if (Object.keys(updates).length > 0) {
   updatePreferencesMutation.mutate(updates);
  } else {
   toast({
    title:"No changes",
    description:"Please enter your financial information first.",
    variant:"destructive",
   });
  }
 };

 const handleSaveAll = async () => {
  try {
   await queryClient.refetchQueries({ queryKey: ['/api/user-preferences'] });
   toast({
    title:"Settings synchronized",
    description:"Your preferences have been refreshed from the server.",
   });
  } catch (error) {
   toast({
    title:"Sync failed",
    description:"Could not refresh settings. Please try again.",
    variant:"destructive",
   });
  }
 };

 if (isLoading) {
  return (
   <div className="flex items-center justify-center p-8 sm:p-12">
    <Loader2 className="animate-spin mr-2 w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
    <span className="text-base sm:text-lg text-slate-600 dark:text-slate-400">Loading preferences...</span>
   </div>
  );
 }

 if (!preferences) {
  return (
   <div className="text-center p-8 sm:p-12">
    <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">Failed to load preferences</p>
   </div>
  );
 }

 return (
  <div className="space-y-4 sm:space-y-6">
   {/* Theme & Appearance */}
   <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="p-4 sm:p-6">
     <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
      <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
      Theme & Appearance
     </CardTitle>
     <CardDescription className="text-sm sm:text-base mt-1">
      Customize your interface colors and style
     </CardDescription>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 space-y-6">
     <div className="space-y-3 sm:space-y-4">
      <h4 className="font-medium text-sm sm:text-base text-slate-700 dark:text-slate-300">Theme Mode</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
       {themes.map((theme) => (
        <button
         key={theme.value}
         data-testid={`theme-${theme.value}`}
         onClick={() => handleThemeChange(theme.value as"light" |"dark" |"system")}
         disabled={updatePreferencesMutation.isPending}
         className={`min-h-[88px] sm:min-h-[100px] p-4 sm:p-5 rounded-xl border-2 transition-all ${
          preferences.theme === theme.value 
           ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30 shadow-md' 
           : 'border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 bg-white dark:bg-slate-800/50'
         } ${updatePreferencesMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer[1.02]'}`}
        >
         <div className="flex items-center justify-center mb-2 sm:mb-3">
          <theme.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${preferences.theme === theme.value ? 'text-purple-600' : 'text-slate-400'}`} />
         </div>
         <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">{theme.label}</h4>
         <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">{theme.description}</p>
        </button>
       ))}
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Notifications - Mobile-Optimized */}
   <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="p-4 sm:p-6">
     <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
      <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
      Notifications
     </CardTitle>
     <CardDescription className="text-sm sm:text-base mt-1">
      Manage how you receive alerts and updates
     </CardDescription>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[60px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-3 mb-3 sm:mb-0">
       <CheckCircle className="text-green-600 w-5 h-5 mt-0.5 flex-shrink-0" />
       <div>
        <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Goal Progress</p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Notify when goals reach milestones</p>
       </div>
      </div>
      <Switch 
       data-testid="switch-goal-reminders"
       checked={preferences.goalReminders ?? true}
       onCheckedChange={() => handleNotificationToggle('goalReminders')}
       disabled={updatePreferencesMutation.isPending}
       className="scale-110"
      />
     </div>

     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[60px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-3 mb-3 sm:mb-0">
       <SettingsIcon className="text-blue-600 w-5 h-5 mt-0.5 flex-shrink-0" />
       <div>
        <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Expense Alerts</p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Alert for large expenses and income</p>
       </div>
      </div>
      <Switch 
       data-testid="switch-expense-alerts"
       checked={preferences.expenseAlerts ?? true}
       onCheckedChange={() => handleNotificationToggle('expenseAlerts')}
       disabled={updatePreferencesMutation.isPending}
       className="scale-110"
      />
     </div>

     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[60px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-3 mb-3 sm:mb-0">
       <Smartphone className="text-purple-600 w-5 h-5 mt-0.5 flex-shrink-0" />
       <div>
        <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Weekly Reports</p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Weekly financial insights and tips</p>
       </div>
      </div>
      <Switch 
       data-testid="switch-weekly-reports"
       checked={preferences.weeklyReports ?? true}
       onCheckedChange={() => handleNotificationToggle('weeklyReports')}
       disabled={updatePreferencesMutation.isPending}
       className="scale-110"
      />
     </div>

     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[60px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-3 mb-3 sm:mb-0">
       <Bell className="text-orange-600 w-5 h-5 mt-0.5 flex-shrink-0" />
       <div>
        <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Email Notifications</p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Receive updates via email</p>
       </div>
      </div>
      <Switch 
       data-testid="switch-email-notifications"
       checked={preferences.emailNotifications ?? true}
       onCheckedChange={() => handleNotificationToggle('emailNotifications')}
       disabled={updatePreferencesMutation.isPending}
       className="scale-110"
      />
     </div>
    </CardContent>
   </Card>

   {/* Language & Region - Mobile-Optimized */}
   <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="p-4 sm:p-6">
     <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
      <Languages className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
      Language & Region
     </CardTitle>
     <CardDescription className="text-sm sm:text-base mt-1">
      Set your preferred language and default currency
     </CardDescription>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <div className="space-y-2">
       <label className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 block">Language</label>
       <Select 
        value={preferences.language ??"en"} 
        onValueChange={handleLanguageChange}
        disabled={updatePreferencesMutation.isPending}
       >
        <SelectTrigger className="h-12 sm:h-14 text-base bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" data-testid="select-language">
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         {languages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
           <span className="text-sm sm:text-base">{lang.label}</span>
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </div>

      <div className="space-y-2">
       <label className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 block">Default Currency</label>
       <Select 
        value={preferences.currency ??"USD"} 
        onValueChange={handleCurrencyChange}
        disabled={updatePreferencesMutation.isPending}
       >
        <SelectTrigger className="h-12 sm:h-14 text-base bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" data-testid="select-currency">
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         {currencies.map((curr) => (
          <SelectItem key={curr.value} value={curr.value}>
           <div className="flex items-center gap-2 py-1">
            <span className="text-sm sm:text-base">{curr.label}</span>
            <span className="text-xs sm:text-sm text-slate-500">({curr.symbol})</span>
           </div>
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Financial Profile - New Section */}
   <Card className="border-2 border-green-200 dark:border-green-900/50 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900">
    <CardHeader className="p-4 sm:p-6">
     <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
      Financial Profile
     </CardTitle>
     <CardDescription className="text-sm sm:text-base mt-1">
      Set your income, expenses, and savings to unlock personalized AI insights
     </CardDescription>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
     <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
       <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
       <div className="text-sm text-blue-900 dark:text-blue-200">
        <p className="font-semibold mb-1">Why this matters</p>
        <p className="text-xs sm:text-sm">
         Your financial data powers the AI Insights page, providing personalized budget recommendations and net worth projections based on your actual situation.
        </p>
       </div>
      </div>
     </div>

     <div className="space-y-4">
      <div className="space-y-2">
       <label className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-green-600" />
        Monthly Income
       </label>
       <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
         {preferences?.currency === 'USD' ? '$' : 
          preferences?.currency === 'EUR' ? '€' : 
          preferences?.currency === 'GBP' ? '£' : 
          preferences?.currency === 'JPY' ? '¥' : '$'}
        </span>
        <Input
         type="number"
         step="0.01"
         min="0"
         value={financialData.monthlyIncome}
         onChange={(e) => handleFinancialDataChange('monthlyIncome', e.target.value)}
         placeholder="5000"
         className="h-12 pl-8 text-base bg-white dark:bg-slate-900"
         data-testid="input-monthly-income"
        />
       </div>
      </div>

      <div className="space-y-2">
       <label className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-orange-600" />
        Monthly Expenses
       </label>
       <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
         {preferences?.currency === 'USD' ? '$' : 
          preferences?.currency === 'EUR' ? '€' : 
          preferences?.currency === 'GBP' ? '£' : 
          preferences?.currency === 'JPY' ? '¥' : '$'}
        </span>
        <Input
         type="number"
         step="0.01"
         min="0"
         value={financialData.monthlyExpenses}
         onChange={(e) => handleFinancialDataChange('monthlyExpenses', e.target.value)}
         placeholder="3000"
         className="h-12 pl-8 text-base bg-white dark:bg-slate-900"
         data-testid="input-monthly-expenses"
        />
       </div>
      </div>

      <div className="space-y-2">
       <label className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-blue-600" />
        Current Savings
       </label>
       <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
         {preferences?.currency === 'USD' ? '$' : 
          preferences?.currency === 'EUR' ? '€' : 
          preferences?.currency === 'GBP' ? '£' : 
          preferences?.currency === 'JPY' ? '¥' : '$'}
        </span>
        <Input
         type="number"
         step="0.01"
         min="0"
         value={financialData.currentSavings}
         onChange={(e) => handleFinancialDataChange('currentSavings', e.target.value)}
         placeholder="10000"
         className="h-12 pl-8 text-base bg-white dark:bg-slate-900"
         data-testid="input-current-savings"
        />
       </div>
      </div>
     </div>

     <Button
      onClick={handleSaveFinancialData}
      disabled={updatePreferencesMutation.isPending}
      className="w-full h-12 text-base bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all font-semibold"
      data-testid="button-save-financial-profile"
     >
      {updatePreferencesMutation.isPending ? (
       <>
        <Loader2 className="mr-2 w-5 h-5" />
        Saving...
       </>
      ) : (
       <>
        <CheckCircle className="mr-2 w-5 h-5" />
        Save Financial Profile
       </>
      )}
     </Button>

     {(financialData.monthlyIncome && financialData.monthlyExpenses) && (
      <div className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
       <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
        Monthly Surplus: {preferences?.currency === 'USD' ? '$' : ''}
        {(parseFloat(financialData.monthlyIncome) - parseFloat(financialData.monthlyExpenses)).toFixed(2)}
       </p>
      </div>
     )}
    </CardContent>
   </Card>

   {/* Crypto & Advanced Features */}
   <Card className="border-2 border-yellow-200 dark:border-yellow-900/50 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900">
    <CardHeader className="p-4 sm:p-6">
     <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
      Advanced Financial Features
     </CardTitle>
     <CardDescription className="text-sm sm:text-base mt-1">
      Enable cryptocurrency tracking and multi-currency wealth analysis
     </CardDescription>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 space-y-6">
     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[72px] p-4 sm:p-5 bg-white dark:bg-gray-900 rounded-xl border-2 border-yellow-300/50 dark:border-yellow-700/50">
      <div className="flex items-start gap-3 mb-3 sm:mb-0">
       <div className="bg-yellow-200 dark:bg-yellow-900/50 p-2 rounded-lg flex-shrink-0">
        <Zap className="text-yellow-700 dark:text-yellow-400 w-5 h-5" />
       </div>
       <div>
        <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">Enable Crypto Features</p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
         Track Bitcoin, gold, and alternative currencies
        </p>
       </div>
      </div>
      <Switch 
       data-testid="switch-crypto-enabled"
       checked={preferences.cryptoEnabled ?? false}
       onCheckedChange={(checked) => updatePreferencesMutation.mutate({ cryptoEnabled: checked })}
       disabled={updatePreferencesMutation.isPending}
       className="scale-110"
      />
     </div>

     {preferences.cryptoEnabled && (
      <div className="space-y-3 sm:space-y-4-50">
       <label className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 block">Experience Level</label>
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
         { value:"beginner", label:"Beginner", description:"Simple interface", icon: Eye },
         { value:"intermediate", label:"Intermediate", description:"Standard tracking", icon: Layout },
         { value:"advanced", label:"Advanced", description:"Full analytics", icon: Zap }
        ].map((level) => (
         <button
          key={level.value}
          data-testid={`experience-${level.value}`}
          onClick={() => updatePreferencesMutation.mutate({ experienceLevel: level.value as"beginner" |"intermediate" |"advanced" })}
          disabled={updatePreferencesMutation.isPending}
          className={`min-h-[88px] p-4 rounded-xl border-2 transition-all ${
           preferences.experienceLevel === level.value 
            ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 shadow-md' 
            : 'border-slate-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-600 bg-white dark:bg-slate-800/50'
          } ${updatePreferencesMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer[1.02]'}`}
         >
          <div className="flex items-center justify-center mb-2">
           <level.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${preferences.experienceLevel === level.value ? 'text-yellow-600' : 'text-slate-400'}`} />
          </div>
          <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">{level.label}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{level.description}</p>
         </button>
        ))}
       </div>
      </div>
     )}
    </CardContent>
   </Card>

   {/* Save Button - Mobile-Optimized */}
   <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
    <CardContent className="p-4 sm:p-6">
     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
       <h4 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white">Save Preferences</h4>
       <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
        {updatePreferencesMutation.isPending ? 'Saving...' : 'Settings are saved automatically'}
       </p>
      </div>
      <Button 
       data-testid="button-save-preferences"
       onClick={handleSaveAll}
       disabled={updatePreferencesMutation.isPending}
       className="w-full sm:w-auto h-12 sm:h-14 text-base bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all font-semibold"
      >
       {updatePreferencesMutation.isPending ? (
        <>
         <Loader2 className="mr-2 w-5 h-5" />
         Saving...
        </>
       ) : (
        <>
         <CheckCircle className="mr-2 w-5 h-5" />
         Sync Settings
        </>
       )}
      </Button>
     </div>
    </CardContent>
   </Card>
  </div>
 );
}
