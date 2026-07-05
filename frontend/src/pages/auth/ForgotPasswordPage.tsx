import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { auth, sendPasswordResetEmail } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Code2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<{ email: string }>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: { email: string }) => {
    setError('')
    try {
      await sendPasswordResetEmail(auth, data.email)
      setSent(true)
    } catch {
      setError('Failed to send reset email. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold">VSB LeetCode</p>
            <p className="text-xs text-muted-foreground">Analytics Dashboard</p>
          </div>
        </div>

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold mb-2">Check your email</h2>
            <p className="text-muted-foreground text-sm mb-6">
              We've sent a password reset link to your email address.
            </p>
            <Link to="/login">
              <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" />Back to Login</Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-1">Forgot password?</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email Address" type="email" placeholder="john@vsb.edu.in"
                leftIcon={<Mail className="w-4 h-4" />} error={errors.email?.message}
                {...register('email')} />

              {error && (
                <div className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</div>
              )}

              <Button type="submit" className="w-full h-11" isLoading={isSubmitting}>
                Send Reset Link
              </Button>
            </form>

            <Link to="/login" className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}
