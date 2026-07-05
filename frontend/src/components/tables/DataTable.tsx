import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/shared/Skeleton'
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react'
import { downloadCSV } from '@/lib/utils'

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  exportable?: boolean
  exportFilename?: string
  pageSize?: number
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

type SortDir = 'asc' | 'desc' | null

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading,
  searchable = true,
  searchPlaceholder = 'Search...',
  exportable = true,
  exportFilename = 'export',
  pageSize = 10,
  emptyMessage = 'No data found',
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [data, search])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av === bv) return 0
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc') }
    else if (sortDir === 'asc') setSortDir('desc')
    else { setSortKey(null); setSortDir(null) }
  }

  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null
    const key = String(col.key)
    if (sortKey !== key) return <ChevronUp className="w-3 h-3 opacity-30" />
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-2">
            {columns.map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {searchable && (
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            leftIcon={<Search className="w-4 h-4" />}
            className="max-w-xs"
          />
        )}
        <div className="flex items-center gap-2 ml-auto">
          {exportable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(sorted as Record<string, unknown>[], exportFilename)}
              className="gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          )}
          <span className="text-xs text-muted-foreground">{sorted.length} records</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''} ${col.className || ''}`}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-accent/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={String(col.key)} className={`px-4 py-3 ${col.className || ''}`}>
                        {col.render ? col.render(row) : String(row[String(col.key)] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
