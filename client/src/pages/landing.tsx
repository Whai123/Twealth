import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  Shield, 
  Check, 
  Brain, 
  Target, 
  Wallet, 
  TrendingUp,
  Sparkles,
  ArrowRight,
  Zap
} from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Clean Header */}
      <header className="border-b border-gray-100 dark:border-gray-900 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Twealth" className="w-8 h-8" />
            <span className="text-xl font-semibold text-black dark:text-white">Twealth</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleLogin}
              variant="ghost"
              className="text-sm font-medium hidden sm:flex"
              data-testid="header-signin-button"
            >
              Sign in
            </Button>
            <Button 
              onClick={handleLogin}
              size="sm"
              className="text-sm font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              data-testid="header-getstarted-button"
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-24 sm:pt-32 pb-20 text-center">
          <Badge 
            variant="outline" 
            className="mb-6 px-4 py-1.5 text-sm font-medium border-gray-200 dark:border-gray-800"
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            Powered by GPT-5 and Claude
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-black dark:text-white mb-6 max-w-4xl mx-auto leading-[1.05]">
            Financial intelligence
            <br />
            <span className="text-gray-400 dark:text-gray-500">for modern life</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track spending, set goals, and get CFO-level advice from AI. 
            Professional financial management made simple.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              onClick={handleLogin} 
              size="lg"
              className="h-14 px-8 text-base font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl"
              data-testid="hero-get-started-button"
            >
              Start for free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={() => window.location.href = "/pricing"}
              variant="outline" 
              size="lg"
              className="h-14 px-8 text-base font-medium border-gray-300 dark:border-gray-700 rounded-xl"
              data-testid="hero-view-pricing-button"
            >
              View pricing
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Bank-level security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-950/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">4</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">AI Models</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">11</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">99.9%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">$0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Setup fee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">
            Everything you need to manage your finances
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powerful tools designed to help you understand, track, and grow your wealth.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center mb-5">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">AI Financial Advisor</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Get personalized advice from GPT-5 and Claude. Ask anything about budgeting, investing, or financial planning.
            </p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center mb-5">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Smart Money Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Track income and expenses with automatic categorization. See exactly where your money goes each month.
            </p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950/50 flex items-center justify-center mb-5">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Goal Management</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Set financial goals and track your progress. Get AI-powered suggestions to achieve them faster.
            </p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mb-5">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Investment Insights</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Track stocks, crypto, and other investments. Get market data and AI-powered analysis.
            </p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">AI Playbooks</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Get weekly AI-generated financial reports with actionable insights and personalized recommendations.
            </p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center mb-5">
              <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Financial Health Score</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Get a comprehensive health score based on savings, debt, and goals. Know exactly where you stand.
            </p>
          </Card>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="border-t border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Start free, upgrade when you need more AI power
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-1">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-black dark:text-white">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  50 AI queries/month
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  Basic expense tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  Goal management
                </li>
              </ul>
              <Button 
                onClick={handleLogin}
                variant="outline" 
                className="w-full"
                data-testid="pricing-free-button"
              >
                Get started
              </Button>
            </Card>
            
            <Card className="p-6 bg-white dark:bg-black border-2 border-black dark:border-white relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black">
                Most popular
              </Badge>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-1">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-black dark:text-white">$9.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  Unlimited Scout queries
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  25 Sonnet queries/month
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  5 GPT-5 math queries
                </li>
              </ul>
              <Button 
                onClick={handleLogin}
                className="w-full bg-black dark:bg-white text-white dark:text-black"
                data-testid="pricing-pro-button"
              >
                Start Pro trial
              </Button>
            </Card>
            
            <Card className="p-6 bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-1">Enterprise</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-black dark:text-white">$49.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  20 Opus CFO queries
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  Priority support
                </li>
              </ul>
              <Button 
                onClick={handleLogin}
                variant="outline" 
                className="w-full"
                data-testid="pricing-enterprise-button"
              >
                Contact sales
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-6">
          Ready to take control?
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Join thousands of people who use Twealth to manage their finances smarter.
        </p>
        <Button 
          onClick={handleLogin} 
          size="lg"
          className="h-14 px-8 text-base font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl"
          data-testid="cta-get-started-button"
        >
          Get started free
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/ai-assistant" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">AI Advisor</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Features</h4>
              <ul className="space-y-3">
                <li><a href="/financial-goals" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Goals</a></li>
                <li><a href="/money-tracking" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Money Tracking</a></li>
                <li><a href="/playbooks" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">AI Playbooks</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><a href="/investment-intelligence" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Investments</a></li>
                <li><a href="/calendar" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Calendar</a></li>
                <li><a href="/settings" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Settings</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><span className="text-sm text-gray-500 cursor-default">Privacy Policy</span></li>
                <li><span className="text-sm text-gray-500 cursor-default">Terms of Service</span></li>
                <li><span className="text-sm text-gray-500 cursor-default">Cookie Policy</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 dark:border-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Twealth" className="w-6 h-6" />
              <span className="text-sm text-gray-600 dark:text-gray-400">2025 Twealth. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              <span>SOC 2 Type II Certified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
