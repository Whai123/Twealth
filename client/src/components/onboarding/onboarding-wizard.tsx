import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Sparkles, 
  DollarSign, 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  TrendingUp,
  PiggyBank,
  Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const financialInfoSchema = z.object({
  monthlyIncome: z.string().min(1, "Monthly income is required"),
  monthlyExpenses: z.string().min(1, "Monthly expenses are required"),
});

const goalSchema = z.object({
  title: z.string().min(1, "Goal name is required"),
  targetAmount: z.string().min(1, "Target amount is required"),
  targetDate: z.string().min(1, "Target date is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().default("medium"),
});

type FinancialInfo = z.infer<typeof financialInfoSchema>;
type GoalInfo = z.infer<typeof goalSchema>;

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [financialData, setFinancialData] = useState<FinancialInfo | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Financial info form
  const financialForm = useForm<FinancialInfo>({
    resolver: zodResolver(financialInfoSchema),
    defaultValues: {
      monthlyIncome: "",
      monthlyExpenses: "",
    },
  });

  // Goal form
  const goalForm = useForm<GoalInfo>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      targetAmount: "",
      targetDate: "",
      category: "savings",
      priority: "medium",
    },
  });

  // Save financial estimates mutation
  const saveEstimates = useMutation({
    mutationFn: async (data: FinancialInfo) => {
      return apiRequest("POST", "/api/financial-estimates", {
        monthlyIncome: parseFloat(data.monthlyIncome),
        monthlyExpenses: parseFloat(data.monthlyExpenses),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  // Create goal mutation
  const createGoal = useMutation({
    mutationFn: async (data: GoalInfo) => {
      return apiRequest("POST", "/api/financial-goals", {
        title: data.title,
        targetAmount: data.targetAmount,
        currentAmount: "0",
        targetDate: data.targetDate,
        category: data.category,
        priority: data.priority,
        status: "active",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const handleFinancialSubmit = async (data: FinancialInfo) => {
    setFinancialData(data);
    await saveEstimates.mutateAsync(data);
    setStep(3);
  };

  const handleGoalSubmit = async (data: GoalInfo) => {
    await createGoal.mutateAsync(data);
    setStep(4);
  };

  const handleComplete = () => {
    toast({
      title: "Welcome to Twealth! 🎉",
      description: "Your financial journey starts now. Let's build wealth together!",
    });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/20 dark:via-blue-950/20 dark:to-purple-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card className="border-2 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to Twealth!
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Your AI-powered CFO advisor for smarter financial decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Track Everything</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor income, expenses, and financial goals in real-time
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <PiggyBank className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">AI-Powered Insights</h4>
                    <p className="text-sm text-muted-foreground">
                      Get CFO-level advice on spending, saving, and investing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <Rocket className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Achieve Your Goals</h4>
                    <p className="text-sm text-muted-foreground">
                      Set goals, track progress, and reach them faster
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold h-12"
                  data-testid="button-start-onboarding"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Financial Basics */}
        {step === 2 && (
          <Card className="border-2 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-center">Tell us about your finances</CardTitle>
              <CardDescription className="text-center">
                This helps us provide personalized advice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...financialForm}>
                <form onSubmit={financialForm.handleSubmit(handleFinancialSubmit)} className="space-y-6">
                  <FormField
                    control={financialForm.control}
                    name="monthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Income</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="number"
                              placeholder="5000"
                              className="pl-9 h-11"
                              data-testid="input-monthly-income"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={financialForm.control}
                    name="monthlyExpenses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Expenses</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="number"
                              placeholder="3000"
                              className="pl-9 h-11"
                              data-testid="input-monthly-expenses"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                      data-testid="button-back-step1"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveEstimates.isPending}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      data-testid="button-continue-step2"
                    >
                      {saveEstimates.isPending ? "Saving..." : "Continue"}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Create First Goal */}
        {step === 3 && (
          <Card className="border-2 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-center">Set your first goal</CardTitle>
              <CardDescription className="text-center">
                What would you like to achieve? (You can add more goals later)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...goalForm}>
                <form onSubmit={goalForm.handleSubmit(handleGoalSubmit)} className="space-y-4">
                  <FormField
                    control={goalForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Emergency Fund"
                            className="h-11"
                            data-testid="input-goal-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={goalForm.control}
                    name="targetAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="number"
                              placeholder="10000"
                              className="pl-9 h-11"
                              data-testid="input-goal-amount"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={goalForm.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="h-11"
                            min={new Date().toISOString().split('T')[0]}
                            data-testid="input-goal-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={goalForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11" data-testid="select-goal-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="investment">Investment</SelectItem>
                            <SelectItem value="debt">Debt Payoff</SelectItem>
                            <SelectItem value="purchase">Major Purchase</SelectItem>
                            <SelectItem value="travel">Travel</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="retirement">Retirement</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1"
                      data-testid="button-back-step2"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={createGoal.isPending}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      data-testid="button-create-goal"
                    >
                      {createGoal.isPending ? "Creating..." : "Create Goal"}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <Card className="border-2 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                You're All Set! 🎉
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Your Twealth account is ready. Let's start building wealth!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                <h4 className="font-semibold mb-3">What's Next?</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span>View your personalized dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span>Chat with AI for financial advice</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span>Track transactions and monitor progress</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold h-12"
                data-testid="button-go-to-dashboard"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
