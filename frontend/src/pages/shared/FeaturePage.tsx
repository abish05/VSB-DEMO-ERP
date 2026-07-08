import { Link, useLocation, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  ClipboardList,
  LineChart,
  Sparkles,
} from 'lucide-react'

function titleFromSlug(slug = 'feature') {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getRole(pathname: string) {
  return pathname.startsWith('/faculty') ? 'Faculty' : 'Student'
}

export default function FeaturePage() {
  const { slug } = useParams()
  const location = useLocation()
  const title = titleFromSlug(slug)
  const role = getRole(location.pathname)
  const basePath = role === 'Faculty' ? '/faculty/dashboard' : '/student/dashboard'

  const featureCards = [
    {
      title: 'Live Metrics',
      text: 'Connects to synced LeetCode activity, contest stats, and college ranking data.',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      title: 'Trend Analysis',
      text: 'Tracks daily, weekly, and monthly movement so progress is easy to compare.',
      icon: <LineChart className="w-5 h-5" />,
    },
    {
      title: 'Action Queue',
      text: 'Keeps recommended next steps visible for coding practice, reviews, and reminders.',
      icon: <ClipboardList className="w-5 h-5" />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{role}</Badge>
            <Badge variant="outline">Enterprise Module</Badge>
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            This module is ready in navigation and can be connected to dedicated data views as the workflow is built out.
          </p>
        </div>
        <Link
          to={basePath}
          className="inline-flex h-7 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {featureCards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {card.icon}
                </span>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" /> Suggested Build Scope
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex gap-3">
            <CalendarDays className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Filters and time range</p>
              <p className="text-muted-foreground mt-1">Department, batch, section, difficulty, contest, and custom date controls.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">AI insight panel</p>
              <p className="text-muted-foreground mt-1">Summaries, weak topic detection, next-problem recommendations, and placement readiness notes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
