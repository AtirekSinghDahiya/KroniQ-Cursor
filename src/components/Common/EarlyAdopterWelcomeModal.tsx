import { useState, useEffect } from 'react';
import { Gift, Sparkles, X, Star, Zap } from 'lucide-react';

interface EarlyAdopterWelcomeModalProps {
    tokensAwarded: number;
    onClose: () => void;
    autoCloseDelay?: number;
}

export default function EarlyAdopterWelcomeModal({
    tokensAwarded,
    onClose,
    autoCloseDelay = 8000
}: EarlyAdopterWelcomeModalProps) {
    const [countdown, setCountdown] = useState(Math.ceil(autoCloseDelay / 1000));
    const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string }>>([]);

    useEffect(() => {
        // Generate confetti
        const colors = ['#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
        const pieces = Array.from({ length: 60 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 0.8,
            duration: 2.5 + Math.random() * 2,
            color: colors[Math.floor(Math.random() * colors.length)]
        }));
        setConfettiPieces(pieces);

        // Auto-close countdown
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [autoCloseDelay, onClose]);

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center animate-fade-in">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Confetti */}
            {confettiPieces.map(piece => (
                <div
                    key={piece.id}
                    className="absolute top-0 w-2 h-3 rounded-sm animate-confetti-fall pointer-events-none"
                    style={{
                        left: `${piece.left}%`,
                        backgroundColor: piece.color,
                        animationDelay: `${piece.delay}s`,
                        animationDuration: `${piece.duration}s`,
                        opacity: 0.8
                    }}
                />
            ))}

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-3xl border border-purple-500/30 shadow-2xl overflow-hidden animate-scale-in">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-yellow-500/20 pointer-events-none" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="relative p-8 text-center">
                    {/* Icon */}
                    <div className="relative mx-auto w-24 h-24 mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full animate-pulse opacity-50 blur-xl" />
                        <div className="relative w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                            <Gift className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <Star className="w-5 h-5 text-yellow-900 fill-yellow-900" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-white mb-2">
                        🎉 Congratulations!
                    </h2>
                    <p className="text-lg text-purple-300 mb-4">
                        You're an Early Adopter! 🚀
                    </p>

                    {/* Token Amount */}
                    <div className="bg-black/40 rounded-2xl p-6 mb-6 border border-purple-500/30">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Zap className="w-6 h-6 text-yellow-400" />
                            <span className="text-yellow-400 font-bold uppercase text-sm tracking-wider">Bonus Tokens Awarded</span>
                            <Zap className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400">
                            {tokensAwarded.toLocaleString()}
                        </div>
                        <p className="text-white/60 mt-2 text-sm">
                            +200,000 bonus tokens for being among the first 106 users!
                        </p>
                    </div>

                    {/* Message */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-center gap-2 text-emerald-400">
                            <Sparkles className="w-5 h-5" />
                            <span className="font-medium">Tokens added to your account</span>
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <p className="text-white/70 text-sm">
                            Thank you for joining KroniQ AI early! Use your tokens to generate amazing AI content.
                        </p>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Start Creating! ✨
                    </button>

                    {/* Countdown */}
                    <p className="text-white/40 text-xs mt-4">
                        Auto-closing in {countdown} second{countdown !== 1 ? 's' : ''}...
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear infinite;
        }
        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
