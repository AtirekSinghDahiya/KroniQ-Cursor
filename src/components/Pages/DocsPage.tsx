import React, { useState } from 'react';
import { X, Book, MessageSquare, Code, Palette, Settings, Shield, Zap, Coins } from 'lucide-react';

interface DocsPageProps {
  onClose: () => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Book },
    { id: 'pricing', title: 'Pricing & Tokens', icon: Coins },
    { id: 'ai-chat', title: 'AI Chat', icon: MessageSquare },
    { id: 'code-studio', title: 'Code Studio', icon: Code },
    { id: 'design-studio', title: 'Design Studio', icon: Palette },
    { id: 'settings', title: 'Settings & Profile', icon: Settings },
    { id: 'security', title: 'Security', icon: Shield },
    { id: 'api', title: 'API Reference', icon: Zap },
  ];

  const content: Record<string, any> = {
    'getting-started': {
      title: 'Getting Started with KroniQ',
      sections: [
        {
          heading: 'Welcome to KroniQ',
          content: 'KroniQ is your all-in-one AI platform for chat, code, and design. Get started in minutes and unlock the power of advanced AI models.',
        },
        {
          heading: 'Quick Start Guide',
          content: 'Follow these steps to get started:\n\n1. Create your account or sign in\n2. Choose your AI model preference\n3. Start chatting or creating projects\n4. Customize your AI assistant personality\n5. Explore Code Studio and Design Studio',
        },
        {
          heading: 'System Requirements',
          content: 'KroniQ works on any modern browser:\n• Chrome 90+\n• Firefox 88+\n• Safari 14+\n• Edge 90+\n\nNo installation required!',
        },
      ],
    },
    'pricing': {
      title: 'Pricing & Token System',
      sections: [
        {
          heading: 'How Token-Based Billing Works',
          content: 'KroniQ uses a fair, transparent token-based pricing system:\n\n• You only pay for what you use\n• Tokens never expire\n• No hidden fees or subscriptions (unless you choose monthly auto-refill)',
        },
        {
          heading: 'Free vs Paid Tiers',
          content: '🆓 FREE TIER:\n• 10,000 tokens (refreshes daily)\n• Access to 14 free AI models\n• All basic features included\n• Perfect for trying out KroniQ\n\n💎 PAID TIER:\n• Purchase tokens as needed\n• Access to ALL 27 AI models (free + premium)\n• Priority support\n• Advanced features\n• Tokens never expire',
        },
        {
          heading: 'Auto-Downgrade System',
          content: 'Smart tier management:\n\n• When you purchase tokens → Upgraded to PAID tier\n• Access all premium AI models\n• Paid tokens used first, then free tokens\n• When paid tokens reach 0 → Auto-downgrade to FREE\n• You keep your free 10,000 daily tokens\n• Can upgrade anytime by purchasing more',
        },
        {
          heading: 'Token Packs Available',
          content: 'Choose from flexible token packs to fit your needs:\n\n• Multiple tiers available\n• One-time purchases or monthly subscriptions\n• Bonus tokens with larger packs\n• Save 10% with monthly auto-refill\n• Visit Billing page to see current pricing',
        },
        {
          heading: 'Monthly Subscriptions',
          content: 'Save with automatic monthly refills:\n\n✅ BENEFITS:\n• Automatic token refill every 30 days\n• Discounts on monthly plans\n• Cancel anytime\n• Keep all unused tokens after cancellation\n• Email notifications before each refill\n\n❌ NO COMMITMENT:\n• No long-term contracts\n• Cancel at end of billing period\n• Tokens remain yours forever\n• Switch back to one-time purchases anytime',
        },
        {
          heading: 'Usage Examples',
          content: 'Typical token consumption:\n\n💬 CHAT MESSAGES:\n• Simple question: 10-50 tokens\n• Detailed conversation: 100-300 tokens\n• Long-form content: 500-2,000 tokens\n\n🖼️ IMAGE GENERATION:\n• Standard image: 200-500 tokens\n• High-quality image: 1,000-3,000 tokens\n\n🎬 VIDEO GENERATION:\n• Short clip (5s): 5,000-10,000 tokens\n• Full video (30s): 30,000-50,000 tokens\n\n💻 CODE GENERATION:\n• Simple function: 50-200 tokens\n• Full component: 500-2,000 tokens\n• Complete app: 5,000-20,000 tokens',
        },
        {
          heading: 'Free Models vs Paid Models',
          content: '🆓 FREE MODELS (14 total):\n• Grok 4 Fast\n• GPT-5 Nano\n• DeepSeek V3.1 Free\n• Nemotron Nano Free\n• Claude Haiku Free\n• Gemini Flash Lite Free\n• And 8 more!\n\n💎 PAID MODELS (13 total):\n• GPT-5 Chat & Pro\n• Claude Sonnet 4.5\n• Gemini 2.5 Flash Image\n• DeepSeek V3.2\n• Llama 4 Maverick\n• And 8 more premium models!',
        },
        {
          heading: 'Best Practices',
          content: 'Get the most from your tokens:\n\n• Start with the FREE tier to test the platform\n• Use free models for simple tasks\n• Reserve paid models for complex work\n• Monitor your usage in the Billing tab\n• Subscribe monthly if you use >$5/month (saves 10%)\n• Buy larger packs for better bonus tokens\n• Tokens stack - free + paid work together',
        },
      ],
    },
    'ai-chat': {
      title: 'AI Chat Assistant',
      sections: [
        {
          heading: 'Using the Chat Interface',
          content: 'The AI Chat interface allows you to have natural conversations with advanced AI models. Simply type your message and press Enter or click Send.',
        },
        {
          heading: 'Supported AI Models',
          content: 'KroniQ supports multiple AI models:\n• OpenAI GPT-4 and GPT-3.5\n• Anthropic Claude\n• Google Gemini\n\nYou can switch between models in your settings.',
        },
        {
          heading: 'Customizing AI Personality',
          content: 'Personalize your AI assistant:\n• Creative - More imaginative and artistic responses\n• Professional - Formal and business-oriented\n• Technical - Detailed technical explanations\n• Casual - Friendly and conversational\n• Funny - Light-hearted and humorous\n• Balanced - Mix of all personalities',
        },
        {
          heading: 'Managing Chat History',
          content: 'All your conversations are automatically saved. You can:\n• Start new chats from the sidebar\n• Search through past conversations\n• Delete conversations you no longer need\n• Export chat history',
        },
      ],
    },
    'code-studio': {
      title: 'Code Studio',
      sections: [
        {
          heading: 'What is Code Studio?',
          content: 'Code Studio is an AI-powered coding environment that helps you write, debug, and optimize code across multiple programming languages.',
        },
        {
          heading: 'Supported Languages',
          content: 'Code Studio supports:\n• JavaScript/TypeScript\n• Python\n• Java\n• C/C++\n• Go\n• Rust\n• PHP\n• Ruby\n• And many more!',
        },
        {
          heading: 'Features',
          content: '• Syntax highlighting\n• Auto-completion\n• Code debugging\n• Code optimization suggestions\n• Real-time collaboration\n• Version control',
        },
      ],
    },
    'design-studio': {
      title: 'Design Studio',
      sections: [
        {
          heading: 'Creating Designs',
          content: 'Design Studio allows you to create stunning visuals with AI assistance. Generate images, mockups, logos, and more using natural language descriptions.',
        },
        {
          heading: 'Available Tools',
          content: '• Image generation\n• Logo creation\n• UI/UX mockups\n• Color palette generator\n• Typography suggestions\n• Layout templates',
        },
      ],
    },
    'settings': {
      title: 'Settings & Profile',
      sections: [
        {
          heading: 'Profile Settings',
          content: 'Customize your profile:\n• Display name\n• Profile photo\n• Bio and location\n• Contact information',
        },
        {
          heading: 'AI Preferences',
          content: 'Configure how AI responds:\n• Personality type\n• Creativity level (1-10)\n• Response length (short, medium, long)\n• Preferred AI model',
        },
        {
          heading: 'Account Settings',
          content: 'Manage your account:\n• Email and password\n• Subscription plan\n• Token usage\n• Billing information',
        },
      ],
    },
    'security': {
      title: 'Security & Privacy',
      sections: [
        {
          heading: 'Data Protection',
          content: 'Your data is protected with:\n• End-to-end encryption\n• Secure authentication\n• Regular security audits\n• GDPR compliance',
        },
        {
          heading: 'Privacy Policy',
          content: 'We take your privacy seriously:\n• Your conversations are private\n• No data is sold to third parties\n• You control your data\n• Right to data deletion',
        },
      ],
    },
    'api': {
      title: 'API Reference',
      sections: [
        {
          heading: 'API Access',
          content: 'API access is available for Pro and Enterprise users. Contact us to get your API key.',
        },
        {
          heading: 'Authentication',
          content: 'All API requests require authentication using Bearer tokens:\n\nAuthorization: Bearer YOUR_API_KEY',
        },
        {
          heading: 'Rate Limits',
          content: 'API rate limits:\n• Free: N/A\n• Pro: 1000 requests/day\n• Enterprise: Unlimited',
        },
      ],
    },
  };

  const activeContent = content[activeSection];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel backdrop-blur-3xl border border-white/20 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex">
        <div className="w-64 border-r border-white/10 flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Book className="w-5 h-5 text-cyan-400" />
              Documentation
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all text-left ${
                    activeSection === section.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 glass-panel backdrop-blur-3xl border-b border-white/10 p-6 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-white">{activeContent.title}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all button-press"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {activeContent.sections.map((section: any, index: number) => (
              <div key={index} className="mb-6 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <h3 className="text-lg font-semibold text-white mb-3">{section.heading}</h3>
                <div className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{section.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
