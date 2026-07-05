import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { auth, createUserWithEmailAndPassword, sendEmailVerification } from '@/lib/firebase'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Code2, Eye, EyeOff, Lock, Mail, User, CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react'
import type { Department, Batch, Section } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['STUDENT', 'FACULTY']),
  leetcodeUsername: z.string().min(1, 'LeetCode username is required'),
  avatar: z.string().optional(),
  registerNumber: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  batchId: z.string().optional(),
  sectionId: z.string().optional(),
  employeeId: z.string().optional(),
  designation: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).superRefine((data, ctx) => {
  if (data.role === 'STUDENT') {
    if (!data.registerNumber || data.registerNumber.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Register number is required for students',
        path: ['registerNumber'],
      })
    }
    if (!data.batchId || data.batchId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Batch is required for students',
        path: ['batchId'],
      })
    }
    if (!data.sectionId || data.sectionId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Section is required for students',
        path: ['sectionId'],
      })
    }
  } else if (data.role === 'FACULTY') {
    if (!data.employeeId || data.employeeId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Employee ID is required for faculty',
        path: ['employeeId'],
      })
    }
    if (!data.designation || data.designation.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Designation is required for faculty',
        path: ['designation'],
      })
    }
  }
})

type RegisterForm = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser, setFirebaseUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  
  // Registration options dropdown lists
  const [departments, setDepartments] = useState<Department[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)

  // LeetCode verification states
  const [lcUsername, setLcUsername] = useState('')
  const [lcState, setLcState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [lcMessage, setLcMessage] = useState('')
  const [verifiedUsername, setVerifiedUsername] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'STUDENT' }
  })

  const selectedRole = watch('role')

  // Load registration dropdown collections
  useEffect(() => {
    async function loadOptions() {
      try {
        const data = await authService.getRegistrationOptions()
        setDepartments(data.departments)
        setBatches(data.batches)
        setSections(data.sections)
      } catch (err) {
        console.error('Failed to load selection data:', err)
      } finally {
        setOptionsLoading(false)
      }
    }
    loadOptions()
  }, [])

  const handleLcUsernameChange = (val: string) => {
    setLcUsername(val)
    if (verifiedUsername) {
      setVerifiedUsername('')
      setLcState('idle')
      setLcMessage('')
      setValue('leetcodeUsername', '', { shouldValidate: true })
    }
  }

  // Validate username availability on demand
  const handleVerifyUsername = async () => {
    const trimmed = lcUsername.trim()
    if (!trimmed) {
      setLcState('invalid')
      setLcMessage('Please enter a username')
      setValue('leetcodeUsername', '', { shouldValidate: true })
      return
    }
    setLcState('checking')
    setLcMessage('')
    try {
      const result = await authService.checkLeetCodeUsername(trimmed)
      if (result.exists && result.available) {
        setLcState('valid')
        setLcMessage('LeetCode username verified!')
        setVerifiedUsername(trimmed)
        setValue('leetcodeUsername', trimmed, { shouldValidate: true })
      } else {
        setLcState('invalid')
        setLcMessage(result.message || 'Username not found or already in use')
        setVerifiedUsername('')
        setValue('leetcodeUsername', '', { shouldValidate: true })
      }
    } catch (err) {
      setLcState('invalid')
      setLcMessage('Unable to connect to verification server')
      setVerifiedUsername('')
      setValue('leetcodeUsername', '', { shouldValidate: true })
    }
  }

  const onSubmit = async (data: RegisterForm) => {
    setError('')
    setSyncMessage('')

    if (!verifiedUsername || verifiedUsername.toLowerCase() !== data.leetcodeUsername.toLowerCase().trim()) {
      setError('Please verify your LeetCode username before registering.')
      return
    }

    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, data.email, data.password)
      await sendEmailVerification(firebaseUser)
      setFirebaseUser(firebaseUser)

      const profile = await authService.registerUser({
        firebaseUid: firebaseUser.uid,
        email: data.email,
        name: data.name,
        role: data.role,
        avatar: data.avatar,
        registerNumber: data.registerNumber,
        employeeId: data.employeeId,
        designation: data.designation,
        departmentId: data.departmentId,
        batchId: data.batchId,
        sectionId: data.sectionId,
        leetcodeUsername: verifiedUsername,
      })

      setUser(profile)
      if ((profile as any).syncMessage) {
        setSyncMessage((profile as any).syncMessage)
      } else {
        setSyncMessage('Your LeetCode profile has been successfully linked and synchronized.')
      }

      // Display sync success banner briefly, then route to corresponding console
      setTimeout(() => {
        const dest = data.role === 'FACULTY' ? '/faculty/dashboard' : '/student/dashboard'
        navigate(dest, { replace: true })
      }, 3000)
    } catch (err: any) {
      console.error('Registration error:', err)
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.'
      setError(msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center border border-primary/20">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-100">VSB LeetCode</p>
            <p className="text-xs text-primary font-semibold tracking-wider">Analytics Console</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-1">Create your profile</h2>
        <p className="text-slate-400 text-sm mb-6">Join VSB LeetCode dashboard</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              leftIcon={<User className="w-4 h-4 text-slate-500" />}
              error={errors.name?.message}
              {...register('name')}
              className="bg-slate-950 border-slate-800 text-slate-200"
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="john@vsb.edu.in"
              leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
              error={errors.email?.message}
              {...register('email')}
              className="bg-slate-950 border-slate-800 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
              className="bg-slate-950 border-slate-800 text-slate-200"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              className="bg-slate-950 border-slate-800 text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Role selection</label>
            <div className="grid grid-cols-2 gap-3">
              {(['STUDENT', 'FACULTY'] as const).map((role) => (
                <label key={role} className="flex items-center gap-2 border border-slate-800 rounded-lg px-4 py-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input type="radio" value={role} {...register('role')} className="text-primary" />
                  <span className="text-sm font-medium text-slate-300 capitalize">{role.toLowerCase()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional Student vs Faculty forms */}
          {selectedRole === 'STUDENT' ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Input
                label="Register Number"
                placeholder="922521104001"
                error={errors.registerNumber?.message}
                {...register('registerNumber')}
                className="bg-slate-950 border-slate-800 text-slate-200"
              />

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Department</label>
                  <select
                    {...register('departmentId')}
                    className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  >
                    <option value="">Select</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.code}</option>
                    ))}
                  </select>
                  {errors.departmentId && <p className="text-xs text-error">{errors.departmentId.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Batch</label>
                  <select
                    {...register('batchId')}
                    className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  >
                    <option value="">Select</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {errors.batchId && <p className="text-xs text-error">{errors.batchId.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Section</label>
                  <select
                    {...register('sectionId')}
                    className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  >
                    <option value="">Select</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.sectionId && <p className="text-xs text-error">{errors.sectionId.message}</p>}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Employee ID"
                  placeholder="EMP-1002"
                  error={errors.employeeId?.message}
                  {...register('employeeId')}
                  className="bg-slate-950 border-slate-800 text-slate-200"
                />

                <Input
                  label="Designation"
                  placeholder="Assistant Professor"
                  error={errors.designation?.message}
                  {...register('designation')}
                  className="bg-slate-950 border-slate-800 text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Department</label>
                <select
                  {...register('departmentId')}
                  className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-xs text-error">{errors.departmentId.message}</p>}
              </div>
            </motion.div>
          )}

          {/* LeetCode Username link validation */}
          <div className="border border-slate-800 bg-slate-950/30 rounded-xl p-4 space-y-3">
            <label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> LeetCode Integration
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="LeetCode username"
                  value={lcUsername}
                  onChange={(e) => handleLcUsernameChange(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              </div>
              <Button
                type="button"
                onClick={handleVerifyUsername}
                disabled={lcState === 'checking'}
                className="h-9 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700"
              >
                {lcState === 'checking' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
              </Button>
            </div>

            {/* Validation states message */}
            <AnimatePresence mode="wait">
              {lcMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 text-xs mt-1"
                >
                  {lcState === 'valid' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400 font-medium">{lcMessage}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-rose-400 font-medium">{lcMessage}</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden hook input synced on verify */}
            <input type="hidden" value={verifiedUsername} {...register('leetcodeUsername')} />
            {errors.leetcodeUsername && <p className="text-xs text-error mt-1">{errors.leetcodeUsername.message}</p>}
          </div>

          {/* Sync status and registration flow logs */}
          {syncMessage && (
            <div className="text-sm text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 rounded-lg px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>{syncMessage}</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-rose-400 bg-rose-950/20 border border-rose-900/50 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-primary hover:bg-primary-hover text-white shadow-lg"
            isLoading={isSubmitting}
            disabled={!verifiedUsername || optionsLoading}
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
