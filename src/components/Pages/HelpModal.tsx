import React from 'react';
import { X, Mail, MessageCircle, Book, HelpCircle, ExternalLink } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const helpOptions = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Browse our comprehensive guides and tutorials',
      action: 'View Docs',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      action: 'Start Chat',
      gradient: 'from-green-500 to-teal-600',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      action: 'support@kroniq.ai',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: HelpCircle,
      title: 'FAQ',
      description: 'Find answers to commonly asked questions',
      action: 'Browse FAQ',
      gradient: 'from-orange-500 to-red-600',
    },
  ];

  const faqs = [
    {
      question: 'How do I change my AI model preference?',
      answer: 'Go to Settings > AI Preferences and select your preferred AI model from the dropdown menu.',
    },
    {
      question: 'Can I export my chat history?',
      answer: 'Yes! Click on the three dots menu in any chat and select "Export Chat" to download your conversation history.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for enterprise customers.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely! We use enterprise-grade encryption and follow industry best practices to keep your data safe and private.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel backdrop-blur-3xl border border-white/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 glass-panel backdrop-blur-3xl border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-3xl font-bold text-white">Help & Support</h2>
            <p className="text-white/60 text-sm mt-1">We're here to help you succeed</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all button-press"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-thin max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {helpOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <button
                  key={index}
                  className="glass-panel glass-panel-hover rounded-2xl p-6 text-left animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{option.title}</h3>
                  <p className="text-white/60 text-sm mb-4">{option.description}</p>
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                    <span>{option.action}</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-white/10 last:border-0 pb-4 last:pb-0">
                  <h4 className="text-white font-medium mb-2">{faq.question}</h4>
                  <p className="text-white/70 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 glass-panel rounded-2xl p-6 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Need More Help?</h4>
                <p className="text-white/70 text-sm mb-3">
                  Our support team is available 24/7 to assist you with any questions or issues.
                </p>
                <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all button-press">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
