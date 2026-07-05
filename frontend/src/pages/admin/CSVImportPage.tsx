import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { adminService } from '@/services/admin.service'
import { useToast } from '@/hooks/use-toast'
import { FileSpreadsheet, AlertCircle, CheckCircle, Info, UploadCloud, ArrowRight } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function CSVImportPage() {
  const { toast } = useToast()
  const [importType, setImportType] = useState<'students' | 'faculty'>('students')
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setSuccessMsg('')
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)

    if (selectedFile) {
      try {
        const text = await selectedFile.text()
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length > 0) {
          const parsedHeaders = lines[0].split(',').map(h => h.trim())
          setHeaders(parsedHeaders)

          // Load first 5 rows for preview
          const rows = lines.slice(1, 6).map(line => {
            const parts = line.split(',').map(p => p.trim())
            const rowObj: Record<string, string> = {}
            parsedHeaders.forEach((header, idx) => {
              rowObj[header] = parts[idx] || ''
            })
            return rowObj
          })
          setPreviewRows(rows)
        }
      } catch (err) {
        setError('Failed to parse CSV file structure.')
      }
    } else {
      setHeaders([])
      setPreviewRows([])
    }
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await adminService.importCSV(file, importType)
      if (res.errors && res.errors.length > 0) {
        setError(`Failed to import some rows:\n${res.errors.join('\n')}`)
      } else {
        setSuccessMsg(`Successfully imported ${res.imported} records into the roster!`)
        toast({ title: 'Import Successful', description: `${res.imported} users added.` })
        setFile(null)
        setHeaders([])
        setPreviewRows([])
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'CSV Import failed. Verify columns.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">CSV Import Console</h1>
        <p className="text-muted-foreground text-sm mt-1">Bulk load users and establish LeetCode links from files</p>
      </motion.div>

      {/* Select Type */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">1. Select Registry Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`p-4 border rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                importType === 'students' ? 'border-primary bg-primary/5' : 'border-border hover:bg-slate-50/5'
              }`}
              onClick={() => { setImportType('students'); setFile(null); setPreviewRows([]) }}
            >
              <div>
                <p className="text-sm font-bold text-slate-200">Students Roster</p>
                <p className="text-xs text-slate-500 mt-1">Imports student logs & creates profiles</p>
              </div>
              <Badge>STUDENT</Badge>
            </div>

            <div
              className={`p-4 border rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                importType === 'faculty' ? 'border-primary bg-primary/5' : 'border-border hover:bg-slate-50/5'
              }`}
              onClick={() => { setImportType('faculty'); setFile(null); setPreviewRows([]) }}
            >
              <div>
                <p className="text-sm font-bold text-slate-200">Faculty Registry</p>
                <p className="text-xs text-slate-500 mt-1">Imports faculty advisors accounts</p>
              </div>
              <Badge variant="secondary">FACULTY</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Upload card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">2. Choose CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-3 text-xs text-slate-400">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-slate-300">CSV Template Columns Required:</p>
                <p className="font-mono text-slate-500 mt-1">
                  name, email{importType === 'students' ? ', leetcodeUsername' : ''}
                </p>
              </div>
            </div>

            <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center hover:border-slate-700 transition-colors cursor-pointer relative bg-slate-950/20">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">
                {file ? file.name : 'Select or drop CSV file'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Only .csv files up to 10MB supported</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CSV Preview Section */}
      {previewRows.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" /> Roster Preview (First 5 Rows)
              </CardTitle>
              <Button onClick={handleImport} isLoading={loading} className="gap-2">
                Import Roster <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    {headers.map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400 tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/5">
                      {headers.map(h => (
                        <td key={h} className="px-6 py-3 text-xs font-medium text-slate-300">
                          {row[h] || <span className="text-slate-600 italic">empty</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Status displays */}
      {(successMsg || error) && (
        <motion.div variants={itemVariants} className="space-y-3">
          {successMsg && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex gap-3 items-start">
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-success">Import Complete</h4>
                <p className="text-xs text-slate-400 mt-1">{successMsg}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-error shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-error">Import Warnings / Errors</h4>
                <pre className="text-xs text-slate-400 mt-1 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                  {error}
                </pre>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
