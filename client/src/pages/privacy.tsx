import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/5-removebg-preview_1761748275134.png";

export default function Privacy() {
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
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-400 text-lg mb-8">
            Last updated: November 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We collect information you provide directly, including:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Account information (name, email) from OAuth providers</li>
              <li>Financial data you input (transactions, goals, budgets)</li>
              <li>Preferences and settings you configure</li>
              <li>Communications with our AI assistant</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Provide and personalize our financial management services</li>
              <li>Generate AI-powered insights and recommendations</li>
              <li>Process payments and manage subscriptions</li>
              <li>Improve our services and develop new features</li>
              <li>Communicate with you about your account and updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Security</h2>
            <p className="text-slate-300 leading-relaxed">
              We implement industry-standard security measures to protect your data, including 
              256-bit encryption for data in transit and at rest, secure authentication via 
              OAuth providers, and regular security audits. Your financial data is never sold 
              to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Service providers who assist in operating our platform (e.g., Stripe for payments)</li>
              <li>AI providers for generating financial insights (data is anonymized where possible)</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies and Tracking</h2>
            <p className="text-slate-300 leading-relaxed">
              We use essential cookies for authentication and session management. We do not use 
              third-party advertising trackers. Analytics data is collected in aggregate form 
              to improve our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p className="text-slate-300 leading-relaxed">
              We retain your data for as long as your account is active. Upon account deletion, 
              your personal data will be removed within 30 days, except where retention is 
              required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. International Users</h2>
            <p className="text-slate-300 leading-relaxed">
              Twealth is designed to serve users globally. We comply with GDPR for European 
              users and other applicable data protection regulations. Data may be processed 
              in the United States with appropriate safeguards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact</h2>
            <p className="text-slate-300 leading-relaxed">
              For privacy-related inquiries or to exercise your rights, please contact us at 
              privacy@twealth.ltd
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
