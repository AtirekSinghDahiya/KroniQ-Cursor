import React, { useState, useEffect } from 'react';
import { MessageSquare, Palette, Video, ArrowRight, Check, Sparkles, Zap, Star, TrendingUp, Users, Crown, Music, Image as ImageIcon, Mic, Loader2, CheckCircle } from 'lucide-react';
import { Floating3DCard, AnimatedGradientOrb } from './FloatingElements';
import { MouseParticles } from './MouseParticles';
import { CountUp } from '../Common/CountUp';
import { useAuth } from '../../contexts/AuthContext';
import { getTokenPacks, getTotalTokens } from '../../lib/subscriptionManagementService';
import { trackPageVisit, trackGetStartedClick, trackEvent } from '../../lib/analyticsService';
import { PageMeta } from '../SEO/PageMeta';
import { joinWaitlistWithGoogle, getRemainingSpots, getWaitlistCount } from '../../lib/waitlistService';
import { getAppStats } from '../../lib/dataService';

interface HomePageProps {
  onGetStarted: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  const { signInWithGoogle } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [tokenPacks, setTokenPacks] = useState<any[]>([]);

  // Waitlist state
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [remainingSpots, setRemainingSpots] = useState(79); // Default value
  const [joinedEmail, setJoinedEmail] = useState<string | null>(null);
  const [totalCreators, setTotalCreators] = useState(0);

  // Live stats from Firebase
  const [appStats, setAppStats] = useState({ activeUsers: 0, aiGenerations: 0, uptime: '99.9%', userRating: '4.8/5' });

  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);

    loadTokenPacks();
    loadRemainingSpots();
    loadTotalCreators();
    loadAppStats();

    trackPageVisit({ pageName: 'home' });

    return () => clearInterval(interval);
  }, []);

  const loadAppStats = async () => {
    try {
      const stats = await getAppStats();
      setAppStats(stats);
    } catch (error) {
      console.error('Error loading app stats:', error);
    }
  };

  const loadRemainingSpots = async () => {
    try {
      const spots = await getRemainingSpots();
      setRemainingSpots(spots);
    } catch (error) {
      console.error('Error loading remaining spots:', error);
    }
  };

  const handleJoinWaitlist = async () => {
    setWaitlistLoading(true);
    setWaitlistMessage(null);

    try {
      const result = await joinWaitlistWithGoogle();

      if (result.success) {
        setWaitlistMessage({ type: 'success', text: result.message });
        setJoinedEmail(result.email || null);
        await loadRemainingSpots(); // Refresh spots count

        trackEvent({
          eventType: 'waitlist',
          eventName: 'waitlist_joined',
          eventData: { email: result.email },
          pageName: 'home',
        });

        // After joining waitlist, sign them directly into main app
        if (result.shouldRedirect) {
          setWaitlistMessage({ type: 'success', text: 'Signing you in...' });
          setTimeout(async () => {
            try {
              await signInWithGoogle();
              // AuthContext will handle redirect to dashboard
            } catch (error) {
              console.error('Auto sign-in failed:', error);
              // Fallback to login page if auto sign-in fails
              onGetStarted();
            }
          }, 1000);
        }
      } else {
        setWaitlistMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setWaitlistMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setWaitlistLoading(false);
    }
  };

  const loadTokenPacks = async () => {
    const packs = await getTokenPacks();
    setTokenPacks(packs);
  };

  const loadTotalCreators = async () => {
    try {
      const count = await getWaitlistCount();
      setTotalCreators(count);
    } catch (error) {
      console.error('Error loading total creators:', error);
    }
  };

  const features = [
    {
      icon: MessageSquare,
      title: 'Chat AI',
      description: 'Intelligent conversations powered by 40+ AI models including GPT-4, Claude, Gemini & more.',
      stats: '40+ models',
      color: 'from-pink-500 to-purple-600',
      highlight: true
    },
    {
      icon: ImageIcon,
      title: 'Image Studio',
      description: 'Generate stunning AI art, photos, and graphics with multiple image generation models.',
      stats: 'Unlimited creations',
      color: 'from-purple-500 to-fuchsia-600'
    },
    {
      icon: Video,
      title: 'Video Studio',
      description: 'Create AI-powered videos, animations, and visual content with cutting-edge models.',
      stats: 'HD quality',
      color: 'from-orange-500 to-red-600'
    },
    {
      icon: Music,
      title: 'Music Studio',
      description: 'Compose original music, soundtracks, and audio with AI music generation.',
      stats: 'Multiple genres',
      color: 'from-green-500 to-teal-600'
    },
    {
      icon: Mic,
      title: 'Text to Speech',
      description: 'Convert text to natural-sounding speech with AI voice synthesis in multiple languages.',
      stats: '50+ voices',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Palette,
      title: 'PPT Studio',
      description: 'Generate professional presentations with AI-designed slides and content.',
      stats: 'Instant decks',
      color: 'from-red-500 to-pink-600'
    }
  ];

  // Parse uptime and userRating from strings to numbers for CountUp
  const uptimeNum = parseFloat(appStats.uptime.replace('%', '')) || 99.9;
  const ratingNum = parseFloat(appStats.userRating.split('/')[0]) || 4.8;

  const stats = [
    { icon: Users, end: appStats.activeUsers, suffix: '+', label: 'Active Users' },
    { icon: Sparkles, end: appStats.aiGenerations, suffix: '+', label: 'AI Generations' },
    { icon: TrendingUp, end: uptimeNum, suffix: '%', label: 'Uptime', decimals: 1 },
    { icon: Star, end: ratingNum, suffix: '/5', label: 'User Rating', decimals: 1 }
  ];

  const journey = [
    { date: 'September 14, 2025', event: 'The Idea', description: 'KroniQ AI was born from a vision to democratize AI creativity' },
    { date: 'December 7, 2025', event: 'Added Waitlist', description: 'Launched early bird waitlist for first 100 users' },
    { date: 'December 11, 2025', event: 'MVP Launch', description: 'Launched minimum viable product with core features' }
  ];

  return (
    <div className="relative w-full">
      <PageMeta
        title="AI-Powered Creative Platform"
        description="Create stunning content with KroniQ AI - Your all-in-one platform for AI chat, code generation, design, video editing, and more. Join 50+ active users today."
        keywords="AI platform, AI chat, code generation, design tools, video editing, artificial intelligence, creative AI, KroniQ"
      />
      {/* Mouse-following particles */}
      <MouseParticles />

      {/* Background Orb */}
      <AnimatedGradientOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-60" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-32 pb-20">
        <div className={`max-w-7xl mx-auto text-center relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {/* Logo Animation */}
          <div className="relative inline-block mb-8">
            <img
              src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png"
              alt="KroniQ"
              className="relative h-48 md:h-64 w-auto mx-auto object-contain drop-shadow-[0_0_30px_rgba(0,255,240,0.8)] floating-animation"
            />
          </div>

          {/* Limited Time Promo Banner */}
          <div className="mb-8 animate-pulse-slow">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#EC4899]/20 via-[#8B5CF6]/20 to-[#EF4444]/20 border-2 border-[#EC4899] rounded-2xl backdrop-blur-xl shadow-2xl shadow-[#EC4899]/30">
              <Crown className="w-6 h-6 text-[#FFD700] animate-bounce" />
              <span className="text-white font-bold text-lg md:text-xl">
                🎉 First 100 Users Get <span className="text-[#EC4899] text-2xl">5 MILLION</span> Tokens FREE!
              </span>
              <Sparkles className="w-6 h-6 text-[#FFD700] animate-spin-slow" />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
            <span className="block mb-4">One AI.</span>
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#EF4444] bg-clip-text text-transparent blur-lg animate-gradient bg-[length:200%_auto]">
                Infinite Creation.
              </span>
              <span className="relative bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#EF4444] bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Infinite Creation.
              </span>
            </span>
          </h1>

          <p className="text-2xl md:text-3xl text-white/80 mb-12 max-w-4xl mx-auto font-light leading-relaxed">
            Harness the power of <span className="text-[#EC4899] font-semibold">multiple AI models</span> in one unified platform. Create, code, design, and deploy with <span className="text-[#8B5CF6] font-semibold">unprecedented speed</span>.
          </p>

          {/* Under Construction Notice */}
          <div className="mb-8 px-6 py-3 glass-panel border border-[#F97316]/30 rounded-xl max-w-2xl mx-auto">
            <p className="text-white/80 text-center text-sm">
              🚧 <span className="font-semibold text-[#F97316]">Beta Version</span> - We're still building! Some features may be under development or not fully functional yet.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <button
              onClick={() => {
                trackGetStartedClick('home');
                onGetStarted();
              }}
              className="group relative bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#EF4444] text-white px-10 py-5 rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-[#EC4899]/50 transition-all duration-300 hover:scale-105 flex items-center gap-3 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <span className="relative">Start Creating Free</span>
              <ArrowRight className="relative w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>

            <button
              onClick={() => {
                trackEvent({
                  eventType: 'button_click',
                  eventName: 'explore_features_clicked',
                  pageName: 'home',
                });
                const element = document.getElementById('features-showcase');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="glass-panel border-2 border-white/30 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-[#8B5CF6]/50"
            >
              Explore Features
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/70 text-sm">
            {[
              { icon: Check, text: 'No credit card required' },
              { icon: Zap, text: 'Instant activation' },
              { icon: Star, text: 'Trusted by 50+ early users' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                  <Icon className="w-5 h-5 text-[#8B5CF6]" />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Exclusive Early Bird Offer Section - Premium Immersive Design */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Orbital Rings - Background Animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="waitlist-orbit-ring w-[400px] h-[400px] md:w-[600px] md:h-[600px]" />
          <div className="waitlist-orbit-ring waitlist-orbit-ring-reverse w-[500px] h-[500px] md:w-[750px] md:h-[750px]" />
          <div className="waitlist-orbit-ring w-[600px] h-[600px] md:w-[900px] md:h-[900px]" style={{ animationDuration: '50s' }} />
        </div>

        {/* Morphing Blob Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className="waitlist-morph-blob w-[500px] h-[500px] md:w-[700px] md:h-[700px] opacity-30"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.4) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 70%)'
            }}
          />
        </div>

        {/* Floating Glowing Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="waitlist-glow-particle absolute top-[10%] left-[15%] w-3 h-3 rounded-full bg-[#EC4899] blur-sm" />
          <div className="waitlist-glow-particle absolute top-[25%] right-[20%] w-4 h-4 rounded-full bg-[#8B5CF6] blur-sm" style={{ animationDelay: '1s' }} />
          <div className="waitlist-glow-particle absolute bottom-[20%] left-[25%] w-2 h-2 rounded-full bg-[#F97316] blur-sm" style={{ animationDelay: '2s' }} />
          <div className="waitlist-glow-particle absolute top-[40%] right-[10%] w-3 h-3 rounded-full bg-[#EC4899] blur-sm" style={{ animationDelay: '0.5s' }} />
          <div className="waitlist-glow-particle absolute bottom-[30%] right-[30%] w-2 h-2 rounded-full bg-[#8B5CF6] blur-sm" style={{ animationDelay: '1.5s' }} />
          <div className="waitlist-glow-particle absolute top-[60%] left-[10%] w-4 h-4 rounded-full bg-[#D946EF] blur-sm" style={{ animationDelay: '3s' }} />

          {/* Floating Stars */}
          <Star className="waitlist-float-star absolute top-[15%] right-[25%] w-4 h-4 text-[#FFD700]/60" style={{ animationDelay: '0s' }} />
          <Star className="waitlist-float-star absolute bottom-[25%] left-[20%] w-3 h-3 text-[#EC4899]/70" style={{ animationDelay: '1s' }} />
          <Star className="waitlist-float-star absolute top-[50%] right-[15%] w-5 h-5 text-[#8B5CF6]/50" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          {/* Exclusive Badge with Shimmer */}
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full relative overflow-hidden waitlist-badge-shimmer"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(249, 115, 22, 0.2) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.4)'
            }}
          >
            <Zap className="w-5 h-5 text-[#F97316]" />
            <span className="text-lg font-bold text-[#F97316]">Exclusive Early Bird Offer</span>
            <Sparkles className="w-5 h-5 text-[#EC4899]" />
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            The first <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EC4899] to-[#8B5CF6]">100 users</span> will receive
          </h2>

          {/* Giant Token Display - Floating & Glowing */}
          <div className="relative my-12 md:my-16">
            {/* Energy Rings around the number */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="waitlist-energy-ring w-40 h-40 md:w-64 md:h-64 rounded-full border-2 border-[#EC4899]/30" />
              <div className="waitlist-energy-ring w-52 h-52 md:w-80 md:h-80 rounded-full border-2 border-[#8B5CF6]/20" style={{ animationDelay: '0.5s' }} />
              <div className="waitlist-energy-ring w-64 h-64 md:w-96 md:h-96 rounded-full border border-[#F97316]/15" style={{ animationDelay: '1s' }} />
            </div>

            {/* The Big Token Amount */}
            <div className="relative inline-block">
              <span
                className="waitlist-number-glow text-8xl md:text-[10rem] lg:text-[14rem] font-black text-white leading-none tracking-tighter"
                style={{
                  WebkitTextStroke: '2px rgba(236, 72, 153, 0.3)'
                }}
              >
                200K
              </span>
            </div>

            {/* Tokens Label with Icons */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-3xl">🪙</span>
              <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700]">
                Tokens FREE
              </span>
              <Crown className="w-8 h-8 text-[#FFD700] animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          {/* Spots Remaining - Floating Pill */}
          <div className="relative inline-block mb-8">
            <div
              className="waitlist-gradient-border inline-flex items-center gap-3 px-8 py-4 rounded-full"
              style={{ background: 'rgba(15, 23, 42, 0.8)' }}
            >
              <Users className="w-5 h-5 text-[#EC4899]" />
              <span className="text-white font-semibold text-lg">
                {remainingSpots > 0 ? (
                  <>Only <span className="text-2xl font-bold text-[#EC4899] waitlist-counter-flip">{remainingSpots}</span> spots remaining!</>
                ) : (
                  '🔥 Waitlist is full!'
                )}
              </span>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            Sign in with Google to join the waitlist &amp; get instant access
          </p>

          {/* Success/Error Message */}
          {waitlistMessage && (
            <div
              className={`mb-8 px-8 py-4 rounded-2xl inline-flex items-center gap-3 animate-scale-in ${waitlistMessage.type === 'success'
                ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                : 'bg-red-500/20 border border-red-500/40 text-red-400'
                }`}
            >
              {waitlistMessage.type === 'success' && <CheckCircle className="w-6 h-6" />}
              <span className="font-semibold text-lg">{waitlistMessage.text}</span>
            </div>
          )}

          {/* CTA Button - Premium Style */}
          {!joinedEmail ? (
            <button
              onClick={handleJoinWaitlist}
              disabled={waitlistLoading || remainingSpots <= 0}
              className="group relative inline-flex items-center gap-4 px-12 py-6 bg-white text-gray-900 rounded-full font-bold text-xl shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed waitlist-button-wave overflow-hidden"
              style={{
                boxShadow: '0 0 40px rgba(255, 255, 255, 0.3), 0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Background shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

              {waitlistLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-7 h-7" />
                  <span>Continue with Google</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          ) : (
            <div className="inline-flex items-center gap-4 px-12 py-6 rounded-full text-green-400 font-bold text-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                border: '2px solid rgba(34, 197, 94, 0.5)',
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)'
              }}
            >
              <CheckCircle className="w-7 h-7" />
              <span>🎉 You're on the list!</span>
            </div>
          )}

          {/* Disclaimer */}
          <p className="mt-10 text-white/40 text-sm">
            By joining, you agree to receive updates about KroniQ. No spam, ever.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <Floating3DCard key={idx} delay={idx * 100}>
                  <div className="rounded-2xl p-6 border border-white/10 bg-[#0d1117]/80 backdrop-blur-sm text-center group hover:border-pink-500/30 transition-all duration-300">
                    <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      <CountUp
                        end={stat.end}
                        suffix={stat.suffix}
                        decimals={stat.decimals}
                        duration={2500}
                      />
                    </div>
                    <div className="text-white/50 text-sm">{stat.label}</div>
                  </div>
                </Floating3DCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features-showcase" className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 glass-panel rounded-full border border-white/20 mb-8 animate-fade-in">
              <span className="text-[#8B5CF6] text-sm font-bold tracking-wider">POWERFUL FEATURES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up">
              Everything You Need,{' '}
              <span className="bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] bg-clip-text text-transparent">
                All in One Place
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Six powerful AI studios with 40+ chat models, image, video, music, text-to-speech, and presentation generation.
            </p>
          </div>

          {/* Interactive Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;

              // Color mapping for icon backgrounds
              const iconColors: Record<string, string> = {
                'Chat AI': 'from-pink-500/20 to-pink-600/30 border-pink-500/30',
                'Image Studio': 'from-purple-500/20 to-fuchsia-600/30 border-purple-500/30',
                'Video Studio': 'from-orange-500/20 to-red-600/30 border-orange-500/30',
                'Music Studio': 'from-green-500/20 to-teal-600/30 border-green-500/30',
                'Text to Speech': 'from-blue-500/20 to-cyan-600/30 border-blue-500/30',
                'PPT Studio': 'from-pink-500/20 to-rose-600/30 border-pink-500/30',
              };

              const iconTextColors: Record<string, string> = {
                'Chat AI': 'text-pink-400',
                'Image Studio': 'text-purple-400',
                'Video Studio': 'text-orange-400',
                'Music Studio': 'text-green-400',
                'Text to Speech': 'text-blue-400',
                'PPT Studio': 'text-pink-400',
              };

              // Unique gradient backgrounds for each card
              const cardGradients: Record<string, string> = {
                'Chat AI': 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                'Image Studio': 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(217, 70, 239, 0.1) 100%)',
                'Video Studio': 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)',
                'Music Studio': 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(20, 184, 166, 0.1) 100%)',
                'Text to Speech': 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                'PPT Studio': 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(59, 130, 246, 0.3) 100%)',
              };

              // Unique decoration colors for each card
              const decorColors: Record<string, { primary: string; secondary: string }> = {
                'Chat AI': { primary: 'from-pink-500/30 via-pink-400/20', secondary: 'from-purple-500/20' },
                'Image Studio': { primary: 'from-purple-500/30 via-fuchsia-400/20', secondary: 'from-violet-500/20' },
                'Video Studio': { primary: 'from-orange-500/30 via-red-400/20', secondary: 'from-yellow-500/20' },
                'Music Studio': { primary: 'from-green-500/30 via-teal-400/20', secondary: 'from-emerald-500/20' },
                'Text to Speech': { primary: 'from-blue-500/30 via-cyan-400/20', secondary: 'from-sky-500/20' },
                'PPT Studio': { primary: 'from-purple-500/40 via-pink-500/30', secondary: 'from-blue-500/30' },
              };

              const decor = decorColors[feature.title] || { primary: 'from-gray-500/30', secondary: 'from-gray-500/20' };

              return (
                <Floating3DCard key={idx} delay={idx * 100}>
                  <div
                    className="relative group rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 h-full overflow-hidden"
                    style={{ background: cardGradients[feature.title] || 'rgba(30, 30, 50, 0.5)' }}
                  >
                    {/* Background decoration shapes */}
                    <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${decor.primary} to-transparent rounded-bl-full opacity-60`} />
                    <div className={`absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr ${decor.secondary} to-transparent rounded-tr-full opacity-50`} />

                    <div className="relative z-10">
                      {/* Icon Box */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${iconColors[feature.title] || 'from-gray-500/20 to-gray-600/30'} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-7 h-7 ${iconTextColors[feature.title] || 'text-white'}`} />
                      </div>

                      {/* Content */}
                      <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                      <p className="text-white/60 leading-relaxed mb-6 text-sm">{feature.description}</p>

                      {/* Stats Badge */}
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-white/70 font-medium">{feature.stats}</span>
                      </div>
                    </div>
                  </div>
                </Floating3DCard>
              );
            })}
          </div>
        </div>
      </section >

      {/* Our Journey Section */}
      < section className="relative py-32 px-4" >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-[#8B5CF6] to-[#8B5CF6] bg-clip-text text-transparent">
                Our Journey
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              From idea to reality - building the future of AI creativity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {journey.map((milestone, idx) => (
              <Floating3DCard key={idx} delay={idx * 100}>
                <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-[#8B5CF6]/30 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#8B5CF6]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6 text-[#8B5CF6]" />
                  </div>
                  <div className="text-sm text-[#8B5CF6] font-semibold mb-2">{milestone.date}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{milestone.event}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{milestone.description}</p>
                </div>
              </Floating3DCard>
            ))}
          </div>
        </div>
      </section >

      {/* AI Models Showcase */}
      < section className="relative py-32 px-4" >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 glass-panel rounded-full border border-white/20 mb-8 animate-fade-in">
              <span className="text-[#EC4899] text-sm font-bold tracking-wider">55+ VERIFIED AI MODELS</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-[#8B5CF6] to-[#8B5CF6] bg-clip-text text-transparent">
                The Most Comprehensive
              </span>
              <br />AI Model Collection
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Access models from OpenAI, Anthropic, Google, Meta, Mistral, and 15+ more providers
            </p>
          </div>

          {/* Featured Models Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {/* GPT 5.1 */}
            <Floating3DCard>
              <div className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-green-500/50 transition-all duration-300 group h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">GPT 5.1</h3>
                <p className="text-xs text-white/50 mb-2">Latest OpenAI flagship</p>
                <span className="inline-block px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">OpenAI</span>
              </div>
            </Floating3DCard>

            {/* Gemini 3 */}
            <Floating3DCard delay={50}>
              <div className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-blue-500/50 transition-all duration-300 group h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Gemini 3</h3>
                <p className="text-xs text-white/50 mb-2">Next-gen multimodal</p>
                <span className="inline-block px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">Google</span>
              </div>
            </Floating3DCard>

            {/* Claude 4.5 */}
            <Floating3DCard delay={100}>
              <div className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-purple-500/50 transition-all duration-300 group h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Claude 4.5</h3>
                <p className="text-xs text-white/50 mb-2">Advanced reasoning</p>
                <span className="inline-block px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold">Anthropic</span>
              </div>
            </Floating3DCard>

            {/* Sora 2 */}
            <Floating3DCard delay={150}>
              <div className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-orange-500/50 transition-all duration-300 group h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Video className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Sora 2</h3>
                <p className="text-xs text-white/50 mb-2">AI video generation</p>
                <span className="inline-block px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold">OpenAI</span>
              </div>
            </Floating3DCard>

            {/* Nano Banana Pro */}
            <Floating3DCard delay={200}>
              <div className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-yellow-500/50 transition-all duration-300 group h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Nano Banana</h3>
                <p className="text-xs text-white/50 mb-2">Pro image model</p>
                <span className="inline-block px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">Nano</span>
              </div>
            </Floating3DCard>

            {/* Veo 3.1 */}
            <Floating3DCard delay={250}>
              <div className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-pink-500/50 transition-all duration-300 group h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Video className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Veo 3.1</h3>
                <p className="text-xs text-white/50 mb-2">Google video AI</p>
                <span className="inline-block px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-semibold">Google</span>
              </div>
            </Floating3DCard>
          </div>

          {/* Model Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chat */}
            <Floating3DCard>
              <div
                className="rounded-2xl p-8 border border-pink-500/30 transition-all duration-300 h-full overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-bl-full" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-600/30 border border-pink-500/30 flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 text-pink-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">40+</div>
                      <div className="text-sm text-white/60">Models</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Chat</h3>
                  <p className="text-white/60 mb-4 text-sm leading-relaxed">
                    GPT 5.1, Claude 4.5, Gemini 3, Llama 3.3, Mistral, DeepSeek, and more
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">OpenAI</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Anthropic</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Google</span>
                  </div>
                </div>
              </div>
            </Floating3DCard>

            {/* Video */}
            <Floating3DCard delay={100}>
              <div
                className="rounded-2xl p-8 border border-orange-500/30 transition-all duration-300 h-full overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-bl-full" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-600/30 border border-orange-500/30 flex items-center justify-center">
                      <Video className="w-7 h-7 text-orange-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">6+</div>
                      <div className="text-sm text-white/60">Models</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Video</h3>
                  <p className="text-white/60 mb-4 text-sm leading-relaxed">
                    Sora 2, Veo 3.1, Kling AI, and cutting-edge video generation models
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">OpenAI</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Google</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Runway</span>
                  </div>
                </div>
              </div>
            </Floating3DCard>

            {/* PPT */}
            <Floating3DCard delay={200}>
              <div
                className="rounded-2xl p-8 border border-purple-500/30 transition-all duration-300 h-full overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(59, 130, 246, 0.2) 100%)' }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-500/30 via-pink-500/20 to-transparent rounded-bl-full" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-tr-full" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-600/30 border border-purple-500/30 flex items-center justify-center">
                      <Palette className="w-7 h-7 text-purple-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">AI</div>
                      <div className="text-sm text-white/60">Powered</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">PPT</h3>
                  <p className="text-white/60 mb-4 text-sm leading-relaxed">
                    Generate stunning presentations with AI-designed slides and content
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Slides</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Decks</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Export</span>
                  </div>
                </div>
              </div>
            </Floating3DCard>
          </div>

          {/* Provider Showcase */}
          <div className="mt-16">
            <h3 className="text-3xl font-bold text-white text-center mb-10">Powered by Leading AI Providers</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {['OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral AI', 'DeepSeek', 'Qwen', 'X.AI', 'Perplexity', 'Amazon', 'Microsoft', 'Cohere'].map((provider, idx) => (
                <Floating3DCard key={provider} delay={idx * 50}>
                  <div className="glass-panel rounded-xl p-4 border border-white/10 hover:border-[#8B5CF6]/30 transition-all duration-300 text-center">
                    <div className="text-white font-semibold text-sm">{provider}</div>
                  </div>
                </Floating3DCard>
              ))}
            </div>
          </div>
        </div>
      </section >

      {/* Pricing Section */}
      < section className="relative py-32 px-4" >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-[#8B5CF6] to-[#8B5CF6] bg-clip-text text-transparent">
                Token-Based Pricing
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Pay only for what you use. Buy tokens once or subscribe monthly and save 10%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tokenPacks.slice(0, 3).map((pack, index) => {
              const Icon = [Sparkles, Zap, Crown][index];
              const totalTokens = getTotalTokens(pack.tokens, pack.bonusTokens);
              const monthlyPrice = pack.recurringPriceUsd;
              const savings = (pack.priceUsd - monthlyPrice).toFixed(2);

              return (
                <Floating3DCard key={pack.id}>
                  <div className={`relative glass-panel rounded-3xl p-8 border-2 transition-all duration-300 group ${pack.popular
                    ? 'border-[#8B5CF6] shadow-2xl shadow-[#8B5CF6]/20 scale-105'
                    : 'border-white/20 hover:border-white/40'
                    }`}>
                    {pack.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="px-6 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#8B5CF6] text-white text-sm font-bold shadow-lg">
                          💎 MOST POPULAR
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${pack.popular ? 'from-[#8B5CF6] to-[#8B5CF6]' : 'from-white/10 to-white/5'
                        } flex items-center justify-center`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="text-3xl font-bold text-white mb-2">{pack.name}</h3>

                      <div className="mb-6">
                        <div className="text-5xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#8B5CF6] bg-clip-text text-transparent mb-2">
                          {totalTokens >= 1000000
                            ? `${(totalTokens / 1000000).toFixed(0)} Million`
                            : `${(totalTokens / 1000).toFixed(0)}K`}
                        </div>
                        <div className="text-white/60">tokens</div>
                        {pack.bonusTokens > 0 && (
                          <div className="mt-2 text-sm text-[#8B5CF6]">
                            + {(pack.bonusTokens / 1000).toFixed(0)}K bonus!
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="glass-panel rounded-xl p-4 border border-white/10">
                          <div className="text-white/60 text-sm mb-1">One-Time</div>
                          <div className="text-3xl font-bold text-white">${pack.priceUsd}</div>
                        </div>
                        <div className="glass-panel rounded-xl p-4 border border-[#8B5CF6]/30 relative overflow-hidden">
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-bold">
                              SAVE ${savings}
                            </span>
                          </div>
                          <div className="text-white/60 text-sm mb-1">Monthly</div>
                          <div className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#8B5CF6] bg-clip-text text-transparent">
                            ${monthlyPrice}
                          </div>
                          <div className="text-xs text-white/40 mt-1">per month</div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#8B5CF6]" />
                          <span>Access to all AI models</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#8B5CF6]" />
                          <span>Never expires</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#8B5CF6]" />
                          <span>Cancel subscription anytime</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#8B5CF6]" />
                          <span>Priority support</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          trackEvent({
                            eventType: 'button_click',
                            eventName: 'pricing_get_started_clicked',
                            eventData: { pack_name: pack.name },
                            pageName: 'home',
                          });
                          trackGetStartedClick('home');
                          onGetStarted();
                        }}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${pack.popular
                          ? 'bg-gradient-to-r from-[#8B5CF6] to-[#8B5CF6] text-white hover:shadow-xl hover:shadow-[#8B5CF6]/50 hover:scale-105'
                          : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                      >
                        Get Started
                      </button>
                    </div>
                  </div>
                </Floating3DCard>
              );
            })}
          </div>
        </div>
      </section >

      {/* Final CTA */}
      < section className="relative py-32 px-4" >
        <div className="max-w-5xl mx-auto">
          <Floating3DCard>
            <div className="relative glass-panel rounded-3xl p-16 border-2 border-white/20 backdrop-blur-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/10 via-[#8B5CF6]/10 to-[#3B82F6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 text-center">
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  Ready to{' '}
                  <span className="bg-gradient-to-r from-[#8B5CF6] to-[#8B5CF6] bg-clip-text text-transparent">
                    Create Magic?
                  </span>
                </h2>
                <p className="text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
                  Join {totalCreators > 0 ? totalCreators.toLocaleString() : 'other'} creators building the future with AI
                </p>

                <button
                  onClick={() => {
                    trackGetStartedClick('home');
                    onGetStarted();
                  }}
                  className="group bg-gradient-to-r from-[#8B5CF6] to-[#8B5CF6] text-white px-12 py-6 rounded-2xl font-bold text-2xl hover:shadow-2xl hover:shadow-[#8B5CF6]/50 transition-all duration-300 hover:scale-110 inline-flex items-center gap-4"
                >
                  <span>Start Creating Now</span>
                  <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </Floating3DCard>
        </div>
      </section >
    </div >
  );
};
