import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Check, ArrowRight, Sparkles, Globe, Users } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:opacity-20 opacity-30" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px]">
          {/* Logo and Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <img 
                src={logoUrl} 
                alt="Twealth Logo" 
                className="w-24 h-24 object-contain relative z-10 drop-shadow-2xl"
              />
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">
              Twealth
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
              Your AI-powered financial companion
            </p>
            
            {/* Stats Bar */}
            <div className="flex items-center justify-center gap-8 mt-6 text-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold">10K+ users</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold">Global reach</span>
              </div>
            </div>
          </div>

          {/* Main Login Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 overflow-hidden">
            {/* Premium Header */}
            <div className="relative px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600" />
              <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
                Welcome back
              </h2>
              <p className="text-center text-slate-600 dark:text-slate-400">
                Sign in with your preferred account
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Social Login Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleGoogleLogin}
                  variant="outline"
                  className="w-full h-14 text-base font-semibold border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300 group shadow-sm hover:shadow-md"
                  data-testid="button-google-login"
                >
                  <SiGoogle className="mr-3 h-5 w-5 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-slate-900 dark:text-white">Continue with Google</span>
                </Button>

                <Button
                  onClick={handleAppleLogin}
                  variant="outline"
                  className="w-full h-14 text-base font-semibold border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300 group shadow-sm hover:shadow-md"
                  data-testid="button-apple-login"
                >
                  <SiApple className="mr-3 h-5 w-5 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-slate-900 dark:text-white">Continue with Apple</span>
                </Button>

                <Button
                  onClick={handleFacebookLogin}
                  variant="outline"
                  className="w-full h-14 text-base font-semibold border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300 group shadow-sm hover:shadow-md"
                  data-testid="button-facebook-login"
                >
                  <SiFacebook className="mr-3 h-5 w-5 text-[#1877F2] group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-slate-900 dark:text-white">Continue with Facebook</span>
                </Button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-500 font-semibold tracking-wider">
                    Enterprise-grade security
                  </span>
                </div>
              </div>

              {/* Security Features */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 shadow-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-0.5">
                      Bank-level encryption
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      256-bit SSL protection for all your data
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0 shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-0.5">
                      AI-powered insights
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      CFO-level financial advice at your fingertips
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0 shadow-lg">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-0.5">
                      Privacy-first approach
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Your data is yours. Never shared or sold.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-center text-slate-500 dark:text-slate-500 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <a href="/terms" className="font-semibold text-purple-600 dark:text-purple-400 hover:underline transition-colors">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="font-semibold text-purple-600 dark:text-purple-400 hover:underline transition-colors">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              New to Twealth?{" "}
              <button
                onClick={() => setLocation("/welcome")}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all"
                data-testid="link-learn-more"
              >
                Discover what's possible
                <ArrowRight className="w-4 h-4" />
              </button>
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 space-y-4">
            {/* Compliance badges */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">ISO 27001</span>
              </div>
            </div>
            
            {/* Encryption badge */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                <Lock className="w-3 h-3" />
                <span className="font-medium">Protected by 256-bit AES encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
