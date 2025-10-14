import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings as SettingsIcon, Clock, DollarSign, TrendingUp, Save, Info, User, Palette, Shield, Database, Sparkles, Lock, CreditCard, Brain, Zap, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserPreferences from "@/components/settings/user-preferences";
import FinancialPreferences from "@/components/settings/financial-preferences";
import DataPrivacy from "@/components/settings/data-privacy";

// Settings form schema
const settingsSchema = z.object({
  hourlyRate: z.string().min(1, "Hourly rate is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Hourly rate must be a positive number"
  ),
  currency: z.string().min(1, "Currency is required"),
  workHoursPerWeek: z.string().min(1, "Work hours per week is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 168,
    "Work hours must be between 1 and 168 hours per week"
  ),
  timeValueStrategy: z.enum(["fixed", "derived"], {
    required_error: "Please select a time value strategy"
  })
});

type SettingsFormData = z.infer<typeof settingsSchema>;

function Settings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  // Fetch current user settings
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ["/api/user-settings"],
    enabled: true,
  });

  // Initialize form with current settings or defaults
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      hourlyRate: "50",
      currency: "USD",
      workHoursPerWeek: "40",
      timeValueStrategy: "fixed" as const
    },
    values: userSettings ? {
      hourlyRate: (userSettings as any).hourlyRate?.toString() || "50",
      currency: (userSettings as any).currency || "USD",
      workHoursPerWeek: (userSettings as any).workHoursPerWeek?.toString() || "40",
      timeValueStrategy: (userSettings as any).timeValueStrategy || "fixed"
    } : undefined
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const payload = {
        hourlyRate: parseFloat(data.hourlyRate),
        currency: data.currency,
        workHoursPerWeek: parseInt(data.workHoursPerWeek),
        timeValueStrategy: data.timeValueStrategy
      };

      const method = userSettings ? "PUT" : "POST";
      return apiRequest(method, "/api/user-settings", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights/time-value"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/time-stats"] });
      toast({
        title: "Settings Updated! 🎉",
        description: "Your time-value preferences have been saved successfully.",
      });
      setIsSaving(false);
    },
    onError: (error: any) => {
      // Settings update failed, user will see error in UI
      toast({
        title: "Update Failed",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);
    updateSettingsMutation.mutate(data);
  };

  // Calculate preview values
  const hourlyRate = parseFloat(form.watch("hourlyRate") || "0");
  const workHoursPerWeek = parseInt(form.watch("workHoursPerWeek") || "0");
  const selectedCurrency = form.watch("currency") || "USD";
  const dailyValue = (hourlyRate * workHoursPerWeek) / 5; // assuming 5 work days
  const monthlyValue = hourlyRate * workHoursPerWeek * 4.33; // average weeks per month

  // Currency formatter function
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
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid gap-6">
            <div className="h-64 bg-muted rounded animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modern Header with gradient background */}
      <header className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/50 dark:to-indigo-900/50 border-b border-border/50">
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Cog className="w-8 h-8 text-white animate-spin-slow" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    ⚙️ Settings & Preferences
                  </h1>
                  <p className="text-xl text-muted-foreground">Customize your experience to perfection</p>
                </div>
              </div>
              
              {/* Quick Settings Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Account</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">Personal</div>
                  <div className="text-xs text-muted-foreground">Time & money settings</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium">Preferences</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600">Theme</div>
                  <div className="text-xs text-muted-foreground">Interface customization</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Financial</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">Goals</div>
                  <div className="text-xs text-muted-foreground">Money preferences</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium">Privacy</span>
                  </div>
                  <div className="text-lg font-bold text-red-600">Secure</div>
                  <div className="text-xs text-muted-foreground">Data protection</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-6xl">

        {/* Enhanced Modern Tab Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900/20 dark:to-indigo-900/20 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <TabsTrigger 
              value="account" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 flex items-center gap-2" 
              data-testid="tab-account"
            >
              <User size={16} />
              <span className="hidden sm:inline">👤 Account</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 flex items-center gap-2" 
              data-testid="tab-preferences"
            >
              <Palette size={16} />
              <span className="hidden sm:inline">🎨 Preferences</span>
            </TabsTrigger>
            <TabsTrigger 
              value="financial" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 flex items-center gap-2" 
              data-testid="tab-financial"
            >
              <CreditCard size={16} />
              <span className="hidden sm:inline">💰 Financial</span>
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 flex items-center gap-2" 
              data-testid="tab-privacy"
            >
              <Shield size={16} />
              <span className="hidden sm:inline">🔒 Privacy</span>
            </TabsTrigger>
          </TabsList>

        {/* Account Tab (Original Time-Value Settings) */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <Card className="border-2 time-money-gradient-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="text-primary" size={20} />
                Personal Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Hourly Rate */}
                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="text-money" size={16} />
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
                              className="pl-8"
                              data-testid="input-hourly-rate"
                            />
                            <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The monetary value of one hour of your time
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Currency */}
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">🇺🇸 USD ($)</SelectItem>
                            <SelectItem value="THB">🇹🇭 THB (฿)</SelectItem>
                            <SelectItem value="EUR">🇪🇺 EUR (€)</SelectItem>
                            <SelectItem value="IDR">🇮🇩 IDR (Rp)</SelectItem>
                            <SelectItem value="VND">🇻🇳 VND (₫)</SelectItem>
                            <SelectItem value="INR">🇮🇳 INR (₹)</SelectItem>
                            <SelectItem value="PHP">🇵🇭 PHP (₱)</SelectItem>
                            <SelectItem value="BRL">🇧🇷 BRL (R$)</SelectItem>
                            <SelectItem value="MYR">🇲🇾 MYR (RM)</SelectItem>
                            <SelectItem value="MXN">🇲🇽 MXN ($)</SelectItem>
                            <SelectItem value="TRY">🇹🇷 TRY (₺)</SelectItem>
                            <SelectItem value="GBP">🇬🇧 GBP (£)</SelectItem>
                            <SelectItem value="JPY">🇯🇵 JPY (¥)</SelectItem>
                            <SelectItem value="CAD">🇨🇦 CAD (C$)</SelectItem>
                            <SelectItem value="AUD">🇦🇺 AUD (A$)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Your preferred currency for financial calculations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Work Hours Per Week */}
                  <FormField
                    control={form.control}
                    name="workHoursPerWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="text-time" size={16} />
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
                              className="pl-8"
                              data-testid="input-work-hours"
                            />
                            <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your typical working hours per week (used for time-value calculations)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Time Value Strategy */}
                  <FormField
                    control={form.control}
                    name="timeValueStrategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <TrendingUp className="text-productivity-high" size={16} />
                          Time Value Strategy
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-time-strategy">
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">
                              <div>
                                <div className="font-medium">Fixed Rate</div>
                                <div className="text-xs text-muted-foreground">Use your hourly rate for all calculations</div>
                              </div>
                            </SelectItem>
                            <SelectItem value="derived">
                              <div>
                                <div className="font-medium">Context-Derived</div>
                                <div className="text-xs text-muted-foreground">Adjust based on event type and context</div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How ScheduleMoney should calculate time value for different events
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Save Button */}
                  <Button
                    type="submit"
                    className="w-full time-money-gradient hover:opacity-90 text-white"
                    disabled={isSaving}
                    data-testid="button-save-settings"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Info Panel */}
        <div className="space-y-6">
          {/* Time Value Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💰 Value Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10">
                  <span className="text-sm font-medium">Per Hour</span>
                  <span className="font-bold currency-format" data-testid="text-preview-hourly">
                    {formatCurrency(hourlyRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10">
                  <span className="text-sm font-medium">Per Day</span>
                  <span className="font-bold currency-format" data-testid="text-preview-daily">
                    {formatCurrency(dailyValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10">
                  <span className="text-sm font-medium">Per Month</span>
                  <span className="font-bold currency-format" data-testid="text-preview-monthly">
                    {formatCurrency(monthlyValue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="text-blue-500" size={18} />
                Strategy Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-1">Fixed Rate</h4>
                <p className="text-muted-foreground">
                  Uses your hourly rate consistently across all events. Best for freelancers and consultants.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-1">Context-Derived</h4>
                <p className="text-muted-foreground">
                  Adjusts value based on event type, meeting importance, and productivity context. More sophisticated.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="text-orange-500" size={18} />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">💡</span>
                <p className="text-muted-foreground">
                  Set your hourly rate to your actual billing rate or desired income per hour
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">⚡</span>
                <p className="text-muted-foreground">
                  Review your settings monthly to ensure they reflect your current value
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">🎯</span>
                <p className="text-muted-foreground">
                  Use "Context-Derived" for more nuanced time valuations
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
    </>
  );
}

export default Settings;