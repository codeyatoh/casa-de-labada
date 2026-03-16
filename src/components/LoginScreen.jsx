import React, { useState } from 'react'
import {
  LockKeyholeIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  LogInIcon,
  SparklesIcon,
} from 'lucide-react'
import { auth } from '../config/firebase'
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { Logo } from './Logo'
import { toast } from 'sonner'

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState(() => localStorage.getItem('cdl_email') || '')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('cdl_remember') === 'true')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.warning('Fill in all fields.')
      return
    }
    
    setIsLoading(true)
    try {
      // Set persistence based on "Remember Me"
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistenceType)
      
      // Save Remember Me preference to localStorage
      if (rememberMe) {
        localStorage.setItem('cdl_email', email.trim())
        localStorage.setItem('cdl_remember', 'true')
      } else {
        localStorage.removeItem('cdl_email')
        localStorage.setItem('cdl_remember', 'false')
      }

      // Attempt login
      await signInWithEmailAndPassword(auth, email, password)
      
      setIsLoading(false)
      onLogin()
    } catch (error) {
      setIsLoading(false)
      // Map Firebase errors to user-friendly messages
      let message = 'Invalid credentials. Please try again.'
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        message = 'Incorrect email or password.'
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Try again later.'
      }
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background:
            'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" />
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl"
        >
          <div className="text-center mb-2">
            <h1 className="font-mono text-xl font-semibold text-white tracking-wide">
              Welcome Back!
            </h1>
            <p className="font-mono text-xs text-zinc-400 mt-1">
              Sign in to your Casa de Labada dashboard
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="font-mono text-xs font-medium text-cyan-400 uppercase tracking-wider block"
            >
              Email
            </label>
            <div className="relative">
              <UserIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                aria-hidden="true"
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 font-mono text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                placeholder="Your email address"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="font-mono text-xs font-medium text-cyan-400 uppercase tracking-wider block"
            >
              Password
            </label>
            <div className="relative">
              <LockKeyholeIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                aria-hidden="true"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-10 pr-12 font-mono text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                placeholder="Your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-cyan-400 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center w-4 h-4 rounded border border-zinc-600 bg-zinc-800 group-hover:border-cyan-500 transition-colors shrink-0">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                {rememberMe && (
                  <div className="w-2.5 h-2.5 rounded-sm bg-cyan-500 animate-scale-in" />
                )}
              </div>
              <span className="font-mono text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                Remember me
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-600/50 text-black font-mono font-semibold text-sm py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group shadow-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <LogInIcon
                  className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
                <span>Sign In</span>
              </>
            )}
          </button>

          <p className="font-mono text-[10px] text-zinc-500 text-center">
            v1.0.0 // CASA DE LABADA
          </p>
        </form>
      </div>
    </div>
  )
}
