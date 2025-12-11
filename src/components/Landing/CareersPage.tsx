import React, { useState, useEffect } from 'react';
import { Rocket, Globe, TrendingUp, Code, Lightbulb, Award, Briefcase } from 'lucide-react';
import { Floating3DCard, AnimatedGradientOrb } from './FloatingElements';
import { MouseParticles } from './MouseParticles';

export const CareersPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const whyJoinReasons = [
    {
      icon: Rocket,
      title: 'Shape the Future of AI',
      description: 'Work on cutting-edge AI technology that empowers millions of creators worldwide. Your code and ideas will directly impact how people create, innovate, and express themselves.',
      highlight: 'Direct Impact'
    },
    {
      icon: Globe,
      title: 'Remote-First Culture',
      description: 'Work from anywhere in the world with flexible hours. We believe in results over presence, giving you the freedom to work when and where you\'re most productive.',
      highlight: 'True Flexibility'
    },
    {
      icon: TrendingUp,
      title: 'Rapid Growth & Learning',
      description: 'Join a fast-growing startup where you\'ll wear multiple hats and learn quickly. Access to courses, conferences, and mentorship to accelerate your career growth.',
      highlight: 'Career Acceleration'
    },
    {
      icon: Code,
      title: 'Modern Tech Stack',
      description: 'Work with the latest technologies including React, TypeScript, Node.js, Firebase, and cutting-edge AI APIs. Use the best tools for the job.',
      highlight: 'Latest Technology'
    },
    {
      icon: Lightbulb,
      title: 'Innovation & Autonomy',
      description: 'Your ideas matter here. We encourage experimentation, innovation, and taking calculated risks. Own your projects from conception to launch.',
      highlight: 'Ownership Culture'
    },
    {
      icon: Award,
      title: 'Competitive & Fair',
      description: 'Market-competitive salaries, equity options, and transparent compensation. We believe in rewarding talent fairly and providing clear growth paths.',
      highlight: 'Fair Compensation'
    }
  ];

  return (
    <div className="relative w-full pb-20">
      <MouseParticles />
      <AnimatedGradientOrb className="top-40 right-10 w-96 h-96" />
      <AnimatedGradientOrb className="bottom-40 left-10 w-[500px] h-[500px]" />

      {/* Hero Section */}
      <section className={`relative pt-40 pb-20 px-4 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-6 py-3 glass-panel rounded-full border border-white/20 mb-8">
            <span className="text-[#EC4899] text-sm font-bold tracking-wider">JOIN OUR TEAM</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Build the Future of{' '}
            <span className="bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] bg-clip-text text-transparent">
              AI Creativity
            </span>
          </h1>

          <p className="text-2xl text-white/70 leading-relaxed max-w-3xl mx-auto">
            Join a team of passionate innovators building the next generation of AI-powered creative tools
          </p>
        </div>
      </section>

      {/* Why Join KroniQ Section */}
      <section className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Join KroniQ?
            </h2>
            <p className="text-xl text-white/60">
              More than a job - join a mission to democratize AI creativity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {whyJoinReasons.map((reason, idx) => {
              const Icon = reason.icon;
              return (
                <Floating3DCard key={idx} delay={idx * 100}>
                  <div className="glass-panel rounded-2xl p-8 border border-white/10 hover:border-[#EC4899]/30 transition-all duration-300 h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#EC4899]/20 to-[#8B5CF6]/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-[#EC4899]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-2xl font-bold text-white">{reason.title}</h3>
                          <span className="px-3 py-1 text-xs font-bold text-[#EC4899] bg-[#EC4899]/10 rounded-full border border-[#EC4899]/30 whitespace-nowrap ml-2">
                            {reason.highlight}
                          </span>
                        </div>
                        <p className="text-white/70 leading-relaxed">{reason.description}</p>
                      </div>
                    </div>
                  </div>
                </Floating3DCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* No Open Positions Section */}
      <section className="relative px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] bg-clip-text text-transparent">
                Open Positions
              </span>
            </h2>
          </div>

          {/* No Positions Available Card */}
          <div className="max-w-2xl mx-auto">
            <Floating3DCard>
              <div className="glass-panel rounded-3xl p-12 border border-white/10 text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#EC4899]/20 to-[#8B5CF6]/20 flex items-center justify-center mb-8">
                  <Briefcase className="w-10 h-10 text-[#EC4899]" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">No Open Positions</h3>
                <p className="text-lg text-white/70 mb-6 max-w-md mx-auto">
                  We don't have any open positions at the moment, but we're always looking for talented people. Check back soon or get in touch!
                </p>
                <p className="text-white/50 text-sm">
                  Follow us on social media for job announcements
                </p>
              </div>
            </Floating3DCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel rounded-3xl p-12 border border-[#EC4899]/30 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#EC4899]/10 to-[#8B5CF6]/10" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Want to Connect?
              </h2>
              <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                Even if we don't have open positions, we'd love to hear from talented people. Send us your resume and let's talk!
              </p>
              <button
                onClick={() => window.location.href = '/contact'}
                className="px-8 py-4 glass-panel border border-white/20 text-white rounded-xl font-bold text-lg hover:border-[#EC4899]/50 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Get in Touch
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
