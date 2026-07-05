import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { auth, signInWithEmailAndPassword } from '@/lib/firebase'
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
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, data.email, data.password)
      
      // Fetch profile and check role
      const profile = await authService.getCurrentUser()
      if (profile.role !== 'ADMIN') {
        setError('Access denied. You are not authorized as an administrator.')
        await auth.signOut()
        return
      }

      setFirebaseUser(firebaseUser)
      setUser(profile)
      navigate('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      console.error('Admin login error:', err)
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <Code2 className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">VSB LeetCode</h1>
          <p className="text-xs text-primary font-semibold tracking-widest uppercase mt-1">Admin Portal</p>
          <p className="text-sm text-slate-400 mt-2">Sign in to access the institution console</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@vsb.edu.in"
            className="bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-primary"
            leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-primary"
            leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-300">
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
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase font-semibold">Or</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <Button
            type="button"
            className="w-full h-11 border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 gap-2 shadow-md transition-colors"
            onClick={async () => {
              setError('')
              try {
                localStorage.setItem('mockToken', 'mock:seed-admin-uid-001:abishstk@gmail.com')
                const profile = await authService.getCurrentUser()
                setFirebaseUser({
                  uid: 'seed-admin-uid-001',
                  email: 'abishstk@gmail.com',
                  displayName: 'VSB Administrator',
                  getIdToken: async () => 'mock:seed-admin-uid-001:abishstk@gmail.com',
                } as any)
                setUser(profile)
                navigate('/admin/dashboard', { replace: true })
              } catch (err) {
                console.error('Demo login failed:', err)
                setError('Demo login failed. Make sure the backend server is running.')
              }
            }}
          >
            Demo Admin Login
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
