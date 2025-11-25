import { useState } from"react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { useForm } from"react-hook-form";
import { zodResolver } from"@hookform/resolvers/zod";
import { z } from"zod";
import { Settings as SettingsIcon, Clock, DollarSign, TrendingUp, Save, Info, User, Palette, Shield, Database, Sparkles, Lock, CreditCard, Brain, Zap, Cog, CheckCircle2, AlertCircle, LogOut, Loader2 } from"lucide-react";
import { useLocation } from"wouter";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from"@/components/ui/form";
import { Input } from"@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs";
import { ScrollArea } from"@/components/ui/scroll-area";
import { useToast } from"@/hooks/use-toast";
import { apiRequest, queryClient } from"@/lib/queryClient";
import UserPreferences from"@/components/settings/user-preferences";
import FinancialPreferences from"@/components/settings/financial-preferences";
import DataPrivacy from"@/components/settings/data-privacy";

const settingsSchema = z.object({
 hourlyRate: z.string().min(1,"Hourly rate is required").refine(
  (val) => !isNaN(Number(val)) && Number(val) > 0,
 "Hourly rate must be a positive number"
 ),
 currency: z.string().min(1,"Currency is required"),
 workHoursPerWeek: z.string().min(1,"Work hours per week is required").refine(
  (val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 168,
 "Work hours must be between 1 and 168 hours per week"
 ),
 timeValueStrategy: z.enum(["fixed","derived"], {
  required_error:"Please select a time value strategy"
 })
});

type SettingsFormData = z.infer<typeof settingsSchema>;

function Settings() {
 const { t } = useTranslation();
 const { toast } = useToast();
 const [isSaving, setIsSaving] = useState(false);
 const [activeTab, setActiveTab] = useState("account");
 const [, setLocation] = useLocation();

 const logoutMutation = useMutation({
  mutationFn: async () => {
   return await apiRequest('POST', '/api/auth/logout', {});
  },
  onSuccess: () => {
   // Invalidate auth queries
   queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
   queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
   queryClient.clear(); // Clear all cached data on logout
   
   // Show success toast
   toast({
    title:"Signed out securely",
    description:"You have been logged out successfully",
   });
   
   // Redirect to login page
   setTimeout(() => {
    setLocation('/login');
   }, 100);
  },
  onError: (error: any) => {
   toast({
    title:"Logout failed",
    description: error.message ||"Please try again",
    variant:"destructive",
   });
  },
 });

 const handleLogout = () => {
  logoutMutation.mutate();
 };

 const { data: userSettings, isLoading } = useQuery({
  queryKey: ["/api/user-settings"],
  enabled: true,
 });

 const form = useForm<SettingsFormData>({
  resolver: zodResolver(settingsSchema),
  defaultValues: {
   hourlyRate:"50",
   currency:"USD",
   workHoursPerWeek:"40",
   timeValueStrategy:"fixed" as const
  },
  values: userSettings ? {
   hourlyRate: (userSettings as any).hourlyRate?.toString() ||"50",
   currency: (userSettings as any).currency ||"USD",
   workHoursPerWeek: (userSettings as any).workHoursPerWeek?.toString() ||"40",
   timeValueStrategy: (userSettings as any).timeValueStrategy ||"fixed"
  } : undefined
 });

 const updateSettingsMutation = useMutation({
  mutationFn: async (data: SettingsFormData) => {
   const payload = {
    hourlyRate: parseFloat(data.hourlyRate),
    currency: data.currency,
    workHoursPerWeek: parseInt(data.workHoursPerWeek),
    timeValueStrategy: data.timeValueStrategy
   };

   const method = userSettings ?"PUT" :"POST";
   return apiRequest(method,"/api/user-settings", payload);
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
   queryClient.invalidateQueries({ queryKey: ["/api/insights/time-value"] });
   queryClient.invalidateQueries({ queryKey: ["/api/dashboard/time-stats"] });
   toast({
    title:"Settings Updated!",
    description:"Your time-value preferences have been saved successfully.",
    icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
   });
   setIsSaving(false);
  },
  onError: (error: any) => {
   toast({
    title:"Update Failed",
    description:"Failed to save your settings. Please try again.",
    variant:"destructive",
    icon: <AlertCircle className="h-5 w-5" />,
   });
   setIsSaving(false);
  },
 });

 const onSubmit = async (data: SettingsFormData) => {
  setIsSaving(true);
  updateSettingsMutation.mutate(data);
 };

 const hourlyRate = parseFloat(form.watch("hourlyRate") ||"0");
 const workHoursPerWeek = parseInt(form.watch("workHoursPerWeek") ||"0");
 const selectedCurrency = form.watch("currency") ||"USD";
 const dailyValue = (hourlyRate * workHoursPerWeek) / 5;
 const monthlyValue = hourlyRate * workHoursPerWeek * 4.33;

 const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
   style: 'currency',
   currency: selectedCurrency,
   minimumFractionDigits: 2,
   maximumFractionDigits: 2,
  }).format(amount);
 };

 if (isLoading) {
  return (
   <div className="min-h-screen bg-background">
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
     <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
      <div className="h-8 bg-muted/50 rounded w-32 mb-2" />
      <div className="h-4 bg-muted/50 rounded w-48" />
     </div>
    </header>
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
     <div className="h-12 bg-muted/50 rounded-lg w-full max-w-lg mb-8" />
     <div className="h-96 bg-muted/50 rounded-xl" />
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-background">
   {/* Clean Professional Header - Stripe/Coinbase Style */}
   <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-30">
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
     <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
       <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
        {t('settings.title', 'Settings')}
       </h1>
       <p className="text-sm text-muted-foreground mt-1">
        {t('settings.subtitle', 'Manage your account and preferences')}
       </p>
      </div>
      <Button
       variant="outline"
       onClick={handleLogout}
       disabled={logoutMutation.isPending}
       className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950"
       data-testid="button-logout"
      >
       {logoutMutation.isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
       ) : (
        <LogOut className="w-4 h-4 mr-2" />
       )}
       Sign out
      </Button>
     </div>
    </div>
   </header>

   {/* Main Content */}
   <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
     {/* Clean Tab Interface */}
     <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8 p-1 h-auto">
      <TabsTrigger 
       value="account" 
       className="flex items-center justify-center gap-2 py-3 text-sm font-medium"
       data-testid="tab-account"
      >
       <User className="w-4 h-4" />
       <span className="hidden sm:inline">Account</span>
      </TabsTrigger>
      <TabsTrigger 
       value="preferences" 
       className="flex items-center justify-center gap-2 py-3 text-sm font-medium"
       data-testid="tab-preferences"
      >
       <Palette className="w-4 h-4" />
       <span className="hidden sm:inline">Preferences</span>
      </TabsTrigger>
      <TabsTrigger 
       value="financial" 
       className="flex items-center justify-center gap-2 py-3 text-sm font-medium"
       data-testid="tab-financial"
      >
       <CreditCard className="w-4 h-4" />
       <span className="hidden sm:inline">Financial</span>
      </TabsTrigger>
      <TabsTrigger 
       value="privacy" 
       className="flex items-center justify-center gap-2 py-3 text-sm font-medium"
       data-testid="tab-privacy"
      >
       <Shield className="w-4 h-4" />
       <span className="hidden sm:inline">Privacy</span>
      </TabsTrigger>
     </TabsList>

     {/* Account Tab */}
     <TabsContent value="account" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
       <div className="lg:col-span-2">
        <Card className="border-border/50">
         <CardHeader className="p-6">
          <CardTitle className="text-lg font-semibold">
           Time Value Configuration
          </CardTitle>
          <CardDescription>
           Set your hourly rate and work schedule for time-value calculations
          </CardDescription>
         </CardHeader>
         <CardContent className="p-6 pt-0">
          <Form {...form}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
             control={form.control}
             name="hourlyRate"
             render={({ field }) => (
              <FormItem>
               <FormLabel className="text-sm font-medium">
                Hourly Rate
               </FormLabel>
               <FormControl>
                <div className="relative">
                 <Input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="50.00"
                  className="h-11 pl-9"
                  data-testid="input-hourly-rate"
                 />
                 <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                </div>
               </FormControl>
               <FormDescription className="text-xs">
                The monetary value of one hour of your time
               </FormDescription>
               <FormMessage />
              </FormItem>
             )}
            />

            <FormField
             control={form.control}
             name="currency"
             render={({ field }) => (
              <FormItem>
               <FormLabel className="text-sm font-medium">Currency</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                 <SelectTrigger className="h-11" data-testid="select-currency">
                  <SelectValue placeholder="Select currency" />
                 </SelectTrigger>
                </FormControl>
                <SelectContent>
                 <SelectItem value="USD">USD ($)</SelectItem>
                 <SelectItem value="THB">THB (฿)</SelectItem>
                 <SelectItem value="EUR">EUR (€)</SelectItem>
                 <SelectItem value="IDR">IDR (Rp)</SelectItem>
                 <SelectItem value="VND">VND (₫)</SelectItem>
                 <SelectItem value="INR">INR (₹)</SelectItem>
                 <SelectItem value="PHP">PHP (₱)</SelectItem>
                 <SelectItem value="BRL">BRL (R$)</SelectItem>
                 <SelectItem value="MYR">MYR (RM)</SelectItem>
                 <SelectItem value="MXN">MXN ($)</SelectItem>
                 <SelectItem value="TRY">TRY (₺)</SelectItem>
                 <SelectItem value="GBP">GBP (£)</SelectItem>
                 <SelectItem value="JPY">JPY (¥)</SelectItem>
                 <SelectItem value="CAD">CAD (C$)</SelectItem>
                 <SelectItem value="AUD">AUD (A$)</SelectItem>
                </SelectContent>
               </Select>
               <FormDescription className="text-xs">
                Your preferred currency for financial calculations
               </FormDescription>
               <FormMessage />
              </FormItem>
             )}
            />

            <FormField
             control={form.control}
             name="workHoursPerWeek"
             render={({ field }) => (
              <FormItem>
               <FormLabel className="text-sm font-medium">
                Work Hours Per Week
               </FormLabel>
               <FormControl>
                <div className="relative">
                 <Input
                  {...field}
                  type="number"
                  min="1"
                  max="168"
                  placeholder="40"
                  className="h-11 pl-9"
                  data-testid="input-work-hours"
                 />
                 <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                </div>
               </FormControl>
               <FormDescription className="text-xs">
                Your typical working hours per week
               </FormDescription>
               <FormMessage />
              </FormItem>
             )}
            />

            <FormField
             control={form.control}
             name="timeValueStrategy"
             render={({ field }) => (
              <FormItem>
               <FormLabel className="text-sm font-medium">
                Time Value Strategy
               </FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                 <SelectTrigger className="h-11" data-testid="select-time-strategy">
                  <SelectValue placeholder="Select strategy" />
                 </SelectTrigger>
                </FormControl>
                <SelectContent>
                 <SelectItem value="fixed">Fixed Rate</SelectItem>
                 <SelectItem value="derived">Context-Derived</SelectItem>
                </SelectContent>
               </Select>
               <FormDescription className="text-xs">
                How time value should be calculated for different events
               </FormDescription>
               <FormMessage />
              </FormItem>
             )}
            />

            <Button
             type="submit"
             className="w-full h-11"
             disabled={isSaving}
             data-testid="button-save-settings"
            >
             {isSaving ? (
              <>
               <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               Saving...
              </>
             ) : (
              <>
               <Save className="w-4 h-4 mr-2" />
               Save Settings
              </>
             )}
            </Button>
           </form>
          </Form>
         </CardContent>
        </Card>
       </div>

       {/* Preview Panel */}
       <div className="space-y-6">
        <Card className="border-border/50">
         <CardHeader className="p-6">
          <CardTitle className="text-lg font-semibold">
           Time Value Preview
          </CardTitle>
         </CardHeader>
         <CardContent className="p-6 pt-0">
          <div className="space-y-4">
           <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Per Hour</span>
            <span className="text-lg font-semibold" data-testid="text-preview-hourly">
             {formatCurrency(hourlyRate)}
            </span>
           </div>
           <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Per Day</span>
            <span className="text-lg font-semibold" data-testid="text-preview-daily">
             {formatCurrency(dailyValue)}
            </span>
           </div>
           <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Per Month</span>
            <span className="text-lg font-semibold" data-testid="text-preview-monthly">
             {formatCurrency(monthlyValue)}
            </span>
           </div>
          </div>
         </CardContent>
        </Card>

        <Card className="border-border/50">
         <CardHeader className="p-6">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
           <Info className="w-4 h-4 text-muted-foreground" />
           Strategy Guide
          </CardTitle>
         </CardHeader>
         <CardContent className="p-6 pt-0 space-y-4 text-sm">
          <div className="p-4 rounded-lg bg-muted/50">
           <h4 className="font-medium mb-1">Fixed Rate</h4>
           <p className="text-muted-foreground text-xs">
            Uses your hourly rate consistently. Best for freelancers and consultants.
           </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
           <h4 className="font-medium mb-1">Context-Derived</h4>
           <p className="text-muted-foreground text-xs">
            Adjusts value based on event type and meeting importance.
           </p>
          </div>
         </CardContent>
        </Card>
       </div>
      </div>
     </TabsContent>

     {/* Preferences Tab */}
     <TabsContent value="preferences" className="space-y-6">
      <UserPreferences />
     </TabsContent>

     {/* Financial Tab */}
     <TabsContent value="financial" className="space-y-6">
      <FinancialPreferences />
     </TabsContent>

     {/* Privacy Tab */}
     <TabsContent value="privacy" className="space-y-6">
      <DataPrivacy />
     </TabsContent>
    </Tabs>
   </div>
  </div>
 );
}

export default Settings;
