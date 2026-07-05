import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { auth, signInWithEmailAndPassword, signOut } from '@/lib/firebase'
import { missingFirebaseEnv } from '@/lib/firebaseConfig'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Code2, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { setUser, setFirebaseUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setError('')
    try {
      if (missingFirebaseEnv.length > 0) {
        // Dev mode: use dev-login endpoint
        const { token, user } = await authService.devLogin(data)
        if (user.role !== 'ADMIN') {
          setError('Access denied. You are not authorized as an administrator.')
          return
        }
        localStorage.setItem('mockToken', token)
        setFirebaseUser({
          uid: user.firebaseUid,
          email: user.email,
          displayName: user.name,
          getIdToken: async () => token,
        } as any)
        setUser(user)
        navigate('/admin/dashboard', { replace: true })
        return
      }

      // Production: use real Firebase Auth
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, data.email, data.password)

      // Fetch profile from database and verify admin role
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
      console.error('Admin login error:', err)
      const e = err as { code?: string; response?: { status?: number; data?: { message?: string } } }
      if (
        e.code === 'auth/user-not-found' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/invalid-credential' ||
        e.code === 'auth/invalid-login-credentials'
      ) {
        setError('Invalid email or password')
      } else if (e.response?.status === 404) {
        setError('No admin account found for this email. Please contact your system administrator.')
      } else {
        setError(e.response?.data?.message || 'Login failed. Please try again.')
      }
    }
  }

  const handleDemoLogin = async () => {
    setError('')
    try {
      // Ensure any existing Firebase student session is cleared before demo admin login
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

      setFirebaseUser({
        uid: ADMIN_FIREBASE_UID,
        email: ADMIN_EMAIL,
        displayName: 'VSB Administrator',
        getIdToken: async () => mockToken,
      } as any)
      setUser(profile)
      navigate('/admin/dashboard', { replace: true })
    } catch (err: any) {
      localStorage.removeItem('mockToken')
      console.error('Demo login failed:', err)
      setError(
        err?.response?.data?.message ||
        'Demo login failed. Make sure the backend server is running and the database is seeded.'
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center border border-primary/20">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">VSBCETC LeetCode</h1>
              <p className="text-sm font-semibold tracking-wider text-primary">ADMINISTRATION</p>
            </div>
          </div>

        {missingFirebaseEnv.length > 0 && (
          <div className="text-xs text-muted-foreground bg-slate-800/50 border border-input rounded-lg px-3 py-2 mb-5 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            Development mode active — using backend authentication
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Admin Email"
            type="email"
            placeholder="admin@vsbcetc.edu.in"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />

          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary-hover text-white shadow-lg" isLoading={isSubmitting}>
            Log In to Console
          </Button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase font-semibold">Or</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <Button
            type="button"
            className="w-full h-11 border border-input bg-slate-800/50 hover:bg-slate-800 text-muted-foreground gap-2 shadow-md transition-colors"
            onClick={handleDemoLogin}
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            Demo Admin Login
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          Demo uses the seeded admin account from the database
        </p>
      </motion.div>
    </div>
  )
}
