import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProgressiveOnboardingWizard } from "@/components/onboarding/progressive-onboarding-wizard";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Zap, Target, ArrowRight, Sparkles, Loader2, Clock, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getSupportedCurrencies } from "@/lib/currency";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

const expressFormSchema = z.object({
  fullName: z.string().min(1, "Please enter your name"),
  currency: z.string().min(1, "Please select your currency"),
});

type ExpressFormData = z.infer<typeof expressFormSchema>;

// Detect user's likely currency from browser locale
function detectCurrency(): string {
  try {
    const locale = navigator.language || "en-US";
    const regionMap: Record<string, string> = {
      TH: "THB", US: "USD", GB: "GBP", EU: "EUR", JP: "JPY",
      CN: "CNY", KR: "KRW", IN: "INR", AU: "AUD", CA: "CAD",
      SG: "SGD", MY: "MYR", ID: "IDR", PH: "PHP", VN: "VND",
    };
    const region = locale.split("-")[1]?.toUpperCase() || "US";
    return regionMap[region] || "USD";
  } catch {
    return "USD";
  }
}

// Mini Twealth Score Ring (preview)
function ScorePreview() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(75), 500);
    return () => clearTimeout(timer);
  }, []);

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" strokeWidth="6" className="stroke-white/10" />
        <circle
          cx="40" cy="40" r="36"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-emerald-500 transition-all duration-1000 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">80+</span>
        <span className="text-[10px] text-white/60 uppercase tracking-wider">Goal</span>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'choice' | 'express' | 'full'>('choice');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const expressForm = useForm<ExpressFormData>({
    resolver: zodResolver(expressFormSchema),
    defaultValues: {
      fullName: "",
      currency: detectCurrency(),
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (data: { fullName: string; currency: string }) => {
      return apiRequest("PUT", "/api/user-preferences", {
        onboardingData: { fullName: data.fullName },
        currency: data.currency,
        hasCompletedOnboarding: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({
        title: "Welcome to Twealth!",
        description: "Your preferences have been saved. Let's get started!",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOnboardingComplete = () => setLocation("/");
  const handleExpressSubmit = (data: ExpressFormData) => savePreferencesMutation.mutate(data);

  // EXPRESS MODE
  if (mode === 'express') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-6">
              <img src={logoUrl} alt="Twealth" className="w-10 h-10" />
              <span className="text-xl font-semibold text-white">Twealth</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-[-0.02em] mb-2">Quick Setup</h1>
            <p className="text-white/60">Just two questions to get started</p>
          </div>

          {/* Card */}
          <div className="relative rounded-[24px] bg-white/[0.03] border border-white/[0.06] p-6 sm:p-8">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[24px] bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />

            <Form {...expressForm}>
              <form onSubmit={expressForm.handleSubmit(handleExpressSubmit)} className="space-y-5">
                <FormField
                  control={expressForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 text-sm">What should we call you?</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your name"
                          className="h-12 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={expressForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 text-sm">Preferred currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-white/[0.04] border-white/10 text-white rounded-xl">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 max-h-[280px]">
                          {getSupportedCurrencies().map((c) => (
                            <SelectItem key={c.code} value={c.code} className="text-white hover:bg-white/10">
                              {c.code} - {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={savePreferencesMutation.isPending}
                  className="w-full h-12 mt-2 bg-white text-black hover:bg-white/90 font-semibold rounded-xl"
                >
                  {savePreferencesMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</>
                  ) : (
                    <>Get Started <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => setMode('choice')} className="text-white/40 hover:text-white/60 text-sm">
              ← Back to options
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // FULL/GUIDED MODE
  if (mode === 'full') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-6">
              <img src={logoUrl} alt="Twealth" className="w-10 h-10" />
              <span className="text-xl font-semibold text-white">Twealth</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-[-0.02em] mb-2">Personalize Your Experience</h1>
            <p className="text-white/60">This will only take a minute</p>
          </div>
          <ProgressiveOnboardingWizard onComplete={handleOnboardingComplete} />
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => setMode('choice')} className="text-white/40 hover:text-white/60 text-sm">
              ← Back to options
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // CHOICE MODE (default)
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <img src={logoUrl} alt="Twealth" className="w-12 h-12" />
            <span className="text-2xl font-semibold text-white">Twealth</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
            Welcome to Twealth
          </h1>
          <p className="text-lg text-white/50">Choose how you'd like to get started</p>
        </div>

        {/* Two Cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Express Start */}
          <div
            onClick={() => setMode('express')}
            className="relative group cursor-pointer"
          >
            {/* Recommended Badge */}
            <div className="absolute -top-3 left-5 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-xs font-medium rounded-full">
                <Sparkles className="w-3 h-3" /> Recommended
              </span>
            </div>

            <div className="h-full rounded-[24px] bg-white/[0.03] border border-white/[0.06] p-6 pt-8 transition-all group-hover:border-white/[0.12] group-hover:bg-white/[0.04]">
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[24px] bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Express Start</h3>
                  <p className="text-xs text-white/40">~30 seconds</p>
                </div>
              </div>

              <p className="text-white/50 text-sm mb-5">Get started in seconds with smart defaults</p>

              <ul className="space-y-3 mb-6">
                {["Just name & currency", "AI learns as you use the app", "Customize anytime"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-blue-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Button className="w-full h-11 bg-white text-black hover:bg-white/90 font-medium rounded-xl">
                Start Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Guided Setup */}
          <div
            onClick={() => setMode('full')}
            className="relative group cursor-pointer"
          >
            <div className="h-full rounded-[24px] bg-white/[0.03] border border-white/[0.06] p-6 pt-8 transition-all group-hover:border-white/[0.12] group-hover:bg-white/[0.04]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Target className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Guided Setup</h3>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~3 minutes
                  </p>
                </div>
              </div>

              <p className="text-white/50 text-sm mb-5">Personalize your experience step by step</p>

              <ul className="space-y-3 mb-6">
                {["Set your financial goals", "Configure AI preferences", "Get tailored insights faster"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white/40" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full h-11 bg-transparent border-white/10 text-white hover:bg-white/5 font-medium rounded-xl">
                Customize Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Twealth Index Preview */}
        <div className="mt-10 flex flex-col items-center">
          <div className="flex items-center gap-6 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <ScorePreview />
            <div>
              <p className="text-sm text-white/60 mb-1">Build your Twealth Index™</p>
              <p className="text-white font-medium flex items-center gap-2">
                <span className="text-white/40">Starting:</span> 0
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">80+</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm text-white/30 mb-3">Join thousands building their financial future with AI</p>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
              queryClient.clear();
              setLocation('/');
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
