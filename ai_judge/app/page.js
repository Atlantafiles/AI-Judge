'use client';
import { Scale, Upload, Gavel, MessageSquare, ChevronRight, Sparkles, Users, BarChart3, FileText } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-br from-blue-500 to-cyan-500 p-2 rounded-lg">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">AI Judge</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-blue-200 hover:text-white transition-colors hidden md:block">Features</a>
          <a href="#how-it-works" className="text-blue-200 hover:text-white transition-colors hidden md:block">How It Works</a>
          <a href="#about" className="text-blue-200 hover:text-white transition-colors hidden md:block">About</a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center mb-16">
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            
            Welcome to <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI Judge</span>
          </h1>
          <h2 className="text-2xl md:text-3xl text-blue-300 font-semibold mb-6">
            Your Mock Trial Platform
          </h2>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Step into the future of legal simulation with AI Judge. Our platform offers a cutting-edge 
            environment for conducting mock trials, powered by advanced artificial intelligence. 
            Experience realistic legal scenarios and receive impartial, data-driven judgments.
          </p>
          
          <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Whether you're honing your advocacy skills, preparing for a complex case, or simply 
            exploring the intricacies of legal arguments, AI Judge provides an unparalleled learning and 
            testing ground. Submit your arguments as Side A or present your rebuttal as Side B, and let 
            our AI adjudicate.
          </p>

          <Link
            href="/case/side-a"
            className="group bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-10 py-5 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-2xl shadow-blue-500/50 inline-flex items-center gap-3"
          >
            Get Started
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            { 
              icon: Upload, 
              title: 'Upload Documents', 
              desc: 'Submit comprehensive case files, evidence, and supporting documents from both parties',
              color: 'from-blue-500 to-cyan-500'
            },
            { 
              icon: Gavel, 
              title: 'AI Analysis', 
              desc: 'Receive detailed verdicts based on legal precedents, evidence quality, and argumentation strength',
              color: 'from-purple-500 to-pink-500'
            },
            { 
              icon: MessageSquare, 
              title: 'Present Arguments', 
              desc: 'Engage in dynamic back-and-forth discussions to challenge and refine the AI\'s decision',
              color: 'from-orange-500 to-red-500'
            }
          ].map((item, i) => (
            <div 
              key={i} 
              className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all hover:transform hover:scale-105 hover:shadow-2xl"
            >
              <div className={`bg-linear-to-br ${item.color} p-4 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="mt-32">
          <h2 className="text-4xl font-bold text-white text-center mb-4">How It Works</h2>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Our AI-powered platform simulates real courtroom proceedings in four simple steps
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Side A Submits', desc: 'Plaintiff uploads case documents and arguments', icon: Users },
              { num: '02', title: 'Side B Responds', desc: 'Defendant presents counter-arguments and evidence', icon: FileText },
              { num: '03', title: 'Arguments Phase', desc: 'Both parties engage in up to 5 rounds of rebuttals', icon: MessageSquare },
              { num: '04', title: 'Final Verdict', desc: 'AI delivers comprehensive judgment with reasoning', icon: BarChart3 }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-linear-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
                  <div className="text-6xl font-bold text-blue-500/20 mb-4">{step.num}</div>
                  <step.icon className="w-10 h-10 text-blue-400 mb-4" />
                  <h3 className="text-white text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-linear-to-r from-blue-500 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { value: '5', label: 'Argument Rounds', suffix: 'max' },
            { value: '100%', label: 'Impartial Judgments', suffix: '' },
            { value: '24/7', label: 'Platform Availability', suffix: '' }
          ].map((stat, i) => (
            <div key={i} className="text-center bg-linear-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="text-5xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-slate-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
        
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-sm bg-white/5 px-6 py-8 mt-20">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>© 2024 AI Judge. All rights reserved.</p>
          <p className="text-sm mt-2">Made By AtlantaFiles</p>
        </div>
      </footer>
    </div>
  );
}