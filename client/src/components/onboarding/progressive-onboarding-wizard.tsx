import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check, User, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    if (!prefsLoading && !isHydrated) {
      const savedData = userPreferences?.onboardingData || {};
      const savedStep = userPreferences?.onboardingStep || 1;

      if (savedData && Object.keys(savedData).length > 0) {
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

        if (savedData.notificationFrequency || savedData.adviceStyle || savedData.preferredLanguage) {
          step3Form.reset({
            notificationFrequency: savedData.notificationFrequency || "weekly",
            adviceStyle: savedData.adviceStyle || "conversational",
            preferredLanguage: savedData.preferredLanguage || "en",
          });
        }

        setCurrentStep(savedStep);
      }

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

  if (prefsLoading || !isHydrated) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Loading your profile...</h2>
            <p className="text-slate-400">Please wait a moment</p>
          </div>
          <div className="space-y-4">
            <div className="h-12 bg-slate-800 rounded-xl animate-pulse"></div>
            <div className="h-12 bg-slate-800 rounded-xl animate-pulse"></div>
            <div className="h-12 bg-slate-800 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isComplete = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            
            return (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                      ${isComplete ? "bg-green-500 text-white shadow-lg shadow-green-500/25" : ""}
                      ${isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-600/30 shadow-lg shadow-blue-600/25" : ""}
                      ${!isComplete && !isCurrent ? "bg-slate-700 text-slate-400" : ""}
                    `}
                    data-testid={`step-indicator-${step.number}`}
                  >
                    {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium transition-colors ${
                      isCurrent ? "text-white" : isComplete ? "text-green-400" : "text-slate-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-4 rounded transition-colors ${
                      isComplete ? "bg-green-500" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {currentStep === 1 && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-1">Tell us about yourself</h2>
            <p className="text-slate-400 text-sm">Help us personalize your financial guidance</p>
          </div>
          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-5">
              <FormField
                control={step1Form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-sm font-medium">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        data-testid="input-full-name"
                        className="h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={step1Form.control}
                name="incomeRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-sm font-medium">Annual Income Range</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          data-testid="select-income-range" 
                          className="h-12 bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        >
                          <SelectValue placeholder="Select your income range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="under_30k" className="text-white focus:bg-slate-700">Under $30,000</SelectItem>
                        <SelectItem value="30k-60k" className="text-white focus:bg-slate-700">$30,000 - $60,000</SelectItem>
                        <SelectItem value="60k-100k" className="text-white focus:bg-slate-700">$60,000 - $100,000</SelectItem>
                        <SelectItem value="100k-200k" className="text-white focus:bg-slate-700">$100,000 - $200,000</SelectItem>
                        <SelectItem value="over_200k" className="text-white focus:bg-slate-700">Over $200,000</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-slate-400 text-xs">
                      This helps us provide appropriate recommendations
                    </FormDescription>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={step1Form.control}
                name="riskTolerance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-sm font-medium">Risk Tolerance</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          data-testid="select-risk-tolerance" 
                          className="h-12 bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        >
                          <SelectValue placeholder="How comfortable are you with risk?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="conservative" className="text-white focus:bg-slate-700">
                          Conservative - Prefer safe investments
                        </SelectItem>
                        <SelectItem value="moderate" className="text-white focus:bg-slate-700">
                          Moderate - Balance safety and growth
                        </SelectItem>
                        <SelectItem value="aggressive" className="text-white focus:bg-slate-700">
                          Aggressive - Higher risk for returns
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
                  data-testid="button-next-step-1"
                  disabled={saveProgressMutation.isPending}
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {currentStep === 2 && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-1">Your Financial Goals</h2>
            <p className="text-slate-400 text-sm">What are you working towards?</p>
          </div>
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-5">
              <FormField
                control={step2Form.control}
                name="savingsTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-sm font-medium">Savings Target</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000"
                        {...field}
                        data-testid="input-savings-target"
                        className="h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                      />
                    </FormControl>
                    <FormDescription className="text-slate-400 text-xs">
                      How much would you like to save? (in your local currency)
                    </FormDescription>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={step2Form.control}
                name="savingsTimeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-sm font-medium">Timeline</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          data-testid="select-savings-timeline" 
                          className="h-12 bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        >
                          <SelectValue placeholder="When do you want to reach your goal?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="3months" className="text-white focus:bg-slate-700">3 months</SelectItem>
                        <SelectItem value="6months" className="text-white focus:bg-slate-700">6 months</SelectItem>
                        <SelectItem value="1year" className="text-white focus:bg-slate-700">1 year</SelectItem>
                        <SelectItem value="3years" className="text-white focus:bg-slate-700">3 years</SelectItem>
                        <SelectItem value="5years+" className="text-white focus:bg-slate-700">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={step2Form.control}
                name="financialPriorities"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-sm font-medium">Financial Priorities</FormLabel>
                    <p className="text-slate-400 text-xs mb-3">Select all that apply</p>
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
                                  className="h-5 w-5 border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-slate-200 cursor-pointer">
                                {priority.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(1)}
                  className="h-12 px-6 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
                  data-testid="button-back-step-2"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
                  data-testid="button-next-step-2"
                  disabled={saveProgressMutation.isPending}
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {currentStep === 3 && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-1">Customize Your AI Assistant</h2>
            <p className="text-slate-400 text-sm">How would you like your AI to help you?</p>
          </div>
          <Form {...step3Form}>
            <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-5">
              <FormField
                control={step3Form.control}
                name="notificationFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-sm font-medium">Notification Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          data-testid="select-notification-frequency" 
                          className="h-12 bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="daily" className="text-white focus:bg-slate-700">Daily insights</SelectItem>
                        <SelectItem value="weekly" className="text-white focus:bg-slate-700">Weekly summaries</SelectItem>
                        <SelectItem value="monthly" className="text-white focus:bg-slate-700">Monthly reports</SelectItem>
                        <SelectItem value="never" className="text-white focus:bg-slate-700">Only when I ask</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={step3Form.control}
                name="adviceStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-sm font-medium">Advice Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          data-testid="select-advice-style" 
                          className="h-12 bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="detailed" className="text-white focus:bg-slate-700">Detailed analysis with numbers</SelectItem>
                        <SelectItem value="concise" className="text-white focus:bg-slate-700">Concise actionable points</SelectItem>
                        <SelectItem value="conversational" className="text-white focus:bg-slate-700">Conversational and friendly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={step3Form.control}
                name="preferredLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 text-sm font-medium">Preferred Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          data-testid="select-preferred-language" 
                          className="h-12 bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="en" className="text-white focus:bg-slate-700">English</SelectItem>
                        <SelectItem value="es" className="text-white focus:bg-slate-700">Espanol</SelectItem>
                        <SelectItem value="ar" className="text-white focus:bg-slate-700">Arabic</SelectItem>
                        <SelectItem value="hi" className="text-white focus:bg-slate-700">Hindi</SelectItem>
                        <SelectItem value="id" className="text-white focus:bg-slate-700">Bahasa Indonesia</SelectItem>
                        <SelectItem value="ms" className="text-white focus:bg-slate-700">Bahasa Melayu</SelectItem>
                        <SelectItem value="pt" className="text-white focus:bg-slate-700">Portugues</SelectItem>
                        <SelectItem value="th" className="text-white focus:bg-slate-700">Thai</SelectItem>
                        <SelectItem value="tl" className="text-white focus:bg-slate-700">Tagalog</SelectItem>
                        <SelectItem value="tr" className="text-white focus:bg-slate-700">Turkish</SelectItem>
                        <SelectItem value="vi" className="text-white focus:bg-slate-700">Vietnamese</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(2)}
                  className="h-12 px-6 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
                  data-testid="button-back-step-3"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
                  data-testid="button-complete-onboarding"
                  disabled={completeOnboardingMutation.isPending}
                >
                  {completeOnboardingMutation.isPending ? "Finishing..." : "Complete Setup"}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
