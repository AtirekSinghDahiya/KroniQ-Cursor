import React from 'react';
import { X, Briefcase, MapPin, Clock, DollarSign, Heart, Users, Zap, Trophy } from 'lucide-react';

interface CareersModalProps {
  onClose: () => void;
}

export const CareersModal: React.FC<CareersModalProps> = ({ onClose }) => {
  const openings = [
    {
      title: 'Senior AI Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$800 - $1000',
      department: 'Engineering',
    },
    {
      title: 'Product Designer',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$800 - $1000',
      department: 'Design',
    },
    {
      title: 'Full Stack Developer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$800 - $1000',
      department: 'Engineering',
    },
    {
      title: 'Customer Success Manager',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$800 - $1000',
      department: 'Customer Success',
    },
    {
      title: 'Marketing Specialist',
      location: 'Remote',
      type: 'Contract',
      salary: '$800 - $1000',
      department: 'Marketing',
    },
  ];

  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health, dental, and vision insurance',
    },
    {
      icon: Users,
      title: 'Remote First',
      description: 'Work from anywhere in the world',
    },
    {
      icon: Zap,
      title: 'Learning Budget',
      description: '$2,000 annual budget for courses and conferences',
    },
    {
      icon: Trophy,
      title: 'Equity',
      description: 'Competitive equity packages for all employees',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel backdrop-blur-3xl border border-white/20 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 glass-panel backdrop-blur-3xl border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-3xl font-bold text-white">Join Our Team</h2>
            <p className="text-white/60 text-sm mt-1">Help us build the future of AI</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all button-press"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-thin max-h-[calc(90vh-100px)]">
          <div className="glass-panel rounded-2xl p-6 mb-6 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/20">
            <h3 className="text-xl font-bold text-white mb-3">Why KroniQ?</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              At KroniQ, we're building the next generation of AI tools that empower creators, developers, and businesses worldwide.
              Join a team of passionate innovators who are shaping the future of technology.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-white font-medium text-sm mb-1">{benefit.title}</h4>
                    <p className="text-white/60 text-xs">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-4">Open Positions</h3>
          <div className="space-y-3">
            {openings.map((job, index) => (
              <div
                key={index}
                className="glass-panel glass-panel-hover rounded-2xl p-5 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">{job.title}</h4>
                    <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                      {job.department}
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all button-press">
                    Apply Now
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 text-white/70 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>{job.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    <span>{job.salary}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 glass-panel rounded-2xl p-6 text-center">
            <Briefcase className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
            <h4 className="text-white font-semibold mb-2">Don't see a perfect fit?</h4>
            <p className="text-white/70 text-sm mb-4">
              We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <button className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all button-press">
              Send Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
