import React, { useState, useEffect } from 'react';
import { MessageSquare, Code, Palette, Video, ArrowRight, Check, Sparkles, Zap, Star, TrendingUp, Users, Coins, Crown, Building2, Music, Image as ImageIcon, Mic } from 'lucide-react';
import { Floating3DCard, AnimatedGradientOrb } from './FloatingElements';
import { useTheme } from '../../contexts/ThemeContext';
import { getTokenPacks, getTotalTokens } from '../../lib/subscriptionManagementService';
import { trackPageVisit, trackGetStartedClick, trackEvent } from '../../lib/analyticsService';
import { AI_MODELS } from '../../lib/aiModels';
import { PageMeta } from '../SEO/PageMeta';

interface HomePageProps {
  onGetStarted: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [tokenPacks, setTokenPacks] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);

    loadTokenPacks();

    trackPageVisit({ pageName: 'home' });

    return () => clearInterval(interval);
  }, []);

  const loadTokenPacks = async () => {
    const packs = await getTokenPacks();
    setTokenPacks(packs);
  };

  const features = [
    {
      icon: MessageSquare,
      title: 'Chat AI',
      description: 'Intelligent conversations powered by multiple AI models with context awareness and memory.',
      stats: '500+ conversations',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      icon: Code,
      title: 'Code Studio',
      description: 'Generate, debug, and optimize code across multiple programming languages with AI assistance.',
      stats: '50+ projects',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: Palette,
      title: 'Design Studio',
      description: 'Create stunning visuals, logos, and UI designs with AI-powered creative tools.',
      stats: '100+ designs',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Video,
      title: 'Video Studio',
      description: 'Edit, enhance, and generate video content with advanced AI video processing.',
      stats: '50+ videos',
      color: 'from-blue-500 to-indigo-600'
    }
  ];

  const stats = [
    { icon: Users, value: '50+', label: 'Active Users' },
    { icon: Sparkles, value: '800+', label: 'AI Generations' },
    { icon: TrendingUp, value: '99.5%', label: 'Uptime' },
    { icon: Star, value: '4.5/5', label: 'User Rating' }
  ];

  const journey = [
    { date: 'September 14, 2025', event: 'The Idea', description: 'KroniQ AI was born from a vision to democratize AI creativity' },
    { date: 'September 30, 2025', event: 'Basic Prototype', description: 'Built foundational structure and core architecture' },
    { date: 'October 25, 2025', event: 'First Working Prototype', description: 'Completed first working prototype with AI integrations' },
    { date: 'October 27, 2025', event: 'Published', description: 'Published and launched to the world' }
  ];

  return (
    <div className="relative w-full">
      <PageMeta
        title="AI-Powered Creative Platform"
        description="Create stunning content with KroniQ AI - Your all-in-one platform for AI chat, code generation, design, video editing, and more. Join 50+ active users today."
        keywords="AI platform, AI chat, code generation, design tools, video editing, artificial intelligence, creative AI, KroniQ"
      />
      {/* Optimized Background Orb - Reduced to 1 for better performance */}
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
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00FFF0]/20 via-[#8A2BE2]/20 to-[#00FFF0]/20 border-2 border-[#00FFF0] rounded-2xl backdrop-blur-xl shadow-2xl shadow-[#00FFF0]/30">
              <Crown className="w-6 h-6 text-[#FFD700] animate-bounce" />
              <span className="text-white font-bold text-lg md:text-xl">
                🎉 First 100 Users Get <span className="text-[#00FFF0] text-2xl">5 MILLION</span> Tokens FREE!
              </span>
              <Sparkles className="w-6 h-6 text-[#FFD700] animate-spin-slow" />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
            <span className="block mb-4">One AI.</span>
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-[#00FFF0] via-[#8A2BE2] to-[#00FFF0] bg-clip-text text-transparent blur-lg animate-gradient bg-[length:200%_auto]">
                Infinite Creation.
              </span>
              <span className="relative bg-gradient-to-r from-[#00FFF0] via-[#8A2BE2] to-[#00FFF0] bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Infinite Creation.
              </span>
            </span>
          </h1>

          <p className="text-2xl md:text-3xl text-white/80 mb-12 max-w-4xl mx-auto font-light leading-relaxed">
            Harness the power of <span className="text-[#00FFF0] font-semibold">multiple AI models</span> in one unified platform. Create, code, design, and deploy with <span className="text-[#8A2BE2] font-semibold">unprecedented speed</span>.
          </p>

          {/* Under Construction Notice */}
          <div className="mb-8 px-6 py-3 glass-panel border border-[#00FFF0]/30 rounded-xl max-w-2xl mx-auto">
            <p className="text-white/80 text-center text-sm">
              🚧 <span className="font-semibold text-[#00FFF0]">Beta Version</span> - We're still building! Some features may be under development or not fully functional yet.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <button
              onClick={() => {
                trackGetStartedClick('home');
                onGetStarted();
              }}
              className="group relative bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white px-10 py-5 rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-[#00FFF0]/50 transition-all duration-300 hover:scale-105 flex items-center gap-3 overflow-hidden"
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
              className="glass-panel border-2 border-white/30 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-[#00FFF0]/50"
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
                  <Icon className="w-5 h-5 text-[#00FFF0]" />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <Floating3DCard key={idx} delay={idx * 100}>
                  <div className="glass-panel rounded-2xl p-8 border border-white/20 text-center group hover:border-[#00FFF0]/50 transition-all duration-500">
                    <Icon className="w-8 h-8 mx-auto mb-4 text-[#00FFF0] group-hover:scale-125 transition-transform duration-300" />
                    <div className="text-4xl font-bold text-white mb-2 group-hover:text-[#00FFF0] transition-colors">
                      {stat.value}
                    </div>
                    <div className="text-white/60 text-sm">{stat.label}</div>
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
              <span className="text-[#00FFF0] text-sm font-bold tracking-wider">POWERFUL FEATURES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up">
              Everything You Need,{' '}
              <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                All in One Place
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Four specialized studios powered by cutting-edge AI models, designed to transform your creative workflow.
            </p>
          </div>

          {/* Interactive Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isActive = activeFeature === idx;

              return (
                <Floating3DCard key={idx} delay={idx * 150}>
                  <div
                    onMouseEnter={() => setActiveFeature(idx)}
                    className={`relative group glass-panel rounded-3xl p-10 border transition-all duration-500 overflow-hidden cursor-pointer ${
                      isActive
                        ? 'border-[#00FFF0]/60 shadow-2xl shadow-[#00FFF0]/20 scale-105'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-500 ${
                      isActive ? 'opacity-20' : 'group-hover:opacity-10'
                    }`} />

                    {/* Animated Border Glow */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-3xl opacity-75">
                        <div className="absolute inset-[-2px] bg-gradient-to-r from-[#00FFF0] via-[#8A2BE2] to-[#00FFF0] rounded-3xl animate-spin-slow blur-sm" />
                      </div>
                    )}

                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.color} opacity-20 flex items-center justify-center mb-6 transition-all duration-500 ${
                        isActive ? 'scale-110 opacity-30' : 'group-hover:scale-105'
                      }`}>
                        <Icon className={`w-10 h-10 text-white transition-all duration-500 ${
                          isActive ? 'scale-125' : ''
                        }`} />
                      </div>

                      {/* Content */}
                      <h3 className="text-3xl font-bold text-white mb-4">{feature.title}</h3>
                      <p className="text-white/70 leading-relaxed mb-6 text-lg">{feature.description}</p>

                      {/* Stats Badge */}
                      <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full border border-white/20">
                        <Sparkles className="w-4 h-4 text-[#00FFF0]" />
                        <span className="text-sm text-white/80 font-semibold">{feature.stats}</span>
                      </div>
                    </div>
                  </div>
                </Floating3DCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Journey Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                Our Journey
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              From idea to reality - building the future of AI creativity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {journey.map((milestone, idx) => (
              <Floating3DCard key={idx} delay={idx * 100}>
                <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-[#00FFF0]/30 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6 text-[#00FFF0]" />
                  </div>
                  <div className="text-sm text-[#00FFF0] font-semibold mb-2">{milestone.date}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{milestone.event}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{milestone.description}</p>
                </div>
              </Floating3DCard>
            ))}
          </div>
        </div>
      </section>

      {/* AI Models Showcase */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 glass-panel rounded-full border border-white/20 mb-8 animate-fade-in">
              <span className="text-[#00FFF0] text-sm font-bold tracking-wider">150+ AI MODELS</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                The Most Comprehensive
              </span>
              <br />AI Model Collection
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Access models from OpenAI, Anthropic, Google, Meta, Mistral, and 15+ more providers
            </p>
          </div>

          {/* Featured Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* GPT-4o */}
            <Floating3DCard>
              <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-[#00FFF0]/50 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">GPT-4o</h3>
                <p className="text-sm text-white/60 mb-3">Most capable OpenAI model with vision</p>
                <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">OpenAI</span>
              </div>
            </Floating3DCard>

            {/* Claude 3.5 Sonnet */}
            <Floating3DCard delay={100}>
              <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-[#8A2BE2]/50 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Claude 3.5 Sonnet</h3>
                <p className="text-sm text-white/60 mb-3">Superior reasoning and coding</p>
                <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold">Anthropic</span>
              </div>
            </Floating3DCard>

            {/* Gemini 2.0 Flash */}
            <Floating3DCard delay={200}>
              <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gemini 2.0 Flash</h3>
                <p className="text-sm text-white/60 mb-3">Fast multimodal AI</p>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">Google</span>
              </div>
            </Floating3DCard>

            {/* Llama 3.3 70B */}
            <Floating3DCard delay={300}>
              <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Llama 3.3 70B</h3>
                <p className="text-sm text-white/60 mb-3">Open-source powerhouse</p>
                <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold">Meta</span>
              </div>
            </Floating3DCard>
          </div>

          {/* Model Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chat Models */}
            <Floating3DCard>
              <div className="glass-panel rounded-2xl p-8 border border-white/10 hover:border-[#00FFF0]/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00FFF0]/20 to-blue-600/20 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-[#00FFF0]" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{AI_MODELS.filter(m => m.category === 'chat').length}+</div>
                    <div className="text-sm text-white/60">Models</div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Chat AI</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  GPT-5.1, Claude 4, Gemini 2.0, Llama 4, Mistral Large, DeepSeek V3.2, Qwen 2.5, and more
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">OpenAI</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Anthropic</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Google</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">+15 more</span>
                </div>
              </div>
            </Floating3DCard>

            {/* Code Models */}
            <Floating3DCard delay={100}>
              <div className="glass-panel rounded-2xl p-8 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center">
                    <Code className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{AI_MODELS.filter(m => m.category === 'code').length}+</div>
                    <div className="text-sm text-white/60">Models</div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Code AI</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  GPT-5.1 Codex, Codestral, DeepSeek Coder, Qwen 2.5 Coder, and specialized coding models
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Mistral</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">DeepSeek</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Qwen</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">OpenAI</span>
                </div>
              </div>
            </Floating3DCard>

            {/* Media Models */}
            <Floating3DCard delay={200}>
              <div className="glass-panel rounded-2xl p-8 border border-white/10 hover:border-pink-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-600/20 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-pink-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{AI_MODELS.filter(m => ['image', 'video', 'audio'].includes(m.category)).length}+</div>
                    <div className="text-sm text-white/60">Models</div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Media AI</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Sora 2, Veo 3, Flux Pro, Suno AI, ElevenLabs TTS, and cutting-edge media models
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Image</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Video</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Audio</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">Music</span>
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
                  <div className="glass-panel rounded-xl p-4 border border-white/10 hover:border-[#00FFF0]/30 transition-all duration-300 text-center">
                    <div className="text-white font-semibold text-sm">{provider}</div>
                  </div>
                </Floating3DCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
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
                  <div className={`relative glass-panel rounded-3xl p-8 border-2 transition-all duration-300 group ${
                    pack.popular
                      ? 'border-[#00FFF0] shadow-2xl shadow-[#00FFF0]/20 scale-105'
                      : 'border-white/20 hover:border-white/40'
                  }`}>
                    {pack.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="px-6 py-2 rounded-full bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white text-sm font-bold shadow-lg">
                          💎 MOST POPULAR
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${
                        pack.popular ? 'from-[#00FFF0] to-[#8A2BE2]' : 'from-white/10 to-white/5'
                      } flex items-center justify-center`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="text-3xl font-bold text-white mb-2">{pack.name}</h3>

                      <div className="mb-6">
                        <div className="text-5xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent mb-2">
                          {(totalTokens / 1000).toFixed(0)}K
                        </div>
                        <div className="text-white/60">tokens</div>
                        {pack.bonusTokens > 0 && (
                          <div className="mt-2 text-sm text-[#00FFF0]">
                            + {(pack.bonusTokens / 1000).toFixed(0)}K bonus!
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="glass-panel rounded-xl p-4 border border-white/10">
                          <div className="text-white/60 text-sm mb-1">One-Time</div>
                          <div className="text-3xl font-bold text-white">${pack.priceUsd}</div>
                        </div>
                        <div className="glass-panel rounded-xl p-4 border border-[#00FFF0]/30 relative overflow-hidden">
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-bold">
                              SAVE ${savings}
                            </span>
                          </div>
                          <div className="text-white/60 text-sm mb-1">Monthly</div>
                          <div className="text-3xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                            ${monthlyPrice}
                          </div>
                          <div className="text-xs text-white/40 mt-1">per month</div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#00FFF0]" />
                          <span>Access to all AI models</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#00FFF0]" />
                          <span>Never expires</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#00FFF0]" />
                          <span>Cancel subscription anytime</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#00FFF0]" />
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
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                          pack.popular
                            ? 'bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white hover:shadow-xl hover:shadow-[#00FFF0]/50 hover:scale-105'
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
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <Floating3DCard>
            <div className="relative glass-panel rounded-3xl p-16 border-2 border-white/20 backdrop-blur-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFF0]/10 via-[#8A2BE2]/10 to-[#00FFF0]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 text-center">
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  Ready to{' '}
                  <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                    Create Magic?
                  </span>
                </h2>
                <p className="text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
                  Join over 500,000 creators building the future with AI
                </p>

                <button
                  onClick={() => {
                    trackGetStartedClick('home');
                    onGetStarted();
                  }}
                  className="group bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white px-12 py-6 rounded-2xl font-bold text-2xl hover:shadow-2xl hover:shadow-[#00FFF0]/50 transition-all duration-300 hover:scale-110 inline-flex items-center gap-4"
                >
                  <span>Start Creating Now</span>
                  <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </Floating3DCard>
        </div>
      </section>
    </div>
  );
};
