import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, MapPin, Send, Check } from 'lucide-react';
import { Floating3DCard, AnimatedGradientOrb } from './FloatingElements';
import { submitForm } from '../../lib/formTrackingService';
import { useAuth } from '../../contexts/AuthContext';

export const ContactPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const userId = currentUser?.uid || 'anonymous';
      const result = await submitForm(userId, 'contact', formData);

      if (result.success) {
        console.log('✅ Contact form submitted successfully:', result.id);
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setFormData({ name: '', email: '', subject: '', message: '' });
        }, 3000);
      } else {
        setError(result.error || 'Failed to submit form. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      content: 'kroniq.ca@gmail.com',
      description: 'We respond within 24 hours'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      content: 'Available 24/7',
      description: 'Instant support for urgent queries'
    },
    {
      icon: MapPin,
      title: 'Office',
      content: 'Toronto, CA',
      description: 'Building the future of AI'
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
            <span className="text-[#00FFF0] text-sm font-bold tracking-wider">CONTACT US</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Let's{' '}
            <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
              Connect
            </span>
          </h1>

          <p className="text-2xl text-white/70 leading-relaxed max-w-3xl mx-auto">
            Have a question, feedback, or just want to say hello? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {contactInfo.map((info, idx) => {
              const Icon = info.icon;
              return (
                <Floating3DCard key={idx} delay={idx * 100}>
                  <div className="glass-panel rounded-2xl p-8 border border-white/20 hover:border-[#00FFF0]/50 transition-all duration-500 text-center group">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-[#00FFF0]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{info.title}</h3>
                    <p className="text-[#00FFF0] font-semibold mb-2">{info.content}</p>
                    <p className="text-white/60 text-sm">{info.description}</p>
                  </div>
                </Floating3DCard>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="max-w-4xl mx-auto">
            <Floating3DCard>
              <div className="glass-panel rounded-3xl p-10 md:p-16 border border-white/20">
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center mb-10">
                      <h2 className="text-4xl font-bold text-white mb-4">Send Us a Message</h2>
                      <p className="text-white/70">Fill out the form below and we'll get back to you soon</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-sm font-semibold text-white/80 mb-3">
                          Your Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-6 py-4 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-2xl text-white placeholder-white/40 focus:outline-none transition-all duration-300"
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-white/80 mb-3">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-6 py-4 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-2xl text-white placeholder-white/40 focus:outline-none transition-all duration-300"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-white/80 mb-3">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-2xl text-white placeholder-white/40 focus:outline-none transition-all duration-300"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-white/80 mb-3">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-6 py-4 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-2xl text-white placeholder-white/40 focus:outline-none resize-none transition-all duration-300"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-2xl text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white px-8 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-[#00FFF0]/40 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {submitting ? (
                        <>
                          <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                          </div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-20 animate-fade-in">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center animate-scale-in">
                      <Check className="w-12 h-12 text-[#00FFF0]" />
                    </div>
                    <h3 className="text-4xl font-bold text-white mb-4">Message Sent!</h3>
                    <p className="text-xl text-white/70">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </div>
                )}
              </div>
            </Floating3DCard>
          </div>
        </div>
      </section>
    </div>
  );
};
