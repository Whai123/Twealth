import { useState } from "react";
import { useLocation } from "wouter";
import { ProgressiveOnboardingWizard } from "@/components/onboarding/progressive-onboarding-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Target, ArrowRight } from "lucide-react";

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome to Twealth
            </h1>
            <p className="text-lg text-muted-foreground">
              Your AI-powered financial assistant
            </p>
          </div>
          <ProgressiveOnboardingWizard onComplete={handleOnboardingComplete} />
          <div className="mt-8 text-center">
            <Button 
              variant="ghost" 
              onClick={handleExpressStart}
              data-testid="button-skip-onboarding"
            >
              Skip to dashboard
            </Button>
          </div>
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>Join thousands of users building their financial future with AI</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to Twealth
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="border-2 hover:border-primary transition-colors cursor-pointer" 
            onClick={handleExpressStart}
            data-testid="card-express-start"
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Express Start</CardTitle>
              </div>
              <CardDescription>
                Get started in seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Start tracking immediately
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  AI learns as you use the app
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Customize anytime in settings
                </p>
              </div>
              <Button className="w-full" size="lg" data-testid="button-express-start">
                Start Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="border-2 hover:border-primary transition-colors cursor-pointer" 
            onClick={() => setMode('full')}
            data-testid="card-guided-setup"
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Guided Setup</CardTitle>
              </div>
              <CardDescription>
                Personalize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Set your financial goals
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Configure AI preferences
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Get tailored insights faster
                </p>
              </div>
              <Button className="w-full" variant="outline" size="lg" data-testid="button-guided-setup">
                Customize Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Join thousands of users building their financial future with AI</p>
        </div>
      </div>
    </div>
  );
}
