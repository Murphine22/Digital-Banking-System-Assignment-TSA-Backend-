import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield, Zap, Users, TrendingUp, Lock, CheckCircle2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import AdminDashboard from "@/components/AdminDashboard";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  // If authenticated, show the admin dashboard
  if (isAuthenticated && user) {
    return <AdminDashboard />;
  }

  // Otherwise show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-950 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white">
              PB
            </div>
            <h1 className="text-2xl font-bold text-white">Phoenix Bank</h1>
          </div>
          <a
            href={getLoginUrl()}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Modern Banking for the Digital Age
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Experience seamless financial operations with our cutting-edge digital banking platform powered by NIBSS integration.
            </p>
            <div className="flex gap-4">
              <a
                href={getLoginUrl()}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                Get Started <ArrowRight size={20} />
              </a>
              <button className="px-8 py-3 border border-slate-600 hover:border-slate-500 text-white rounded-lg font-semibold transition-colors">
                Learn More
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-2xl blur-3xl opacity-20"></div>
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <CheckCircle2 className="text-emerald-400" size={20} />
                  <span className="text-white">Instant Account Creation</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <CheckCircle2 className="text-emerald-400" size={20} />
                  <span className="text-white">Secure BVN/NIN Verification</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <CheckCircle2 className="text-emerald-400" size={20} />
                  <span className="text-white">Real-time Fund Transfers</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <CheckCircle2 className="text-emerald-400" size={20} />
                  <span className="text-white">Complete Transaction History</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-4xl font-bold text-white mb-12 text-center">Powerful Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Shield}
            title="Secure Identity Verification"
            description="Advanced BVN and NIN verification with NIBSS integration for maximum security"
          />
          <FeatureCard
            icon={Zap}
            title="Lightning-Fast Transfers"
            description="Intra-bank and inter-bank transfers processed instantly with real-time status tracking"
          />
          <FeatureCard
            icon={Users}
            title="Customer Management"
            description="Complete customer lifecycle management from onboarding to transaction history"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Real-time Analytics"
            description="Monitor account balances, transaction volumes, and banking metrics in real-time"
          />
          <FeatureCard
            icon={Lock}
            title="Data Privacy"
            description="Strict data isolation ensures customers only access their own transaction records"
          />
          <FeatureCard
            icon={CheckCircle2}
            title="Compliance Ready"
            description="Built-in compliance with Nigerian banking regulations and NIBSS standards"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-4xl font-bold text-white mb-12 text-center">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StepCard
            number="1"
            title="Onboard Fintech"
            description="Register your fintech institution with NIBSS Phoenix API"
          />
          <StepCard
            number="2"
            title="Verify Identity"
            description="Validate customer BVN or NIN through secure NIBSS verification"
          />
          <StepCard
            number="3"
            title="Create Account"
            description="Instantly create bank accounts with NGN 15,000 initial balance"
          />
          <StepCard
            number="4"
            title="Start Banking"
            description="Enable customers to perform transfers and manage their accounts"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl p-12 text-center">
          <h3 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Banking?</h3>
          <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
            Join Phoenix Bank and experience the future of digital banking with seamless NIBSS integration
          </p>
          <a
            href={getLoginUrl()}
            className="inline-block px-8 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
          >
            Get Started Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-700 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Phoenix Bank</h4>
              <p className="text-slate-400 text-sm">Modern digital banking platform powered by NIBSS</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 Phoenix Bank. All rights reserved. Powered by NIBSS Phoenix API.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ size: number }>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition-colors group">
      <CardContent className="pt-6">
        <div className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform inline-block">
          <Icon size={32} />
        </div>
        <h4 className="text-white font-bold mb-2">{title}</h4>
        <p className="text-slate-400 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="relative">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 text-white rounded-full font-bold mb-4">
          {number}
        </div>
        <h4 className="text-white font-bold mb-2">{title}</h4>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  );
}
