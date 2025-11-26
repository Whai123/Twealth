import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SiGoogle, SiFacebook, SiApple } from "react-icons/si";
import { Shield, Lock, Eye, Loader2, ArrowLeft } from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

interface AuthProviders {
  google: boolean;
  facebook: boolean;
  apple: boolean;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { data: providers, isLoading: providersLoading } = useQuery<AuthProviders>({
    queryKey: ["/api/auth/providers"],
  });

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

  const hasAnyProvider = providers?.google || providers?.facebook || providers?.apple;

  if (isCheckingAuth || providersLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      
      <div className="relative min-h-screen flex flex-col">
        <header className="px-6 py-4">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
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
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Welcome back
              </h1>
              <p className="text-slate-400">
                Sign in to continue to Twealth
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
              <div className="p-8 space-y-4">
                {!hasAnyProvider ? (
                  <div className="text-center py-6">
                    <p className="text-slate-400 mb-2">Authentication is being configured.</p>
                    <p className="text-sm text-slate-500">Please check back soon.</p>
                  </div>
                ) : (
                  <>
                    {providers?.google && (
                      <Button
                        onClick={handleGoogleLogin}
                        disabled={loadingProvider !== null}
                        variant="outline"
                        className="w-full h-12 font-medium border-slate-600 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                        data-testid="button-google-login"
                      >
                        {loadingProvider === "google" ? (
                          <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                        ) : (
                          <SiGoogle className="mr-3 h-4 w-4" />
                        )}
                        Continue with Google
                      </Button>
                    )}

                    {providers?.apple && (
                      <Button
                        onClick={handleAppleLogin}
                        disabled={loadingProvider !== null}
                        variant="outline"
                        className="w-full h-12 font-medium border-slate-600 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                        data-testid="button-apple-login"
                      >
                        {loadingProvider === "apple" ? (
                          <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                        ) : (
                          <SiApple className="mr-3 h-4 w-4" />
                        )}
                        Continue with Apple
                      </Button>
                    )}

                    {providers?.facebook && (
                      <Button
                        onClick={handleFacebookLogin}
                        disabled={loadingProvider !== null}
                        variant="outline"
                        className="w-full h-12 font-medium border-slate-600 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                        data-testid="button-facebook-login"
                      >
                        {loadingProvider === "facebook" ? (
                          <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                        ) : (
                          <SiFacebook className="mr-3 h-4 w-4 text-[#1877F2]" />
                        )}
                        Continue with Facebook
                      </Button>
                    )}
                  </>
                )}

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-slate-900 px-3 text-slate-500">
                      Enterprise-grade security
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400">256-bit encryption</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400">SOC 2 compliant</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400">GDPR ready</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-center text-sm text-slate-400">
                New to Twealth?{" "}
                <button
                  onClick={() => setLocation("/welcome")}
                  className="text-white font-medium hover:underline"
                  data-testid="link-learn-more"
                >
                  Learn more
                </button>
              </p>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <button 
                  onClick={() => setLocation("/terms")}
                  className="hover:text-slate-300 transition-colors"
                  data-testid="link-terms"
                >
                  Terms
                </button>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <button 
                  onClick={() => setLocation("/privacy")}
                  className="hover:text-slate-300 transition-colors"
                  data-testid="link-privacy"
                >
                  Privacy
                </button>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>2025 Twealth</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
