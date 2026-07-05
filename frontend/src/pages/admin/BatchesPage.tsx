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
import { Plus, Layers, Pencil, Trash2, X } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function BatchesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<any | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [departmentId, setDepartmentId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')

  // Query resources
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => adminService.getDepartments() })
  const { data: years } = useQuery({ queryKey: ['academicYears'], queryFn: () => adminService.getAcademicYears() })

  // Query Batches
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => adminService.getBatches(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminService.createBatch(payload),
    onSuccess: () => {
      toast({ title: 'Batch Created', description: 'The batch has been successfully registered.' })
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to add batch.', variant: 'destructive' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminService.updateBatch(id, payload),
    onSuccess: () => {
      toast({ title: 'Batch Updated', description: 'Batch details have been updated.' })
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to update batch.', variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteBatch(id),
    onSuccess: () => {
      toast({ title: 'Batch Deleted', description: 'Deleted batch record from database.' })
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to delete batch.', variant: 'destructive' })
    }
  })

  const openAddModal = () => {
    setEditingBatch(null)
    setName('')
    setYear(new Date().getFullYear())
    setDepartmentId(depts?.[0]?.id || '')
    setAcademicYearId(years?.[0]?.id || '')
    setIsModalOpen(true)
  }

  const openEditModal = (batch: any) => {
    setEditingBatch(batch)
    setName(batch.name)
    setYear(batch.year)
    setDepartmentId(batch.departmentId || '')
    setAcademicYearId(batch.academicYearId || '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBatch(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { name, year: Number(year), departmentId, academicYearId }
    if (editingBatch) {
      updateMutation.mutate({ id: editingBatch.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this batch? All sections inside this batch will be impacted.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Batches</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure academic batches and year terms</p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="w-4 h-4" /> Add Batch
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-primary" /> Active Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={batches}
              isLoading={isLoading}
              columns={[
                { key: 'name', label: 'Batch Name', sortable: true, render: (r) => <span className="font-semibold">{r.name as string}</span> },
                { key: 'year', label: 'Graduation Year', sortable: true },
                { key: 'dept', label: 'Department', render: (r: any) => <Badge variant="secondary">{r.department?.code || '—'}</Badge> },
                { key: 'cal', label: 'Academic Calendar', render: (r: any) => <span className="text-xs text-muted-foreground">{r.academicYear?.name || '—'}</span> },
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
              exportFilename="batches"
              emptyMessage="No batches defined."
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
            <h2 className="text-lg font-bold text-slate-200 mb-4">{editingBatch ? 'Edit Batch Details' : 'Add Batch'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Batch Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="CSE 2024" className="bg-slate-950 border-slate-800" />
              <Input label="Graduation Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} required placeholder="2024" className="bg-slate-950 border-slate-800" />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Department</label>
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary">
                  {depts?.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Academic Calendar</label>
                <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary">
                  {years?.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="border-slate-800 text-slate-400 hover:bg-slate-800">Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>Save Batch</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
