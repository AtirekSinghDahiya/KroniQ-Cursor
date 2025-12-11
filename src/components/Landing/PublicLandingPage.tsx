import React, { useState, useEffect } from 'react';
import { MessageSquare, Code, Palette, Video, ArrowRight, Check, Sparkles, Zap, Globe, Shield, Grid3X3, ChevronDown, Users } from 'lucide-react';

interface PublicLandingPageProps {
  onGetStarted: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onGetStarted }) => {
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);

    // Countdown to December 11, 2025
    const targetDate = new Date('2025-12-11T00:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, []);

  const features = [
    {
      icon: MessageSquare,
      title: 'Chat AI',
      description: 'Intelligent conversations powered by multiple AI models with context awareness and memory.',
      gradient: 'from-pink-500/20 to-purple-500/20',
      iconColor: 'text-pink-400',
      borderColor: 'hover:border-pink-400/50'
    },
    {
      icon: Code,
      title: 'Code Studio',
      description: 'Generate, debug, and optimize code across multiple programming languages with AI assistance.',
      gradient: 'from-purple-500/20 to-fuchsia-500/20',
      iconColor: 'text-purple-400',
      borderColor: 'hover:border-purple-400/50'
    },
    {
      icon: Palette,
      title: 'Design Studio',
      description: 'Create stunning visuals, logos, and UI designs with AI-powered creative tools.',
      gradient: 'from-orange-500/20 to-red-500/20',
      iconColor: 'text-orange-400',
      borderColor: 'hover:border-orange-400/50'
    },
    {
      icon: Video,
      title: 'Video Studio',
      description: 'Edit, enhance, and generate video content with advanced AI video processing.',
      gradient: 'from-red-500/20 to-pink-500/20',
      iconColor: 'text-red-400',
      borderColor: 'hover:border-red-400/50'
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0815 50%, #0a0a0f 100%)' }}>
      {/* Animated Background Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Central purple glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'pulse-glow 8s ease-in-out infinite'
          }}
        />
        {/* Left pink glow */}
        <div
          className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'float-slow 12s ease-in-out infinite'
          }}
        />
        {/* Right purple glow */}
        <div
          className="absolute top-1/2 right-1/4 w-[500px] h-[500px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
            filter: 'blur(70px)',
            animation: 'float-slow 10s ease-in-out infinite reverse'
          }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              background: `rgba(${Math.random() > 0.5 ? '236, 72, 153' : '139, 92, 246'}, ${Math.random() * 0.5 + 0.2})`,
              animation: `float-particle ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Floating Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 md:px-4 py-3 md:py-5">
        <div className="max-w-7xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#EC4899]/10 via-[#8B5CF6]/10 to-[#EC4899]/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative glass-panel rounded-full px-4 md:px-8 py-2.5 md:py-3.5 shadow-2xl border border-white/10 backdrop-blur-2xl" style={{ background: 'rgba(10, 10, 15, 0.8)' }}>
              <div className="flex items-center justify-between gap-2">
                <img
                  src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png"
                  alt="KroniQ"
                  className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
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
                  className="flex items-center gap-2 bg-gradient-to-r from-[#EC4899] to-[#EF4444] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold text-xs md:text-sm hover:shadow-lg hover:shadow-[#EC4899]/30 transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 md:pt-32 pb-12 md:pb-20">
        <div className={`max-w-6xl mx-auto text-center relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {/* Early Access Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#EC4899]/40 mb-8 md:mb-10" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
            <Grid3X3 className="w-4 h-4 text-[#EC4899]" />
            <span className="text-[#EC4899] text-sm font-medium tracking-wide">Early Access Rewards</span>
          </div>

          {/* Main Headline - Matching the reference image style */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 md:mb-8 leading-tight px-4">
            Something
            <br />
            <span
              className="italic font-bold"
              style={{
                background: 'linear-gradient(90deg, #F97316 0%, #FBBF24 50%, #EF4444 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Extraordinary
            </span>
            <br />
            is Coming
          </h1>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/60 mb-8 md:mb-12 max-w-3xl mx-auto font-normal px-4 leading-relaxed">
            Join the revolution. Be among the first to experience the future of innovation.{' '}
            <span className="text-white font-semibold">Your journey starts December 11, 2025.</span>
          </p>

          {/* Countdown Timer - Glass Style Boxes */}
          <div className="flex items-center justify-center gap-3 md:gap-5 mb-10 md:mb-14">
            {[
              { value: countdown.days, label: 'DAYS', color: '#3B82F6' },
              { value: countdown.hours, label: 'HOURS', color: '#8B5CF6' },
              { value: countdown.minutes, label: 'MINUTES', color: '#EC4899' },
              { value: countdown.seconds, label: 'SECONDS', color: '#F97316' }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div
                  className="relative rounded-2xl px-4 md:px-6 py-4 md:py-6 transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid rgba(255, 255, 255, 0.1)`,
                    boxShadow: `0 0 30px rgba(${item.color === '#3B82F6' ? '59, 130, 246' : item.color === '#8B5CF6' ? '139, 92, 246' : item.color === '#EC4899' ? '236, 72, 153' : '249, 115, 22'}, 0.15)`
                  }}
                >
                  <div
                    className="text-4xl md:text-5xl lg:text-6xl font-bold transition-all duration-300"
                    style={{ color: item.color }}
                  >
                    {String(item.value).padStart(2, '0')}
                  </div>
                </div>
                <div className="text-xs md:text-sm text-white/40 mt-2 uppercase tracking-widest font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4 w-full max-w-md sm:max-w-none mx-auto">
            <button
              onClick={onGetStarted}
              className="group relative bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#EF4444] text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold text-base md:text-lg hover:shadow-2xl hover:shadow-[#EC4899]/40 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] active:scale-95"
            >
              Get Early Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="glass-panel border border-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold text-base md:text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 w-full sm:w-auto min-h-[48px] active:scale-95"
            >
              Explore Features
            </button>
          </div>

          <div className="mt-8 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 md:gap-8 text-white/50 text-xs sm:text-sm px-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#EC4899] flex-shrink-0" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#F97316] flex-shrink-0" />
              <span>Instant access</span>
            </div>
          </div>

          {/* Mouse Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce-slow hidden md:flex">
            <div
              className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <div
                className="w-1.5 h-2.5 rounded-full bg-gradient-to-b from-[#EC4899] to-[#8B5CF6]"
                style={{ animation: 'scroll-dot 2s ease-in-out infinite' }}
              />
            </div>
            <ChevronDown className="w-4 h-4 text-white/40" style={{ animation: 'chevron-bounce 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 rounded-full border border-[#EC4899]/30 mb-6" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
              <span className="text-[#EC4899] text-sm font-semibold">FEATURES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need to Create
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
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
                    <p className="text-white/60 leading-relaxed">{feature.description}</p>
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
            <div className="inline-block px-4 py-2 rounded-full border border-[#8B5CF6]/30 mb-6" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <span className="text-[#8B5CF6] text-sm font-semibold">HOW IT WORKS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple. Powerful. Intelligent.
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
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
                  <div className="glass-panel rounded-2xl p-8 border border-white/10 hover:border-[#8B5CF6]/50 transition-all duration-300 h-full">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-6xl font-bold bg-gradient-to-br from-[#EC4899] via-[#8B5CF6] to-[#F97316] bg-clip-text text-transparent">
                        {step.number}
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EC4899]/20 to-[#8B5CF6]/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[#EC4899]" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-white/60 leading-relaxed">{step.description}</p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#EC4899] to-transparent" />
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
            <div className="inline-block px-4 py-2 rounded-full border border-[#F97316]/30 mb-6" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
              <span className="text-[#F97316] text-sm font-semibold">TESTIMONIALS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
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
                    <Sparkles key={i} className="w-4 h-4 text-[#F97316] fill-[#F97316]" />
                  ))}
                </div>

                <p className="text-white/80 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EC4899]/30 to-[#8B5CF6]/30" />
                  <div>
                    <p className="text-white font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-white/50 text-xs">{testimonial.role} at {testimonial.company}</p>
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
          <div className="glass-panel rounded-3xl p-16 border border-white/10 backdrop-blur-2xl relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#EC4899]/10 via-[#8B5CF6]/10 to-[#F97316]/10" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Start Creating with KroniQ Today
              </h2>
              <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
                Join the next generation of creators using AI to build faster, smarter, and more creatively.
              </p>

              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#F97316] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-[#EC4899]/40 transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
              >
                <span>Join Now — It's Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="mt-8 flex items-center justify-center gap-8 text-white/50 text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#EC4899]" />
                  <span>Used in 120+ countries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Enterprise-grade security</span>
                </div>
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
              <p className="text-white/50 text-sm">Crafted with intelligence</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-white/50 text-sm">
            <p>KroniQ © 2025 — All rights reserved</p>
          </div>
        </div>
      </footer>

      {/* Add custom keyframes for animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.5;
          }
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-30px) translateX(20px);
          }
        }
        
        @keyframes scroll-dot {
          0%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(10px);
            opacity: 0.4;
          }
        }
        
        @keyframes chevron-bounce {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          50% {
            transform: translateY(4px);
            opacity: 0.3;
          }
        }
        
        @keyframes float-particle {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0;
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};
