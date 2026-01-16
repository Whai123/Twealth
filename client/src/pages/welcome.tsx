import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressiveOnboardingWizard } from "@/components/onboarding/progressive-onboarding-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Zap, Target, ArrowRight, Sparkles, Loader2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getSupportedCurrencies } from "@/lib/currency";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

const formSchema = z.object({
  fullName: z.string().min(1, "Please enter your name"),
  currency: z.string().min(1, "Please select your currency"),
});

type FormData = z.infer<typeof formSchema>;

function detectCurrency(): string {
  try {
    const locale = navigator.language || "en-US";
    const map: Record<string, string> = {
      TH: "THB", US: "USD", GB: "GBP", EU: "EUR", JP: "JPY", SG: "SGD", AU: "AUD"
    };
    return map[locale.split("-")[1]?.toUpperCase()] || "USD";
  } catch { return "USD"; }
}

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'choice' | 'express' | 'full'>('choice');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", currency: detectCurrency() },
  });

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("PUT", "/api/user-preferences", {
      onboardingData: { fullName: data.fullName },
      currency: data.currency,
      hasCompletedOnboarding: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      toast({ title: "Welcome to Twealth!", description: "Let's get started!" });
      setLocation("/");
    },
  });

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    queryClient.clear();
    setLocation('/');
    window.location.reload();
  };

  // EXPRESS MODE
  if (mode === 'express') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-6">
              <img src={logoUrl} alt="Twealth" className="w-10 h-10" />
              <span className="text-xl font-semibold text-white">Twealth</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Quick Setup</h1>
            <p className="text-zinc-400">Just two questions to get started</p>
          </div>

          {/* Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">What should we call you?</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your name"
                          className="h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Preferred currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-zinc-800 border-zinc-700 text-white rounded-xl">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {getSupportedCurrencies().map((c) => (
                            <SelectItem key={c.code} value={c.code} className="text-white hover:bg-zinc-800">
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
                  disabled={saveMutation.isPending}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                >
                  {saveMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</>
                  ) : (
                    <>Get Started <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => setMode('choice')} className="text-zinc-500 hover:text-zinc-300">
              ← Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // FULL MODE
  if (mode === 'full') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <img src={logoUrl} alt="Twealth" className="w-10 h-10" />
              <span className="text-xl font-semibold text-white">Twealth</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Personalize Your Experience</h1>
            <p className="text-zinc-400">This will only take a minute</p>
          </div>
          <ProgressiveOnboardingWizard onComplete={() => setLocation("/")} />
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => setMode('choice')} className="text-zinc-500 hover:text-zinc-300">
              ← Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // CHOICE MODE
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={logoUrl} alt="Twealth" className="w-14 h-14" />
            <span className="text-2xl font-semibold text-white">Twealth</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Welcome
          </h1>
          <p className="text-xl text-zinc-400">Choose how you'd like to get started</p>
        </motion.div>

        {/* Two Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Express */}
          <motion.button
            onClick={() => setMode('express')}
            className="relative group text-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
          >
            {/* Recommended Badge */}
            <div className="absolute -top-3 left-5 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full shadow-lg shadow-blue-600/30">
                <Sparkles className="w-3 h-3" /> Recommended
              </span>
            </div>

            <div className="h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 pt-10 transition-all group-hover:border-zinc-700 group-hover:bg-zinc-900/80">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Express Start</h3>
                  <p className="text-xs text-zinc-500">~30 seconds</p>
                </div>
              </div>

              <p className="text-zinc-400 text-sm mb-6">Get started in seconds with smart defaults</p>

              <ul className="space-y-3 mb-6">
                {["Just name & currency", "AI learns as you use the app", "Customize anytime"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-blue-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="h-11 bg-blue-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 group-hover:bg-blue-700 transition-colors">
                Start Now <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>

          {/* Guided */}
          <motion.button
            onClick={() => setMode('full')}
            className="relative group text-left"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
          >
            <div className="h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 pt-10 transition-all group-hover:border-zinc-700 group-hover:bg-zinc-900/80">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Target className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Guided Setup</h3>
                  <p className="text-xs text-zinc-500">~3 minutes</p>
                </div>
              </div>

              <p className="text-zinc-400 text-sm mb-6">Personalize your experience step by step</p>

              <ul className="space-y-3 mb-6">
                {["Set your financial goals", "Configure AI preferences", "Get tailored insights faster"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-zinc-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="h-11 bg-zinc-800 border border-zinc-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 group-hover:bg-zinc-700 transition-colors">
                Customize Now <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Footer */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-zinc-600 mb-4">Join thousands building their financial future with AI</p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
