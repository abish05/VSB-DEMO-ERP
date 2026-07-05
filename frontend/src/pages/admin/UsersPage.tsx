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
import { UserCircle, Shield, GraduationCap, Users as UsersIcon, Trash2 } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function UsersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [roleFilter, setRoleFilter] = useState<string>('')

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1 w-fit"><Shield className="w-3 h-3" /> Admin</Badge>
      case 'FACULTY':
        return <Badge className="bg-success/20 text-success border-success/30 flex items-center gap-1 w-fit"><GraduationCap className="w-3 h-3" /> Faculty</Badge>
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 flex items-center gap-1 w-fit"><UsersIcon className="w-3 h-3" /> Student</Badge>
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
      </motion.div>

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
                        className="bg-slate-950 border border-slate-800 rounded-lg h-8 px-2 text-xs focus:outline-none focus:border-primary"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="FACULTY">FACULTY</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
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
    </motion.div>
  )
}
