import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User as UserIcon, Bug, Eye, EyeOff, Check, X } from 'lucide-react';
import { CosmicBackground } from '../Layout/CosmicBackground';
import { auth } from '../../lib/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { PromoService } from '../../lib/promoService';
import PromoBanner from '../Promo/PromoBanner';
import PromoSuccessModal from '../Promo/PromoSuccessModal';
import OfferExpiredModal from '../Promo/OfferExpiredModal';
import { trackSignupPageView, trackSignupComplete, trackEvent } from '../../lib/analyticsService';

export const LoginPage: React.FC = () => {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [showPromoSuccess, setShowPromoSuccess] = useState(false);
  const [promoTokensAwarded, setPromoTokensAwarded] = useState(0);
  const [showOfferExpired, setShowOfferExpired] = useState(false);
  const { signIn, signUp, signInWithGoogle, currentUser } = useAuth();

  const getPasswordStrength = () => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;

    return {
      checks,
      strength: passedChecks === 5 ? 'strong' : passedChecks >= 3 ? 'medium' : 'weak',
      percentage: (passedChecks / 5) * 100
    };
  };

  const passwordStrength = password && !isLogin ? getPasswordStrength() : null;

  useEffect(() => {
    setMounted(true);

    trackSignupPageView();

    const searchParams = new URLSearchParams(window.location.search);
    const promo = searchParams.get('promo');

    if (promo) {
      setPromoCode(promo);
      PromoService.storePromoCodeInSession(promo);
      setIsLogin(false);

      PromoService.checkCampaignStatus(promo).then(status => {
        if (!status.isValid) {
          setShowOfferExpired(true);
        }
      });
    } else {
      const storedPromo = PromoService.getPromoCodeFromSession();
      if (storedPromo) {
        setPromoCode(storedPromo);
        setIsLogin(false);
      }
    }

    console.log('🔥 Firebase Auth Status:');
    console.log('   Auth instance:', auth ? 'OK' : 'NULL');
    console.log('   Project ID:', auth?.app?.options?.projectId);
    console.log('   Auth domain:', auth?.app?.options?.authDomain);
  }, []);

  const handlePromoRedemption = async (userId: string, userEmail: string) => {
    if (!promoCode) return;

    try {
      console.log('🎯 Starting promo redemption for:', { userId, userEmail, promoCode });

      const ipAddress = await PromoService.getUserIpAddress();
      const userAgent = PromoService.getUserAgent();

      const result = await PromoService.redeemPromoCode(
        userId,
        promoCode,
        userEmail,
        ipAddress || undefined,
        userAgent
      );

      console.log('📊 Redemption result:', result);

      if (result.success) {
        console.log('🎉 Promo redeemed successfully:', result);
        setPromoTokensAwarded(result.tokensAwarded);
        setShowPromoSuccess(true);
        PromoService.clearPromoCodeFromSession();
      } else {
        console.warn('Promo redemption failed:', result.message);
        if (result.message.includes('claimed')) {
          setShowOfferExpired(true);
        }
      }
    } catch (error) {
      console.error('Error redeeming promo:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Request timed out. Please check your connection and try again.');
    }, 30000);

    try {
      if (isLogin) {
        await signIn(email, password);
        console.log('✅ Login successful, waiting for redirect...');

        trackEvent({
          eventType: 'auth',
          eventName: 'login_success',
          pageName: 'signup',
        });
      } else {
        const strength = getPasswordStrength();
        if (strength.strength === 'weak') {
          clearTimeout(timeoutId);
          setError('Password is too weak. Please include: 8+ characters, uppercase, lowercase, number, and special character.');
          setLoading(false);
          return;
        }
        const userCredential = await signUp(email, password, displayName);
        console.log('✅ Sign up successful, waiting for redirect...');

        if (userCredential?.user?.uid) {
          await trackSignupComplete(userCredential.user.uid);
        }

        if (promoCode && currentUser) {
          await handlePromoRedemption(currentUser.uid, email);
        }
      }

      clearTimeout(timeoutId);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Auth error:', err);
      const errorMessage = err.message || 'Authentication failed';
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Invalid email or password.');
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Please confirm your email address.');
      } else if (errorMessage.includes('User already registered') || errorMessage.includes('email-already-in-use')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (errorMessage.includes('Password should be at least 6 characters')) {
        setError('Password should be at least 6 characters.');
      } else if (errorMessage.includes('Invalid email')) {
        setError('Please enter a valid email address.');
      } else if (errorMessage.includes('user-not-found')) {
        setError('No account found with this email. Please sign up first.');
      } else if (errorMessage.includes('wrong-password') || errorMessage.includes('invalid-credential')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(errorMessage);
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      console.log('✅ Google sign in successful, waiting for redirect...');

      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      console.error('Google auth error:', err);
      const errorMessage = err.message || 'Google authentication failed';
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && promoCode && !isLogin && email) {
      console.log('🔄 User authenticated, attempting promo redemption...');
      handlePromoRedemption(currentUser.uid, email);
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen gradient-background flex items-center justify-center p-3 md:p-4 relative overflow-hidden">
      <CosmicBackground />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orbit-ring hidden md:block" style={{ width: '400px', height: '400px', top: '10%', left: '5%' }} />
        <div className="orbit-ring hidden md:block" style={{ width: '600px', height: '600px', top: '50%', right: '0%' }} />
        <div className="orbit-ring hidden md:block" style={{ width: '300px', height: '300px', bottom: '10%', left: '40%' }} />
      </div>

      <div className={`w-full max-w-md relative z-10 px-2 ${mounted ? 'animate-scale-in' : 'opacity-0'}`}>
        <div className="text-center mb-8 md:mb-10 flex flex-col items-center">
          <img
            src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png"
            alt="KroniQ"
            className="h-32 md:h-40 w-auto object-contain mb-3 drop-shadow-[0_0_20px_rgba(0,255,240,0.6)]"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            <span className="text-glow-teal">KroniQ</span>
          </h1>
          <p className="text-white/70 text-sm md:text-base font-light tracking-wide">
            AI Development Studio
          </p>
        </div>

        <div className="glass-panel rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/20 backdrop-blur-2xl">
          {!isLogin && promoCode && (
            <PromoBanner campaignCode={promoCode} />
          )}

          <div className="flex gap-1 md:gap-2 mb-4 md:mb-6 glass-panel rounded-xl md:rounded-2xl p-1">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 md:py-2.5 px-3 md:px-4 rounded-lg md:rounded-xl font-medium transition-all text-xs md:text-sm blur-transition active:scale-95 ${
                isLogin
                  ? 'bg-gradient-to-r from-[#00FFF0]/30 to-[#8A2BE2]/30 text-white shadow-lg border border-[#00FFF0]/50'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 md:py-2.5 px-3 md:px-4 rounded-lg md:rounded-xl font-medium transition-all text-xs md:text-sm blur-transition active:scale-95 ${
                !isLogin
                  ? 'bg-gradient-to-r from-[#00FFF0]/30 to-[#8A2BE2]/30 text-white shadow-lg border border-[#00FFF0]/50'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {!isLogin && (
              <div className="animate-fade-in-up">
                <label className="block text-xs font-medium text-white/80 mb-1.5 md:mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 glass-panel border border-white/20 rounded-lg md:rounded-xl text-white text-sm placeholder-white/40 focus:outline-none blur-transition"
                    placeholder="John Doe"
                    required={!isLogin}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5 md:mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 glass-panel border border-white/20 rounded-lg md:rounded-xl text-white text-sm placeholder-white/40 focus:outline-none blur-transition"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5 md:mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-9 md:pr-10 py-2.5 md:py-3 glass-panel border border-white/20 rounded-lg md:rounded-xl text-white text-sm placeholder-white/40 focus:outline-none blur-transition"
                  placeholder="••••••••"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {passwordStrength && (
              <div className="space-y-3 animate-fade-in-up">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-white/70">Password Strength</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.strength === 'strong' ? 'text-green-400' :
                      passwordStrength.strength === 'medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {passwordStrength.strength === 'strong' ? 'Strong' :
                       passwordStrength.strength === 'medium' ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.strength === 'strong' ? 'bg-green-500' :
                        passwordStrength.strength === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${passwordStrength.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  <div className={`flex items-center text-xs ${
                    passwordStrength.checks.length ? 'text-green-400' : 'text-white/40'
                  }`}>
                    {passwordStrength.checks.length ? (
                      <Check className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    )}
                    At least 8 characters
                  </div>
                  <div className={`flex items-center text-xs ${
                    passwordStrength.checks.uppercase ? 'text-green-400' : 'text-white/40'
                  }`}>
                    {passwordStrength.checks.uppercase ? (
                      <Check className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    )}
                    One uppercase letter
                  </div>
                  <div className={`flex items-center text-xs ${
                    passwordStrength.checks.lowercase ? 'text-green-400' : 'text-white/40'
                  }`}>
                    {passwordStrength.checks.lowercase ? (
                      <Check className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    )}
                    One lowercase letter
                  </div>
                  <div className={`flex items-center text-xs ${
                    passwordStrength.checks.number ? 'text-green-400' : 'text-white/40'
                  }`}>
                    {passwordStrength.checks.number ? (
                      <Check className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    )}
                    One number
                  </div>
                  <div className={`flex items-center text-xs ${
                    passwordStrength.checks.special ? 'text-green-400' : 'text-white/40'
                  }`}>
                    {passwordStrength.checks.special ? (
                      <Check className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    )}
                    One special character (!@#$%^&*)
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs animate-fade-in-up">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white py-3 md:py-3.5 px-4 rounded-lg md:rounded-xl font-semibold hover:shadow-xl hover:shadow-[#00FFF0]/40 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-sm md:text-base min-h-[48px]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                  <span>Please wait...</span>
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>

            {/* OR Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="text-white/50 text-xs font-medium">OR</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 py-3 md:py-3.5 px-4 rounded-lg md:rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-sm md:text-base min-h-[48px] flex items-center justify-center gap-3 group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-white/50">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-[#00FFF0] hover:text-[#00FFF0]/80 font-medium transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6 space-y-3">
          <p className="text-white/40 text-xs">KroniQ © 2025 — Crafted with intelligence</p>

          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-white/30 hover:text-white/60 text-xs flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <Bug className="w-3 h-3" />
            {showDebug ? 'Hide' : 'Show'} Debug Info
          </button>

          {showDebug && (
            <div className="glass-panel rounded-xl p-3 border border-white/10 text-left">
              <p className="text-white/60 text-xs font-mono mb-2">Firebase Status:</p>
              <div className="space-y-1 text-xs font-mono">
                <p className="text-white/50">Auth: {auth ? '✅ OK' : '❌ NULL'}</p>
                <p className="text-white/50">Project: {auth?.app?.options?.projectId}</p>
                <p className="text-white/50">Domain: {auth?.app?.options?.authDomain}</p>
                {error && <p className="text-red-400 mt-2">Last Error: {error}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {showPromoSuccess && (
        <PromoSuccessModal
          tokensAwarded={promoTokensAwarded}
          onClose={() => {
            setShowPromoSuccess(false);
            window.location.href = '/';
          }}
        />
      )}

      {showOfferExpired && (
        <OfferExpiredModal
          onClose={() => setShowOfferExpired(false)}
        />
      )}
    </div>
  );
};
