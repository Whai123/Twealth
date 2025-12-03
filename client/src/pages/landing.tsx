import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
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
import { useUserCurrency } from "@/lib/userContext";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { formatAmount, convertFromUSD } = useUserCurrency();

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
              onClick={() => setLocation("/login")}
              variant="ghost"
              className="text-sm font-medium hidden sm:flex"
              data-testid="header-signin-button"
            >
              {t('landing.header.signIn')}
            </Button>
            <Button 
              onClick={() => setLocation("/login")}
              size="sm"
              className="text-sm font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              data-testid="header-getstarted-button"
            >
              {t('landing.header.getStarted')}
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
            {t('landing.hero.badge')}
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-black dark:text-white mb-6 max-w-4xl mx-auto leading-[1.05]">
            {t('landing.hero.title')}
            <br />
            <span className="text-gray-400 dark:text-gray-500">{t('landing.hero.titleHighlight')}</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              onClick={() => setLocation("/login")} 
              size="lg"
              className="h-14 px-8 text-base font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl"
              data-testid="hero-get-started-button"
            >
              {t('landing.hero.startFree')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={() => setLocation("/subscription")}
              variant="outline" 
              size="lg"
              className="h-14 px-8 text-base font-medium border-gray-300 dark:border-gray-700 rounded-xl"
              data-testid="hero-view-pricing-button"
            >
              {t('landing.hero.viewPricing')}
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>{t('landing.hero.freeForever')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>{t('landing.hero.noCreditCard')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>{t('landing.hero.bankSecurity')}</span>
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
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('landing.stats.aiModels')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">11</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('landing.stats.languages')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">99.9%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('landing.stats.uptime')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">{formatAmount(convertFromUSD(0))}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('landing.stats.setupFee')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">
            {t('landing.features.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center mb-5">
              <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">{t('landing.features.aiAdvisor.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('landing.features.aiAdvisor.description')}
            </p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center mb-5">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">{t('landing.features.smartTracking.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('landing.features.smartTracking.description')}
            </p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950/50 flex items-center justify-center mb-5">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">{t('landing.features.goalManagement.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('landing.features.goalManagement.description')}
            </p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mb-5">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">{t('landing.features.investmentInsights.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('landing.features.investmentInsights.description')}
            </p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">{t('landing.features.aiPlaybooks.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('landing.features.aiPlaybooks.description')}
            </p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-950/50 flex items-center justify-center mb-5">
              <Shield className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">{t('landing.features.healthScore.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('landing.features.healthScore.description')}
            </p>
          </Card>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="border-t border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('landing.pricing.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{t('landing.pricing.free.name')}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-black dark:text-white">{formatAmount(convertFromUSD(0))}</span>
                  <span className="text-gray-500">{t('landing.pricing.perMonth')}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  {t('landing.pricing.free.aiQueries')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  {t('landing.pricing.free.expenseTracking')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  {t('landing.pricing.free.goalManagement')}
                </li>
              </ul>
              <Button 
                onClick={() => setLocation("/login")}
                variant="outline" 
                className="w-full"
                data-testid="pricing-free-button"
              >
                {t('landing.pricing.free.button')}
              </Button>
            </Card>
            
            <Card className="p-6 bg-white dark:bg-black border-2 border-black dark:border-white relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black">
                {t('landing.pricing.pro.badge')}
              </Badge>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{t('landing.pricing.pro.name')}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-black dark:text-white">{formatAmount(convertFromUSD(9.99))}</span>
                  <span className="text-gray-500">{t('landing.pricing.perMonth')}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  {t('landing.pricing.pro.scoutQueries')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  {t('landing.pricing.pro.sonnetQueries')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  {t('landing.pricing.pro.gptQueries')}
                </li>
              </ul>
              <Button 
                onClick={() => setLocation("/login")}
                className="w-full bg-black dark:bg-white text-white dark:text-black"
                data-testid="pricing-pro-button"
              >
                {t('landing.pricing.pro.button')}
              </Button>
            </Card>
            
            <Card className="p-6 bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{t('landing.pricing.enterprise.name')}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-black dark:text-white">{formatAmount(convertFromUSD(49.99))}</span>
                  <span className="text-gray-500">{t('landing.pricing.perMonth')}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  {t('landing.pricing.enterprise.everythingInPro')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  {t('landing.pricing.enterprise.opusQueries')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-600" />
                  {t('landing.pricing.enterprise.prioritySupport')}
                </li>
              </ul>
              <Button 
                onClick={() => setLocation("/login")}
                variant="outline" 
                className="w-full"
                data-testid="pricing-enterprise-button"
              >
                {t('landing.pricing.enterprise.button')}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-6">
          {t('landing.cta.title')}
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          {t('landing.cta.subtitle')}
        </p>
        <Button 
          onClick={() => setLocation("/login")} 
          size="lg"
          className="h-14 px-8 text-base font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl"
          data-testid="cta-get-started-button"
        >
          {t('landing.cta.button')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-3">
                <li><Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t('landing.footer.dashboard')}</Link></li>
                <li><Link href="/subscription" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t('landing.footer.pricing')}</Link></li>
                <li><Link href="/ai-assistant" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t('landing.footer.aiAdvisor')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">{t('landing.footer.features')}</h4>
              <ul className="space-y-3">
                <li><Link href="/financial-goals" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t('landing.footer.goals')}</Link></li>
                <li><Link href="/money-tracking" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t('landing.footer.moneyTracking')}</Link></li>
                <li><Link href="/playbooks" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t('landing.footer.aiPlaybooks')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">{t('landing.footer.resources')}</h4>
              <ul className="space-y-3">
                <li><Link href="/investments" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t('landing.footer.investments')}</Link></li>
                <li><Link href="/calendar" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t('landing.footer.calendar')}</Link></li>
                <li><Link href="/settings" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t('landing.footer.settings')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-white mb-4">{t('landing.footer.legal')}</h4>
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
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              <span>{t('landing.footer.socCertified')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
