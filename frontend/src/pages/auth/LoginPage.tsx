import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Code2, Eye, EyeOff, Lock, Mail } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser, setFirebaseUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const completeGoogleLogin = useCallback(async (firebaseUser: User) => {
    setFirebaseUser(firebaseUser)
    try {
      const token = await firebaseUser.getIdToken()
      const profile = await authService.getCurrentUser(token)
      setUser(profile)
      navigate(from, { replace: true })
    } catch (err: any) {
      console.error('completeGoogleLogin failed. Error:', err, 'Status:', err?.response?.status, 'Data:', err?.response?.data);
      if (err.response?.status === 404) {
        setError('No VSBCETC account found for this Google login. Please create an account and link your LeetCode username first.')
      } else {
        setError('Login failed. Please try again.')
      }
      navigate('/register', {
        state: {
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        },
      })
    }
  }, [from, navigate, setFirebaseUser, setUser])



  const onSubmit = async (data: LoginForm) => {
    setError('')
    try {
      if (import.meta.env.DEV && missingFirebaseEnv.length > 0) {
        const { token, user } = await authService.devLogin(data)
        localStorage.setItem('mockToken', token)
        setFirebaseUser({
          uid: user.firebaseUid,
          email: user.email,
          displayName: user.name,
          getIdToken: async () => token,
        } as User)
        setUser(user)
        navigate(from, { replace: true })
        return
      }

      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, data.email, data.password)
      setFirebaseUser(firebaseUser)
      const profile = await authService.getCurrentUser()
      setUser(profile)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      console.error('Firebase sign-in error:', err)
      const e = err as { code?: string }
      if (
        e.code === 'auth/user-not-found' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/invalid-credential' ||
        e.code === 'auth/invalid-login-credentials'
      ) {
        setError('Invalid email or password')
      } else {
        setError('Login failed. Please try again.')
      }
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await completeGoogleLogin(result.user)
    } catch (err: unknown) {
      console.error('Google sign-in error:', err)
      const e = err as { code?: string }
      if (e.code === 'auth/popup-closed-by-user') {
        // Just ignore if the user closes the popup
      } else {
        setError('Google login failed. Please try again.')
      }
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#002147] via-[#0A223D] to-[#004479] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-[#D51616] blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[#FDC500] blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center"
        >
          <div className="w-32 h-32 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl p-3 border border-white/20">
            <img src="/logo.png" alt="VSBCETC Logo" className="w-full h-full object-contain" />
          </div>
          <div className="relative z-20 mt-auto">
          <h1 className="text-4xl font-bold text-white mb-3">VSBCETC LeetCode</h1>
          <p className="text-lg text-primary-200">
            A unified portal to track coding performance, analyze contests, and monitor institutional progress.
          </p>
          </div>

          {/* Feature list */}
          <div className="mt-10 space-y-3 text-left">
            {[
              '🏆 Contest & Rating Analytics',
              '📊 Daily Activity Heatmaps',
              '🎯 Role-Based Dashboards',
              '🔄 Auto LeetCode Sync',
              '📈 Leaderboards & Reports',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {f}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1.5 shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <p className="font-bold text-foreground">VSBCETC LeetCode</p>
          </div>

          <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-6">Sign in to your account to continue</p>

          {missingFirebaseEnv.length > 0 && (
            <div className="text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 mb-4">
              Local demo mode is active.
            </div>
          )}

          {/* Google login */}
          {!missingFirebaseEnv.length && (
            <Button
              variant="outline"
              className="w-full mb-4 h-11 gap-3"
              onClick={handleGoogleLogin}
              isLoading={googleLoading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
          )}

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <div className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full h-11" isLoading={isSubmitting} disabled={missingFirebaseEnv.length > 0}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
