import React, { useState } from 'react';
import { X, Upload, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
}

export const JobApplicationForm: React.FC<JobApplicationFormProps> = ({ jobId, jobTitle, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    coverLetter: '',
    yearsOfExperience: '',
    currentLocation: '',
    availableStartDate: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.fullName || !formData.email || !formData.phone ||
          !formData.resumeUrl || !formData.coverLetter || !formData.yearsOfExperience ||
          !formData.currentLocation || !formData.availableStartDate) {
        throw new Error('Please fill in all required fields');
      }

      // Insert application into database
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert([
          {
            job_id: jobId,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            linkedin_url: formData.linkedinUrl || null,
            portfolio_url: formData.portfolioUrl || null,
            resume_url: formData.resumeUrl,
            cover_letter: formData.coverLetter,
            years_of_experience: parseInt(formData.yearsOfExperience),
            current_location: formData.currentLocation,
            available_start_date: formData.availableStartDate,
            status: 'new'
          }
        ]);

      if (insertError) throw insertError;

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="glass-panel rounded-3xl p-12 border border-white/20 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Application Submitted!</h3>
          <p className="text-white/70">
            Thank you for your interest. We'll review your application and get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel rounded-3xl p-8 border border-white/20 max-w-3xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Apply for Position</h2>
            <p className="text-[#00FFF0] text-lg mt-1">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl glass-panel border border-white/10 flex items-center justify-center hover:border-red-500/50 transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center text-sm">1</span>
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Current Location <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                  placeholder="San Francisco, CA"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Years of Experience <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  required
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Available Start Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="availableStartDate"
                  value={formData.availableStartDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Professional Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center text-sm">2</span>
              Professional Links
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Portfolio/Website URL
                </label>
                <input
                  type="url"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                  placeholder="https://johndoe.com"
                />
              </div>
            </div>
          </div>

          {/* Resume */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center text-sm">3</span>
              Resume
            </h3>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Resume URL (Google Drive, Dropbox, etc.) <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="resumeUrl"
                  value={formData.resumeUrl}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-3 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-xl text-white placeholder-white/40 focus:outline-none transition-all"
                  placeholder="https://drive.google.com/file/..."
                />
              </div>
              <p className="text-xs text-white/50 mt-2">
                Please upload your resume to Google Drive or Dropbox and paste the shareable link here
              </p>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center text-sm">4</span>
              Cover Letter
            </h3>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Why do you want to join KroniQ? <span className="text-red-400">*</span>
              </label>
              <textarea
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 glass-panel border border-white/20 focus:border-[#00FFF0]/50 rounded-xl text-white placeholder-white/40 focus:outline-none resize-none transition-all"
                placeholder="Tell us about yourself, your experience, and why you'd be a great fit for this role..."
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 glass-panel border border-white/20 text-white rounded-xl font-semibold hover:border-white/40 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white rounded-xl font-semibold hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
