import React, { useState, useEffect } from 'react';
import { MessageSquare, Image, Video, Music, Code, Palette, Mic, Sparkles, Check, Crown } from 'lucide-react';
import { Floating3DCard, AnimatedGradientOrb } from './FloatingElements';

export const ServicesPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const services = [
    {
      icon: MessageSquare,
      title: 'AI Chat & Assistance',
      description: 'Intelligent conversations with context-aware AI assistants',
      features: [
        'Multiple AI models (GPT-4, Claude, Gemini, and more)',
        'Context-aware conversations with memory',
        'Custom system prompts and personalities',
        'Multi-turn dialogue capabilities',
        'Document analysis and Q&A',
        'Real-time streaming responses'
      ],
      available: true,
      color: 'from-cyan-500 to-blue-600'
    },
    {
      icon: Image,
      title: 'Image Generation',
      description: 'Create stunning images from text descriptions',
      features: [
        'DALL-E 3, Stable Diffusion, Midjourney-style models',
        'Custom styles and art directions',
        'High-resolution outputs up to 4K',
        'Batch generation capabilities',
        'Image editing and enhancement',
        'Multiple aspect ratios'
      ],
      available: true,
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Video,
      title: 'Video Generation & Editing',
      description: 'Generate and edit videos with AI-powered tools',
      features: [
        'Sora-2, Runway Gen-3, Kling AI, Veo-3',
        'Text-to-video generation',
        'Image-to-video animation',
        'Custom duration and resolution',
        'Video enhancement and upscaling',
        'Multiple style presets'
      ],
      available: true,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      icon: Music,
      title: 'Music & Audio Generation',
      description: 'Create original music and soundtracks with AI',
      features: [
        'Suno AI integration',
        'Custom genre and mood selection',
        'Instrumental and vocal tracks',
        'Multiple duration options',
        'High-quality audio output',
        'Royalty-free music creation'
      ],
      available: true,
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Mic,
      title: 'Voice & Speech',
      description: 'Text-to-speech and voice cloning capabilities',
      features: [
        'Natural-sounding voice synthesis',
        'Multiple languages and accents',
        'Custom voice characteristics',
        'Emotion and tone control',
        'High-quality audio output',
        'Voice cloning (coming soon)'
      ],
      available: true,
      color: 'from-orange-500 to-amber-600'
    },
    {
      icon: Code,
      title: 'Code Generation',
      description: 'AI-powered coding assistance and generation',
      features: [
        'Multi-language code generation',
        'Bug detection and fixing',
        'Code optimization suggestions',
        'Documentation generation',
        'Code explanation and tutorials',
        'Framework-specific assistance'
      ],
      available: true,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Palette,
      title: 'Design & UI/UX',
      description: 'Create professional designs and interfaces',
      features: [
        'Logo and brand design',
        'UI/UX mockup generation',
        'Color palette suggestions',
        'Typography recommendations',
        'Layout and composition tools',
        'Design system creation'
      ],
      available: true,
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: Sparkles,
      title: 'Advanced AI Features',
      description: 'Cutting-edge AI capabilities',
      features: [
        '3D model generation (coming soon)',
        'AI avatar creation (coming soon)',
        'Real-time collaboration (coming soon)',
        'Custom AI model fine-tuning (coming soon)',
        'API access for developers (coming soon)',
        'Batch processing workflows (coming soon)'
      ],
      available: false,
      color: 'from-fuchsia-500 to-pink-600'
    }
  ];

  const allModels = [
    { name: 'GPT-4 Turbo', category: 'Chat', provider: 'In-house' },
    { name: 'Claude 3 Opus', category: 'Chat', provider: 'In-house' },
    { name: 'Gemini Pro', category: 'Chat', provider: 'In-house' },
    { name: 'DALL-E 3', category: 'Image', provider: 'In-house' },
    { name: 'Stable Diffusion XL', category: 'Image', provider: 'In-house' },
    { name: 'Sora-2', category: 'Video', provider: 'In-house' },
    { name: 'Runway Gen-3', category: 'Video', provider: 'In-house' },
    { name: 'Kling AI', category: 'Video', provider: 'In-house' },
    { name: 'Veo-3', category: 'Video', provider: 'In-house' },
    { name: 'Suno AI', category: 'Music', provider: 'In-house' },
    { name: 'ElevenLabs', category: 'Voice', provider: 'In-house' },
    { name: 'And many more...', category: 'All', provider: 'In-house' }
  ];

  return (
    <div className="relative w-full pb-20">
      <AnimatedGradientOrb className="top-40 right-10 w-96 h-96" />
      <AnimatedGradientOrb className="bottom-40 left-10 w-[500px] h-[500px]" />

      {/* Hero Section */}
      <section className={`relative pt-40 pb-20 px-4 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-6 py-3 glass-panel rounded-full border border-white/20 mb-8">
            <span className="text-[#00FFF0] text-sm font-bold tracking-wider">OUR SERVICES</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Everything You Need for{' '}
            <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
              AI Creation
            </span>
          </h1>

          <p className="text-2xl text-white/70 leading-relaxed max-w-3xl mx-auto">
            Access the world's most powerful AI models and tools - all in one platform
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <Floating3DCard key={idx} delay={idx * 100}>
                  <div className="glass-panel rounded-3xl p-8 border border-white/10 hover:border-[#00FFF0]/30 transition-all duration-300 group h-full relative overflow-hidden">
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                    {/* Status Badge */}
                    {service.available ? (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                        <span className="text-green-300 text-xs font-bold">AVAILABLE</span>
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                        <span className="text-orange-300 text-xs font-bold">COMING SOON</span>
                      </div>
                    )}

                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} opacity-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-2xl font-bold text-white mb-3">{service.title}</h3>
                      <p className="text-white/60 mb-6 leading-relaxed">{service.description}</p>

                      {/* Features List */}
                      <ul className="space-y-2">
                        {service.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2 text-sm text-white/70">
                            <Check className="w-4 h-4 text-[#00FFF0] mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Floating3DCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Models Section */}
      <section className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                Powered by the Best
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              We integrate with the world's leading AI models to give you the best results
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-8 md:p-12 border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allModels.map((model, idx) => (
                <div key={idx} className="glass-panel rounded-xl p-4 border border-white/10 hover:border-[#00FFF0]/30 transition-all duration-300 group">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-[#00FFF0]" />
                    <span className="text-xs text-[#00FFF0] font-semibold">{model.category}</span>
                  </div>
                  <h4 className="text-white font-semibold mb-1">{model.name}</h4>
                  <p className="text-xs text-white/50">{model.provider}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel rounded-3xl p-12 border border-[#00FFF0]/30 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFF0]/10 to-[#8A2BE2]/10" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Create?
              </h2>
              <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                Start using all these powerful AI tools today with our flexible token-based pricing
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-8 py-4 bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white rounded-xl font-bold text-lg shadow-2xl shadow-[#00FFF0]/30 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
