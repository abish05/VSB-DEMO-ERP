import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { leetcodeService } from '@/services/leetcode.service'
import type { LeetCodeProfile, DailyActivity } from '@/types'
import {
  Code2, Flame, RefreshCw, Clock, CheckCircle2, AlertCircle,
  Target, TrendingUp, Zap, BookOpen, Send, Activity,
} from 'lucide-react'

// ─── Animation variants ────────────────────────────────────────
const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

// ─── Design tokens ─────────────────────────────────────────────
const GOLD = '#F5B301'
const EASY_COLOR = '#22C55E'
const MEDIUM_COLOR = '#F59E0B'
const HARD_COLOR = '#EF4444'

function formatTime(ts: string) {
  return new Date(Number(ts) * 1000).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSyncTime(value?: string) {
  if (!value) return 'Not synced yet'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function isToday(ts: string): boolean {
  const date = new Date(Number(ts) * 1000)
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function difficultyColor(diff: string) {
  const d = diff?.toLowerCase()
  if (d === 'easy') return { text: 'text-success', bg: 'bg-success/10' }
  if (d === 'medium') return { text: 'text-warning', bg: 'bg-warning/10' }
  if (d === 'hard') return { text: 'text-error', bg: 'bg-error/10' }
  return { text: 'text-muted-foreground', bg: 'bg-muted/20' }
}

// ─── Daily Goal (configurable) ────────────────────────────────
const DAILY_GOAL = 5

export default function DailyActivityPage() {
  const { user } = useAuth()

  const [profile, setProfile] = useState<LeetCodeProfile | null>(
    user?.leetcodeProfile || null
  )
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  // ─── Load profile + daily activity ─────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [prof, activity] = await Promise.all([
        leetcodeService.getProfile(user.id),
        leetcodeService.getDailyActivity(user.id, 7),
      ])
      setProfile(prof)
      setDailyActivity(activity)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { void loadData() }, [loadData])

  // ─── Sync handler ───────────────────────────────────────────
  const handleSync = async () => {
    if (!user?.id) return
    setSyncing(true)
    setSyncMsg('')
    try {
      const result = await leetcodeService.syncNow(user.id)
      setSyncMsg(result.message || 'Sync complete!')
      await loadData()
    } catch {
      setSyncMsg('Sync failed. Last known data is still shown.')
    } finally {
      setSyncing(false)
    }
  }

  // ─── Today's daily activity record ─────────────────────────
  const todayRecord = useMemo<DailyActivity | null>(() => {
    const todayKey = new Date().toISOString().split('T')[0]
    return dailyActivity.find(a => a.date?.startsWith(todayKey)) || null
  }, [dailyActivity])

  // ─── Today's submissions from recentSubmissions ─────────────
  const todaySubmissions = useMemo(() => {
    return (profile?.recentSubmissions || []).filter(s => isToday(s.timestamp))
  }, [profile])

  const totalToday = todayRecord?.solved ?? todaySubmissions.filter(s => s.statusDisplay === 'Accepted').length
  const totalSubmissions = todaySubmissions.length
  const goalProgress = Math.min((totalToday / DAILY_GOAL) * 100, 100)

  // ─── Summary cards ──────────────────────────────────────────
  const summaryCards = [
    {
      label: 'Problems Solved Today',
      value: totalToday,
      icon: <Code2 className="w-5 h-5" />,
      color: 'bg-primary/10 text-primary',
      sub: `Goal: ${DAILY_GOAL} problems`
    },
    {
      label: 'Total Submissions',
      value: totalSubmissions,
      icon: <Send className="w-5 h-5" />,
      color: 'bg-indigo-500/10 text-indigo-400',
      sub: 'Attempts today'
    },
    {
      label: 'Current Streak',
      value: `${profile?.currentStreak ?? 0} days`,
      icon: <Flame className="w-5 h-5" />,
      color: 'bg-warning/10 text-warning',
      sub: `Best: ${profile?.longestStreak ?? 0} days`
    },
    {
      label: 'Last Sync',
      value: formatSyncTime(profile?.lastSyncedAt),
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-success/10 text-success',
      sub: profile?.syncStatus || 'Status unknown'
    },
  ]

  // ─── Difficulty breakdown ───────────────────────────────────
  const easyToday = todayRecord?.easy ?? 0
  const mediumToday = todayRecord?.medium ?? 0
  const hardToday = todayRecord?.hard ?? 0

  // ─── Skeleton loader ────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted/30 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/20" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted/20" />
      </div>
    )
  }

  // ─── Empty state: no profile linked ─────────────────────────
  if (!profile) {
    return (
      <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={iv}>
          <h1 className="text-2xl font-bold">Daily Activity</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your coding progress for today</p>
        </motion.div>
        <motion.div variants={iv} className="stat-card flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">LeetCode Profile Not Linked</p>
            <p className="text-sm text-muted-foreground mt-1">Link your LeetCode username in Settings to track daily activity.</p>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // ─── No activity today state ─────────────────────────────────
  const hasActivityToday = totalToday > 0 || totalSubmissions > 0

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">

      {/* ─── Header ────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Daily Activity</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            <span className="font-mono text-foreground">{profile.username}</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 self-start sm:self-auto"
          onClick={handleSync}
          isLoading={syncing}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </Button>
      </motion.div>

      {/* Sync message */}
      {syncMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {syncMsg}
        </motion.div>
      )}

      {/* ─── Summary Cards ─────────────────────────────────────── */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <div key={card.label} className="stat-card flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold truncate">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* ─── Daily Goal Progress ────────────────────────────────── */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Daily Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {totalToday} of {DAILY_GOAL} problems completed
              </span>
              <span className="font-bold" style={{ color: goalProgress >= 100 ? EASY_COLOR : GOLD }}>
                {Math.round(goalProgress)}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: goalProgress >= 100
                    ? `linear-gradient(90deg, ${EASY_COLOR}, #16A34A)`
                    : `linear-gradient(90deg, ${GOLD}, #D97706)`
                }}
              />
            </div>
            {goalProgress >= 100 && (
              <div className="flex items-center gap-2 text-success text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Daily goal achieved! 🎉
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Difficulty Breakdown + Today's Activity ───────────── */}
      <motion.div variants={iv} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Easy */}
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Easy</p>
              <p className="text-3xl font-extrabold text-success">{easyToday}</p>
              <p className="text-xs text-muted-foreground">solved today</p>
            </div>
          </CardContent>
        </Card>

        {/* Medium */}
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Medium</p>
              <p className="text-3xl font-extrabold text-warning">{mediumToday}</p>
              <p className="text-xs text-muted-foreground">solved today</p>
            </div>
          </CardContent>
        </Card>

        {/* Hard */}
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-error" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Hard</p>
              <p className="text-3xl font-extrabold text-error">{hardToday}</p>
              <p className="text-xs text-muted-foreground">solved today</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Today's Solved Problems Table ─────────────────────── */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" /> Today's Submissions
              </CardTitle>
              {totalSubmissions > 0 && (
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {totalSubmissions} attempts
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!hasActivityToday ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center py-16 gap-4 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                  <Code2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-base">No coding activity today</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start solving problems on LeetCode to track your progress here.
                  </p>
                </div>
                <a
                  href="https://leetcode.com/problemset/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted/20 transition-colors"
                >
                  Open LeetCode →
                </a>
              </div>
            ) : todaySubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="px-4 py-3 font-semibold text-muted-foreground">#</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Problem</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Language</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Time</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {todaySubmissions.map((s, idx) => (
                      <tr key={`${s.titleSlug}-${s.timestamp}`} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://leetcode.com/problems/${s.titleSlug}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {s.title}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-muted/30 font-mono text-[10px] text-muted-foreground uppercase">
                            {s.lang}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{formatTime(s.timestamp)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={s.statusDisplay === 'Accepted' ? 'success' : 'error'}
                            className="text-[10px] uppercase tracking-wider font-mono"
                          >
                            {s.statusDisplay === 'Accepted' ? '✓ Accepted' : '✗ ' + s.statusDisplay}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* DailyActivity record exists but no recent submissions loaded yet */
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">{totalToday}</span> problem{totalToday !== 1 ? 's' : ''} solved today based on synced data.
                </p>
                <p className="mt-1">Sync now to load individual submission details.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Submission Timeline ────────────────────────────────── */}
      {todaySubmissions.length > 0 && (
        <motion.div variants={iv}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Submission Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-5">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-border rounded-full" />

                <div className="space-y-4">
                  {todaySubmissions.map((s, idx) => {
                    const accepted = s.statusDisplay === 'Accepted'
                    return (
                      <motion.div
                        key={`timeline-${s.titleSlug}-${s.timestamp}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative flex items-start gap-3"
                      >
                        {/* Dot */}
                        <div
                          className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-background flex-shrink-0"
                          style={{ backgroundColor: accepted ? EASY_COLOR : HARD_COLOR }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-semibold text-sm text-foreground">{s.title}</span>
                            <Badge
                              variant={accepted ? 'success' : 'error'}
                              className="text-[9px] uppercase font-mono"
                            >
                              {s.statusDisplay}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-muted-foreground font-mono">{formatTime(s.timestamp)}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">{s.lang}</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Recent Activity (all-time recent, up to 5) ─────────── */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(profile.recentSubmissions || []).slice(0, 8).map((s, idx) => {
              const accepted = s.statusDisplay === 'Accepted'
              const todayMark = isToday(s.timestamp)
              return (
                <div
                  key={`recent-${s.titleSlug}-${s.timestamp}-${idx}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/10 transition-colors border border-transparent hover:border-border/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${accepted ? 'bg-success' : 'bg-error'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{s.lang}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {todayMark && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Today</span>
                    )}
                    <Badge variant={accepted ? 'success' : 'error'} className="text-[9px] font-mono">
                      {accepted ? '✓' : '✗'} {s.statusDisplay}
                    </Badge>
                  </div>
                </div>
              )
            })}
            {(!profile.recentSubmissions || profile.recentSubmissions.length === 0) && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No recent submissions synced yet.</p>
                <Button size="sm" variant="outline" className="gap-1.5 mt-1 h-7 text-xs" onClick={handleSync} isLoading={syncing}>
                  <RefreshCw className="w-3 h-3" /> Sync Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

    </motion.div>
  )
}
