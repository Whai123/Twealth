import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SiGoogle, SiFacebook, SiApple } from "react-icons/si";
import { Shield, Lock, Eye, Loader2, ArrowLeft } from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/status")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setLocation("/");
        }
      })
      .catch(() => {})
      .finally(() => setIsCheckingAuth(false));
  }, [setLocation]);

  const handleGoogleLogin = () => {
    setLoadingProvider("google");
    window.location.assign("/api/auth/google");
  };

  const handleFacebookLogin = () => {
    setLoadingProvider("facebook");
    window.location.assign("/api/auth/facebook");
  };

  const handleAppleLogin = () => {
    setLoadingProvider("apple");
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/apple';
    document.body.appendChild(form);
    form.submit();
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black" />
      
      <div className="relative min-h-screen flex flex-col">
        <header className="px-6 py-4">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center mb-6">
                <img 
                  src={logoUrl} 
                  alt="Twealth" 
                  className="w-14 h-14 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-2">
                Welcome back
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to continue to Twealth
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
              <div className="p-8 space-y-4">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={loadingProvider !== null}
                  variant="outline"
                  className="w-full h-12 font-medium border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-black dark:text-white rounded-xl"
                  data-testid="button-google-login"
                >
                  {loadingProvider === "google" ? (
                    <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  ) : (
                    <SiGoogle className="mr-3 h-4 w-4" />
                  )}
                  Continue with Google
                </Button>

                <Button
                  onClick={handleAppleLogin}
                  disabled={loadingProvider !== null}
                  variant="outline"
                  className="w-full h-12 font-medium border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-black dark:text-white rounded-xl"
                  data-testid="button-apple-login"
                >
                  {loadingProvider === "apple" ? (
                    <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  ) : (
                    <SiApple className="mr-3 h-4 w-4" />
                  )}
                  Continue with Apple
                </Button>

                <Button
                  onClick={handleFacebookLogin}
                  disabled={loadingProvider !== null}
                  variant="outline"
                  className="w-full h-12 font-medium border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-black dark:text-white rounded-xl"
                  data-testid="button-facebook-login"
                >
                  {loadingProvider === "facebook" ? (
                    <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  ) : (
                    <SiFacebook className="mr-3 h-4 w-4 text-[#1877F2]" />
                  )}
                  Continue with Facebook
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-gray-200 dark:bg-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-gray-950 px-3 text-gray-500">
                      Enterprise-grade security
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">256-bit encryption</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">SOC 2 compliant</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-2">
                      <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">GDPR ready</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                New to Twealth?{" "}
                <button
                  onClick={() => setLocation("/welcome")}
                  className="text-black dark:text-white font-medium hover:underline"
                  data-testid="link-learn-more"
                >
                  Learn more
                </button>
              </p>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>Terms</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <span>Privacy</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <span>2025 Twealth</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
