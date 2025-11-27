import { useState } from "react";
import { useLocation } from "wouter";
import { ProgressiveOnboardingWizard } from "@/components/onboarding/progressive-onboarding-wizard";
import { Button } from "@/components/ui/button";
import { Check, Zap, Target, ArrowRight, Sparkles } from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'choice' | 'express' | 'full'>('choice');

  const handleOnboardingComplete = () => {
    setLocation("/");
  };

  const handleExpressStart = () => {
    setLocation("/");
  };

  if (mode === 'full') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        
        <div className="w-full max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <img src={logoUrl} alt="Twealth" className="w-12 h-12 relative" />
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
              onClick={handleExpressStart}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              data-testid="button-skip-onboarding"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full scale-150" />
              <img src={logoUrl} alt="Twealth" className="w-14 h-14 relative drop-shadow-2xl" />
            </div>
            <span className="text-3xl font-semibold text-white tracking-tight">Twealth</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text">
            Welcome to Twealth
          </h1>
          <p className="text-xl text-slate-400 max-w-md mx-auto">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div 
            className="relative group cursor-pointer pt-5"
            onClick={handleExpressStart}
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
                  <span className="text-base">Start tracking immediately</span>
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
                onClick={handleExpressStart}
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
            onClick={() => setMode('full')}
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
                onClick={() => setMode('full')}
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
