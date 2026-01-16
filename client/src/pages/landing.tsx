import { Button } from "../components/ui/button";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  Shield, Check, Brain, Target, Wallet, TrendingUp, Sparkles,
  ArrowRight, Zap, ChevronRight, BarChart3, PiggyBank, Play
} from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";
import { useUserCurrency } from "@/lib/userContext";

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 1500;
      const steps = 40;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { formatAmount, convertFromUSD } = useUserCurrency();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-100/50 dark:from-blue-900/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <img src={logoUrl} alt="Twealth" className="w-9 h-9" />
            <span className="text-xl font-bold text-zinc-900 dark:text-white">Twealth</span>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              onClick={() => setLocation("/login")}
              variant="ghost"
              className="text-sm font-medium hidden sm:flex"
            >
              Sign in
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-full h-10 px-5 text-sm font-medium"
            >
              Get Started <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 md:pt-32 pb-20 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4" />
              Your AI-Powered Financial Assistant
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6 leading-[1.1]">
              Transform Time
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 bg-clip-text text-transparent">
                Into Wealth
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Get personalized financial advice from AI that understands your goals.
              Track spending, build savings, and grow your wealth.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => setLocation("/login")}
                size="lg"
                className="h-14 px-8 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/25 group"
              >
                Start Free <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => setLocation("/subscription")}
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg font-medium border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <Play className="w-5 h-5 mr-2" /> Watch Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
              {["Free forever plan", "No credit card required", "Bank-level security"].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Visual - App Preview */}
          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-violet-500/10 rounded-3xl blur-3xl" />
            <div className="relative bg-zinc-100 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-2 md:p-4 shadow-2xl">
              <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 md:p-10">
                {/* Mock Dashboard */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Total Balance", value: "$24,580", change: "+12%", color: "emerald" },
                    { label: "Monthly Savings", value: "$1,240", change: "+8%", color: "blue" },
                    { label: "Twealth Score", value: "85", change: "Great", color: "violet" },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</span>
                        <span className={`text-sm font-medium text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* AI Chat Preview */}
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Based on your spending, you could save <span className="font-semibold text-blue-600">$340/month</span> by
                      reducing dining expenses by 20%. Want me to create a savings plan?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {[
              { value: 4, label: "AI Models", suffix: "" },
              { value: 11, label: "Languages", suffix: "" },
              { value: 99, label: "Uptime", suffix: "%" },
              { value: 0, label: "Setup Fee", suffix: "", prefix: "$" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-1">
                  {stat.prefix}<AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              Everything you need to build wealth
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
              Powerful features designed to help you take control of your finances
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "AI Financial Advisor", desc: "Get personalized advice from AI that learns your financial habits and goals", color: "blue" },
              { icon: Wallet, title: "Smart Tracking", desc: "Automatically categorize transactions and track spending patterns", color: "violet" },
              { icon: Target, title: "Goal Setting", desc: "Set savings goals and get AI-powered tips to reach them faster", color: "emerald" },
              { icon: TrendingUp, title: "Investment Insights", desc: "Monitor investments and get data-driven recommendations", color: "amber" },
              { icon: BarChart3, title: "Financial Score", desc: "Track your financial health with our proprietary Twealth Score", color: "rose" },
              { icon: PiggyBank, title: "Auto Savings", desc: "Set up automatic savings rules based on your spending patterns", color: "cyan" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="group p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-lg transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400">
              Start free, upgrade when you need more
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Free", price: "$0", desc: "Perfect for getting started", features: ["20 AI queries/month", "Basic expense tracking", "3 savings goals"], cta: "Start Free", primary: false },
              { name: "Pro", price: "$10", desc: "For serious savers", features: ["Unlimited AI queries", "Advanced analytics", "Unlimited goals", "Priority support"], cta: "Upgrade to Pro", primary: true },
              { name: "Enterprise", price: "$50", desc: "For power users", features: ["Everything in Pro", "CFO-level AI", "API access", "White-glove support"], cta: "Contact Sales", primary: false },
            ].map((plan, i) => (
              <motion.div
                key={i}
                className={`relative p-6 rounded-2xl ${plan.primary
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/25'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800'
                  }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                {plan.primary && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-blue-600 text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-1 ${plan.primary ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>{plan.name}</h3>
                  <p className={`text-sm ${plan.primary ? 'text-blue-100' : 'text-zinc-500'}`}>{plan.desc}</p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${plan.primary ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>{plan.price}</span>
                  <span className={plan.primary ? 'text-blue-100' : 'text-zinc-500'}>/mo</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 ${plan.primary ? 'text-blue-200' : 'text-emerald-500'}`} />
                      <span className={plan.primary ? 'text-blue-50' : 'text-zinc-600 dark:text-zinc-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => setLocation("/login")}
                  className={`w-full rounded-xl h-11 font-medium ${plan.primary
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    }`}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
              Ready to take control of your finances?
            </h2>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-10">
              Join thousands of people building their financial future with AI
            </p>
            <Button
              onClick={() => setLocation("/login")}
              size="lg"
              className="h-14 px-10 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/25 group"
            >
              Get Started Free <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="Twealth" className="w-6 h-6" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">© 2026 Twealth. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs">
                <Shield className="w-3.5 h-3.5" />
                SOC 2 Certified
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
