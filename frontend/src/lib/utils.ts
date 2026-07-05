import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function getRoleColor(role: string): string {
  switch (role.toUpperCase()) {
    case 'ADMIN': return 'bg-error/10 text-error'
    case 'FACULTY': return 'bg-primary/10 text-primary'
    case 'STUDENT': return 'bg-success/10 text-success'
    default: return 'bg-muted text-muted-foreground'
  }
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'text-success'
    case 'medium': return 'text-warning'
    case 'hard': return 'text-error'
    default: return 'text-foreground'
  }
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 100) return '🔥🔥🔥'
  if (streak >= 30) return '🔥🔥'
  if (streak >= 7) return '🔥'
  return '⚡'
}

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function getHeatmapColor(count: number): string {
  if (count === 0) return 'heatmap-0'
  if (count <= 2) return 'heatmap-1'
  if (count <= 4) return 'heatmap-2'
  if (count <= 6) return 'heatmap-3'
  return 'heatmap-4'
}
