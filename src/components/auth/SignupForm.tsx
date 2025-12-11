import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Check, X, ArrowRight, Sparkles } from 'lucide-react'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const getPasswordStrength = () => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const passedChecks = Object.values(checks).filter(Boolean).length

    return {
      checks,
      strength: passedChecks === 5 ? 'strong' : passedChecks >= 3 ? 'medium' : 'weak',
      percentage: (passedChecks / 5) * 100
    }
  }

  const passwordStrength = password ? getPasswordStrength() : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      })

      if (error) throw error

      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID
          }
        }
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const strengthColor = passwordStrength?.strength === 'strong'
    ? 'from-[#10B981] to-[#34D399]'
    : passwordStrength?.strength === 'medium'
      ? 'from-[#F59E0B] to-[#FBBF24]'
      : 'from-[#EF4444] to-[#F87171]'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-10 right-20 w-80 h-80 bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-gradient-to-br from-[#EC4899]/15 to-[#F97316]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#06B6D4]/10 to-[#EAB308]/10 rounded-full blur-3xl opacity-40" />

      <div className="relative z-10 max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 mb-4 group">
            <img
              src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png"
              alt="KroniQ"
              className="h-12 w-auto object-contain group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-2xl font-bold text-white">KroniQ</span>
          </Link>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Create your account
          </h2>
          <p className="text-white/60">Start creating with AI today</p>
        </div>

        {/* Form Card */}
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#EC4899]/50 focus:ring-2 focus:ring-[#EC4899]/20 transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#EC4899]/50 focus:ring-2 focus:ring-[#EC4899]/20 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#EC4899]/50 focus:ring-2 focus:ring-[#EC4899]/20 transition-all"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && passwordStrength && (
              <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white/70">Password Strength</span>
                  <span className={`text-sm font-semibold bg-gradient-to-r ${strengthColor} bg-clip-text text-transparent`}>
                    {passwordStrength.strength === 'strong' ? 'Strong' :
                      passwordStrength.strength === 'medium' ? 'Medium' : 'Weak'}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${strengthColor} transition-all duration-300`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'length', label: '8+ characters' },
                    { key: 'uppercase', label: 'Uppercase' },
                    { key: 'lowercase', label: 'Lowercase' },
                    { key: 'number', label: 'Number' },
                    { key: 'special', label: 'Special char' }
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-1.5 ${passwordStrength.checks[key as keyof typeof passwordStrength.checks]
                          ? 'text-[#10B981]'
                          : 'text-white/40'
                        }`}
                    >
                      {passwordStrength.checks[key as keyof typeof passwordStrength.checks] ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#3B82F6] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#EC4899]/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0a0a0f] text-white/50">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-300 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? 'Signing up...' : 'Sign up with Google'}
            </button>

            <p className="text-center text-white/60 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] bg-clip-text text-transparent hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-6">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="underline hover:text-white/60">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="underline hover:text-white/60">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}