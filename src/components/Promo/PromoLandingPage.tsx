import { useEffect, useState } from 'react';
import { Gift, Sparkles, Zap, Rocket, Star, ArrowRight, Users, Clock } from 'lucide-react';
import { PromoService } from '../../lib/promoService';

export default function PromoLandingPage() {
  const [campaignStatus, setCampaignStatus] = useState<{
    isValid: boolean;
    remainingSlots: number;
    tokenAmount: number;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCampaign = async () => {
      const status = await PromoService.checkCampaignStatus('FIRST100');
      setCampaignStatus(status);
      setIsLoading(false);
    };

    checkCampaign();
    const interval = setInterval(checkCampaign, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClaimOffer = () => {
    PromoService.storePromoCodeInSession('FIRST100');
    window.location.href = '/login?promo=FIRST100';
  };

  const formatTokens = (tokens: number): string => {
    return tokens.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading offer details...</p>
        </div>
      </div>
    );
  }

  const remainingSlots = campaignStatus?.remainingSlots || 0;
  const tokenAmount = campaignStatus?.tokenAmount || 500000;
  const claimedSlots = 100 - remainingSlots;
  const progressPercentage = (claimedSlots / 100) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>

      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-600/20 border border-pink-500/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-blue-300 uppercase tracking-wide">
                Limited Time Offer
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Be One of the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-violet-500">
                First 100 Users
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-8">
              Sign up now and get <span className="font-bold text-white">{formatTokens(tokenAmount)} FREE tokens</span> to explore our AI platform
            </p>

            <div className="inline-flex items-center gap-2 text-lg text-slate-400 mb-8">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span>
                <span className="font-bold text-white">{remainingSlots}</span> out of 100 spots remaining
              </span>
            </div>

            <div className="max-w-md mx-auto mb-8">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>Campaign Progress</span>
                <span>{claimedSlots}/100 claimed</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-500 ease-out relative overflow-hidden"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>

            <button
              onClick={handleClaimOffer}
              disabled={!campaignStatus?.isValid}
              className={`group px-8 py-4 text-lg font-bold rounded-xl transition-all transform hover:scale-105 shadow-2xl flex items-center gap-3 mx-auto ${campaignStatus?.isValid
                  ? 'bg-gradient-to-r from-purple-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
            >
              {campaignStatus?.isValid ? (
                <>
                  <Gift className="w-6 h-6" />
                  Claim Your {formatTokens(tokenAmount)} Tokens Now
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  <Clock className="w-6 h-6" />
                  Offer No Longer Available
                </>
              )}
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Instant Access
              </h3>
              <p className="text-slate-400">
                Start creating with AI immediately after claiming your tokens
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Premium Models
              </h3>
              <p className="text-slate-400">
                Access GPT-4, Claude, and other advanced AI models
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No Strings Attached
              </h3>
              <p className="text-slate-400">
                Free tokens with no credit card required
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Gift className="w-8 h-8 text-yellow-400" />
              What Can You Do With {formatTokens(tokenAmount)} Tokens?
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <p className="text-white font-medium mb-1">AI Chat Conversations</p>
                  <p className="text-slate-400 text-sm">Thousands of messages with advanced AI models like GPT-4 and Claude</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Image Generation</p>
                  <p className="text-slate-400 text-sm">Create hundreds of AI-generated images for your projects</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Video Creation</p>
                  <p className="text-slate-400 text-sm">Generate AI videos with various models and styles</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                  4
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Music & Voice</p>
                  <p className="text-slate-400 text-sm">Create music tracks and voiceovers for your content</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-purple-600/10 border border-pink-500/30 rounded-lg">
              <p className="text-blue-300 font-medium text-center">
                💰 That's worth <span className="text-white font-bold">${(tokenAmount / 1000000).toFixed(2)}</span> in AI credits, completely free!
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-8 h-8 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I claim my tokens?
                </h3>
                <p className="text-slate-400">
                  Click the button above to go to the signup page. After creating your account, you'll automatically receive {formatTokens(tokenAmount)} tokens.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Do the tokens expire?
                </h3>
                <p className="text-slate-400">
                  No, your promotional tokens never expire. Use them at your own pace to explore all our AI features.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I purchase more tokens later?
                </h3>
                <p className="text-slate-400">
                  Yes! You can purchase additional token packs anytime at affordable prices, or subscribe to a plan for regular token allocations.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is there a credit card required?
                </h3>
                <p className="text-slate-400">
                  No credit card needed to claim your free tokens. Just sign up and start creating!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={handleClaimOffer}
              disabled={!campaignStatus?.isValid}
              className={`group px-8 py-4 text-lg font-bold rounded-xl transition-all transform hover:scale-105 shadow-2xl inline-flex items-center gap-3 ${campaignStatus?.isValid
                  ? 'bg-gradient-to-r from-purple-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
            >
              {campaignStatus?.isValid ? (
                <>
                  <Gift className="w-6 h-6" />
                  Claim Your Free Tokens Now
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  <Clock className="w-6 h-6" />
                  Offer No Longer Available
                </>
              )}
            </button>

            {campaignStatus?.isValid && (
              <p className="text-slate-400 text-sm mt-4">
                ⏰ Hurry! Only {remainingSlots} spots left
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
