import { useEffect } from"react";
import { useLocation } from"wouter";
import { Button } from"@/components/ui/button";
import { Separator } from"@/components/ui/separator";
import { SiGoogle, SiFacebook, SiApple } from"react-icons/si";
import logoUrl from"@assets/5-removebg-preview_1761660874225.png";

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
  // Force immediate redirect using location.assign for better compatibility
  window.location.assign("/api/auth/google");
 };

 const handleFacebookLogin = () => {
  window.location.assign("/api/auth/facebook");
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
  <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
   <div className="w-full max-w-md">
    {/* Logo and Header */}
    <div className="text-center mb-12">
     <div className="inline-flex items-center justify-center mb-6">
      <img 
       src={logoUrl} 
       alt="Twealth" 
       className="w-16 h-16 object-contain"
      />
     </div>
     <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">
      Sign in to Twealth
     </h1>
     <p className="text-slate-600 dark:text-slate-400">
      Manage your finances with AI-powered insights
     </p>
    </div>

    {/* Login Card */}
    <div 
     className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900"
     style={{ transition: 'none', transform: 'none' }}
    >
     <div className="p-8 space-y-4">
      {/* Social Login Buttons */}
      <Button
       onClick={handleGoogleLogin}
       variant="outline"
       className="w-full h-12 font-medium border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white"
       style={{ transition: 'none', transform: 'none' }}
       data-testid="button-google-login"
      >
       <SiGoogle className="mr-3 h-4 w-4" />
       Continue with Google
      </Button>

      <Button
       onClick={handleAppleLogin}
       variant="outline"
       className="w-full h-12 font-medium border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white"
       style={{ transition: 'none', transform: 'none' }}
       data-testid="button-apple-login"
      >
       <SiApple className="mr-3 h-4 w-4" />
       Continue with Apple
      </Button>

      <Button
       onClick={handleFacebookLogin}
       variant="outline"
       className="w-full h-12 font-medium border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white"
       style={{ transition: 'none', transform: 'none' }}
       data-testid="button-facebook-login"
      >
       <SiFacebook className="mr-3 h-4 w-4 text-[#1877F2]" />
       Continue with Facebook
      </Button>

      <div className="relative my-6">
       <div className="absolute inset-0 flex items-center">
        <Separator className="w-full" />
       </div>
       <div className="relative flex justify-center text-xs">
        <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">
         Secure authentication
        </span>
       </div>
      </div>

      {/* Security Info */}
      <div className="space-y-2 pt-2">
       <p className="text-sm text-slate-600 dark:text-slate-400">
        • Bank-level 256-bit encryption
       </p>
       <p className="text-sm text-slate-600 dark:text-slate-400">
        • Your data is never shared or sold
       </p>
       <p className="text-sm text-slate-600 dark:text-slate-400">
        • SOC 2 and GDPR compliant
       </p>
      </div>
     </div>
    </div>

    {/* Footer */}
    <div className="mt-8 space-y-6">
     <p className="text-center text-sm text-slate-600 dark:text-slate-400">
      New to Twealth?{""}
      <button
       onClick={() => setLocation("/welcome")}
       className="text-slate-900 dark:text-white font-medium hover:underline"
       data-testid="link-learn-more"
      >
       Learn more
      </button>
     </p>

     <div className="text-center text-xs text-slate-500">
      <a href="/terms" className="hover:text-slate-900 dark:hover:text-white" data-testid="link-terms">
       Terms
      </a>
      {" ·"}
      <a href="/privacy" className="hover:text-slate-900 dark:hover:text-white" data-testid="link-privacy">
       Privacy
      </a>
      {" ·"}
      <span>© 2025 Twealth</span>
     </div>
    </div>
   </div>
  </div>
 );
}
