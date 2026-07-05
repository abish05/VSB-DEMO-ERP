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
import { Plus, FolderOpen, Pencil, Trash2, X } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function SectionsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<any | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [batchId, setBatchId] = useState('')
  const [facultyId, setFacultyId] = useState('')

  // Query resources
  const { data: batches } = useQuery({ queryKey: ['batches'], queryFn: () => adminService.getBatches() })
  const { data: advisors } = useQuery({ queryKey: ['adminFaculty'], queryFn: () => adminService.getUsers({ role: 'FACULTY', limit: 1000 }) })
  const facultyMembers = advisors?.data || []

  // Query Sections
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: () => adminService.getSections(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminService.createSection(payload),
    onSuccess: () => {
      toast({ title: 'Section Created', description: 'The section has been successfully configured.' })
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to add section.', variant: 'destructive' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminService.updateSection(id, payload),
    onSuccess: () => {
      toast({ title: 'Section Updated', description: 'Section details have been updated.' })
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to update section.', variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteSection(id),
    onSuccess: () => {
      toast({ title: 'Section Deleted', description: 'Deleted section record from database.' })
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to delete section.', variant: 'destructive' })
    }
  })

  const openAddModal = () => {
    setEditingSection(null)
    setName('')
    setBatchId(batches?.[0]?.id || '')
    setFacultyId(facultyMembers?.[0]?.id || '')
    setIsModalOpen(true)
  }

  const openEditModal = (sec: any) => {
    setEditingSection(sec)
    setName(sec.name)
    setBatchId(sec.batchId || '')
    setFacultyId(sec.facultyId || '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSection(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { name, batchId, facultyId }
    if (editingSection) {
      updateMutation.mutate({ id: editingSection.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this section? Students inside this section will be unassigned.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sections</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure class sections and assign advisors</p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="w-4 h-4" /> Add Section
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FolderOpen className="w-4 h-4 text-primary" /> Registered Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={sections}
              isLoading={isLoading}
              columns={[
                { key: 'name', label: 'Section Class', sortable: true, render: (r) => <span className="font-semibold">Class {r.name as string}</span> },
                { key: 'batch', label: 'Batch Name', render: (r: any) => <span>{r.batch?.name || '—'}</span> },
                { key: 'dept', label: 'Department', render: (r: any) => <Badge variant="secondary">{r.batch?.department?.code || '—'}</Badge> },
                { key: 'advisor', label: 'Faculty Advisor', render: (r: any) => <span className="text-xs font-semibold text-slate-400">{r.faculty?.name || '—'}</span> },
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
              exportFilename="sections"
              emptyMessage="No sections configured."
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
            <h2 className="text-lg font-bold text-slate-200 mb-4">{editingSection ? 'Edit Section Details' : 'Add Section'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Section Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="A" className="bg-slate-950 border-slate-800" />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Associated Batch</label>
                <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary">
                  {batches?.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.department?.code})</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Faculty Advisor</label>
                <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary">
                  {facultyMembers?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="border-slate-800 text-slate-400 hover:bg-slate-800">Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>Save Section</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
