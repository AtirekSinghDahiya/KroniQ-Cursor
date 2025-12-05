import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Clock, Rocket, Globe, TrendingUp, Code, Lightbulb, Award } from 'lucide-react';
import { Floating3DCard, AnimatedGradientOrb } from './FloatingElements';
import { JobApplicationForm } from './JobApplicationForm';
import { supabase } from '../../lib/supabase';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary_range: string | null;
  is_active: boolean;
}

export const CareersPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [positions, setPositions] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadJobPostings();
  }, []);

  const loadJobPostings = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error loading job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (position: JobPosting) => {
    setSelectedJob(position);
    setShowApplicationForm(true);
  };

  const handleCloseForm = () => {
    setShowApplicationForm(false);
    setSelectedJob(null);
  };

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
      description: 'Work with the latest technologies including React, TypeScript, Node.js, Firebase, Supabase, and cutting-edge AI APIs. Use the best tools for the job.',
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
      <AnimatedGradientOrb className="top-40 right-10 w-96 h-96" />
      <AnimatedGradientOrb className="bottom-40 left-10 w-[500px] h-[500px]" />

      {/* Hero Section */}
      <section className={`relative pt-40 pb-20 px-4 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-6 py-3 glass-panel rounded-full border border-white/20 mb-8">
            <span className="text-[#00FFF0] text-sm font-bold tracking-wider">JOIN OUR TEAM</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Build the Future of{' '}
            <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
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
                  <div className="glass-panel rounded-2xl p-8 border border-white/10 hover:border-[#00FFF0]/30 transition-all duration-300 h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-[#00FFF0]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-2xl font-bold text-white">{reason.title}</h3>
                          <span className="px-3 py-1 text-xs font-bold text-[#00FFF0] bg-[#00FFF0]/10 rounded-full border border-[#00FFF0]/30 whitespace-nowrap ml-2">
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

      {/* Open Positions */}
      <section className="relative px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                Open Positions
              </span>
            </h2>
            <p className="text-lg text-white/60">
              {loading ? 'Loading...' : `${positions.length} openings across multiple departments`}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-[#00FFF0]/20 border-t-[#00FFF0] rounded-full animate-spin"></div>
              <p className="text-white/60 mt-4">Loading positions...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/60 text-lg">No open positions at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {positions.map((position, idx) => (
                <Floating3DCard key={position.id} delay={idx * 50}>
                  <div className="glass-panel rounded-3xl p-8 border border-white/10 hover:border-[#00FFF0]/30 transition-all duration-300 group">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-7 h-7 text-[#00FFF0]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-2">{position.title}</h3>
                          <p className="text-white/70 mb-4">{position.description}</p>

                          <div className="flex flex-wrap gap-3 mb-6">
                            <div className="flex items-center gap-2 px-3 py-1 glass-panel rounded-full border border-white/10">
                              <Briefcase className="w-4 h-4 text-[#00FFF0]" />
                              <span className="text-sm text-white/80">{position.department}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 glass-panel rounded-full border border-white/10">
                              <MapPin className="w-4 h-4 text-[#00FFF0]" />
                              <span className="text-sm text-white/80">{position.location}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 glass-panel rounded-full border border-white/10">
                              <Clock className="w-4 h-4 text-[#00FFF0]" />
                              <span className="text-sm text-white/80">{position.type}</span>
                            </div>
                            {position.salary_range && (
                              <div className="flex items-center gap-2 px-3 py-1 glass-panel rounded-full border border-green-500/30 bg-green-500/10">
                                <DollarSign className="w-4 h-4 text-green-300" />
                                <span className="text-sm text-green-300 font-semibold">{position.salary_range}</span>
                              </div>
                            )}
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-semibold text-white/80 mb-3">Requirements:</h4>
                              <ul className="space-y-2">
                                {position.requirements.map((req, rIdx) => (
                                  <li key={rIdx} className="text-sm text-white/60 flex items-start gap-2">
                                    <span className="text-[#00FFF0] mt-1">•</span>
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-white/80 mb-3">Responsibilities:</h4>
                              <ul className="space-y-2">
                                {position.responsibilities.slice(0, 4).map((resp, rIdx) => (
                                  <li key={rIdx} className="text-sm text-white/60 flex items-start gap-2">
                                    <span className="text-[#00FFF0] mt-1">•</span>
                                    <span>{resp}</span>
                                  </li>
                                ))}
                                {position.responsibilities.length > 4 && (
                                  <li className="text-sm text-white/40 italic">
                                    + {position.responsibilities.length - 4} more...
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyClick(position)}
                        className="w-full md:w-auto md:self-end px-8 py-3 bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white rounded-xl font-semibold hover:scale-105 active:scale-95 transition-all duration-300"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </Floating3DCard>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel rounded-3xl p-12 border border-[#00FFF0]/30 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFF0]/10 to-[#8A2BE2]/10" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Don't See Your Role?
              </h2>
              <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                We're always looking for talented people. Send us your resume and let's talk about how you can contribute!
              </p>
              <button
                onClick={() => window.location.href = '/contact'}
                className="px-8 py-4 glass-panel border border-white/20 text-white rounded-xl font-bold text-lg hover:border-[#00FFF0]/50 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Get in Touch
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Modal */}
      {showApplicationForm && selectedJob && (
        <JobApplicationForm
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};
