import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface PromoSuccessModalProps {
  tokensAwarded: number;
  onClose: () => void;
  autoCloseDelay?: number;
}

export default function PromoSuccessModal({
  tokensAwarded,
  onClose,
  autoCloseDelay = 5000
}: PromoSuccessModalProps) {
  const [countdown, setCountdown] = useState(Math.ceil(autoCloseDelay / 1000));
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2
    }));
    setConfettiPieces(pieces);

    const timer = setTimeout(onClose, autoCloseDelay);

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
  }, [autoCloseDelay, onClose]);

  const formatTokens = (tokens: number): string => {
    return tokens.toLocaleString();
  };

  const calculateValue = (tokens: number): string => {
    const value = tokens / 1000000;
    return value.toFixed(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-blue-500/30 max-w-lg w-full overflow-hidden animate-scale-in">

        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute top-0 w-2 h-2 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-500 rounded-full animate-confetti-fall"
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`
            }}
          />
        ))}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative p-8 text-center">
          <div className="mb-6 animate-bounce-slow">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-yellow-500/50">
              <span className="text-5xl">🎉</span>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-4 animate-pulse-slow">
            Congratulations!
          </h2>

          <div className="space-y-3 mb-6">
            <p className="text-2xl text-white font-semibold">
              You've won
            </p>

            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <span className="text-3xl">💰</span>
              <span className="text-4xl font-bold text-white">
                {formatTokens(tokensAwarded)}
              </span>
              <span className="text-2xl text-blue-200">tokens!</span>
            </div>

            <p className="text-lg text-slate-300">
              That's <span className="font-bold text-green-400">${calculateValue(tokensAwarded)}</span> worth of AI credits!
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6 text-4xl">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎊</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>✨</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎁</span>
            <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>⭐</span>
          </div>

          <div className="space-y-4">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Creating! 🚀
            </button>

            {countdown > 0 && (
              <p className="text-sm text-slate-400">
                Auto-closing in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Your tokens have been added to your account and are ready to use!
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

        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
