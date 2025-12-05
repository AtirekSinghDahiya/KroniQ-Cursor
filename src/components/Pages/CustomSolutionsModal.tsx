import React, { useState } from 'react';
import { X, Building2, Users, Mail, Phone, Briefcase, FileText, DollarSign, Clock, Send } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomSolutionsModalProps {
  onClose: () => void;
}

export const CustomSolutionsModal: React.FC<CustomSolutionsModalProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company_name: '',
    phone: '',
    company_size: '',
    industry: '',
    use_case: '',
    requirements: '',
    budget_range: '',
    timeline: '',
    additional_info: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error: submitError } = await supabase
        .from('custom_solution_requests')
        .insert([formData]);

      if (submitError) throw submitError;

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="glass-panel backdrop-blur-3xl border border-white/20 rounded-3xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Request Submitted!</h3>
          <p className="text-white/70">Our team will contact you within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel backdrop-blur-3xl border border-white/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 glass-panel backdrop-blur-3xl border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-3xl font-bold text-white">Need a Custom Solution?</h2>
            <p className="text-white/60 text-sm mt-1">Tell us about your enterprise needs</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <Users className="w-4 h-4" />
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFF0]/50 transition-all"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <Mail className="w-4 h-4" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFF0]/50 transition-all"
                placeholder="john@company.com"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <Building2 className="w-4 h-4" />
                Company Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFF0]/50 transition-all"
                placeholder="Acme Corporation"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFF0]/50 transition-all"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <Briefcase className="w-4 h-4" />
                Company Size *
              </label>
              <select
                name="company_size"
                value={formData.company_size}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#00FFF0]/50 transition-all ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-900'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                <option value="" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Select size</option>
                <option value="startup" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Startup (1-10)</option>
                <option value="small" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Small (11-50)</option>
                <option value="medium" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Medium (51-200)</option>
                <option value="large" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Large (201-1000)</option>
                <option value="enterprise" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Enterprise (1000+)</option>
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <FileText className="w-4 h-4" />
                Industry
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#00FFF0]/50 transition-all ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-900'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                <option value="" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Select industry</option>
                <option value="technology" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Technology</option>
                <option value="healthcare" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Healthcare</option>
                <option value="finance" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Finance & Banking</option>
                <option value="education" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Education</option>
                <option value="retail" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Retail & E-commerce</option>
                <option value="manufacturing" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Manufacturing</option>
                <option value="real_estate" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Real Estate</option>
                <option value="media" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Media & Entertainment</option>
                <option value="consulting" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Consulting</option>
                <option value="legal" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Legal</option>
                <option value="other" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Other</option>
              </select>
            </div>

            {/* Use Case */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <Briefcase className="w-4 h-4" />
                Use Case *
              </label>
              <textarea
                name="use_case"
                value={formData.use_case}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFF0]/50 transition-all resize-none"
                placeholder="Describe how you plan to use KroniQ in your organization..."
              />
            </div>

            {/* Requirements */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <FileText className="w-4 h-4" />
                Specific Requirements *
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFF0]/50 transition-all resize-none"
                placeholder="List your specific needs: custom integrations, dedicated support, on-premise deployment, etc."
              />
            </div>

            {/* Budget Range */}
            <div>
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <DollarSign className="w-4 h-4" />
                Budget Range
              </label>
              <select
                name="budget_range"
                value={formData.budget_range}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#00FFF0]/50 transition-all ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-900'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                <option value="" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Select range</option>
                <option value="under_10k" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Under $10,000</option>
                <option value="10k_50k" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>$10,000 - $50,000</option>
                <option value="50k_100k" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>$50,000 - $100,000</option>
                <option value="100k_500k" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>$100,000 - $500,000</option>
                <option value="over_500k" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>$500,000+</option>
              </select>
            </div>

            {/* Timeline */}
            <div>
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <Clock className="w-4 h-4" />
                Expected Timeline
              </label>
              <select
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#00FFF0]/50 transition-all ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-900'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                <option value="" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Select timeline</option>
                <option value="immediate" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Immediate (ASAP)</option>
                <option value="1_month" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Within 1 month</option>
                <option value="3_months" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Within 3 months</option>
                <option value="6_months" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Within 6 months</option>
                <option value="flexible" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'}>Flexible</option>
              </select>
            </div>

            {/* Additional Info */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
                <FileText className="w-4 h-4" />
                Additional Information
              </label>
              <textarea
                name="additional_info"
                value={formData.additional_info}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFF0]/50 transition-all resize-none"
                placeholder="Any other details we should know..."
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] hover:from-[#00FFF0]/90 hover:to-[#8A2BE2]/90 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
