import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { Avatar } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { adminService } from '@/services/admin.service'
import { useToast } from '@/hooks/use-toast'
import { UserCircle, Shield, GraduationCap, Users as UsersIcon, Trash2, Plus, X, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/input'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function UsersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'ADMIN' })
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Query unified users registry
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', roleFilter],
    queryFn: () => adminService.getUsers({ role: roleFilter || undefined, limit: 1000 }),
  })
  const users = usersData?.data || []

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => adminService.updateUserRole(userId, role),
    onSuccess: () => {
      toast({ title: 'Role Updated', description: 'User role has been successfully modified.' })
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to update user role.', variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      toast({ title: 'User Deleted', description: 'Account deleted from records.' })
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to delete user.', variant: 'destructive' })
    }
  })

  const updatePasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) => adminService.updateUserPassword(userId, password),
    onSuccess: () => {
      toast({ title: 'Password Updated', description: "User's password has been successfully changed." })
      setEditingPasswordUserId(null)
      setNewPassword('')
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to update password.', variant: 'destructive' })
    }
  })

  const handleRoleChange = (userId: string, newRole: string) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      updateRoleMutation.mutate({ userId, role: newRole })
    }
  }

  const handleDelete = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action is irreversible.')) {
      deleteMutation.mutate(userId)
    }
  }

  const createUserMutation = useMutation({
    mutationFn: (data: any) => adminService.createUser(data),
    onSuccess: () => {
      toast({ title: 'User Created', description: 'New user account created successfully.' })
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
      setIsCreatingUser(false)
      setNewUserForm({ name: '', email: '', role: 'ADMIN' })
    },
    onError: (err: any) => {
      toast({ title: 'Creation Failed', description: err?.response?.data?.message || 'Failed to create user.', variant: 'destructive' })
    }
  })

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserForm.name || !newUserForm.email) {
      toast({ title: 'Missing Fields', description: 'Please provide name and email.', variant: 'destructive' })
      return
    }
    createUserMutation.mutate(newUserForm)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1 w-fit"><Shield className="w-3 h-3" /> Admin</Badge>
      case 'FACULTY':
        return <Badge className="bg-success/20 text-success border-success/30 flex items-center gap-1 w-fit"><GraduationCap className="w-3 h-3" /> Faculty</Badge>
      default:
        return <Badge className="bg-slate-500/20 text-muted-foreground border-slate-500/30 flex items-center gap-1 w-fit"><UsersIcon className="w-3 h-3" /> Student</Badge>
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage institutional console access roles and privileges</p>
        </div>
        {/* Role Filters */}
        <div className="flex gap-2">
          {['', 'ADMIN', 'FACULTY', 'STUDENT'].map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(role)}
            >
              {role === '' ? 'All Roles' : role.charAt(0) + role.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
        <Button onClick={() => setIsCreatingUser(!isCreatingUser)} className="gap-2 bg-primary hover:bg-primary-hover">
          {isCreatingUser ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreatingUser ? 'Cancel' : 'Create Admin/User'}
        </Button>
      </motion.div>

      {/* Create User Form */}
      {isCreatingUser && (
        <motion.div variants={itemVariants} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Shield className="w-4 h-4" /> Provision New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Full Name</label>
                  <Input 
                    placeholder="Jane Doe" 
                    value={newUserForm.name} 
                    onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} 
                    className="bg-background border-input"
                  />
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="jane@vsb.edu.in" 
                    value={newUserForm.email} 
                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} 
                    className="bg-background border-input"
                  />
                </div>
                <div className="w-full sm:w-48 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full bg-background border border-input rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="FACULTY">FACULTY</option>
                    <option value="STUDENT">STUDENT</option>
                  </select>
                </div>
                <Button type="submit" className="w-full sm:w-auto h-10 px-8" isLoading={createUserMutation.isPending}>
                  Create
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Users Registry Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserCircle className="w-4 h-4 text-primary" /> Active User Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={users}
              isLoading={isLoading}
              columns={[
                {
                  key: 'name',
                  label: 'User Profile',
                  sortable: true,
                  render: (r: any) => (
                    <div className="flex items-center gap-3">
                      <Avatar fallback={getInitials(r.name)} size="sm" />
                      <div>
                        <p className="font-semibold text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'role',
                  label: 'Role Status',
                  render: (r: any) => getRoleBadge(r.role),
                },
                {
                  key: 'dept',
                  label: 'Department',
                  render: (r: any) => <span className="text-xs">{r.department?.code || '—'}</span>,
                },
                {
                  key: 'actions',
                  label: 'Console Actions',
                  render: (r: any) => (
                    <div className="flex items-center gap-2">
                      <select
                        value={r.role}
                        onChange={(e) => handleRoleChange(r.id, e.target.value)}
                        className="bg-background border border-input rounded-lg h-8 px-2 text-xs focus:outline-none focus:border-primary text-foreground"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="FACULTY">FACULTY</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary/80"
                        onClick={() => setEditingPasswordUserId(r.id)}
                        title="Change Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-error hover:text-error"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              exportFilename="users_list"
              emptyMessage="No users matched filters."
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Password Modal */}
      {editingPasswordUserId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
          >
            <button onClick={() => setEditingPasswordUserId(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-foreground mb-4">Change User Password</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              updatePasswordMutation.mutate({ userId: editingPasswordUserId, password: newPassword })
            }} className="space-y-4">
              <Input 
                label="New Password" 
                type="password"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                placeholder="Enter new password" 
                className="bg-background border-input text-foreground" 
              />
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingPasswordUserId(null)} className="border-input text-muted-foreground hover:bg-muted">Cancel</Button>
                <Button type="submit" isLoading={updatePasswordMutation.isPending}>Save Password</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
