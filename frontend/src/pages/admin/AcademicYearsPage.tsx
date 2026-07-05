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
import { Plus, BookOpen, Pencil, Trash2, X } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function AcademicYearsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingYear, setEditingYear] = useState<any | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Query Academic Years
  const { data: years = [], isLoading } = useQuery({
    queryKey: ['academicYears'],
    queryFn: () => adminService.getAcademicYears(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminService.createAcademicYear(payload),
    onSuccess: () => {
      toast({ title: 'Academic Year Added', description: 'Added new academic year record.' })
      queryClient.invalidateQueries({ queryKey: ['academicYears'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to add academic year.', variant: 'destructive' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminService.updateAcademicYear(id, payload),
    onSuccess: () => {
      toast({ title: 'Academic Year Updated', description: 'Updated academic year details.' })
      queryClient.invalidateQueries({ queryKey: ['academicYears'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to update academic year.', variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteAcademicYear(id),
    onSuccess: () => {
      toast({ title: 'Academic Year Deleted', description: 'Deleted academic year record.' })
      queryClient.invalidateQueries({ queryKey: ['academicYears'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to delete academic year.', variant: 'destructive' })
    }
  })

  const openAddModal = () => {
    setEditingYear(null)
    setName('')
    setStartDate('')
    setEndDate('')
    setIsActive(true)
    setIsModalOpen(true)
  }

  const openEditModal = (year: any) => {
    setEditingYear(year)
    setName(year.name)
    setStartDate(year.startDate ? year.startDate.split('T')[0] : '')
    setEndDate(year.endDate ? year.endDate.split('T')[0] : '')
    setIsActive(year.isActive)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingYear(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      isActive,
    }
    if (editingYear) {
      updateMutation.mutate({ id: editingYear.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this academic year?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Academic Years</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure institutional academic calendars</p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="w-4 h-4" /> Add Academic Year
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-primary" /> Institutional Calendars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={years}
              isLoading={isLoading}
              columns={[
                { key: 'name', label: 'Academic Year', sortable: true, render: (r) => <span className="font-semibold">{r.name as string}</span> },
                { key: 'startDate', label: 'Start Date', render: (r) => <span>{r.startDate ? new Date(r.startDate as string).toLocaleDateString() : '—'}</span> },
                { key: 'endDate', label: 'End Date', render: (r) => <span>{r.endDate ? new Date(r.endDate as string).toLocaleDateString() : '—'}</span> },
                {
                  key: 'isActive',
                  label: 'Status',
                  render: (r: any) => (
                    <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Archived'}</Badge>
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
              exportFilename="academic_years"
              emptyMessage="No academic years defined."
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
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
          >
            <button onClick={closeModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-foreground mb-4">{editingYear ? 'Edit Calendar Details' : 'Add Academic Year'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Calendar Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="2024-2025" className="bg-background border-input" />
              <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="bg-background border-input text-foreground" />
              <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="bg-background border-input text-foreground" />

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-input bg-background text-primary focus:ring-primary h-4 w-4" />
                <label htmlFor="isActive" className="text-xs font-semibold text-foreground cursor-pointer">Set as Active Calendar</label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="border-input text-muted-foreground hover:bg-muted">Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>Save Calendar</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
