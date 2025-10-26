import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings as SettingsIcon, Clock, DollarSign, TrendingUp, Save, Info, User, Palette, Shield, Database, Sparkles, Lock, CreditCard, Brain, Zap, Cog, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserPreferences from "@/components/settings/user-preferences";
import FinancialPreferences from "@/components/settings/financial-preferences";
import DataPrivacy from "@/components/settings/data-privacy";

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

  const { data: userSettings, isLoading } = useQuery({
    queryKey: ["/api/user-settings"],
    enabled: true,
  });

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
        title: "Settings Updated!",
        description: "Your time-value preferences have been saved successfully.",
        icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
      });
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
      setIsSaving(false);
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);
    updateSettingsMutation.mutate(data);
  };

  const hourlyRate = parseFloat(form.watch("hourlyRate") || "0");
  const workHoursPerWeek = parseInt(form.watch("workHoursPerWeek") || "0");
  const selectedCurrency = form.watch("currency") || "USD";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-12 max-w-7xl mx-auto">
          <div className="space-y-6 animate-pulse">
            <div className="h-16 bg-muted rounded-xl" />
            <div className="h-12 bg-muted rounded-lg w-full max-w-2xl" />
            <div className="grid gap-4 sm:gap-6">
              <div className="h-96 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Mobile-Optimized Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-12 max-w-7xl mx-auto">
          {/* Compact Header for Mobile */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Cog className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">
                {t('settings.title', 'Settings')}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 truncate">
                {t('settings.subtitle', 'Manage your preferences')}
              </p>
            </div>
          </div>

          {/* Quick Overview Cards - Hidden on Mobile, Shown on Tablet+ */}
          <div className="hidden md:grid grid-cols-4 gap-3 lg:gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-lg p-3 lg:p-4 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">Account</span>
              </div>
              <div className="text-sm lg:text-base font-bold text-blue-700 dark:text-blue-300">Personal</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 rounded-lg p-3 lg:p-4 border border-purple-200/50 dark:border-purple-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">Preferences</span>
              </div>
              <div className="text-sm lg:text-base font-bold text-purple-700 dark:text-purple-300">Theme</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 rounded-lg p-3 lg:p-4 border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 text-green-600 dark:text-green-400" />
                <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">Financial</span>
              </div>
              <div className="text-sm lg:text-base font-bold text-green-700 dark:text-green-300">Goals</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30 rounded-lg p-3 lg:p-4 border border-red-200/50 dark:border-red-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-red-600 dark:text-red-400" />
                <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">Privacy</span>
              </div>
              <div className="text-sm lg:text-base font-bold text-red-700 dark:text-red-300">Secure</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-12 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile-Responsive Horizontal Scrollable Tabs */}
          <div className="mb-6 sm:mb-8">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex w-auto min-w-full sm:w-full bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-auto">
                <TabsTrigger 
                  value="account" 
                  className="flex-1 sm:flex-none min-h-[44px] px-4 sm:px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg text-sm sm:text-base font-medium"
                  data-testid="tab-account"
                >
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="preferences" 
                  className="flex-1 sm:flex-none min-h-[44px] px-4 sm:px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg text-sm sm:text-base font-medium"
                  data-testid="tab-preferences"
                >
                  <Palette className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Preferences</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="financial" 
                  className="flex-1 sm:flex-none min-h-[44px] px-4 sm:px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg text-sm sm:text-base font-medium"
                  data-testid="tab-financial"
                >
                  <CreditCard className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Financial</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="flex-1 sm:flex-none min-h-[44px] px-4 sm:px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg text-sm sm:text-base font-medium"
                  data-testid="tab-privacy"
                >
                  <Shield className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Privacy</span>
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </div>

          {/* Account Tab - Mobile-Optimized */}
          <TabsContent value="account" className="mt-0 animate-in fade-in-50 duration-300">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              {/* Settings Form - Full Width on Mobile */}
              <div className="lg:col-span-2">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <User className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
                      Personal Configuration
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Configure your time-value settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
                        {/* Hourly Rate - Full Width Input */}
                        <FormField
                          control={form.control}
                          name="hourlyRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-sm sm:text-base font-medium">
                                <DollarSign className="text-green-600 w-4 h-4" />
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
                                    className="h-12 sm:h-14 text-base sm:text-lg pl-10 w-full bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                                    data-testid="input-hourly-rate"
                                  />
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs sm:text-sm">
                                The monetary value of one hour of your time
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Currency - Full Width Select */}
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base font-medium">Currency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg w-full bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" data-testid="select-currency">
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
                              <FormDescription className="text-xs sm:text-sm">
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
                              <FormLabel className="flex items-center gap-2 text-sm sm:text-base font-medium">
                                <Clock className="text-blue-600 w-4 h-4" />
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
                                    className="h-12 sm:h-14 text-base sm:text-lg pl-10 w-full bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                                    data-testid="input-work-hours"
                                  />
                                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs sm:text-sm">
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
                              <FormLabel className="flex items-center gap-2 text-sm sm:text-base font-medium">
                                <TrendingUp className="text-purple-600 w-4 h-4" />
                                Time Value Strategy
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg w-full bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" data-testid="select-time-strategy">
                                    <SelectValue placeholder="Select strategy" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="fixed">
                                    <div className="py-1">
                                      <div className="font-medium text-sm sm:text-base">Fixed Rate</div>
                                      <div className="text-xs text-slate-600 dark:text-slate-400">Use your hourly rate for all calculations</div>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="derived">
                                    <div className="py-1">
                                      <div className="font-medium text-sm sm:text-base">Context-Derived</div>
                                      <div className="text-xs text-slate-600 dark:text-slate-400">Adjust based on event type and context</div>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs sm:text-sm">
                                How ScheduleMoney should calculate time value for different events
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Save Button - Full Width, Touch-Friendly */}
                        <Button
                          type="submit"
                          className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                          disabled={isSaving}
                          data-testid="button-save-settings"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5 mr-2" />
                              Save Settings
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              {/* Preview & Info Panel - Stacked on Mobile */}
              <div className="space-y-4 sm:space-y-6">
                {/* Time Value Preview */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Value Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
                        <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">Per Hour</span>
                        <span className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-300" data-testid="text-preview-hourly">
                          {formatCurrency(hourlyRate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 sm:p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 border border-green-200 dark:border-green-800">
                        <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">Per Day</span>
                        <span className="text-base sm:text-lg font-bold text-green-700 dark:text-green-300" data-testid="text-preview-daily">
                          {formatCurrency(dailyValue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 sm:p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800">
                        <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">Per Month</span>
                        <span className="text-base sm:text-lg font-bold text-purple-700 dark:text-purple-300" data-testid="text-preview-monthly">
                          {formatCurrency(monthlyValue)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Strategy Info - Hidden on Mobile, Shown on Tablet+ */}
                <Card className="hidden sm:block border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      Strategy Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 text-xs sm:text-sm">
                    <div className="p-3 sm:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <h4 className="font-semibold mb-1 text-slate-900 dark:text-white">Fixed Rate</h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        Uses your hourly rate consistently across all events. Best for freelancers and consultants.
                      </p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <h4 className="font-semibold mb-1 text-slate-900 dark:text-white">Context-Derived</h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        Adjusts value based on event type, meeting importance, and productivity context.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-0 animate-in fade-in-50 duration-300">
            <UserPreferences />
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="mt-0 animate-in fade-in-50 duration-300">
            <FinancialPreferences />
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="mt-0 animate-in fade-in-50 duration-300">
            <DataPrivacy />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Settings;
