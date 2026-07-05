import { useMemo } from 'react'
import { cn, getHeatmapColor, formatDate } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface HeatmapCalendarProps {
  data: Record<string, number> // { 'YYYY-MM-DD': count }
  weeks?: number
}

function* dateRange(startDate: Date, days: number) {
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    yield d
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export function HeatmapCalendar({ data, weeks = 53 }: HeatmapCalendarProps) {
  const { grid, monthLabels } = useMemo(() => {
    const today = new Date()
    const days = weeks * 7
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - days + 1)

    // Pad start to Monday
    const startDay = startDate.getDay()
    const offset = startDay === 0 ? 6 : startDay - 1
    startDate.setDate(startDate.getDate() - offset)

    const allDays = [...dateRange(startDate, weeks * 7)]
    const cols: Date[][] = []
    for (let w = 0; w < weeks; w++) {
      cols.push(allDays.slice(w * 7, w * 7 + 7))
    }

    // Month labels
    const months: { label: string; col: number }[] = []
    let lastMonth = -1
    cols.forEach((col, i) => {
      const m = col[0].getMonth()
      if (m !== lastMonth) {
        months.push({ label: MONTHS[m], col: i })
        lastMonth = m
      }
    })

    return { grid: cols, monthLabels: months }
  }, [weeks])

  const toKey = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="inline-block">
          <div className="flex gap-[3px] mb-1 ml-6">
            {monthLabels.map((m) => (
              <div
                key={`${m.label}-${m.col}`}
                style={{
                  marginLeft: m.col === 0 ? 0 : `${(m.col - (monthLabels[monthLabels.indexOf(m) - 1]?.col ?? 0)) * 15}px`,
                  left: `${m.col * 15 + 24}px`
                }}
                className="text-xs text-muted-foreground whitespace-nowrap absolute"
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px] mt-5">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {DAYS.map((d, i) => (
                <div key={i} className="h-3 w-5 text-[10px] text-muted-foreground leading-3 flex items-center">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  const key = toKey(day)
                  const count = data[key] || 0
                  return (
                    <Tooltip key={di}>
                      <TooltipTrigger asChild>
                        <div className={cn('heatmap-cell', getHeatmapColor(count))} />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <strong>{count} submission{count !== 1 ? 's' : ''}</strong> on {formatDate(day)}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 ml-6">
            <span className="text-xs text-muted-foreground">Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={cn('w-3 h-3 rounded-sm', `heatmap-${level}`)} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
