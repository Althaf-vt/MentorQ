import { useGetMetricsQuery } from '@/store/api/adminApi'
import { Users, GraduationCap, Calendar, Ticket } from 'lucide-react'
import { Card, Loader } from '@/design-system'

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor,
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  accentColor: string
}) {
  return (
    <Card
      variant="paper"
      className="p-6 relative overflow-hidden bg-[var(--mqds-surface,#272440)] border border-[var(--mqds-border,#89839b)]/30 shadow-sm"
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--mqds-muted,#cbc6df)]">
            {title}
          </p>
          <h3 className="text-3xl font-headline font-bold text-[var(--mqds-text,#f4f7f2)] mt-2">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--mqds-muted)] mt-1.5 font-mono">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="p-3 rounded-xl border border-[var(--mqds-border,#89839b)]/20"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  )
}

export function AdminDashboardPage() {
  const { data: metrics, isLoading, isError } = useGetMetricsQuery()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader />
        <p className="text-xs font-mono text-[var(--mqds-muted)]">Loading metrics...</p>
      </div>
    )
  }

  if (isError || !metrics) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--mqds-danger)]/20 border border-[var(--mqds-danger-border)] text-[var(--mqds-error)] text-xs">
        Failed to load platform metrics.
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-body">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight text-[var(--mqds-text,#f4f7f2)]">
          Platform Overview
        </h1>
        <p className="text-xs sm:text-sm text-[var(--mqds-muted)] mt-1 font-mono">
          Live administrative health metrics and user statistics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Students"
          value={metrics.students.total}
          subtitle={`${metrics.students.active} active · ${metrics.students.suspended} suspended`}
          icon={GraduationCap}
          accentColor="#8172fe"
        />

        <MetricCard
          title="Total Mentors"
          value={metrics.mentors.total}
          subtitle={`${metrics.mentors.active} active · ${metrics.mentors.suspended} suspended`}
          icon={Users}
          accentColor="#00b894"
        />

        <MetricCard
          title="Lifetime Sessions"
          value={metrics.sessions.total}
          subtitle="Completed 1-on-1 focus runs"
          icon={Calendar}
          accentColor="#c5baff"
        />

        <MetricCard
          title="Queue Size"
          value={metrics.tickets.pending}
          subtitle="Tickets awaiting claiming"
          icon={Ticket}
          accentColor="#f39c12"
        />
      </div>
    </div>
  )
}
