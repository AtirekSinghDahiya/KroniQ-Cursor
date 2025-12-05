import React, { useState, useRef } from 'react';
import { Bug, X, Send, Image as ImageIcon, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';

export const BugReportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { themeColors } = useTheme();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Screenshot must be less than 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadScreenshot = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `bug-reports/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('bug-screenshots')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('bug-screenshots')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Screenshot upload failed:', error);
      return null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      showToast('Please describe the bug', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let screenshotUrl = null;
      if (screenshot) {
        screenshotUrl = await uploadScreenshot(screenshot);
      }

      const browserInfo = `${navigator.userAgent} | Screen: ${window.innerWidth}x${window.innerHeight}`;

      const { error } = await supabase.from('bug_reports').insert({
        user_id: user?.uid || null,
        user_email: user?.email || null,
        description: description.trim(),
        screenshot_url: screenshotUrl,
        page_url: window.location.href,
        browser_info: browserInfo,
        status: 'new',
      });

      if (error) throw error;

      showToast('Bug report submitted successfully! Thank you for your feedback.', 'success');
      setDescription('');
      setScreenshot(null);
      setScreenshotPreview(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      showToast('Failed to submit bug report. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Draggable Bug Report Button */}
      <button
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          if (!isDragging) setIsOpen(true);
        }}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className={`fixed z-50 w-14 h-14 rounded-full bg-black/80 hover:bg-black border-2 border-white/20 hover:border-red-500/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group ${
          isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'
        }`}
        aria-label="Report a bug"
      >
        <Bug
          className="w-6 h-6 text-red-400 group-hover:text-red-300 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 pointer-events-none"
        />
      </button>

      {/* Bug Report Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-black/95 rounded-2xl border border-white/20 shadow-2xl animate-fade-in-up backdrop-blur-xl">
            {/* Header */}
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: themeColors.border }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${themeColors.accent}20`,
                  }}
                >
                  <Bug className="w-5 h-5" style={{ color: themeColors.accent }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: themeColors.text }}>Report a Bug</h3>
                  <p className="text-sm" style={{ color: themeColors.textMuted }}>Help us improve KroniQ</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg transition-colors flex items-center justify-center"
                style={{
                  backgroundColor: themeColors.surface,
                  color: themeColors.textMuted,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.surfaceHover;
                  e.currentTarget.style.color = themeColors.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.surface;
                  e.currentTarget.style.color = themeColors.textMuted;
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Description */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: themeColors.textSecondary }}
                >
                  Describe the bug *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened? What did you expect to happen?"
                  className="w-full h-32 px-4 py-3 rounded-xl focus:outline-none transition-all resize-none"
                  style={{
                    backgroundColor: themeColors.input,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: themeColors.inputBorder,
                    color: themeColors.text,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = themeColors.accent;
                    e.currentTarget.style.backgroundColor = themeColors.surfaceHover;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeColors.inputBorder;
                    e.currentTarget.style.backgroundColor = themeColors.input;
                  }}
                  required
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: themeColors.textSecondary }}
                >
                  Screenshot (optional)
                </label>

                {screenshotPreview ? (
                  <div
                    className="relative rounded-xl overflow-hidden border group"
                    style={{ borderColor: themeColors.border }}
                  >
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="absolute top-2 right-2 w-8 h-8 rounded-lg transition-colors flex items-center justify-center"
                      style={{
                        backgroundColor: `${themeColors.accent}cc`,
                        color: themeColors.text,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = themeColors.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${themeColors.accent}cc`;
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed rounded-xl transition-colors flex flex-col items-center justify-center gap-2"
                    style={{
                      borderColor: themeColors.border,
                      color: themeColors.textMuted,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = themeColors.accent;
                      e.currentTarget.style.color = themeColors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = themeColors.border;
                      e.currentTarget.style.color = themeColors.textMuted;
                    }}
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-sm">Click to upload screenshot</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* User Info Display */}
              {user && (
                <div
                  className="text-xs rounded-lg p-3"
                  style={{
                    color: themeColors.textMuted,
                    backgroundColor: themeColors.surface,
                  }}
                >
                  Submitting as: {user.email}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-[#00FFF0] text-black hover:bg-[#00E6D8]"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Bug Report
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
