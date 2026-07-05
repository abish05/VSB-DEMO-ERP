import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/tables/DataTable'
import { Avatar } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { adminService } from '@/services/admin.service'
import { useToast } from '@/hooks/use-toast'
import { Plus, GraduationCap, Pencil, Trash2, X } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function FacultyManagementPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  // Query resources
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => adminService.getDepartments() })

  // Query faculty
  const { data: facultyData, isLoading: loadingFaculty } = useQuery({
    queryKey: ['adminFaculty'],
    queryFn: () => adminService.getUsers({ role: 'FACULTY', limit: 1000 }),
  })
  const faculty = facultyData?.data || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminService.createUser(payload),
    onSuccess: () => {
      toast({ title: 'Faculty Added', description: 'The faculty member profile has been created.' })
      queryClient.invalidateQueries({ queryKey: ['adminFaculty'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to add faculty.', variant: 'destructive' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminService.updateUser(id, payload),
    onSuccess: () => {
      toast({ title: 'Faculty Updated', description: 'Faculty member profile has been updated.' })
      queryClient.invalidateQueries({ queryKey: ['adminFaculty'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to update faculty.', variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      toast({ title: 'Faculty Deleted', description: 'Faculty member profile deleted successfully.' })
      queryClient.invalidateQueries({ queryKey: ['adminFaculty'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to delete faculty.', variant: 'destructive' })
    }
  })

  const openAddModal = () => {
    setEditingFaculty(null)
    setName('')
    setEmail('')
    setDepartmentId(depts?.[0]?.id || '')
    setIsModalOpen(true)
  }

  const openEditModal = (member: any) => {
    setEditingFaculty(member)
    setName(member.name)
    setEmail(member.email)
    setDepartmentId(member.departmentId || '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingFaculty(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name,
      email,
      role: 'FACULTY',
      departmentId,
    }
    if (editingFaculty) {
      updateMutation.mutate({ id: editingFaculty.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Faculty Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage institutional faculty members and allocations</p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="w-4 h-4" /> Add Faculty Member
        </Button>
      </motion.div>

      {/* Faculty Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <GraduationCap className="w-4 h-4 text-primary" /> Faculty Registry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={faculty}
              isLoading={loadingFaculty}
              columns={[
                {
                  key: 'name',
                  label: 'Faculty Member',
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
                  key: 'dept',
                  label: 'Department',
                  render: (r: any) => <Badge variant="secondary">{r.department?.code || '—'}</Badge>,
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (r: any) => (
                    <Badge variant={r.isActive ? 'success' : 'error'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
                  ),
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (r: any) => (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(r)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-error hover:text-error" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              exportFilename="faculty"
              emptyMessage="No faculty records found."
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Add / Edit Faculty Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
          >
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-200 mb-4">{editingFaculty ? 'Edit Faculty Member' : 'Add Faculty Member'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Dr. Priya Nair" className="bg-slate-950 border-slate-800" />
              <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="priya@vsb.edu.in" className="bg-slate-950 border-slate-800" />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Department</label>
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary">
                  {depts?.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="border-slate-800 text-slate-400 hover:bg-slate-800">Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>Save Profile</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
