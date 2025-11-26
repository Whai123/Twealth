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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src={logoUrl} alt="Twealth" className="w-10 h-10" />
              <span className="text-2xl font-semibold text-white tracking-tight">Twealth</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Let's personalize your experience
            </h1>
            <p className="text-slate-400">
              This will only take a minute
            </p>
          </div>
          <ProgressiveOnboardingWizard onComplete={handleOnboardingComplete} />
          <div className="mt-8 text-center">
            <Button 
              variant="ghost" 
              onClick={handleExpressStart}
              className="text-slate-400 hover:text-white hover:bg-transparent"
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={logoUrl} alt="Twealth" className="w-12 h-12" />
            <span className="text-2xl font-semibold text-white tracking-tight">Twealth</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
            Welcome to Twealth
          </h1>
          <p className="text-lg text-slate-400">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
          <div 
            className="relative group cursor-pointer pt-4"
            onClick={handleExpressStart}
            data-testid="card-express-start"
          >
            <div className="absolute top-0 left-6 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full shadow-lg shadow-blue-600/25">
                <Sparkles className="w-3 h-3" />
                Recommended
              </span>
            </div>
            <div className="h-full bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 pt-8 transition-all duration-200 group-hover:border-blue-500 group-hover:shadow-xl group-hover:shadow-blue-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-blue-600/15 rounded-xl">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Express Start</h3>
              </div>
              <p className="text-slate-400 mb-6">
                Get started in seconds
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-slate-200">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  Start tracking immediately
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  AI learns as you use the app
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  Customize anytime in settings
                </li>
              </ul>
              <Button 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                data-testid="button-express-start"
              >
                Start Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div 
            className="relative group cursor-pointer pt-4"
            onClick={() => setMode('full')}
            data-testid="card-guided-setup"
          >
            <div className="h-full bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 pt-8 transition-all duration-200 group-hover:border-slate-500 group-hover:shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-slate-700 rounded-xl">
                  <Target className="h-6 w-6 text-slate-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Guided Setup</h3>
              </div>
              <p className="text-slate-400 mb-6">
                Personalize your experience
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-slate-200">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center">
                    <Check className="w-3 h-3 text-slate-400" />
                  </div>
                  Set your financial goals
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center">
                    <Check className="w-3 h-3 text-slate-400" />
                  </div>
                  Configure AI preferences
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center">
                    <Check className="w-3 h-3 text-slate-400" />
                  </div>
                  Get tailored insights faster
                </li>
              </ul>
              <Button 
                variant="outline"
                className="w-full h-12 bg-transparent border-slate-600 text-white hover:bg-slate-800 hover:border-slate-500 font-medium rounded-xl transition-colors"
                data-testid="button-guided-setup"
              >
                Customize Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Join thousands of users building their financial future with AI
          </p>
        </div>
      </div>
    </div>
  );
}
