import { Button } from "../components/ui/button";
import { Shield, Check } from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Clean Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Twealth" className="w-8 h-8" />
            <span className="text-xl font-semibold text-black dark:text-white">Twealth</span>
          </div>
          <Button 
            onClick={handleLogin}
            variant="ghost"
            className="text-sm font-medium"
            data-testid="header-signin-button"
          >
            Sign in
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-black dark:text-white mb-6 max-w-4xl mx-auto leading-[1.1]">
          Financial intelligence for modern life
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Professional financial management with AI-powered insights. Track spending, set goals, and get CFO-level advice.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            onClick={handleLogin} 
            size="lg"
            className="h-12 px-6 text-base font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            data-testid="hero-get-started-button"
          >
            Get started
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Shield className="w-4 h-4" />
          <span>Enterprise-grade security • Free to start</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-gray-200 dark:border-gray-800">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">AI Financial Advisor</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Get personalized financial advice powered by advanced AI. Smart recommendations tailored to your goals.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Smart Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Track income, expenses, and investments in real-time with automatic categorization and insights.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Goal Management</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Set financial goals and track progress automatically with AI-powered suggestions to achieve them faster.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-semibold text-black dark:text-white mb-12 text-center">Built for trust</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-black dark:text-white font-semibold mb-2">Bank-level security</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your data is encrypted and secure
              </p>
            </div>
            <div className="text-center">
              <div className="text-black dark:text-white font-semibold mb-2">Privacy first</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We never sell your information
              </p>
            </div>
            <div className="text-center">
              <div className="text-black dark:text-white font-semibold mb-2">Always available</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                99.9% uptime guarantee
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 text-center border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-4xl font-semibold text-black dark:text-white mb-6">
          Start managing your finances today
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Join thousands taking control of their financial future
        </p>
        <Button 
          onClick={handleLogin} 
          size="lg"
          className="h-12 px-6 text-base font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          data-testid="cta-get-started-button"
        >
          Get started free
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Features</a></li>
                <li><a href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">About</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Blog</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Terms</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Twealth" className="w-6 h-6" />
              <span className="text-sm text-gray-600 dark:text-gray-400">© 2025 Twealth. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Shield className="w-3 h-3" />
              <span>SOC 2 Type II Certified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
