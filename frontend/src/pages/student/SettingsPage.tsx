import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Moon, Shield, Palette, Globe } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore()

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-2xl">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your preferences and account settings</p>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="w-4 h-4 text-primary" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Theme</p>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <Button
                    key={t}
                    variant={theme === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme(t)}
                    className="capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-primary" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Contest Reminders', desc: 'Get notified before contests start', enabled: true },
              { label: 'Daily Coding Reminder', desc: 'Daily reminder to solve a problem', enabled: true },
              { label: 'Streak Alerts', desc: 'Alert when streak is about to break', enabled: true },
              { label: 'Achievement Notifications', desc: 'Celebrate milestone achievements', enabled: false },
              { label: 'Faculty Announcements', desc: 'Announcements from your faculty', enabled: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <ToggleSwitch enabled={item.enabled} onChange={() => {}} />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary" /> Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Show in Leaderboard', desc: 'Allow your profile to appear in section leaderboard', enabled: true },
              { label: 'Share Progress with Faculty', desc: 'Allow faculty to view your detailed stats', enabled: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <ToggleSwitch enabled={item.enabled} onChange={() => {}} />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Button variant="destructive" size="sm">Delete Account</Button>
      </motion.div>
    </motion.div>
  )
}
