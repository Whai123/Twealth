import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Shield, TrendingUp, Target } from "lucide-react";
import { SiGoogle, SiFacebook, SiApple } from "react-icons/si";
import logoUrl from "@assets/5-removebg-preview_1761660874225.png";

export default function Login() {
  const [, setLocation] = useLocation();

  // Check if already authenticated
  useEffect(() => {
    fetch("/api/auth/status")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setLocation("/");
        }
      })
      .catch(() => {
        // Not authenticated, stay on login page
      });
  }, [setLocation]);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleFacebookLogin = () => {
    window.location.href = "/api/auth/facebook";
  };

  const handleAppleLogin = () => {
    // Apple Sign In uses POST method
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/apple';
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src={logoUrl} 
              alt="Twealth Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Twealth
          </h1>
          <p className="text-muted-foreground mt-2">
            Your AI-powered financial advisor
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to access your financial dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full h-12 text-base font-medium hover:bg-accent hover:border-primary/20 transition-all duration-200 group"
                data-testid="button-google-login"
              >
                <SiGoogle className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                Continue with Google
              </Button>

              <Button
                onClick={handleAppleLogin}
                variant="outline"
                className="w-full h-12 text-base font-medium hover:bg-accent hover:border-primary/20 transition-all duration-200 group"
                data-testid="button-apple-login"
              >
                <SiApple className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                Continue with Apple
              </Button>

              <Button
                onClick={handleFacebookLogin}
                variant="outline"
                className="w-full h-12 text-base font-medium hover:bg-accent hover:border-primary/20 transition-all duration-200 group"
                data-testid="button-facebook-login"
              >
                <SiFacebook className="mr-3 h-5 w-5 text-[#1877F2] group-hover:scale-110 transition-transform" />
                Continue with Facebook
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Secure Authentication
                </span>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <span>Bank-level security encryption</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <span>AI-powered financial insights</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <span>Smart goal tracking & budgeting</span>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our{" "}
                <a href="/terms" className="underline hover:text-primary transition-colors">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="underline hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            New to Twealth?{" "}
            <button
              onClick={() => setLocation("/welcome")}
              className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              data-testid="link-learn-more"
            >
              Learn more
              <ArrowRight className="w-4 h-4" />
            </button>
          </p>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-60">
          <div className="text-xs text-muted-foreground">256-bit SSL</div>
          <div className="w-1 h-1 rounded-full bg-muted-foreground" />
          <div className="text-xs text-muted-foreground">SOC 2 Compliant</div>
          <div className="w-1 h-1 rounded-full bg-muted-foreground" />
          <div className="text-xs text-muted-foreground">GDPR Ready</div>
        </div>
      </div>
    </div>
  );
}
