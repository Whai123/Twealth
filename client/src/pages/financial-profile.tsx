import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign, Save, TrendingUp, TrendingDown, Wallet, Building2, CreditCard, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const financialProfileSchema = z.object({
  monthlyIncome: z.string().min(1, "Required").refine(v => !isNaN(Number(v)) && Number(v) >= 0, "Must be a valid number"),
  monthlyExpenses: z.string().min(1, "Required").refine(v => !isNaN(Number(v)) && Number(v) >= 0, "Must be a valid number"),
  monthlySavings: z.string().min(1, "Required").refine(v => !isNaN(Number(v)) && Number(v) >= 0, "Must be a valid number"),
  totalSavings: z.string().min(1, "Required").refine(v => !isNaN(Number(v)) && Number(v) >= 0, "Must be a valid number"),
  savingsGoal: z.string().min(1, "Required").refine(v => !isNaN(Number(v)) && Number(v) >= 0, "Must be a valid number"),
  emergencyFund: z.string().min(1, "Required").refine(v => !isNaN(Number(v)) && Number(v) >= 0, "Must be a valid number"),
});

type FinancialProfileData = z.infer<typeof financialProfileSchema>;

interface ProfileApiResponse {
  profile: {
    monthlyIncome: string;
    monthlyExpenses: string;
    monthlySavings: string;
    totalSavings: string;
    savingsGoal: string;
    emergencyFund: string;
  } | null;
  expenseCategories: any[];
  debts: any[];
  assets: any[];
}

export default function FinancialProfile() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const { data: profileData, isLoading } = useQuery<ProfileApiResponse>({
    queryKey: ["/api/user/financial-profile"],
    enabled: true,
  });

  const form = useForm<FinancialProfileData>({
    resolver: zodResolver(financialProfileSchema),
    defaultValues: {
      monthlyIncome: "0",
      monthlyExpenses: "0",
      monthlySavings: "0",
      totalSavings: "0",
      savingsGoal: "0",
      emergencyFund: "0",
    },
    values: profileData?.profile ? {
      monthlyIncome: profileData.profile.monthlyIncome?.toString() || "0",
      monthlyExpenses: profileData.profile.monthlyExpenses?.toString() || "0",
      monthlySavings: profileData.profile.monthlySavings?.toString() || "0",
      totalSavings: profileData.profile.totalSavings?.toString() || "0",
      savingsGoal: profileData.profile.savingsGoal?.toString() || "0",
      emergencyFund: profileData.profile.emergencyFund?.toString() || "0",
    } : undefined
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FinancialProfileData) => {
      const payload = {
        profile: {
          monthlyIncome: data.monthlyIncome,
          monthlyExpenses: data.monthlyExpenses,
          monthlySavings: data.monthlySavings,
          totalSavings: data.totalSavings,
          savingsGoal: data.savingsGoal,
          emergencyFund: data.emergencyFund,
        }
      };
      return apiRequest("POST", "/api/user/financial-profile", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/financial-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-health"] });
      toast({
        title: "Profile Updated!",
        description: "Your financial profile has been saved successfully.",
        icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
      });
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />,
      });
      setIsSaving(false);
    },
  });

  const onSubmit = async (data: FinancialProfileData) => {
    setIsSaving(true);
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-12 max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="h-16 bg-muted rounded-xl" />
            <div className="h-96 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8 xl:px-12 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Financial Profile
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Manage your complete financial information
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-12 max-w-7xl mx-auto">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Financial Overview
            </CardTitle>
            <CardDescription>
              Your comprehensive financial profile powers AI-driven advice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="monthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Income</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              className="pl-9"
                              placeholder="5000"
                              data-testid="input-monthly-income"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyExpenses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Expenses</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              className="pl-9"
                              placeholder="3000"
                              data-testid="input-monthly-expenses"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlySavings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Savings</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              className="pl-9"
                              placeholder="2000"
                              data-testid="input-monthly-savings"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalSavings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Savings</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              className="pl-9"
                              placeholder="50000"
                              data-testid="input-total-savings"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="savingsGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Savings Goal</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              className="pl-9"
                              placeholder="100000"
                              data-testid="input-savings-goal"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyFund"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Fund</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              className="pl-9"
                              placeholder="18000"
                              data-testid="input-emergency-fund"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                    data-testid="button-save-profile"
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            {profileData && (
              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  AI Data Status
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {profileData.profile ? 
                    "Your AI assistant uses this authoritative financial data for personalized advice." :
                    "Add your financial information above so the AI can provide accurate, data-driven recommendations."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {profileData?.profile && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Monthly Net</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${(parseFloat(profileData.profile.monthlyIncome || "0") - parseFloat(profileData.profile.monthlyExpenses || "0")).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Savings Rate</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {(() => {
                        const income = parseFloat(profileData.profile.monthlyIncome || "0");
                        const savings = parseFloat(profileData.profile.monthlySavings || "0");
                        if (income === 0) return "0.0";
                        return ((savings / income) * 100).toFixed(1);
                      })()}%
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Goal Progress</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {(() => {
                        const savings = parseFloat(profileData.profile.totalSavings || "0");
                        const goal = parseFloat(profileData.profile.savingsGoal || "0");
                        if (goal === 0) return "0.0";
                        return ((savings / goal) * 100).toFixed(1);
                      })()}%
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
