import React from 'react';
import { Shield, FileText, Cookie, Lock } from 'lucide-react';
import { AnimatedGradientOrb } from '../Landing/FloatingElements';

interface LegalPagesProps {
  page: 'privacy' | 'terms' | 'cookies' | 'security';
}

export const LegalPages: React.FC<LegalPagesProps> = ({ page }) => {
  const pages = {
    privacy: {
      icon: Shield,
      title: 'Privacy Policy',
      lastUpdated: 'October 27, 2025',
      content: [
        {
          section: 'Introduction',
          text: 'At KroniQ AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.'
        },
        {
          section: 'Information We Collect',
          text: 'We collect information that you provide directly to us, including:\n• Account information (email, password)\n• Profile information (name, preferences)\n• Usage data (AI interactions, generations)\n• Payment information (processed securely through Stripe)\n• Cookies and tracking technologies'
        },
        {
          section: 'How We Use Your Information',
          text: 'We use the information we collect to:\n• Provide, maintain, and improve our services\n• Process your transactions and manage your account\n• Send you technical notices and support messages\n• Respond to your requests and provide customer service\n• Monitor and analyze usage patterns\n• Detect, prevent, and address technical issues'
        },
        {
          section: 'AI Processing',
          text: 'Your prompts and AI-generated content are processed using our integrated AI models. We do not sell your data to third parties. Your content may be temporarily stored for processing but is not used to train AI models without your explicit consent.'
        },
        {
          section: 'Data Security',
          text: 'We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.'
        },
        {
          section: 'Your Rights',
          text: 'You have the right to:\n• Access your personal information\n• Correct inaccurate data\n• Request deletion of your data\n• Object to data processing\n• Data portability\n• Withdraw consent'
        },
        {
          section: 'Contact Us',
          text: 'For privacy-related questions, contact us at:\nEmail: kroniq.ca@gmail.com\nLocation: Toronto, CA'
        }
      ]
    },
    terms: {
      icon: FileText,
      title: 'Terms of Service',
      lastUpdated: 'October 27, 2025',
      content: [
        {
          section: 'Acceptance of Terms',
          text: 'By accessing and using KroniQ AI, you accept and agree to be bound by these Terms of Service.'
        },
        {
          section: 'Account Registration',
          text: 'You must create an account to use our services. You are responsible for:\n• Maintaining the security of your account\n• All activities under your account\n• Keeping your information accurate and up-to-date'
        },
        {
          section: 'Token System',
          text: 'Our platform operates on a token-based system:\n• Free tier: 5,000 tokens per day\n• Paid tiers: Purchase tokens or subscribe monthly\n• Tokens are non-refundable once purchased\n• Tokens expire according to plan terms\n• 2x cost multiplier applies to all AI requests'
        },
        {
          section: 'Acceptable Use',
          text: 'You agree NOT to:\n• Violate any laws or regulations\n• Infringe on intellectual property rights\n• Generate harmful, abusive, or illegal content\n• Attempt to reverse engineer our services\n• Use the service for automated bulk operations\n• Share your account with others'
        },
        {
          section: 'Content Ownership',
          text: 'You retain ownership of content you create using our platform. However, you grant us a license to process and store your content to provide our services.'
        },
        {
          section: 'Service Availability',
          text: 'We strive for 99.5% uptime but do not guarantee uninterrupted access. We may modify, suspend, or discontinue services at any time with notice.'
        },
        {
          section: 'Limitation of Liability',
          text: 'KroniQ AI is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages arising from your use of our services.'
        },
        {
          section: 'Termination',
          text: 'We may terminate or suspend your account immediately for any breach of these Terms. Upon termination, your right to use the service will cease.'
        },
        {
          section: 'Changes to Terms',
          text: 'We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.'
        }
      ]
    },
    cookies: {
      icon: Cookie,
      title: 'Cookie Policy',
      lastUpdated: 'October 27, 2025',
      content: [
        {
          section: 'What Are Cookies',
          text: 'Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience.'
        },
        {
          section: 'Types of Cookies We Use',
          text: 'Essential Cookies:\n• Authentication and session management\n• Security and fraud prevention\n• Remember your preferences\n\nAnalytics Cookies:\n• Understand how users interact with our site\n• Measure performance and improve features\n• Track page visits and navigation patterns\n\nFunctional Cookies:\n• Remember your settings and preferences\n• Enable personalized features\n• Improve user experience'
        },
        {
          section: 'Third-Party Cookies',
          text: 'We use services that may set their own cookies:\n• Authentication providers\n• Analytics services\n• Payment processors (Stripe)\n• AI model providers'
        },
        {
          section: 'Managing Cookies',
          text: 'You can control cookies through:\n• Browser settings to block or delete cookies\n• Our cookie consent banner\n• Privacy settings in your account\n\nNote: Blocking essential cookies may impact functionality.'
        },
        {
          section: 'Local Storage',
          text: 'We also use browser local storage to:\n• Store your theme preferences\n• Cache temporary data\n• Improve performance\n• Remember your choices'
        },
        {
          section: 'Updates to This Policy',
          text: 'We may update this Cookie Policy to reflect changes in our practices or legal requirements.'
        }
      ]
    },
    security: {
      icon: Lock,
      title: 'Security',
      lastUpdated: 'October 27, 2025',
      content: [
        {
          section: 'Our Commitment',
          text: 'Security is a top priority at KroniQ AI. We implement industry-standard security measures to protect your data and ensure safe operations.'
        },
        {
          section: 'Data Encryption',
          text: 'All data transmission:\n• HTTPS/TLS encryption for all connections\n• End-to-end encryption for sensitive data\n• Encrypted storage for passwords and API keys\n• Secure token-based authentication'
        },
        {
          section: 'Authentication & Access',
          text: 'We use Firebase Authentication with:\n• Secure password hashing (bcrypt)\n• Multi-factor authentication support\n• Session management and timeouts\n• Regular security audits'
        },
        {
          section: 'Payment Security',
          text: 'All payments are processed securely through Stripe:\n• PCI DSS compliant\n• No credit card data stored on our servers\n• Tokenized payment processing\n• Fraud detection and prevention'
        },
        {
          section: 'Data Storage',
          text: 'Your data is stored securely:\n• Supabase database with row-level security\n• Regular automated backups\n• Geographic redundancy\n• Access controls and monitoring'
        },
        {
          section: 'AI Content Security',
          text: 'Your AI interactions are protected:\n• Isolated processing environments\n• No data sharing between users\n• Content not used for model training\n• Automatic deletion of temporary data'
        },
        {
          section: 'Incident Response',
          text: 'In case of a security incident:\n• Immediate containment procedures\n• User notification within 72 hours\n• Root cause analysis\n• Implementation of preventive measures'
        },
        {
          section: 'Best Practices for Users',
          text: 'Protect your account by:\n• Using strong, unique passwords\n• Enabling two-factor authentication\n• Not sharing your credentials\n• Logging out on shared devices\n• Reporting suspicious activity immediately'
        },
        {
          section: 'Compliance',
          text: 'We comply with:\n• GDPR (General Data Protection Regulation)\n• CCPA (California Consumer Privacy Act)\n• SOC 2 Type II standards\n• Industry best practices'
        },
        {
          section: 'Report Security Issues',
          text: 'If you discover a security vulnerability, please report it to:\nEmail: kroniq.ca@gmail.com\nSubject: Security Issue\n\nWe appreciate responsible disclosure and will respond promptly.'
        }
      ]
    }
  };

  const currentPage = pages[page];
  const Icon = currentPage.icon;

  return (
    <div className="relative w-full pb-20 min-h-screen">
      <AnimatedGradientOrb className="top-40 right-10 w-96 h-96" />
      <AnimatedGradientOrb className="bottom-40 left-10 w-[500px] h-[500px]" />

      <section className="relative pt-40 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 mb-6">
              <Icon className="w-10 h-10 text-[#00FFF0]" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              {currentPage.title}
            </h1>
            <p className="text-white/60">
              Last Updated: {currentPage.lastUpdated}
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-8 md:p-12 border border-white/10 space-y-8">
            {currentPage.content.map((item, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center text-sm text-[#00FFF0] font-bold">
                    {idx + 1}
                  </span>
                  {item.section}
                </h2>
                <p className="text-white/70 leading-relaxed whitespace-pre-line">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              Questions? Contact us at{' '}
              <a href="mailto:kroniq.ca@gmail.com" className="text-[#00FFF0] hover:underline">
                kroniq.ca@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
