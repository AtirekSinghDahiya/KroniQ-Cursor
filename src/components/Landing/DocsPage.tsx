import React, { useState } from 'react';
import { Book, AlertCircle, HelpCircle, Shield, Coins, Settings, FileText, MessageSquare, Image as ImageIcon, Video, Music, Palette, Zap, Code, Search } from 'lucide-react';
import { AnimatedGradientOrb, Floating3DCard } from './FloatingElements';
import { MouseParticles } from './MouseParticles';

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Book },
    { id: 'studios', title: 'AI Studios', icon: Zap },
    { id: 'tokens', title: 'Tokens & Billing', icon: Coins },
    { id: 'security', title: 'Security', icon: Shield },
    { id: 'faq', title: 'FAQ', icon: HelpCircle },
  ];

  const content: Record<string, any> = {
    'getting-started': {
      title: 'Getting Started',
      sections: [
        {
          heading: 'Welcome to KroniQ AI',
          content: 'KroniQ is your unified platform for AI creativity. We combine state-of-the-art models for text, image, video, and audio generation into a single, cohesive interface.\n\nKey features include:\n• Unified Chat Interface (40+ models)\n• Dedicated visual studios\n• Project-based workflow\n• Secure data handling'
        },
        {
          heading: 'Quick Start Guide',
          content: '1. **Create an Account**: Sign up with Google for instant access.\n2. **Claim Tokens**: New users receive a starter pack of tokens.\n3. **Select a Studio**: Choose from Chat, Image, Video, Music, or PPT based on your goal.\n4. **Start Creating**: Enter your prompt and watch the magic happen.'
        }
      ]
    },
    'studios': {
      title: 'AI Studios Overview',
      sections: [
        {
          heading: 'Chat Studio',
          content: 'Access the world\'s best LLMs in one place.\n\n• **Models**: GPT-4, Claude 3.5, Gemini 1.5, Llama 3, Mistral, and more.\n• **Features**: Code execution, file analysis, web search capabilities.\n• **Best for**: Coding, writing, analysis, and general assistance.'
        },
        {
          heading: 'Image Studio',
          content: 'Generate professional-grade visuals.\n\n• **Capabilities**: Text-to-Image, Image-to-Image, Inpainting.\n• **Styles**: Photorealistic, 3D Render, Anime, Digital Art, Logo Design.\n• **Tips**: Be descriptive with lighting, style, and composition for best results.'
        },
        {
          heading: 'Video Studio',
          content: 'Text-to-Video generation powered by cutting-edge models like Sora and Veo.\n\n• **Duration**: Generate clips up to 10 seconds.\n• **Controls**: Camera motion, style consistency.\n• **Usage**: Marketing clips, social media content, dynamic backgrounds.'
        },
        {
          heading: 'Music & Audio',
          content: 'Compose original soundtracks.\n\n• **Music**: Generate full tracks with specific moods and genres.\n• **Voice**: High-fidelity Text-to-Speech in 50+ languages and accents.\n• **Rights**: You own the copyright to all generated audio.'
        },
        {
          heading: 'PPT Studio',
          content: 'Create presentations in seconds.\n\n• **Input**: Topic, outline, or full text.\n• **Output**: Fully editable .pptx files with layouts and images.\n• **Features**: Auto-formatting, slide notes, and export.'
        }
      ]
    },
    'tokens': {
      title: 'Tokens & Billing',
      sections: [
        {
          heading: 'Understanding Tokens',
          content: 'Tokens are the universal currency on KroniQ. Different models cost different amounts based on their complexity.\n\n• **Chat**: ~1-100 tokens per message\n• **Image**: ~1000-5000 tokens per image\n• **Video**: ~10,000+ tokens per generation\n\nBalance is deducted in real-time. Free daily tokens reset every 24 hours.'
        },
        {
          heading: 'Plans',
          content: '• **Free**: 5,000 daily tokens\n• **Pro**: 2M monthly tokens, priority access\n• **Enterprise**: Unlimited custom quotas'
        }
      ]
    },
    'security': {
      title: 'Security & Privacy',
      sections: [
        {
          heading: 'Data Protection',
          content: 'We prioritize your privacy.\n\n• **Encryption**: All data is encrypted in transit and at rest.\n• **Model Privacy**: "Privacy Mode" ensures your inputs are not used to train models (Enterprise only).\n• **Ownership**: You retain full ownership of all generated content.'
        }
      ]
    },
    'faq': {
      title: 'Frequently Asked Questions',
      sections: [
        {
          heading: 'Can I use generated content commercially?',
          content: 'Yes! You have full commercial rights to everything you generate on KroniQ, subject to applicable laws.'
        },
        {
          heading: 'How do I download my projects?',
          content: 'Every creation is saved to your Projects sidebar. Open a project and look for the "Download" or "Export" icon in the top right.'
        },
        {
          heading: 'What happens if I run out of tokens?',
          content: 'You can wait for the daily free refresh (midnight UTC) or purchase a token pack from the Billing page for instant top-up.'
        }
      ]
    }
  };

  const activeContent = content[activeSection];

  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden">
      <MouseParticles />

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <AnimatedGradientOrb className="top-[-10%] right-[-5%] w-[800px] h-[800px] opacity-20" />
        <AnimatedGradientOrb className="bottom-[-10%] left-[-10%] w-[600px] h-[600px] opacity-20" />

        {/* Orbital Rings for Premium Feel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-white/5 animate-spin-slow-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5 animate-spin-slow" />
      </div>

      <div className="relative z-10 pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 mb-6">
            <Book className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-[#8B5CF6] text-xs font-bold tracking-widest uppercase">Documentation</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            KroniQ <span className="bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] bg-clip-text text-transparent">Knowledge Base</span>
          </h1>

          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative flex items-center bg-[#0a0a0f] border border-white/10 rounded-xl p-4 shadow-2xl">
              <Search className="w-6 h-6 text-white/40 mr-4" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="bg-transparent border-none outline-none text-white w-full placeholder-white/40 text-lg"
              />
              <span className="text-xs text-white/30 border border-white/10 px-2 py-1 rounded hidden md:block">CMD + K</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="glass-panel rounded-2xl p-4 border border-white/10 sticky top-28 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-left group
                        ${isActive
                          ? 'bg-gradient-to-r from-[#EC4899]/20 to-[#8B5CF6]/20 text-white border border-[#EC4899]/30 shadow-lg shadow-[#EC4899]/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                      <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#EC4899]' : 'text-white/40 group-hover:text-white'}`} />
                      <span className="font-medium">{section.title}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#EC4899] shadow-[0_0_10px_#EC4899]" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <Floating3DCard>
              <div className="glass-panel rounded-3xl p-8 md:p-12 border border-white/10 bg-[#0d1117]/80 backdrop-blur-xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EC4899]/20 to-[#8B5CF6]/20 flex items-center justify-center border border-[#EC4899]/20">
                    {(() => {
                      const iconMap: any = { 'getting-started': Book, 'studios': Zap, 'tokens': Coins, 'security': Shield, 'faq': HelpCircle };
                      const CurrentIcon = iconMap[activeSection];
                      return <CurrentIcon className="w-8 h-8 text-[#EC4899]" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{activeContent.title}</h2>
                    <p className="text-white/50 mt-1">Found {activeContent.sections.length} articles in this section</p>
                  </div>
                </div>

                <div className="space-y-12">
                  {activeContent.sections.map((section: any, idx: number) => (
                    <div key={idx} className="group">
                      <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 group-hover:text-[#8B5CF6] transition-colors">
                        {section.heading}
                      </h3>
                      <div className="text-white/70 text-lg leading-relaxed whitespace-pre-line pl-4 border-l-2 border-white/10 group-hover:border-[#EC4899] transition-colors">
                        {section.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback Section */}
                <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between">
                  <span className="text-white/40 text-sm">Was this article helpful?</span>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors">Yes</button>
                    <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors">No</button>
                  </div>
                </div>
              </div>
            </Floating3DCard>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#8B5CF6]/30 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="text-white font-bold mb-2">Community Support</h4>
                <p className="text-white/50 text-sm">Join our Discord community to chat with other creators.</p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-[#EC4899]/30 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4 text-pink-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-white font-bold mb-2">Submit a Ticket</h4>
                <p className="text-white/50 text-sm">Need direct help? Open a support ticket.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
