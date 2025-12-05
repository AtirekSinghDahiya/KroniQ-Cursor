import { useEffect, useState } from 'react';
import { X, Gift, ArrowRight } from 'lucide-react';

interface OfferExpiredModalProps {
  onClose?: () => void;
  redirectDelay?: number;
  redirectTo?: string;
}

export default function OfferExpiredModal({
  onClose,
  redirectDelay = 5000,
  redirectTo = '/login'
}: OfferExpiredModalProps) {
  const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = redirectTo;
    }, redirectDelay);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [redirectDelay, redirectTo]);

  const handleContinue = () => {
    window.location.href = redirectTo;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full overflow-hidden animate-scale-in">

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="relative p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full shadow-lg border-2 border-slate-600">
              <Gift className="w-12 h-12 text-slate-400" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            Sorry, All Spots Claimed!
          </h2>

          <p className="text-xl text-slate-300 mb-6">
            All 100 promotional spots have been claimed by other users.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">
              But don't worry! You still get:
            </h3>

            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-white font-medium">Free Daily Tokens</p>
                  <p className="text-sm text-slate-400">Get free tokens every day to try our AI models</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-white font-medium">Access to Multiple AI Models</p>
                  <p className="text-sm text-slate-400">Chat with various AI models including GPT, Claude, and more</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-white font-medium">Creative Studio Tools</p>
                  <p className="text-sm text-slate-400">Generate images, videos, music, and more</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-white font-medium">Affordable Token Packs</p>
                  <p className="text-sm text-slate-400">Purchase additional tokens anytime at great prices</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleContinue}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Continue to Signup
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 text-slate-400">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold">
                {countdown}
              </div>
              <p className="text-sm">
                Redirecting to signup in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Join thousands of users creating amazing content with AI
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
