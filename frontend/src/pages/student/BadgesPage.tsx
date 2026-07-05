import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Medal, Star, Zap, Flame, Trophy, Target, Code2, CheckCircle } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const BADGES = [
  { id: '1', name: 'First Blood', desc: 'Solved your first problem', icon: <Code2 className="w-8 h-8" />, earned: true, color: 'text-success bg-success/10' },
  { id: '2', name: '7-Day Streak', desc: '7 consecutive days of solving', icon: <Flame className="w-8 h-8" />, earned: true, color: 'text-warning bg-warning/10' },
  { id: '3', name: 'Century', desc: 'Solved 100 problems', icon: <Target className="w-8 h-8" />, earned: true, color: 'text-primary bg-primary/10' },
  { id: '4', name: 'Contest Warrior', desc: 'Participated in 5 contests', icon: <Trophy className="w-8 h-8" />, earned: true, color: 'text-yellow-500 bg-yellow-500/10' },
  { id: '5', name: '30-Day Streak', desc: '30 consecutive days of solving', icon: <Zap className="w-8 h-8" />, earned: false, color: 'text-muted-foreground bg-muted' },
  { id: '6', name: 'Hard Mode', desc: 'Solved 50 hard problems', icon: <Star className="w-8 h-8" />, earned: false, color: 'text-muted-foreground bg-muted' },
  { id: '7', name: 'Speed Demon', desc: 'Solved 10 problems in a day', icon: <CheckCircle className="w-8 h-8" />, earned: false, color: 'text-muted-foreground bg-muted' },
  { id: '8', name: 'Top Performer', desc: 'Ranked #1 in section', icon: <Medal className="w-8 h-8" />, earned: false, color: 'text-muted-foreground bg-muted' },
]

export default function BadgesPage() {
  const earned = BADGES.filter((b) => b.earned)
  const locked = BADGES.filter((b) => !b.earned)

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">My Badges</h1>
        <p className="text-muted-foreground text-sm mt-1">{earned.length} of {BADGES.length} badges earned</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-base font-semibold mb-3">Earned Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {earned.map((badge) => (
            <Card key={badge.id} className="text-center hover:shadow-card-hover transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${badge.color}`}>
                  {badge.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{badge.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{badge.desc}</p>
                </div>
                <Badge variant="success">Earned ✓</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-base font-semibold mb-3 text-muted-foreground">Locked Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {locked.map((badge) => (
            <Card key={badge.id} className="text-center opacity-60">
              <CardContent className="pt-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-muted text-muted-foreground">
                  {badge.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{badge.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{badge.desc}</p>
                </div>
                <Badge variant="secondary">Locked 🔒</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
