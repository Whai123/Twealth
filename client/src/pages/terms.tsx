import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-3"
          >
            <img src={logoUrl} alt="Twealth" className="w-8 h-8" />
            <span className="text-xl font-semibold text-white">Twealth</span>
          </button>
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-slate-400 hover:text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-400 text-lg mb-8">
            Last updated: November 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              By accessing or using Twealth, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-slate-300 leading-relaxed">
              Twealth provides AI-powered financial management tools, including budget tracking, 
              goal setting, and financial insights. Our service is designed to help you make 
              informed financial decisions but does not constitute financial advice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <p className="text-slate-300 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account. You agree to notify us 
              immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription and Billing</h2>
            <p className="text-slate-300 leading-relaxed">
              Some features require a paid subscription. By subscribing, you agree to pay the 
              applicable fees. Subscriptions auto-renew unless cancelled. You may cancel your 
              subscription at any time through your account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Disclaimer</h2>
            <p className="text-slate-300 leading-relaxed">
              Twealth is not a registered financial advisor, broker, or dealer. The information 
              provided is for educational and informational purposes only. Always consult with 
              a qualified financial professional before making financial decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <p className="text-slate-300 leading-relaxed">
              Twealth shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages arising from your use of the service or any financial decisions 
              made based on information provided by the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of 
              significant changes via email or through the application. Continued use of the 
              service after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
            <p className="text-slate-300 leading-relaxed">
              For questions about these Terms of Service, please contact us at support@twealth.ltd
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Twealth" className="w-6 h-6" />
            <span className="text-sm text-slate-500">2025 Twealth</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <button 
              onClick={() => setLocation("/terms")}
              className="hover:text-slate-300 transition-colors"
            >
              Terms
            </button>
            <button 
              onClick={() => setLocation("/privacy")}
              className="hover:text-slate-300 transition-colors"
            >
              Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
