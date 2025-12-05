import React, { useState } from 'react';
import { Book, AlertCircle, HelpCircle, Shield, Coins, Settings, FileText } from 'lucide-react';
import { AnimatedGradientOrb, Floating3DCard } from './FloatingElements';

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Book },
    { id: 'account', title: 'Account & Setup', icon: Settings },
    { id: 'tokens', title: 'Understanding Tokens', icon: Coins },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertCircle },
    { id: 'security', title: 'Security & Privacy', icon: Shield },
    { id: 'faq', title: 'FAQ', icon: HelpCircle },
  ];

  const content: Record<string, any> = {
    'getting-started': {
      title: 'Getting Started with KroniQ',
      sections: [
        {
          heading: 'Welcome to KroniQ AI',
          content: 'KroniQ is your all-in-one AI platform for creating with AI. Get started in minutes and explore powerful AI capabilities for chat, images, videos, music, code, and more.'
        },
        {
          heading: 'Creating Your Account',
          content: '1. Click "Get Started" on the homepage\n2. Sign up with your email address\n3. Verify your email (check spam folder if needed)\n4. Complete your profile setup\n5. Start creating immediately with free daily tokens'
        },
        {
          heading: 'System Requirements',
          content: 'KroniQ works on any modern browser:\n• Chrome 90+\n• Firefox 88+\n• Safari 14+\n• Edge 90+\n\nRecommended:\n• Stable internet connection (5+ Mbps)\n• Updated browser for best performance\n• JavaScript enabled'
        },
        {
          heading: 'First Steps',
          content: '1. Explore the interface and available features\n2. Try different AI models with your free tokens\n3. Save your favorite creations to projects\n4. Check your token balance regularly\n5. Upgrade when you need more tokens'
        }
      ]
    },
    'account': {
      title: 'Account & Setup',
      sections: [
        {
          heading: 'Managing Your Profile',
          content: 'Access your profile settings to:\n• Update your email and password\n• Set your display name\n• Choose your theme preference\n• Manage notification settings\n• View your account activity'
        },
        {
          heading: 'Email Verification',
          content: 'Why verify your email?\n• Secure your account\n• Receive important updates\n• Enable password recovery\n• Access premium features\n\nDidn\'t receive the email?\n• Check spam/junk folder\n• Add kroniq.ca@gmail.com to contacts\n• Request a new verification email\n• Contact support if issues persist'
        },
        {
          heading: 'Password & Security',
          content: 'Best practices:\n• Use a strong, unique password\n• Don\'t share your credentials\n• Log out on shared devices\n• Enable browser password manager\n• Update password if compromised\n\nForgot password?\n• Click "Forgot Password" on login\n• Check your email for reset link\n• Link expires in 1 hour\n• Contact support if needed'
        },
        {
          heading: 'Subscription Management',
          content: 'If you have an active subscription:\n• View details in Billing section\n• See next renewal date\n• Change or cancel anytime\n• Keep unused tokens after cancellation\n• No refunds on partial usage\n\nCanceling subscription:\n• Go to Billing > Manage Subscription\n• Click "Cancel Subscription"\n• Confirm cancellation\n• Access continues until period ends'
        }
      ]
    },
    'tokens': {
      title: 'Understanding Tokens',
      sections: [
        {
          heading: 'What Are Tokens?',
          content: 'Tokens are KroniQ\'s virtual currency used to access AI features. Think of them like credits:\n• Each AI request consumes tokens\n• Different features use different amounts\n• Free users get daily tokens\n• Purchased tokens never expire'
        },
        {
          heading: 'How Many Tokens Do I Need?',
          content: 'General estimates:\n• Simple chat: Light usage\n• Detailed conversation: Moderate usage\n• Image generation: Medium usage\n• Short video: Higher usage\n• Code generation: Varies by complexity\n• Music creation: Moderate to high usage\n\nNote: Actual usage varies based on complexity and model choice. Check the dashboard for real-time usage.'
        },
        {
          heading: 'Checking Your Balance',
          content: 'View your token balance:\n• Top-right corner of dashboard\n• Billing section for detailed history\n• Real-time updates after each request\n• Separate counters for free vs paid tokens\n\nLow balance warnings:\n• Alert when balance is low\n• Reminder to purchase more\n• Option to upgrade plan'
        },
        {
          heading: 'Purchasing Tokens',
          content: 'Available options:\n• One-time purchase (use anytime)\n• Monthly subscription (with discounts)\n• Multiple tiers available\n• Secure payment via Stripe\n• Instant activation\n\nPayment methods:\n• All major credit cards\n• Debit cards\n• Secure processing\n• No card details stored on our servers'
        },
        {
          heading: 'Free Daily Tokens',
          content: 'Every user gets:\n• Free tokens per day\n• Resets at midnight UTC\n• Available even with paid plan\n• Use them or lose them (don\'t stack)\n• Perfect for testing and light usage'
        }
      ]
    },
    'troubleshooting': {
      title: 'Troubleshooting Common Issues',
      sections: [
        {
          heading: 'Login Problems',
          content: 'Can\'t log in?\n\n1. Verify your email first\n2. Check password (case-sensitive)\n3. Clear browser cache and cookies\n4. Try incognito/private mode\n5. Disable browser extensions\n6. Use password reset if needed\n\nStill stuck?\n• Try different browser\n• Check internet connection\n• Contact support with error message'
        },
        {
          heading: 'Generation Not Working',
          content: 'If AI generation fails:\n\n1. Check your token balance\n2. Verify internet connection\n3. Try simpler/shorter prompt\n4. Switch to different AI model\n5. Refresh the page\n6. Clear browser cache\n\nError messages:\n• "Insufficient tokens" → Purchase more\n• "Request timeout" → Try again or simplify\n• "Model unavailable" → Choose different model\n• Other errors → Contact support'
        },
        {
          heading: 'Slow Performance',
          content: 'Speed up your experience:\n\n1. Close unnecessary tabs\n2. Disable heavy extensions\n3. Clear browser cache\n4. Use recommended browsers\n5. Check internet speed (5+ Mbps)\n6. Try during off-peak hours\n\nVideo/image loading slow?\n• Wait for full generation\n• Don\'t refresh during process\n• Large files take longer\n• Network speed matters'
        },
        {
          heading: 'Payment Issues',
          content: 'Payment declined?\n\n1. Check card details are correct\n2. Ensure sufficient funds\n3. Verify billing address\n4. Check with your bank\n5. Try different card\n6. Contact support with error code\n\nDidn\'t receive tokens?\n• Wait 5 minutes for processing\n• Check billing history\n• Refresh your balance\n• Contact support if still missing'
        },
        {
          heading: 'Content Not Saving',
          content: 'If your work isn\'t saving:\n\n1. Check internet connection\n2. Don\'t close tab during generation\n3. Wait for "Saved" confirmation\n4. Check Projects section\n5. Try saving manually\n6. Export important work locally\n\nLost content?\n• Check all project folders\n• Look in conversation history\n• Contact support (may be recoverable)'
        },
        {
          heading: 'Browser Compatibility',
          content: 'Having display issues?\n\n1. Update to latest browser version\n2. Enable JavaScript\n3. Disable conflicting extensions\n4. Clear cache and cookies\n5. Try recommended browser\n\nMobile users:\n• Use landscape for better view\n• Some features work best on desktop\n• App version coming soon'
        }
      ]
    },
    'security': {
      title: 'Security & Privacy',
      sections: [
        {
          heading: 'Your Data Privacy',
          content: 'We protect your information:\n• All data encrypted (HTTPS/TLS)\n• Passwords securely hashed\n• No selling of user data\n• GDPR and CCPA compliant\n• Regular security audits\n\nWhat we collect:\n• Account information (email)\n• Usage statistics (anonymous)\n• Payment data (via Stripe, not stored)\n• AI prompts and generations (for service)'
        },
        {
          heading: 'Content Ownership',
          content: 'Your creations belong to you:\n• You own all generated content\n• Use commercially without restrictions\n• We don\'t use your content for training\n• Download and export freely\n• Delete anytime\n\nContent storage:\n• Securely stored in database\n• Access only by you\n• Automatic backups\n• Can be deleted permanently'
        },
        {
          heading: 'Account Security',
          content: 'Protect your account:\n• Use strong, unique password\n• Never share login credentials\n• Log out on shared devices\n• Report suspicious activity\n• Enable email notifications\n\nWe never ask for:\n• Your password via email\n• Credit card details via email\n• Personal information via chat'
        },
        {
          heading: 'Reporting Issues',
          content: 'Found a security concern?\n\nContact immediately:\n• Email: kroniq.ca@gmail.com\n• Subject: "Security Issue"\n• Include detailed description\n• We respond within 24 hours\n\nReport:\n• Suspicious activity on your account\n• Security vulnerabilities\n• Phishing attempts\n• Inappropriate content'
        }
      ]
    },
    'faq': {
      title: 'Frequently Asked Questions',
      sections: [
        {
          heading: 'General Questions',
          content: 'Q: Is KroniQ really free?\nA: Yes! Everyone gets 5,000 free tokens daily. No credit card required to start.\n\nQ: What happens when I run out of tokens?\nA: You can purchase more tokens anytime or wait for your daily free tokens to refresh.\n\nQ: Can I use KroniQ for commercial projects?\nA: Yes, all content you create is yours to use commercially.\n\nQ: Do tokens expire?\nA: Free daily tokens expire at midnight UTC. Purchased tokens never expire.'
        },
        {
          heading: 'Account & Billing',
          content: 'Q: How do I cancel my subscription?\nA: Go to Billing → Manage Subscription → Cancel. You keep all unused tokens.\n\nQ: Can I get a refund?\nA: We don\'t offer refunds on token purchases, but tokens never expire.\n\nQ: Can I share my account?\nA: No, accounts are for individual use only. Sharing may result in suspension.\n\nQ: How do I change my email?\nA: Contact support at kroniq.ca@gmail.com with your request.'
        },
        {
          heading: 'Technical Questions',
          content: 'Q: Why is generation taking so long?\nA: Complex requests take more time. Video and high-quality images require more processing.\n\nQ: Can I use KroniQ on mobile?\nA: Yes, but desktop provides the best experience. Mobile app coming soon.\n\nQ: What browsers are supported?\nA: Chrome, Firefox, Safari, and Edge (version 90+).\n\nQ: Can I work offline?\nA: No, KroniQ requires internet connection for AI processing.'
        },
        {
          heading: 'Content & Usage',
          content: 'Q: Where are my saved projects?\nA: Check the Projects section in the sidebar.\n\nQ: Can I export my creations?\nA: Yes, download images, videos, and code directly from the interface.\n\nQ: Is there a limit on generations?\nA: Only your token balance limits usage. No daily generation caps.\n\nQ: Can I edit generated content?\nA: You can regenerate or create variations. Direct editing coming soon.'
        },
        {
          heading: 'Support & Help',
          content: 'Q: How do I contact support?\nA: Email kroniq.ca@gmail.com or use the Contact form.\n\nQ: What are your support hours?\nA: Email support is monitored 24/7. Response within 24 hours.\n\nQ: Do you offer training or tutorials?\nA: Documentation covers all features. Video tutorials coming soon.\n\nQ: Can I request new features?\nA: Yes! We love feedback. Email your suggestions.'
        }
      ]
    }
  };

  const activeContent = content[activeSection];

  return (
    <div className="relative w-full pb-20 min-h-screen">
      <AnimatedGradientOrb className="top-40 right-10 w-96 h-96" />
      <AnimatedGradientOrb className="bottom-40 left-10 w-[500px] h-[500px]" />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-6 py-3 glass-panel rounded-full border border-white/20 mb-8">
            <span className="text-[#00FFF0] text-sm font-bold tracking-wider">HELP CENTER</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
            How Can We{' '}
            <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
              Help You?
            </span>
          </h1>

          <p className="text-2xl text-white/70 leading-relaxed max-w-3xl mx-auto">
            Find answers to common questions and solutions to problems
          </p>
        </div>
      </section>

      {/* Documentation Content */}
      <section className="relative px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="glass-panel rounded-2xl p-6 border border-white/10 lg:sticky lg:top-24">
                <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Topics</h3>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                          activeSection === section.id
                            ? 'bg-gradient-to-r from-[#00FFF0]/20 to-[#8A2BE2]/20 text-white border border-[#00FFF0]/30'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Floating3DCard>
                <div className="glass-panel rounded-3xl p-8 md:p-12 border border-white/10">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                    {activeContent.title}
                  </h2>

                  <div className="space-y-8">
                    {activeContent.sections.map((section: any, idx: number) => (
                      <div key={idx} className="pb-8 border-b border-white/10 last:border-0">
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center text-sm text-[#00FFF0] font-bold">
                            {idx + 1}
                          </span>
                          {section.heading}
                        </h3>
                        <div className="text-white/70 leading-relaxed whitespace-pre-line pl-11">
                          {section.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Floating3DCard>

              {/* Help CTA */}
              <div className="mt-8 glass-panel rounded-2xl p-8 border border-[#00FFF0]/30 text-center">
                <FileText className="w-12 h-12 text-[#00FFF0] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Still Need Help?</h3>
                <p className="text-white/70 mb-6">
                  Can't find what you're looking for? Our team is here to help you.
                </p>
                <button
                  onClick={() => window.location.href = '/contact'}
                  className="px-6 py-3 bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white rounded-xl font-semibold hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
