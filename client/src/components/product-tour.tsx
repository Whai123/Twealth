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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  icon: any;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Twealth",
    description: "Your AI-powered financial command center. Let me show you around in 30 seconds.",
    position: "center",
    icon: Sparkles,
  },
  {
    id: "dashboard",
    title: "Your Financial Health",
    description: "See your overall score, key metrics, and AI-powered insights at a glance.",
    target: '[data-testid="hero-health-score"]',
    position: "bottom",
    icon: Target,
  },
  {
    id: "ai-assistant",
    title: "AI Financial Advisor",
    description: "Ask anything about your finances. Get personalized advice from GPT-5 & Claude.",
    target: '[data-testid="button-view-ai-insights"]',
    position: "left",
    icon: Brain,
  },
  {
    id: "quick-actions",
    title: "Quick Actions",
    description: "Add transactions, create goals, and track spending with one tap.",
    target: '[data-testid="fab-add"]',
    position: "top",
    icon: Wallet,
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "Start by asking the AI a question or setting your first savings goal.",
    position: "center",
    icon: Check,
  },
];

export function ProductTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
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

  useEffect(() => {
    if (!isActive) return;

    const step = tourSteps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isActive]);

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

  const getTooltipPosition = () => {
    if (!targetRect || step.position === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (step.position) {
      case "top":
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: "translateX(-50%)",
        };
      case "bottom":
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
          transform: "translateY(-50%)",
        };
      case "right":
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: "translateY(-50%)",
        };
      default:
        return {};
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={skipTour}
        />

        {targetRect && step.position !== "center" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
              borderRadius: "12px",
            }}
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(59, 130, 246, 0.4)",
                  "0 0 0 8px rgba(59, 130, 246, 0)",
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="absolute inset-0 rounded-xl border-2 border-primary"
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={getTooltipPosition()}
          className="fixed w-[320px] max-w-[90vw] z-[101]"
        >
          <Card className="border-primary/30 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25"
                  >
                    <IconComponent className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Skip tour
                    <X className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-lg font-semibold mb-2"
                >
                  {step.title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-muted-foreground mb-4"
                >
                  {step.description}
                </motion.p>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Step {currentStep + 1} of {tourSteps.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      className="flex-1"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                  >
                    {currentStep === tourSteps.length - 1 ? (
                      <>
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-center gap-1.5 pb-4">
                {tourSteps.map((_, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStep
                        ? "w-6 bg-primary"
                        : idx < currentStep
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-muted"
                    }`}
                    whileHover={{ scale: 1.2 }}
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
  const [, setIsActive] = useState(false);

  const startTour = () => {
    localStorage.removeItem("twealth_tour_completed");
    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTour}
      className="text-xs"
      data-testid="button-restart-tour"
    >
      <Sparkles className="w-3 h-3 mr-1.5" />
      Product Tour
    </Button>
  );
}
