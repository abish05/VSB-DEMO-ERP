import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/tables/DataTable'
import { adminService } from '@/services/admin.service'
import { useToast } from '@/hooks/use-toast'
import { Plus, Building2, Pencil, Trash2, X } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function DepartmentsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<any | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  // Query departments
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => adminService.getDepartments(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminService.createDepartment(payload),
    onSuccess: () => {
      toast({ title: 'Department Created', description: 'The department has been added.' })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to add department.', variant: 'destructive' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminService.updateDepartment(id, payload),
    onSuccess: () => {
      toast({ title: 'Department Updated', description: 'The department details have been updated.' })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to update department.', variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteDepartment(id),
    onSuccess: () => {
      toast({ title: 'Department Deleted', description: 'Deleted department from database.' })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to delete department.', variant: 'destructive' })
    }
  })

  const openAddModal = () => {
    setEditingDept(null)
    setName('')
    setCode('')
    setDescription('')
    setIsModalOpen(true)
  }

  const openEditModal = (dept: any) => {
    setEditingDept(dept)
    setName(dept.name)
    setCode(dept.code)
    setDescription(dept.description || '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingDept(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { name, code, description }
    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure and manage college departments</p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Departments', value: departments.length, color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-primary" /> Active Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={departments}
              isLoading={isLoading}
              columns={[
                { key: 'code', label: 'Code', sortable: true, render: (r) => <Badge variant="default">{r.code as string}</Badge> },
                { key: 'name', label: 'Department Name', sortable: true },
                { key: 'description', label: 'Description', render: (r) => <span className="text-xs text-muted-foreground">{r.description || '—'}</span> },
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
              exportFilename="departments"
              emptyMessage="No departments found."
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Add / Edit Modal */}
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
            <h2 className="text-lg font-bold text-slate-200 mb-4">{editingDept ? 'Edit Department Details' : 'Add Department'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Department Code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="CSE" className="bg-slate-950 border-slate-800" />
              <Input label="Department Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Computer Science & Engineering" className="bg-slate-950 border-slate-800" />
              <Input label="Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Manage CS curriculum" className="bg-slate-950 border-slate-800" />

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="border-slate-800 text-slate-400 hover:bg-slate-800">Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>Save Department</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
