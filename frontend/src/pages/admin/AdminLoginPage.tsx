import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { auth, signInWithEmailAndPassword, signOut } from '@/lib/firebase'
import { missingFirebaseEnv } from '@/lib/firebaseConfig'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

// ─── Design Tokens ───────────────────────────────────────────
const C = {
  gold: '#F5B301',
  goldHover: '#E6A300',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSub: '#475569',
  textMuted: '#94A3B8',
  danger: '#EF4444',
  dangerBg: 'rgba(239,68,68,0.08)',
  dangerBorder: 'rgba(239,68,68,0.2)',
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { setUser, setFirebaseUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setError('')
    try {
      if (missingFirebaseEnv.length > 0) {
        const { token, user } = await authService.devLogin(data)
        if (user.role !== 'ADMIN') {
          setError('Access denied. You are not authorized as an administrator.')
          return
        }
        localStorage.setItem('mockToken', token)
        setFirebaseUser({ uid: user.firebaseUid, email: user.email, displayName: user.name, getIdToken: async () => token } as any)
        setUser(user)
        navigate('/admin/dashboard', { replace: true })
        return
      }

      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, data.email, data.password)
      const profile = await authService.getCurrentUser()
      if (profile.role !== 'ADMIN') {
        setError('Access denied. You are not authorized as an administrator.')
        await signOut(auth)
        return
      }
      setFirebaseUser(firebaseUser)
      setUser(profile)
      navigate('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { status?: number; data?: { message?: string } } }
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-login-credentials') {
        setError('Invalid email or password')
      } else if (e.response?.status === 404) {
        setError('No admin account found. Contact your system administrator.')
      } else {
        setError(e.response?.data?.message || 'Login failed. Please try again.')
      }
    }
  }

  const handleDemoLogin = async () => {
    setError('')
    try {
      await signOut(auth)
      const ADMIN_FIREBASE_UID = 'seed-admin-uid-001'
      const ADMIN_EMAIL = 'abishstk@gmail.com'
      const mockToken = `mock:${ADMIN_FIREBASE_UID}:${ADMIN_EMAIL}`
      localStorage.setItem('mockToken', mockToken)
      const profile = await authService.getCurrentUser(mockToken)
      if (profile.role !== 'ADMIN') {
        localStorage.removeItem('mockToken')
        setError('Demo admin account not found. Please run the database seed first.')
        return
      }
      setFirebaseUser({ uid: ADMIN_FIREBASE_UID, email: ADMIN_EMAIL, displayName: 'VSB Administrator', getIdToken: async () => mockToken } as any)
      setUser(profile)
      navigate('/admin/dashboard', { replace: true })
    } catch (err: any) {
      localStorage.removeItem('mockToken')
      setError(err?.response?.data?.message || 'Demo login failed. Ensure the backend is running and DB is seeded.')
    }
  }

  // Pre-fill demo credentials
  const fillDemo = () => {
    setValue('email', 'abishstk@gmail.com')
    setValue('password', 'Admin@123')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: C.bg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo & Heading */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FFF3CC 0%, #FFE066 100%)', border: `1.5px solid ${C.gold}40` }}
          >
            <img src="/logo.png" alt="VSB Logo" className="w-12 h-12 object-contain" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
              e.currentTarget.parentElement!.innerHTML = `<span style="font-size:28px">🏛️</span>`
            }} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: C.textPrimary }}>
            Administrative Portal
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: C.textSub }}>
            VSBCETC  ERP
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-xl"
          style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
        >
          {/* Dev mode notice */}
          {missingFirebaseEnv.length > 0 && (
            <div
              className="flex items-center gap-2 text-xs rounded-lg px-3 py-2.5 mb-6"
              style={{ background: 'rgba(245,179,1,0.08)', border: `1px solid ${C.gold}40`, color: '#92620A' }}
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: C.gold }} />
              Development mode — using backend authentication
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email / Username */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: C.textPrimary }}>
                Admin Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textMuted }} />
                <input
                  type="email"
                  placeholder="e.g. admin1"
                  className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm transition-all outline-none border bg-[#F8FAFC] text-[#0F172A] focus:border-[#F5B301] focus:ring-1 focus:ring-[#F5B301]/20 ${
                    errors.email ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs mt-1" style={{ color: C.danger }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: C.textPrimary }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textMuted }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full h-11 pl-10 pr-11 rounded-xl text-sm transition-all outline-none border bg-[#F8FAFC] text-[#0F172A] focus:border-[#F5B301] focus:ring-1 focus:ring-[#F5B301]/20 ${
                    errors.password ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: C.textMuted }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = C.gold)}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = C.textMuted)}
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
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm rounded-xl px-4 py-3"
                  style={{ color: C.danger, background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
              style={{ background: isSubmitting ? C.goldHover : C.gold, color: '#0F172A' }}
              onMouseEnter={e => { if (!isSubmitting) (e.currentTarget.style.background = C.goldHover) }}
              onMouseLeave={e => { if (!isSubmitting) (e.currentTarget.style.background = C.gold) }}
            >
              {isSubmitting ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : null}
              Authenticate Administrator
            </button>

            {/* Demo buttons */}
            {missingFirebaseEnv.length > 0 && (
              <>
                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t" style={{ borderColor: C.border }} />
                  <span className="mx-3 text-xs font-medium" style={{ color: C.textMuted }}>or</span>
                  <div className="flex-grow border-t" style={{ borderColor: C.border }} />
                </div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 border"
                  style={{ background: 'transparent', border: `1.5px solid ${C.border}`, color: C.textSub }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = C.gold
                    e.currentTarget.style.color = C.gold
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border
                    e.currentTarget.style.color = C.textSub
                  }}
                >
                  Quick Demo Login
                </button>
              </>
            )}
          </form>

          {/* Footer inside card */}
          <p className="text-center text-xs mt-6 font-mono" style={{ color: C.textMuted }}>

          </p>
        </div>
      </motion.div>
    </div>
  )
}
