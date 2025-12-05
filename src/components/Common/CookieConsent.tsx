import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setTimeout(() => setShow(true), 2000);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShow(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 glass-panel rounded-2xl p-6 border border-white/20 shadow-2xl animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center flex-shrink-0">
          <Cookie className="w-5 h-5 text-[#00FFF0]" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold mb-2">We use cookies</h3>
          <p className="text-white/70 text-sm mb-4 leading-relaxed">
            We use cookies to enhance your experience, analyze site traffic, and personalize content. By continuing to use our site, you consent to our use of cookies.
          </p>
          <div className="flex gap-3">
            <button
              onClick={acceptCookies}
              className="px-5 py-2.5 bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white rounded-lg font-semibold hover:scale-105 active:scale-95 transition-all text-sm shadow-lg shadow-[#00FFF0]/20"
            >
              Accept All
            </button>
            <button
              onClick={declineCookies}
              className="px-5 py-2.5 glass-panel border border-white/20 text-white rounded-lg font-semibold hover:border-white/40 transition-all text-sm"
            >
              Decline
            </button>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-white/50 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
