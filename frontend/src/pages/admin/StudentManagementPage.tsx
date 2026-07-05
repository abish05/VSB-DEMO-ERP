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
import { Plus, Users, Pencil, Trash2, FileSpreadsheet, X, Search, Info } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function StudentManagementPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [leetcodeUsername, setLeetcodeUsername] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [sectionId, setSectionId] = useState('')

  // CSV Import fields
  const [csvFile, setCSVFile] = useState<File | null>(null)
  const [csvError, setCSVError] = useState('')
  const [csvLoading, setCSVLoading] = useState(false)

  // Query resources for select inputs
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => adminService.getDepartments() })
  const { data: batches } = useQuery({ queryKey: ['batches'], queryFn: () => adminService.getBatches() })
  const { data: sections } = useQuery({ queryKey: ['sections'], queryFn: () => adminService.getSections() })

  // Query students
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: () => adminService.getUsers({ role: 'STUDENT', limit: 1000 }),
  })
  const students = studentsData?.data || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminService.createUser(payload),
    onSuccess: () => {
      toast({ title: 'Student Added', description: 'Successfully added new student and LeetCode profile.' })
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to add student.', variant: 'destructive' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminService.updateUser(id, payload),
    onSuccess: () => {
      toast({ title: 'Student Updated', description: 'Successfully updated student details.' })
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] })
      closeModal()
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to update student.', variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      toast({ title: 'Student Deleted', description: 'Deleted student profile from database.' })
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
    },
    onError: (err: any) => {
      toast({ title: 'Action Failed', description: err?.response?.data?.message || 'Failed to delete student.', variant: 'destructive' })
    }
  })

  const openAddModal = () => {
    setEditingStudent(null)
    setName('')
    setEmail('')
    setLeetcodeUsername('')
    setDepartmentId(depts?.[0]?.id || '')
    setBatchId(batches?.[0]?.id || '')
    setSectionId(sections?.[0]?.id || '')
    setIsModalOpen(true)
  }

  const openEditModal = (student: any) => {
    setEditingStudent(student)
    setName(student.name)
    setEmail(student.email)
    setLeetcodeUsername(student.leetcodeProfile?.username || '')
    setDepartmentId(student.departmentId || '')
    setBatchId(student.section?.batchId || '')
    setSectionId(student.sectionId || '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingStudent(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name,
      email,
      role: 'STUDENT',
      departmentId,
      sectionId,
      batchId,
      leetcodeUsername,
    }
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student and their linked LeetCode profile?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return
    setCSVLoading(true)
    setCSVError('')

    try {
      const res = await adminService.importCSV(csvFile, 'students')
      if (res.errors && res.errors.length > 0) {
        setCSVError(res.errors.join('\n'))
      } else {
        toast({ title: 'Import Complete', description: `Successfully imported ${res.imported} students.` })
        queryClient.invalidateQueries({ queryKey: ['adminStudents'] })
        queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
        setIsCSVModalOpen(false)
        setCSVFile(null)
      }
    } catch (err: any) {
      setCSVError(err?.response?.data?.message || 'CSV upload and parsing failed.')
    } finally {
      setCSVLoading(false)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Student Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and sync students accounts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCSVModalOpen(true)} variant="outline" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </motion.div>

      {/* Summary Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Enrolled', value: students.length },
          { label: 'Linked Profiles', value: students.filter((s: any) => s.leetcodeProfile).length },
          { label: 'Unlinked Profiles', value: students.filter((s: any) => !s.leetcodeProfile).length },
          { label: 'Active Status', value: students.filter((s: any) => s.isActive).length },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Students Data Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" /> Registered Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={students}
              isLoading={loadingStudents}
              columns={[
                {
                  key: 'name',
                  label: 'Student',
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
                  key: 'batch',
                  label: 'Batch',
                  render: (r: any) => <span className="text-xs">{r.section?.batch?.name || '—'}</span>,
                },
                {
                  key: 'section',
                  label: 'Section',
                  render: (r: any) => <span className="text-xs font-semibold text-slate-400">Class {r.section?.name || '—'}</span>,
                },
                {
                  key: 'leetcode',
                  label: 'LeetCode profile',
                  render: (r: any) =>
                    r.leetcodeProfile ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold font-mono text-primary">{r.leetcodeProfile.username}</span>
                        <span className="text-xs text-muted-foreground">({r.leetcodeProfile.totalSolved} solved)</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Unlinked</span>
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
              exportFilename="students"
              emptyMessage="No student records found."
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Add / Edit Student Modal */}
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
            <h2 className="text-lg font-bold text-slate-200 mb-4">{editingStudent ? 'Edit Student Profile' : 'Add New Student'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Student Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" className="bg-slate-950 border-slate-800" />
              <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john@vsb.edu.in" className="bg-slate-950 border-slate-800" />
              <Input label="LeetCode Username" value={leetcodeUsername} onChange={(e) => setLeetcodeUsername(e.target.value)} placeholder="leetcode_username" className="bg-slate-950 border-slate-800" />

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Department</label>
                  <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary">
                    {depts?.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Batch</label>
                  <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary">
                    {batches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Section</label>
                  <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary">
                    {sections?.filter(s => s.batchId === batchId || !batchId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="border-slate-800 text-slate-400 hover:bg-slate-800">Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>Save Profile</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCSVModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
          >
            <button onClick={() => setIsCSVModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-200 mb-2">Bulk Import Students</h2>
            <p className="text-xs text-slate-400 mb-4">Upload a CSV containing student rosters.</p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 space-y-2">
              <div className="flex gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-slate-300">Required CSV Columns:</p>
                  <p className="font-mono text-slate-500 mt-1">name, email, leetcodeUsername</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCSVImport} className="space-y-4">
              <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-slate-700 transition-colors cursor-pointer relative bg-slate-950/50">
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setCSVFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">
                  {csvFile ? csvFile.name : 'Select student roster CSV file'}
                </p>
                <p className="text-xs text-slate-500 mt-1">{csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : 'Click or drag files here'}</p>
              </div>

              {csvError && (
                <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-line">
                  {csvError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCSVModalOpen(false)} className="border-slate-800 text-slate-400 hover:bg-slate-800">Cancel</Button>
                <Button type="submit" isLoading={csvLoading}>Import Roster</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
