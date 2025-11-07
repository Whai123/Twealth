import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check, User, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const step1Schema = z.object({
  fullName: z.string().min(1, "Name is required"),
  incomeRange: z.string().min(1, "Please select your income range"),
  riskTolerance: z.string().min(1, "Please select your risk tolerance"),
});

const step2Schema = z.object({
  savingsTarget: z.string().min(1, "Savings target is required"),
  savingsTimeline: z.string().min(1, "Please select a timeline"),
  financialPriorities: z.array(z.string()).min(1, "Select at least one priority"),
});

const step3Schema = z.object({
  notificationFrequency: z.string().min(1, "Please select a frequency"),
  adviceStyle: z.string().min(1, "Please select a style"),
  preferredLanguage: z.string().min(1, "Please select a language"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface ProgressiveOnboardingWizardProps {
  onComplete: () => void;
}

export function ProgressiveOnboardingWizard({ onComplete }: ProgressiveOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing onboarding progress
  const { data: userPreferences, isLoading: prefsLoading } = useQuery<any>({
    queryKey: ["/api/user-preferences"],
  });

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: "",
      incomeRange: "",
      riskTolerance: "",
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      savingsTarget: "",
      savingsTimeline: "",
      financialPriorities: [],
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      notificationFrequency: "weekly",
      adviceStyle: "conversational",
      preferredLanguage: "en",
    },
  });

  // Hydrate forms and step from saved progress
  useEffect(() => {
    if (!prefsLoading && !isHydrated) {
      // Even if no saved data, mark as hydrated to render the wizard
      const savedData = userPreferences?.onboardingData || {};
      const savedStep = userPreferences?.onboardingStep || 1;

      // Only hydrate if there's actual saved data
      if (savedData && Object.keys(savedData).length > 0) {
        // Hydrate step 1 form if data exists
        if (savedData.fullName || savedData.incomeRange || savedData.riskTolerance) {
          step1Form.reset({
            fullName: savedData.fullName || "",
            incomeRange: savedData.incomeRange || "",
            riskTolerance: savedData.riskTolerance || "",
          });
          setStep1Data({
            fullName: savedData.fullName || "",
            incomeRange: savedData.incomeRange || "",
            riskTolerance: savedData.riskTolerance || "",
          });
        }

        // Hydrate step 2 form if data exists
        if (savedData.savingsTarget || savedData.savingsTimeline || savedData.financialPriorities) {
          step2Form.reset({
            savingsTarget: savedData.savingsTarget?.toString() || "",
            savingsTimeline: savedData.savingsTimeline || "",
            financialPriorities: savedData.financialPriorities || [],
          });
          setStep2Data({
            savingsTarget: savedData.savingsTarget?.toString() || "",
            savingsTimeline: savedData.savingsTimeline || "",
            financialPriorities: savedData.financialPriorities || [],
          });
        }

        // Hydrate step 3 form if data exists
        if (savedData.notificationFrequency || savedData.adviceStyle || savedData.preferredLanguage) {
          step3Form.reset({
            notificationFrequency: savedData.notificationFrequency || "weekly",
            adviceStyle: savedData.adviceStyle || "conversational",
            preferredLanguage: savedData.preferredLanguage || "en",
          });
        }

        // Set current step to saved step
        setCurrentStep(savedStep);
      }

      // Always mark as hydrated after query settles, even for new users
      setIsHydrated(true);
    }
  }, [prefsLoading, isHydrated, userPreferences, step1Form, step2Form, step3Form]);

  const saveProgressMutation = useMutation({
    mutationFn: async (data: { step: number; data: any }) => {
      const response = await apiRequest("PUT", "/api/user-preferences/onboarding", {
        onboardingStep: data.step,
        onboardingData: data.data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/user-preferences", {
        hasCompletedOnboarding: true,
        onboardingStep: null,
        onboardingData: data,
        language: data.preferredLanguage || "en",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      toast({
        title: "Welcome to Twealth!",
        description: "Your profile has been set up successfully.",
      });
      onComplete();
    },
  });

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    saveProgressMutation.mutate({ step: 2, data });
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setStep2Data(data);
    saveProgressMutation.mutate({ step: 3, data: { ...step1Data, ...data } });
    setCurrentStep(3);
  };

  const handleStep3Submit = (data: Step3Data) => {
    const finalData = {
      ...step1Data,
      ...step2Data,
      ...data,
      savingsTarget: step2Data ? parseFloat(step2Data.savingsTarget) : 0,
    };
    completeOnboardingMutation.mutate(finalData);
  };

  const steps = [
    { number: 1, title: "Your Profile", icon: User },
    { number: 2, title: "Financial Goals", icon: Target },
    { number: 3, title: "AI Preferences", icon: Sparkles },
  ];

  // Show loading state while fetching saved progress
  if (prefsLoading || !isHydrated) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Loading your profile...</CardTitle>
            <CardDescription>Please wait a moment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isComplete = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors
                      ${isComplete ? "bg-green-600 text-white" : ""}
                      ${isCurrent ? "bg-primary text-primary-foreground" : ""}
                      ${!isComplete && !isCurrent ? "bg-muted text-muted-foreground" : ""}
                    `}
                    data-testid={`step-indicator-${step.number}`}
                  >
                    {isComplete ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-colors ${
                      isComplete ? "bg-green-600" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Profile */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tell us about yourself</CardTitle>
            <CardDescription>
              Help us personalize your financial guidance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                <FormField
                  control={step1Form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          {...field}
                          data-testid="input-full-name"
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="incomeRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Income Range</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-income-range" className="h-12">
                            <SelectValue placeholder="Select your income range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="under_30k">Under $30,000</SelectItem>
                          <SelectItem value="30k-60k">$30,000 - $60,000</SelectItem>
                          <SelectItem value="60k-100k">$60,000 - $100,000</SelectItem>
                          <SelectItem value="100k-200k">$100,000 - $200,000</SelectItem>
                          <SelectItem value="over_200k">Over $200,000</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This helps us provide appropriate financial recommendations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="riskTolerance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Tolerance</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-risk-tolerance" className="h-12">
                            <SelectValue placeholder="How comfortable are you with risk?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="conservative">
                            Conservative - Prefer safe, stable investments
                          </SelectItem>
                          <SelectItem value="moderate">
                            Moderate - Balance between safety and growth
                          </SelectItem>
                          <SelectItem value="aggressive">
                            Aggressive - Willing to take risks for higher returns
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="submit"
                    className="min-h-[52px] px-8"
                    data-testid="button-next-step-1"
                    disabled={saveProgressMutation.isPending}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Financial Goals */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Financial Goals</CardTitle>
            <CardDescription>
              What are you working towards?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
                <FormField
                  control={step2Form.control}
                  name="savingsTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Savings Target</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10000"
                          {...field}
                          data-testid="input-savings-target"
                          className="h-12"
                        />
                      </FormControl>
                      <FormDescription>
                        How much would you like to save? (in your local currency)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="savingsTimeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeline</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-savings-timeline" className="h-12">
                            <SelectValue placeholder="When do you want to reach your goal?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3months">3 months</SelectItem>
                          <SelectItem value="6months">6 months</SelectItem>
                          <SelectItem value="1year">1 year</SelectItem>
                          <SelectItem value="3years">3 years</SelectItem>
                          <SelectItem value="5years+">5+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="financialPriorities"
                  render={() => (
                    <FormItem>
                      <FormLabel>Financial Priorities (select all that apply)</FormLabel>
                      <div className="space-y-3">
                        {[
                          { id: "emergency_fund", label: "Build Emergency Fund" },
                          { id: "retirement", label: "Plan for Retirement" },
                          { id: "debt_payoff", label: "Pay Off Debt" },
                          { id: "investment", label: "Invest for Growth" },
                          { id: "major_purchase", label: "Save for Major Purchase" },
                        ].map((priority) => (
                          <FormField
                            key={priority.id}
                            control={step2Form.control}
                            name="financialPriorities"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(priority.id)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...(field.value || []), priority.id]
                                        : (field.value || []).filter((v) => v !== priority.id);
                                      field.onChange(newValue);
                                    }}
                                    data-testid={`checkbox-priority-${priority.id}`}
                                    className="h-6 w-6"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-base cursor-pointer">
                                  {priority.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="min-h-[52px] px-8"
                    data-testid="button-back-step-2"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="min-h-[52px] px-8"
                    data-testid="button-next-step-2"
                    disabled={saveProgressMutation.isPending}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: AI Preferences */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Customize Your AI Assistant</CardTitle>
            <CardDescription>
              How would you like your AI assistant to help you?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-6">
                <FormField
                  control={step3Form.control}
                  name="notificationFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-notification-frequency" className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily insights</SelectItem>
                          <SelectItem value="weekly">Weekly summaries</SelectItem>
                          <SelectItem value="monthly">Monthly reports</SelectItem>
                          <SelectItem value="never">Only when I ask</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step3Form.control}
                  name="adviceStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advice Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-advice-style" className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="detailed">Detailed analysis with numbers</SelectItem>
                          <SelectItem value="concise">Concise actionable points</SelectItem>
                          <SelectItem value="conversational">Conversational and friendly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step3Form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-preferred-language" className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="ar">العربية (Arabic)</SelectItem>
                          <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                          <SelectItem value="id">Bahasa Indonesia</SelectItem>
                          <SelectItem value="ms">Bahasa Melayu</SelectItem>
                          <SelectItem value="pt">Português</SelectItem>
                          <SelectItem value="th">ไทย (Thai)</SelectItem>
                          <SelectItem value="tl">Tagalog</SelectItem>
                          <SelectItem value="tr">Türkçe (Turkish)</SelectItem>
                          <SelectItem value="vi">Tiếng Việt</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="min-h-[52px] px-8"
                    data-testid="button-back-step-3"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="min-h-[52px] px-8"
                    data-testid="button-complete-onboarding"
                    disabled={completeOnboardingMutation.isPending}
                  >
                    {completeOnboardingMutation.isPending ? "Finishing..." : "Complete Setup"}
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
