import { useCallback, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  type User,
} from '@/lib/firebase'
import { missingFirebaseEnv } from '@/lib/firebaseConfig'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { Eye, EyeOff, Lock, Mail, BarChart2, Github, Trophy, Zap, Users, GraduationCap } from 'lucide-react'

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  gold: '#F5B301',
  goldHover: '#E6A300',
  goldLight: '#FFD45A',
  darkBg: '#111827',
  darkSurface: '#1E293B',
  darkCard: '#243447',
  text: '#FFFFFF',
  textSec: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  borderLight: '#1E3A5F',
  success: '#22C55E',
  danger: '#EF4444',
}

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

type TabType = 'student' | 'staff'

const features = [
  { icon: BarChart2, title: 'LeetCode Tracking', desc: 'Real-time problem stats & heatmaps' },
  { icon: Github, title: 'GitHub Analytics', desc: 'Commits, PRs, contribution graphs' },
  { icon: Trophy, title: 'Leaderboards', desc: 'Department & global rankings' },
  { icon: Zap, title: 'AI Analysis', desc: 'Gemini-powered insights & recommendations' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser, setFirebaseUser } = useAuthStore()

  const [tab, setTab] = useState<TabType>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const switchTab = (t: TabType) => {
    setTab(t)
    setError('')
    reset()
  }

  // ── Google login (student only) ──────────────────────────────
  const completeGoogleLogin = useCallback(async (firebaseUser: User) => {
    setFirebaseUser(firebaseUser)
    try {
      const token = await firebaseUser.getIdToken()
      const profile = await authService.getCurrentUser(token)
      setUser(profile)
      navigate(from, { replace: true })
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No VSBCETC account found. Please create an account first.')
      } else {
        setError('Login failed. Please try again.')
      }
      navigate('/register', { state: { email: firebaseUser.email, name: firebaseUser.displayName } })
    }
  }, [from, navigate, setFirebaseUser, setUser])

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await completeGoogleLogin(result.user)
    } catch (err: unknown) {
      const e = err as { code?: string }
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('Google login failed. Please try again.')
      }
      setGoogleLoading(false)
    }
  }

  // ── Email/password submit ────────────────────────────────────
  const onSubmit = async (data: LoginForm) => {
    setError('')
    try {
      // Dev mode — both student & staff go through devLogin
      if (import.meta.env.DEV && missingFirebaseEnv.length > 0) {
        const { token, user } = await authService.devLogin(data)

        if (tab === 'staff' && user.role !== 'FACULTY' && user.role !== 'ADMIN') {
          setError('Access denied. This account is not a staff account.')
          return
        }
        if (tab === 'student' && user.role !== 'STUDENT') {
          setError('Access denied. Please use a student account or switch to Staff Login.')
          return
        }

        localStorage.setItem('mockToken', token)
        setFirebaseUser({ uid: user.firebaseUid, email: user.email, displayName: user.name, getIdToken: async () => token } as User)
        setUser(user)
        navigate(from, { replace: true })
        return
      }

      // Production Firebase Auth
      const emailToUse = data.email.includes('@') ? data.email : `${data.email}@vsbcetc.edu.in`
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, emailToUse, data.password)
      setFirebaseUser(firebaseUser)
      const profile = await authService.getCurrentUser()

      if (tab === 'staff' && profile.role !== 'FACULTY' && profile.role !== 'ADMIN') {
        setError('Access denied. This account is not a staff account.')
        return
      }
      if (tab === 'student' && profile.role !== 'STUDENT') {
        setError('Access denied. Please use a student account.')
        return
      }

      setUser(profile)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const e = err as { code?: string }
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' ||
        e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-login-credentials') {
        setError('Invalid credentials. Please check and try again.')
      } else {
        setError('Login failed. Please try again.')
      }
    }
  }

  // ── Shared Input ────────────────────────────────────────────
  const inputClass = `w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none transition-all`

  return (
    <div className="min-h-screen flex">
      {/* ═══ LEFT: Warm Cream Branding ═══════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #FFF8E7 0%, #FFF0B3 50%, #FFE680 100%)' }}
      >
        {/* Blobs */}
        <div className="absolute top-[-60px] left-[-60px] w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: `${C.gold}33` }} />
        <div className="absolute bottom-[-40px] right-[-40px] w-56 h-56 rounded-full blur-2xl pointer-events-none" style={{ background: `${C.gold}44` }} />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-white p-1 overflow-hidden">
            <img src="/logo.png" alt="VSBCETC Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-bold text-base leading-tight" style={{ color: C.darkBg }}>VSB College of engineering Technical campus</p>
            <p className="text-xs font-medium" style={{ color: `${C.darkBg}99` }}>Coimbatore</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h1 className="text-5xl font-extrabold leading-tight mb-2" style={{ color: C.darkBg }}>
              Track. Analyze.
            </h1>
            <h1 className="text-5xl font-extrabold leading-tight mb-6" style={{ color: C.gold }}>
              Excel.
            </h1>
            <p className="text-base leading-relaxed max-w-sm" style={{ color: `${C.darkBg}B3` }}>
              AI-powered coding analytics for{' '}
              <span className="font-semibold" style={{ color: C.gold }}>placement readiness</span>. Monitor{' '}
              <span className="font-semibold" style={{ color: C.darkBg }}>10,000+ students</span> in real-time.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
            className="grid grid-cols-2 gap-3 mt-8"
          >
            {features.map((f) => (
              <div
                key={f.title}
                className="backdrop-blur-sm rounded-xl p-4 flex items-start gap-3 transition-all duration-200 cursor-default"
                style={{ background: `${C.darkSurface}DD`, border: `1px solid ${C.border}99` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${C.gold}66`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${C.border}99`)}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${C.gold}22` }}>
                  <f.icon className="w-4 h-4" style={{ color: C.gold }} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight" style={{ color: C.text }}>{f.title}</p>
                  <p className="text-xs mt-0.5 leading-tight" style={{ color: C.textSec }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: `${C.darkBg}66` }}>
          © 2025 VSB College of engineering Technical campus ·VSBCETC .{' '}
          <span className="font-medium" style={{ color: C.gold }}>All rights reserved.</span>
        </p>
      </motion.div>

      {/* ═══ RIGHT: Dark Navy Login ═══════════════════════════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-8 relative"
        style={{ background: `linear-gradient(180deg, ${C.darkBg} 0%, #151f30 100%)` }}
      >
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white p-1 overflow-hidden">
            <img src="/logo.png" alt="VSBCETC Logo" className="w-full h-full object-contain" />
          </div>
          <p className="font-bold text-white text-base">VSB College of engineering Technical campus</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <h2 className="text-3xl font-bold mb-1" style={{ color: C.text }}>VSB Portal Login</h2>
          <p className="text-sm mb-7" style={{ color: C.textSec }}>Sign in to access your dashboard</p>

          {/* ── Tab Switcher ─────────────────────────────────── */}
          <div
            className="flex rounded-xl p-1 mb-7 relative"
            style={{ background: C.darkSurface, border: `1px solid ${C.border}` }}
          >
            {/* Sliding pill */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg shadow-md"
              style={{ background: C.gold, width: 'calc(50% - 4px)' }}
              animate={{ left: tab === 'student' ? '4px' : 'calc(50%)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
            <button
              type="button"
              className="relative flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-colors duration-200 z-10"
              style={{ color: tab === 'student' ? C.darkBg : C.textSec }}
              onClick={() => switchTab('student')}
            >
              <GraduationCap className="w-4 h-4" />
              Student Login
            </button>
            <button
              type="button"
              className="relative flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-colors duration-200 z-10"
              style={{ color: tab === 'staff' ? C.darkBg : C.textSec }}
              onClick={() => switchTab('staff')}
            >
              <Users className="w-4 h-4" />
              Staff Login
            </button>
          </div>

          {/* Dev mode notice */}
          {missingFirebaseEnv.length > 0 && (
            <div className="text-xs rounded-lg px-3 py-2 mb-5" style={{ background: C.darkSurface, border: `1px solid ${C.border}`, color: C.textSec }}>
              Local demo mode is active.
            </div>
          )}

          {/* Google (student only) */}
          <AnimatePresence mode="wait">
            {tab === 'student' && !missingFirebaseEnv.length && (
              <motion.div
                key="google-btn"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full h-11 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-200 mb-4"
                  style={{ background: C.darkCard, border: `1.5px solid ${C.border}`, color: C.text }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.gold}66`; e.currentTarget.style.background = C.darkSurface }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.darkCard }}
                >
                  {googleLoading ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: C.border }} />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3" style={{ background: C.darkBg, color: C.textSec }}>or continue with email</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Form ─────────────────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email / Username */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#C5CBD8' }}>
                {tab === 'student' ? 'Student Email or Username' : 'Staff Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textSec }} />
                <input
                  type="text"
                  placeholder={tab === 'student' ? 'student1@vsb.edu.in or student1' : 'staff@vsbcetc.edu.in'}
                  className={`${inputClass} border bg-[#243447] text-white focus:border-[#F5B301] focus:ring-1 focus:ring-[#F5B301]/30 ${errors.email ? 'border-[#EF4444]' : 'border-[#334155]'
                    }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs mt-1" style={{ color: C.danger }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: '#C5CBD8' }}>Password</label>
                <Link to="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: C.gold }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textSec }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11 border bg-[#243447] text-white focus:border-[#F5B301] focus:ring-1 focus:ring-[#F5B301]/30 ${errors.password ? 'border-[#EF4444]' : 'border-[#334155]'
                    }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: C.textSec }}
                  onMouseEnter={e => ((e.currentTarget.style.color = C.gold))}
                  onMouseLeave={e => ((e.currentTarget.style.color = C.textSec))}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: C.danger }}>{errors.password.message}</p>}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="text-sm rounded-xl px-3 py-2.5"
                  style={{ color: C.danger, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              style={{ background: C.gold, color: C.darkBg }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = C.goldHover }}
              onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = C.gold }}
            >
              {isSubmitting ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : null}
              {tab === 'student' ? 'Sign in as Student' : 'Sign in as Staff'}
            </button>
          </form>

          {/* Register link */}
          {tab === 'student' && (
            <p className="text-center text-sm mt-5" style={{ color: C.textSec }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: C.gold }}>
                Create account
              </Link>
            </p>
          )}

          {/* Demo credentials */}
          {missingFirebaseEnv.length > 0 && (
            <div
              className="mt-5 rounded-xl p-4"
              style={{ background: C.darkCard, border: `1px solid ${C.border}` }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: C.textSec }}>Demo Credentials</p>
              <p className="text-xs" style={{ color: '#C5CBD8' }}>
                Student: <span className="font-mono" style={{ color: C.gold }}>student1</span> /{' '}
                <span className="font-mono" style={{ color: C.gold }}>Student@123</span>
              </p>
              <p className="text-xs mt-1" style={{ color: '#C5CBD8' }}>
                Staff: <span className="font-mono" style={{ color: C.gold }}>staff1</span> /{' '}
                <span className="font-mono" style={{ color: C.gold }}>Staff@123</span>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
