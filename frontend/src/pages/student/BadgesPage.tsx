import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { leetcodeService } from '@/services/leetcode.service'
import type { LeetCodeProfile } from '@/types'
import {
  Medal, Star, Zap, Flame, Trophy, Target, Code2, CheckCircle,
  Lock, RefreshCw, Shield, Rocket, Crown
} from 'lucide-react'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

interface BadgeDef {
  id: string
  name: string
  desc: string
  icon: React.ReactNode
  earnedColor: string
  check: (p: LeetCodeProfile) => boolean
}

const BADGE_DEFS: BadgeDef[] = [
  { id: 'first-blood',    name: 'First Blood',      desc: 'Solved your first problem',             icon: <Code2 className="w-8 h-8" />,    earnedColor: 'text-success bg-success/10',   check: p => p.totalSolved >= 1 },
  { id: 'streak-7',       name: '7-Day Streak',      desc: '7 consecutive coding days',             icon: <Flame className="w-8 h-8" />,    earnedColor: 'text-warning bg-warning/10',   check: p => p.currentStreak >= 7 },
  { id: 'century',        name: 'Century',           desc: 'Solved 100 problems',                   icon: <Target className="w-8 h-8" />,   earnedColor: 'text-primary bg-primary/10',   check: p => p.totalSolved >= 100 },
  { id: 'contest-warrior',name: 'Contest Warrior',   desc: 'Participated in 5+ contests',           icon: <Trophy className="w-8 h-8" />,   earnedColor: 'text-yellow-500 bg-yellow-500/10', check: p => (p.totalContestsParticipated ?? 0) >= 5 },
  { id: 'medium-master',  name: 'Medium Master',     desc: 'Solved 50 medium problems',             icon: <Shield className="w-8 h-8" />,   earnedColor: 'text-orange-400 bg-orange-400/10', check: p => p.mediumSolved >= 50 },
  { id: 'hard-hitter',    name: 'Hard Hitter',       desc: 'Solved 20 hard problems',               icon: <Star className="w-8 h-8" />,     earnedColor: 'text-error bg-error/10',       check: p => p.hardSolved >= 20 },
  { id: 'streak-30',      name: '30-Day Streak',     desc: '30 consecutive coding days',            icon: <Rocket className="w-8 h-8" />,   earnedColor: 'text-indigo-400 bg-indigo-400/10', check: p => p.currentStreak >= 30 },
  { id: 'speed-demon',    name: 'Speed Demon',       desc: 'Solved 10 problems in a single day',    icon: <Zap className="w-8 h-8" />,      earnedColor: 'text-cyan-400 bg-cyan-400/10', check: p => (p.dailySolvedCount ?? 0) >= 10 },
  { id: 'top-performer',  name: 'Top Performer',     desc: 'Reached a contest rating of 1500+',     icon: <Crown className="w-8 h-8" />,    earnedColor: 'text-yellow-400 bg-yellow-400/10', check: p => p.contestRating >= 1500 },
  { id: 'legend',         name: 'Legend',            desc: 'Solved 500 problems',                   icon: <Medal className="w-8 h-8" />,    earnedColor: 'text-purple-400 bg-purple-400/10', check: p => p.totalSolved >= 500 },
  { id: 'all-rounder',    name: 'All-Rounder',       desc: 'Solved Easy, Medium & Hard problems',   icon: <CheckCircle className="w-8 h-8"/>, earnedColor: 'text-teal-400 bg-teal-400/10', check: p => p.easySolved > 0 && p.mediumSolved > 0 && p.hardSolved > 0 },
  { id: 'streak-best',    name: 'Endurance',         desc: 'Longest streak of 14+ days',            icon: <Flame className="w-8 h-8" />,    earnedColor: 'text-rose-400 bg-rose-400/10', check: p => p.longestStreak >= 14 },
]

export default function BadgesPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<LeetCodeProfile | null>(user?.leetcodeProfile || null)
  const [loading, setLoading] = useState(!user?.leetcodeProfile)
  const [syncing, setSyncing] = useState(false)

  const loadProfile = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const p = await leetcodeService.getProfile(user.id)
      setProfile(p)
    } finally { setLoading(false) }
  }, [user?.id])

  useEffect(() => { if (!profile) void loadProfile() }, [loadProfile, profile])

  const handleSync = async () => {
    if (!user?.id) return
    setSyncing(true)
    try { await leetcodeService.syncNow(user.id); await loadProfile() } catch { /* noop */ } finally { setSyncing(false) }
  }

  const { earned, locked } = useMemo(() => {
    if (!profile) return { earned: [], locked: BADGE_DEFS }
    return {
      earned: BADGE_DEFS.filter(b => b.check(profile)),
      locked: BADGE_DEFS.filter(b => !b.check(profile)),
    }
  }, [profile])

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted/30 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-40 rounded-xl bg-muted/20" />)}
      </div>
    </div>
  )

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={iv} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Badges</h1>
          <p className="text-muted-foreground text-sm mt-1">
            <span className="font-bold text-foreground">{earned.length}</span> of {BADGE_DEFS.length} badges earned
            {profile && <span className="ml-2">· <span className="font-mono text-primary">{profile.username}</span></span>}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={handleSync} isLoading={syncing}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </motion.div>

      {/* Progress bar */}
      <motion.div variants={iv}>
        <div className="stat-card space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Badge Progress</span>
            <span className="font-bold text-primary">{earned.length}/{BADGE_DEFS.length}</span>
          </div>
          <div className="w-full h-2.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(earned.length / BADGE_DEFS.length) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-yellow-400"
            />
          </div>
        </div>
      </motion.div>

      {/* Earned Badges */}
      {earned.length > 0 && (
        <motion.div variants={iv}>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning" /> Earned Badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {earned.map(badge => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Card className="text-center hover:shadow-card-hover transition-all hover:-translate-y-1">
                  <CardContent className="pt-5 pb-4 space-y-2.5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${badge.earnedColor}`}>
                      {badge.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-xs leading-tight">{badge.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{badge.desc}</p>
                    </div>
                    <Badge variant="success" className="text-[9px] w-full justify-center">Earned ✓</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Locked Badges */}
      {locked.length > 0 && (
        <motion.div variants={iv}>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            <Lock className="w-4 h-4" /> Locked Badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {locked.map(badge => (
              <Card key={badge.id} className="text-center opacity-50">
                <CardContent className="pt-5 pb-4 space-y-2.5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-muted/40 text-muted-foreground">
                    {badge.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-xs leading-tight">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{badge.desc}</p>
                  </div>
                  <Badge variant="secondary" className="text-[9px] w-full justify-center">🔒 Locked</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {!profile && (
        <div className="stat-card flex flex-col items-center py-12 gap-3 text-center">
          <Medal className="w-10 h-10 text-muted-foreground" />
          <p className="font-semibold">Link your LeetCode profile to earn badges</p>
          <p className="text-sm text-muted-foreground">Go to Settings → Link LeetCode Username</p>
        </div>
      )}
    </motion.div>
  )
}
