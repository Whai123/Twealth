import { useLocation } from "wouter";
import { ProgressiveOnboardingWizard } from "@/components/onboarding/progressive-onboarding-wizard";

export default function WelcomePage() {
  const [, setLocation] = useLocation();

  const handleOnboardingComplete = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to Twealth
          </h1>
          <p className="text-lg text-muted-foreground">
            Your AI-powered financial assistant
          </p>
        </div>

        {/* Progressive Onboarding Wizard */}
        <ProgressiveOnboardingWizard onComplete={handleOnboardingComplete} />

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Join thousands of users building their financial future with AI</p>
        </div>
      </div>
    </div>
  );
}
