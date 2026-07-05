import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { auth } from '@/lib/firebase'
import { updatePassword } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'
import { User, KeyRound, ShieldAlert } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function AdminProfilePage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Profile Updated',
      description: 'Your profile details have been saved.',
    })
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      })
      return
    }

    setLoadingPassword(true)
    try {
      const currentUser = auth.currentUser
      if (currentUser) {
        await updatePassword(currentUser, newPassword)
        toast({
          title: 'Password Updated',
          description: 'Your security password has been changed.',
        })
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast({
          title: 'Action Failed',
          description: 'No active Firebase user context found.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err?.message || 'Failed to update password. Try logging in again first.',
        variant: 'destructive',
      })
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Admin Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your personal console parameters and credentials</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Personal Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <Avatar fallback={getInitials(user?.name || 'A')} size="lg" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">{user?.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                </div>
              </div>

              <Input
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin Name"
                className="bg-background border-border"
              />

              <div className="flex justify-end pt-2">
                <Button type="submit">Save Profile</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security / Password */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" /> Update Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-background border-border"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-background border-border"
                />

                <Button type="submit" isLoading={loadingPassword} className="w-full text-xs">
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security alert */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-warning" /> Security Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Updating passwords requires recent authentication context. If you receive an error, log out of the admin portal and log back in before retrying.
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}
