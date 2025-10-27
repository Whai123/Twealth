import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Brain, Calendar, Target, TrendingUp, Zap, Shield, Users, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761578659737.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center mb-8 transform hover:scale-105 transition-transform duration-300" aria-label="Twealth Logo">
            <img src={logoUrl} alt="Twealth Logo" className="w-24 h-24 md:w-32 md:h-32" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Transform Time Into Wealth
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Your all-in-one platform for <span className="font-semibold text-blue-600 dark:text-blue-400">smart financial management</span>, 
            schedule optimization, and <span className="font-semibold text-purple-600 dark:text-purple-400">AI-powered insights</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              onClick={handleLogin} 
              size="lg"
              className="h-14 px-8 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="hero-login-button"
              aria-label="Get started with Twealth"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="h-14 px-8 text-lg font-semibold border-2"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label="Learn more about features"
            >
              Learn More
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            Secure authentication • No credit card required
          </p>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 scroll-mt-20">
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200 dark:hover:border-blue-800" data-testid="feature-ai">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <CardTitle className="text-xl font-bold">AI Financial Advisor</CardTitle>
              <CardDescription className="text-base">
                Get personalized financial advice powered by advanced AI. Smart recommendations tailored to your goals and spending patterns.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-purple-200 dark:hover:border-purple-800" data-testid="feature-goals">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <CardTitle className="text-xl font-bold">Smart Goal Tracking</CardTitle>
              <CardDescription className="text-base">
                Set financial goals and track progress automatically. Get AI-powered suggestions to achieve them faster.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-indigo-200 dark:hover:border-indigo-800" data-testid="feature-schedule">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <CardTitle className="text-xl font-bold">Schedule Management</CardTitle>
              <CardDescription className="text-base">
                Organize events, set reminders, and integrate with your calendar. Never miss a financial deadline.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-green-200 dark:hover:border-green-800" data-testid="feature-tracking">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <CardTitle className="text-xl font-bold">Money Tracking</CardTitle>
              <CardDescription className="text-base">
                Track income, expenses, and investments in real-time. Multi-currency support with live exchange rates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-orange-200 dark:hover:border-orange-800" data-testid="feature-analytics">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <CardTitle className="text-xl font-bold">Financial Analytics</CardTitle>
              <CardDescription className="text-base">
                Visualize spending patterns, track budgets, and get insights into your financial health score.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-pink-200 dark:hover:border-pink-800" data-testid="feature-collaboration">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <CardTitle className="text-xl font-bold">Team Collaboration</CardTitle>
              <CardDescription className="text-base">
                Create groups for family budgets or shared expenses. Collaborate on financial goals together.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border-2 border-white/20 shadow-xl mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2" data-testid="stat-time-value">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Time = Money
              </div>
              <p className="text-muted-foreground text-lg">Track your time value and optimize earnings</p>
            </div>
            <div className="space-y-2" data-testid="stat-ai-powered">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                <Brain className="w-12 h-12 mx-auto mb-2 text-purple-600" />
                AI-Powered
              </div>
              <p className="text-muted-foreground text-lg">Advanced AI for smarter financial decisions</p>
            </div>
            <div className="space-y-2" data-testid="stat-secure">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                <Shield className="w-12 h-12 mx-auto mb-2 text-green-600" />
                100% Secure
              </div>
              <p className="text-muted-foreground text-lg">Bank-level security for your financial data</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-600 to-purple-600 border-0 shadow-2xl">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Financial Future?
              </h2>
              <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
                Join thousands of users who are already taking control of their finances with AI-powered insights and smart management tools.
              </p>
              <Button 
                onClick={handleLogin} 
                size="lg"
                variant="secondary"
                className="h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 bg-white text-blue-600 hover:bg-gray-100"
                data-testid="cta-login-button"
                aria-label="Get started with Twealth now"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>© 2025 Twealth. Transform time into wealth with smart financial management.</p>
        </footer>
      </div>
    </div>
  );
}
