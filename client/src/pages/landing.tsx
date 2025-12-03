import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { 
  Shield, 
  Check, 
  Brain, 
  Target, 
  Wallet, 
  TrendingUp,
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  Globe,
  MessageSquare,
  ChevronRight,
  BarChart3,
  PiggyBank
} from "lucide-react";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";
import { useUserCurrency } from "@/lib/userContext";

function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}

function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setCount(value);
      return;
    }
    if (isInView) {
      const duration = 2000;
      const steps = 60;
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
  }, [isInView, value, prefersReducedMotion]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

function FloatingElement({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-10, 10, -10] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { formatAmount, convertFromUSD } = useUserCurrency();

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/15 dark:bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[150px]" />
      </div>

      {/* Header with Glassmorphism */}
      <header className="border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-black/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md" />
              <img src={logoUrl} alt="Twealth" className="w-9 h-9 relative" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Twealth</span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button 
              onClick={() => setLocation("/login")}
              variant="ghost"
              className="text-sm font-medium hidden sm:flex hover:bg-blue-50 dark:hover:bg-blue-950/50"
              data-testid="header-signin-button"
            >
              {t('landing.header.signIn')}
            </Button>
            <Button 
              onClick={() => setLocation("/login")}
              size="sm"
              className="text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 border-0"
              data-testid="header-getstarted-button"
            >
              {t('landing.header.getStarted')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div 
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Badge 
                  className="mb-6 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-300"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('landing.hero.badge')}
                </Badge>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                  {t('landing.hero.title')}
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  {t('landing.hero.titleHighlight')}
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Button 
                  onClick={() => setLocation("/login")} 
                  size="lg"
                  className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-xl shadow-blue-500/30 border-0 group"
                  data-testid="hero-get-started-button"
                >
                  {t('landing.hero.startFree')}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  onClick={() => setLocation("/subscription")}
                  variant="outline" 
                  size="lg"
                  className="h-14 px-8 text-base font-medium border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 rounded-xl transition-all"
                  data-testid="hero-view-pricing-button"
                >
                  {t('landing.hero.viewPricing')}
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span>{t('landing.hero.freeForever')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span>{t('landing.hero.noCreditCard')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>{t('landing.hero.bankSecurity')}</span>
                </div>
              </div>
            </motion.div>

            {/* Right - AI Preview Mockup */}
            <motion.div 
              className="relative hidden lg:block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
              
              {/* Main Card */}
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-6 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">AI Financial Advisor</div>
                    <div className="text-xs text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Online
                    </div>
                  </div>
                </div>

                {/* Chat Preview */}
                <div className="space-y-4 mb-6">
                  <FloatingElement delay={0}>
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md max-w-[80%] text-sm shadow-lg">
                        How can I save more money this month?
                      </div>
                    </div>
                  </FloatingElement>
                  
                  <FloatingElement delay={0.5}>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-md max-w-[85%]">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Based on your spending patterns, here are 3 actionable steps:
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">1</span>
                            </div>
                            Reduce dining out by 20%
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">2</span>
                            </div>
                            Cancel unused subscriptions
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">3</span>
                            </div>
                            Set up automatic savings
                          </div>
                        </div>
                      </div>
                    </div>
                  </FloatingElement>
                </div>

                {/* Input */}
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-400 flex-1">Ask your AI CFO anything...</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Floating Stats */}
                <FloatingElement delay={1} className="absolute -right-4 top-20">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Savings</div>
                        <div className="text-sm font-bold text-green-600">+23%</div>
                      </div>
                    </div>
                  </div>
                </FloatingElement>

                <FloatingElement delay={1.5} className="absolute -left-4 bottom-24">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Health Score</div>
                        <div className="text-sm font-bold text-blue-600">85/100</div>
                      </div>
                    </div>
                  </div>
                </FloatingElement>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section with Animation */}
      <section className="relative py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                <AnimatedCounter value={4} />
              </div>
              <div className="text-blue-100 text-sm font-medium">{t('landing.stats.aiModels')}</div>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                <AnimatedCounter value={11} />
              </div>
              <div className="text-blue-100 text-sm font-medium">{t('landing.stats.languages')}</div>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                <AnimatedCounter value={99} suffix="%" />
              </div>
              <div className="text-blue-100 text-sm font-medium">{t('landing.stats.uptime')}</div>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {formatAmount(convertFromUSD(0))}
              </div>
              <div className="text-blue-100 text-sm font-medium">{t('landing.stats.setupFee')}</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Glass Cards */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { icon: Brain, title: t('landing.features.aiAdvisor.title'), desc: t('landing.features.aiAdvisor.description'), gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/10" },
              { icon: Wallet, title: t('landing.features.smartTracking.title'), desc: t('landing.features.smartTracking.description'), gradient: "from-purple-500 to-purple-600", bg: "bg-purple-500/10" },
              { icon: Target, title: t('landing.features.goalManagement.title'), desc: t('landing.features.goalManagement.description'), gradient: "from-green-500 to-green-600", bg: "bg-green-500/10" },
              { icon: TrendingUp, title: t('landing.features.investmentInsights.title'), desc: t('landing.features.investmentInsights.description'), gradient: "from-amber-500 to-orange-600", bg: "bg-amber-500/10" },
              { icon: Zap, title: t('landing.features.aiPlaybooks.title'), desc: t('landing.features.aiPlaybooks.description'), gradient: "from-rose-500 to-pink-600", bg: "bg-rose-500/10" },
              { icon: PiggyBank, title: t('landing.features.healthScore.title'), desc: t('landing.features.healthScore.description'), gradient: "from-cyan-500 to-teal-600", bg: "bg-cyan-500/10" },
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="group relative p-6 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                      {feature.desc}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gray-50/50 dark:bg-gray-950/50 border-y border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-gray-700 dark:text-gray-300">256-bit Encryption</div>
                <div className="text-xs">Bank-level security</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-gray-700 dark:text-gray-300">SOC 2 Compliant</div>
                <div className="text-xs">Enterprise security</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-gray-700 dark:text-gray-300">11 Languages</div>
                <div className="text-xs">Global support</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('landing.pricing.subtitle')}
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Free Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="relative p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-lg h-full">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('landing.pricing.free.name')}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{formatAmount(convertFromUSD(0))}</span>
                    <span className="text-gray-500">{t('landing.pricing.perMonth')}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    {t('landing.pricing.free.aiQueries')}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    {t('landing.pricing.free.expenseTracking')}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    {t('landing.pricing.free.goalManagement')}
                  </li>
                </ul>
                <Button 
                  onClick={() => setLocation("/login")}
                  variant="outline" 
                  className="w-full h-12 border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  data-testid="pricing-free-button"
                >
                  {t('landing.pricing.free.button')}
                </Button>
              </Card>
            </motion.div>
            
            {/* Pro Plan - Featured */}
            <motion.div variants={fadeInUp}>
              <Card className="relative p-6 bg-gradient-to-b from-blue-600 to-blue-700 border-0 shadow-2xl shadow-blue-500/30 h-full overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
                <Badge className="absolute top-4 right-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {t('landing.pricing.pro.badge')}
                </Badge>
                <div className="relative mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{t('landing.pricing.pro.name')}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{formatAmount(convertFromUSD(9.99))}</span>
                    <span className="text-blue-200">{t('landing.pricing.perMonth')}</span>
                  </div>
                </div>
                <ul className="relative space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-white/90">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    {t('landing.pricing.pro.scoutQueries')}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/90">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    {t('landing.pricing.pro.sonnetQueries')}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/90">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    {t('landing.pricing.pro.gptQueries')}
                  </li>
                </ul>
                <Button 
                  onClick={() => setLocation("/login")}
                  className="relative w-full h-12 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                  data-testid="pricing-pro-button"
                >
                  {t('landing.pricing.pro.button')}
                </Button>
              </Card>
            </motion.div>
            
            {/* Enterprise Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="relative p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-lg h-full">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('landing.pricing.enterprise.name')}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{formatAmount(convertFromUSD(49.99))}</span>
                    <span className="text-gray-500">{t('landing.pricing.perMonth')}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    {t('landing.pricing.enterprise.everythingInPro')}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    {t('landing.pricing.enterprise.opusQueries')}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    {t('landing.pricing.enterprise.prioritySupport')}
                  </li>
                </ul>
                <Button 
                  onClick={() => setLocation("/login")}
                  variant="outline" 
                  className="w-full h-12 border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  data-testid="pricing-enterprise-button"
                >
                  {t('landing.pricing.enterprise.button')}
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        
        <motion.div 
          className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <Button 
            onClick={() => setLocation("/login")} 
            size="lg"
            className="h-14 px-10 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 rounded-xl shadow-2xl group"
            data-testid="cta-get-started-button"
          >
            {t('landing.cta.button')}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-3">
                <li><Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('landing.footer.dashboard')}</Link></li>
                <li><Link href="/subscription" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('landing.footer.pricing')}</Link></li>
                <li><Link href="/ai-assistant" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('landing.footer.aiAdvisor')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('landing.footer.features')}</h4>
              <ul className="space-y-3">
                <li><Link href="/financial-goals" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('landing.footer.goals')}</Link></li>
                <li><Link href="/money-tracking" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('landing.footer.moneyTracking')}</Link></li>
                <li><Link href="/playbooks" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('landing.footer.aiPlaybooks')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('landing.footer.resources')}</h4>
              <ul className="space-y-3">
                <li><Link href="/investments" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('landing.footer.investments')}</Link></li>
                <li><Link href="/calendar" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('landing.footer.calendar')}</Link></li>
                <li><Link href="/settings" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('landing.footer.settings')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('landing.footer.legal')}</h4>
              <ul className="space-y-3">
                <li><span className="text-sm text-gray-500 cursor-default">{t('landing.footer.privacyPolicy')}</span></li>
                <li><span className="text-sm text-gray-500 cursor-default">{t('landing.footer.termsOfService')}</span></li>
                <li><span className="text-sm text-gray-500 cursor-default">{t('landing.footer.cookiePolicy')}</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 dark:border-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Twealth" className="w-6 h-6" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('landing.footer.copyright')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              <span>{t('landing.footer.socCertified')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
