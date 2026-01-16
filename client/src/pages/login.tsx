import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SiGoogle, SiFacebook, SiApple } from "react-icons/si";
import { Shield, Lock, Loader2, ArrowLeft, Code2 } from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

interface AuthProviders {
  google: boolean;
  facebook: boolean;
  apple: boolean;
  devLogin?: boolean;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: providers, isLoading, isError } = useQuery<AuthProviders>({
    queryKey: ["/api/auth/providers"],
    retry: 2,
  });

  useEffect(() => {
    fetch("/api/auth/status")
      .then(res => res.json())
      .then(data => setIsLoggedIn(data.authenticated))
      .catch(() => { })
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setIsLoggedIn(false);
    window.location.reload();
  };

  const handleGoogleLogin = () => {
    setLoadingProvider("google");
    window.location.assign("/api/auth/google");
  };

  const handleAppleLogin = () => {
    setLoadingProvider("apple");
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/apple';
    document.body.appendChild(form);
    form.submit();
  };

  const handleFacebookLogin = () => {
    setLoadingProvider("facebook");
    window.location.assign("/api/auth/facebook");
  };

  const handleDevLogin = async () => {
    setLoadingProvider("dev");
    const res = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = "/";
    } else {
      setLoadingProvider(null);
    }
  };

  const hasProvider = providers?.google || providers?.facebook || providers?.apple || providers?.devLogin;

  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div
          className="text-center max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're signed in</h2>
          <p className="text-zinc-400 mb-8">Continue to the app or switch accounts</p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => window.location.href = "/"}
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
            >
              Continue to App
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="h-12 border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl"
            >
              Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-6">
              <img src={logoUrl} alt="Twealth" className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-zinc-400">Sign in to continue to Twealth</p>
          </div>

          {/* Auth Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            {isError ? (
              <div className="text-center py-6">
                <p className="text-red-400 mb-4">Unable to load sign-in options</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="border-zinc-700 text-zinc-300"
                >
                  Try Again
                </Button>
              </div>
            ) : !hasProvider ? (
              <div className="text-center py-6">
                <p className="text-zinc-400">Authentication is being configured...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {providers?.devLogin && (
                  <Button
                    onClick={handleDevLogin}
                    disabled={loadingProvider !== null}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
                  >
                    {loadingProvider === "dev" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Code2 className="mr-2 h-4 w-4" />
                    )}
                    Continue with Dev Login
                  </Button>
                )}

                {providers?.google && (
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={loadingProvider !== null}
                    className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-medium"
                  >
                    {loadingProvider === "google" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SiGoogle className="mr-2 h-4 w-4" />
                    )}
                    Continue with Google
                  </Button>
                )}

                {providers?.apple && (
                  <Button
                    onClick={handleAppleLogin}
                    disabled={loadingProvider !== null}
                    className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-medium"
                  >
                    {loadingProvider === "apple" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SiApple className="mr-2 h-4 w-4" />
                    )}
                    Continue with Apple
                  </Button>
                )}

                {providers?.facebook && (
                  <Button
                    onClick={handleFacebookLogin}
                    disabled={loadingProvider !== null}
                    className="w-full h-12 bg-[#1877F2] hover:bg-[#1565D8] text-white rounded-xl font-medium"
                  >
                    {loadingProvider === "facebook" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SiFacebook className="mr-2 h-4 w-4" />
                    )}
                    Continue with Facebook
                  </Button>
                )}
              </div>
            )}

            {/* Security badges */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Lock className="w-3.5 h-3.5" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Shield className="w-3.5 h-3.5" />
                <span>SOC 2</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500 mb-4">
              New to Twealth?{" "}
              <button onClick={() => setLocation("/")} className="text-white hover:underline">
                Learn more
              </button>
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-zinc-600">
              <span>Terms</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span>Privacy</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span>© 2026 Twealth</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
