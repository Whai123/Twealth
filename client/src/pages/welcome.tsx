import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProgressiveOnboardingWizard } from "@/components/onboarding/progressive-onboarding-wizard";
import { Button } from "@/components/ui/button";
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
import { Check, Zap, Target, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getSupportedCurrencies } from "@/lib/currency";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

const expressFormSchema = z.object({
  fullName: z.string().min(1, "Please enter your name"),
  currency: z.string().min(1, "Please select your currency"),
});

type ExpressFormData = z.infer<typeof expressFormSchema>;

function GradientMeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 40% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 40% 50% at 70% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)
          `
        }}
      />
      
      <div 
        className="absolute top-0 left-0 w-full h-full opacity-30 motion-safe:animate-[meshFloat_20s_ease-in-out_infinite]"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 25%),
            radial-gradient(circle at 70% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 25%)
          `
        }}
      />
      
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl motion-safe:animate-[gentlePulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl motion-safe:animate-[gentlePulse_8s_ease-in-out_infinite_2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-full blur-3xl" />
      
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
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
      currency: "USD",
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (data: { fullName: string; currency: string }) => {
      return apiRequest("PUT", "/api/user-preferences", {
        onboardingData: {
          fullName: data.fullName,
        },
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

  const handleOnboardingComplete = () => {
    setLocation("/");
  };

  const handleExpressSubmit = (data: ExpressFormData) => {
    savePreferencesMutation.mutate(data);
  };

  const handleSelectExpress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMode('express');
  };

  const handleSelectFull = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMode('full');
  };

  if (mode === 'express') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <GradientMeshBackground />
        
        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full scale-150 motion-safe:animate-[gentlePulse_4s_ease-in-out_infinite]" />
                <img src={logoUrl} alt="Twealth" className="w-12 h-12 relative drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
              </div>
              <span className="text-2xl font-semibold text-white tracking-tight">Twealth</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Quick Setup
            </h1>
            <p className="text-slate-400 text-lg">
              Just two quick questions to get started
            </p>
          </div>

          <div className="bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-700/80 rounded-3xl p-8 backdrop-blur-sm">
            <Form {...expressForm}>
              <form onSubmit={expressForm.handleSubmit(handleExpressSubmit)} className="space-y-6">
                <FormField
                  control={expressForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">What should we call you?</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your name"
                          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12"
                          data-testid="input-name"
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
                      <FormLabel className="text-slate-200">Preferred currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger 
                            className="bg-slate-800/50 border-slate-600 text-white h-12"
                            data-testid="select-currency"
                          >
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-slate-600 max-h-[300px]">
                          {getSupportedCurrencies().map((currency) => (
                            <SelectItem 
                              key={currency.code} 
                              value={currency.code}
                              className="text-white hover:bg-slate-700"
                            >
                              {currency.code} - {currency.name}
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
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-500/30 text-base mt-4"
                  data-testid="button-submit-express"
                >
                  {savePreferencesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-8 text-center">
            <Button 
              variant="ghost" 
              onClick={() => setMode('choice')}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              data-testid="button-back-to-choice"
            >
              Back to options
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'full') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <GradientMeshBackground />
        
        <div className="w-full max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full scale-150 motion-safe:animate-[gentlePulse_4s_ease-in-out_infinite]" />
                <img src={logoUrl} alt="Twealth" className="w-12 h-12 relative drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
              </div>
              <span className="text-2xl font-semibold text-white tracking-tight">Twealth</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Let's personalize your experience
            </h1>
            <p className="text-slate-400 text-lg">
              This will only take a minute
            </p>
          </div>
          <ProgressiveOnboardingWizard onComplete={handleOnboardingComplete} />
          <div className="mt-8 text-center">
            <Button 
              variant="ghost" 
              onClick={() => setMode('choice')}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              data-testid="button-back-to-choice"
            >
              Back to options
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <GradientMeshBackground />
      
      <div className="w-full max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/40 blur-xl rounded-full scale-150 motion-safe:animate-[gentlePulse_4s_ease-in-out_infinite]" />
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-200 motion-safe:animate-[gentlePulse_6s_ease-in-out_infinite_1s]" />
              <img src={logoUrl} alt="Twealth" className="w-14 h-14 relative drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
            </div>
            <span className="text-3xl font-semibold text-white tracking-tight drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]">Twealth</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              Welcome to Twealth
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-md mx-auto">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div 
            className="relative group cursor-pointer pt-5"
            onClick={handleSelectExpress}
            data-testid="card-express-start"
          >
            <div className="absolute top-0 left-6 z-10">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold rounded-full shadow-lg shadow-blue-600/30 border border-blue-400/20">
                <Sparkles className="w-3.5 h-3.5" />
                Recommended
              </span>
            </div>
            <div className="h-full bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-700/80 rounded-3xl p-7 sm:p-9 pt-10 transition-all duration-300 group-hover:border-blue-500/70 group-hover:shadow-2xl group-hover:shadow-blue-500/20 group-hover:-translate-y-1 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-2xl border border-blue-500/20 shadow-inner">
                  <Zap className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">Express Start</h3>
              </div>
              <p className="text-slate-400 mb-7 text-base">
                Get started in seconds with smart defaults
              </p>
              <ul className="space-y-4 mb-9">
                <li className="flex items-center gap-4 text-slate-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-600/30 to-blue-700/20 flex items-center justify-center border border-blue-500/30">
                    <Check className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-base">Just name & currency</span>
                </li>
                <li className="flex items-center gap-4 text-slate-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-600/30 to-blue-700/20 flex items-center justify-center border border-blue-500/30">
                    <Check className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-base">AI learns as you use the app</span>
                </li>
                <li className="flex items-center gap-4 text-slate-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-600/30 to-blue-700/20 flex items-center justify-center border border-blue-500/30">
                    <Check className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-base">Customize anytime in settings</span>
                </li>
              </ul>
              <Button 
                onClick={handleSelectExpress}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-500/30 text-base"
                data-testid="button-express-start"
              >
                Start Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          <div 
            className="relative group cursor-pointer pt-5"
            onClick={handleSelectFull}
            data-testid="card-guided-setup"
          >
            <div className="h-full bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-700/80 rounded-3xl p-7 sm:p-9 pt-10 transition-all duration-300 group-hover:border-slate-500/70 group-hover:shadow-2xl group-hover:shadow-slate-500/10 group-hover:-translate-y-1 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl border border-slate-600/30 shadow-inner">
                  <Target className="h-7 w-7 text-slate-300" />
                </div>
                <h3 className="text-2xl font-semibold text-white">Guided Setup</h3>
              </div>
              <p className="text-slate-400 mb-7 text-base">
                Personalize your experience step by step
              </p>
              <ul className="space-y-4 mb-9">
                <li className="flex items-center gap-4 text-slate-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-slate-700/50 to-slate-800/30 flex items-center justify-center border border-slate-600/40">
                    <Check className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-base">Set your financial goals</span>
                </li>
                <li className="flex items-center gap-4 text-slate-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-slate-700/50 to-slate-800/30 flex items-center justify-center border border-slate-600/40">
                    <Check className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-base">Configure AI preferences</span>
                </li>
                <li className="flex items-center gap-4 text-slate-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-slate-700/50 to-slate-800/30 flex items-center justify-center border border-slate-600/40">
                    <Check className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-base">Get tailored insights faster</span>
                </li>
              </ul>
              <Button 
                onClick={handleSelectFull}
                variant="outline"
                className="w-full h-14 bg-transparent border-2 border-slate-600 text-white hover:bg-slate-800/50 hover:border-slate-500 font-semibold rounded-2xl transition-all duration-300 text-base"
                data-testid="button-guided-setup"
              >
                Customize Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-14 text-center">
          <p className="text-base text-slate-500">
            Join thousands of users building their financial future with AI
          </p>
        </div>
      </div>
    </div>
  );
}
