import React, { useState, useEffect } from 'react';
import { MessageSquare, Code, Palette, Video, ArrowRight, Check, Sparkles, Zap, Globe, Shield } from 'lucide-react';
import { CosmicBackground } from '../Layout/CosmicBackground';
import { useTheme } from '../../contexts/ThemeContext';

interface PublicLandingPageProps {
  onGetStarted: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onGetStarted }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: MessageSquare,
      title: 'Chat AI',
      description: 'Intelligent conversations powered by multiple AI models with context awareness and memory.',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      iconColor: 'text-cyan-400',
      borderColor: 'hover:border-cyan-400/50'
    },
    {
      icon: Code,
      title: 'Code Studio',
      description: 'Generate, debug, and optimize code across multiple programming languages with AI assistance.',
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
      borderColor: 'hover:border-purple-400/50'
    },
    {
      icon: Palette,
      title: 'Design Studio',
      description: 'Create stunning visuals, logos, and UI designs with AI-powered creative tools.',
      gradient: 'from-pink-500/20 to-rose-500/20',
      iconColor: 'text-pink-400',
      borderColor: 'hover:border-pink-400/50'
    },
    {
      icon: Video,
      title: 'Video Studio',
      description: 'Edit, enhance, and generate video content with advanced AI video processing.',
      gradient: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'hover:border-blue-400/50'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Chat',
      description: 'Start a conversation with our AI to describe what you want to create.',
      icon: MessageSquare
    },
    {
      number: '02',
      title: 'Create',
      description: 'Our AI generates code, designs, or content based on your requirements.',
      icon: Sparkles
    },
    {
      number: '03',
      title: 'Deploy',
      description: 'Export, download, or integrate your creations directly into your workflow.',
      icon: Zap
    }
  ];

  const testimonials = [
    {
      quote: "KroniQ transformed how we build prototypes. What used to take days now takes hours.",
      author: "Sarah Chen",
      role: "Product Designer",
      company: "TechCorp"
    },
    {
      quote: "The AI understands context incredibly well. It's like having a senior developer on call 24/7.",
      author: "Marcus Rodriguez",
      role: "Full-Stack Developer",
      company: "StartupXYZ"
    },
    {
      quote: "We've increased our content production by 300% while maintaining quality. Absolutely game-changing.",
      author: "Emily Watson",
      role: "Creative Director",
      company: "MediaHub"
    }
  ];

  return (
    <div className="min-h-screen gradient-background relative overflow-hidden">
      <CosmicBackground />

      {/* Floating Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 md:px-4 py-3 md:py-5">
        <div className="max-w-7xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FFF0]/20 via-[#8A2BE2]/20 to-[#00FFF0]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative glass-panel rounded-full px-4 md:px-8 py-2.5 md:py-3.5 shadow-2xl border border-white/20 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-2">
                <img
                  src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png"
                  alt="KroniQ"
                  className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(0,255,240,0.5)]"
                />

                <div className="hidden lg:flex items-center gap-6">
                  <a href="#features" className="text-sm text-white/70 hover:text-white font-medium transition-colors whitespace-nowrap">
                    Features
                  </a>
                  <a href="#how-it-works" className="text-sm text-white/70 hover:text-white font-medium transition-colors whitespace-nowrap">
                    How It Works
                  </a>
                  <a href="#testimonials" className="text-sm text-white/70 hover:text-white font-medium transition-colors whitespace-nowrap">
                    Testimonials
                  </a>
                </div>

                <button
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold text-xs md:text-sm hover:shadow-lg hover:shadow-[#00FFF0]/30 transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 md:pt-32 pb-12 md:pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orbit-ring" style={{ width: '500px', height: '500px', top: '20%', left: '10%', opacity: scrollY > 100 ? 0 : 1, transition: 'opacity 0.5s' }} />
          <div className="orbit-ring" style={{ width: '700px', height: '700px', top: '40%', right: '5%', opacity: scrollY > 100 ? 0 : 1, transition: 'opacity 0.5s' }} />
          <div className="orbit-ring" style={{ width: '300px', height: '300px', bottom: '15%', left: '50%', opacity: scrollY > 100 ? 0 : 1, transition: 'opacity 0.5s' }} />
        </div>

        <div className={`max-w-6xl mx-auto text-center relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 shadow-2xl shadow-[#00FFF0]/30 backdrop-blur-xl border-2 border-white/20 p-3 md:p-4 mb-6 md:mb-8 animate-pulse-glow">
            <img
              src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png"
              alt="KroniQ"
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(0,255,240,0.6)]"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white mb-6 md:mb-8 leading-tight px-4">
            One AI.{' '}
            <span className="bg-gradient-to-r from-[#00FFF0] via-[#8A2BE2] to-[#00FFF0] bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Infinite Creation.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 mb-8 md:mb-12 max-w-3xl mx-auto font-normal px-4 leading-relaxed">
            Harness the power of <span className="text-[#00FFF0] font-medium">multiple AI models</span> in one unified platform. Create, code, design, and deploy with <span className="text-[#8A2BE2] font-medium">unprecedented speed</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4 w-full max-w-md sm:max-w-none mx-auto">
            <button
              onClick={onGetStarted}
              className="group relative bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold text-base md:text-lg hover:shadow-2xl hover:shadow-[#00FFF0]/40 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] active:scale-95"
            >
              Start Creating Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="glass-panel border border-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold text-base md:text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 w-full sm:w-auto min-h-[48px] active:scale-95"
            >
              Explore Features
            </button>
          </div>

          <div className="mt-8 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 md:gap-8 text-white/60 text-xs sm:text-sm px-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00FFF0] flex-shrink-0" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00FFF0] flex-shrink-0" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00FFF0] flex-shrink-0" />
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 glass-panel rounded-full border border-white/20 mb-6">
              <span className="text-[#00FFF0] text-sm font-semibold">FEATURES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need to Create
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Four powerful studios, one seamless experience. Switch between tools effortlessly as your project evolves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className={`group relative glass-panel rounded-2xl p-8 border border-white/10 ${feature.borderColor} transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-fade-in-up overflow-hidden`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-white/70 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 glass-panel rounded-full border border-white/20 mb-6">
              <span className="text-[#00FFF0] text-sm font-semibold">HOW IT WORKS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple. Powerful. Intelligent.
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Three steps to transform your ideas into reality with AI-powered precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  style={{ animationDelay: `${index * 150}ms` }}
                  className="relative animate-fade-in-up"
                >
                  <div className="glass-panel rounded-2xl p-8 border border-white/10 hover:border-[#00FFF0]/50 transition-all duration-300 h-full">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-6xl font-bold bg-gradient-to-br from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                        {step.number}
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[#00FFF0]" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-white/70 leading-relaxed">{step.description}</p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#00FFF0] to-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 glass-panel rounded-full border border-white/20 mb-6">
              <span className="text-[#00FFF0] text-sm font-semibold">TESTIMONIALS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Join thousands of developers, designers, and creators who trust KroniQ for their projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                style={{ animationDelay: `${index * 100}ms` }}
                className="glass-panel rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 animate-fade-in-up"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="w-4 h-4 text-[#00FFF0] fill-[#00FFF0]" />
                  ))}
                </div>

                <p className="text-white/90 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FFF0]/30 to-[#8A2BE2]/30" />
                  <div>
                    <p className="text-white font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-white/60 text-xs">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-panel rounded-3xl p-16 border border-white/20 backdrop-blur-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Start Creating with KroniQ Today
            </h2>
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              Join the next generation of creators using AI to build faster, smarter, and more creatively.
            </p>

            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-[#00FFF0]/40 transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
            >
              <span>Join Now — It's Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="mt-8 flex items-center justify-center gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00FFF0]" />
                <span>Used in 120+ countries</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00FFF0]" />
                <span>Enterprise-grade security</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png" alt="KroniQ" className="h-12 object-contain" />
              </div>
              <p className="text-white/60 text-sm">Crafted with intelligence</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-white/60 text-sm">
            <p>KroniQ © 2025 — All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
