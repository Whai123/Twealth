import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  Brain,
  Wallet,
  Check,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";

interface TourStep {
  id: string;
  title: string;
  description: string;
  position: "center";
  icon: any;
}

// Simplified tour - no element targeting, just overlay steps
const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Twealth 👋",
    description: "Your AI-powered financial command center. Let me show you around in 30 seconds.",
    position: "center",
    icon: Sparkles,
  },
  {
    id: "twealth-score",
    title: "Your Twealth Score",
    description: "This is your financial health score (0-100). It updates based on your cashflow, stability, growth, and spending behavior.",
    position: "center",
    icon: TrendingUp,
  },
  {
    id: "ai-advisor",
    title: "AI Financial Advisor",
    description: "Ask anything about your finances. Get personalized advice from GPT, Claude, and Gemini models. Find it in the purple card!",
    position: "center",
    icon: Brain,
  },
  {
    id: "quick-actions",
    title: "Track Everything",
    description: "Add transactions, set goals, and track your spending. Use the Cards below the score to get started quickly.",
    position: "center",
    icon: Wallet,
  },
  {
    id: "goals",
    title: "Set Financial Goals",
    description: "Create savings goals for things like vacations, emergency funds, or big purchases. The AI will help you reach them faster.",
    position: "center",
    icon: Target,
  },
  {
    id: "complete",
    title: "You're All Set! 🎉",
    description: "Start by asking the AI a question or adding your first transaction. Your Twealth Score will grow as you track!",
    position: "center",
    icon: Check,
  },
];

export function ProductTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("twealth_tour_completed");
    const hasSeenOnboarding = localStorage.getItem("onboarding_completed");

    if (hasSeenOnboarding === "true" && !hasSeenTour) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem("twealth_tour_completed", "true");
    setIsActive(false);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#8b5cf6', '#22c55e'],
    });
  }, []);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    localStorage.setItem("twealth_tour_completed", "true");
    setIsActive(false);
  };

  if (!isActive) return null;

  const step = tourSteps[currentStep];
  const IconComponent = step.icon;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={skipTour}
        />

        {/* Centered Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] max-w-[90vw] z-[101]"
        >
          <Card className="border-0 shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden">
            <CardContent className="p-0">
              {/* Gradient top bar */}
              <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </motion.div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Skip <X className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                {/* Content */}
                <motion.h3
                  key={step.id + "-title"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-bold mb-2 text-zinc-900 dark:text-white"
                >
                  {step.title}
                </motion.h3>

                <motion.p
                  key={step.id + "-desc"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6"
                >
                  {step.description}
                </motion.p>

                {/* Progress */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{currentStep + 1} of {tourSteps.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      className="flex-1 h-10 rounded-xl"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700"
                  >
                    {currentStep === tourSteps.length - 1 ? (
                      <>Let's Go! <ArrowRight className="w-4 h-4 ml-1" /></>
                    ) : (
                      <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step dots */}
              <div className="flex justify-center gap-1.5 pb-4">
                {tourSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 rounded-full transition-all ${idx === currentStep
                      ? "w-6 bg-blue-500"
                      : idx < currentStep
                        ? "w-1.5 bg-blue-500/50"
                        : "w-1.5 bg-zinc-200 dark:bg-zinc-700"
                      }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function TourTrigger() {
  const startTour = () => {
    localStorage.removeItem("twealth_tour_completed");
    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTour}
      className="text-xs rounded-full"
      data-testid="button-restart-tour"
    >
      <Sparkles className="w-3 h-3 mr-1.5" />
      Product Tour
    </Button>
  );
}

export default ProductTour;
