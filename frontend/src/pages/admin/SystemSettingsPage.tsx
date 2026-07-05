import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Settings, ShieldCheck, Database, Sliders, Bell } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function SystemSettingsPage() {
  const { toast } = useToast()
  const [syncInterval, setSyncInterval] = useState('12')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Configuration Saved',
      description: 'System configurations have been successfully updated on the server.',
    })
  }

  const handleDbCompact = () => {
    toast({
      title: 'Maintenance Done',
      description: 'In-memory indices compressed and garbage collected.',
    })
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure global synchronization frequencies and API settings</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sliders Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" /> Engine Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">LeetCode Sync Frequency</label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="12h">Every 12 Hours (Recommended)</option>
                  <option value="6">Every 6 Hours</option>
                  <option value="12">Every 12 Hours (Recommended)</option>
                  <option value="24">Daily (2:00 AM)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">Determines how often the server queries LeetCode GraphQL endpoints.</p>
              </div>

              <div className="flex items-center justify-between p-3 border border-input rounded-lg bg-background/50">
                <div>
                  <p className="text-sm font-semibold text-foreground">Advisory Alerts</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Alert advisors when student streaks fall to zero</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded border-border bg-background text-primary focus:ring-primary h-4.5 w-4.5"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-input rounded-lg bg-background/50">
                <div>
                  <p className="text-sm font-semibold text-foreground">Maintenance Lock</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Restrict client dashboard login access</p>
                </div>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="rounded border-border bg-background text-primary focus:ring-primary h-4.5 w-4.5"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit">Save Configurations</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Column */}
        <div className="space-y-6 md:col-span-1">
          {/* Environment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-success" /> Server Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-muted-foreground">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground font-semibold">Running Mode</span>
                <Badge variant="success">DEVELOPMENT</Badge>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground font-semibold">Mock Database</span>
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">ENABLED (In-Memory)</Badge>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground font-semibold">API Version</span>
                <span className="font-mono text-muted-foreground">v1.0.0-mock</span>
              </div>
            </CardContent>
          </Card>

          {/* Database Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> Maintenance Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleDbCompact} variant="outline" className="w-full text-xs font-semibold">
                Compact Mock Indices
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}
