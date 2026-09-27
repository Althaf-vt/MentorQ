import { useGetMetricsQuery } from '@/store/api/adminApi'
import { Users, GraduationCap, Calendar, Ticket, Loader2 } from 'lucide-react'
import clsx from 'clsx'

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: any
  colorClass: string
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
      <div
        className={clsx(
          'absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40',
          colorClass
        )}
      />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
          {subtitle && <p className="text-sm text-zinc-500 mt-2">{subtitle}</p>}
        </div>
        <div className={clsx('p-3 rounded-xl bg-opacity-10', colorClass, colorClass.replace('bg-', 'text-'))}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  const { data: metrics, isLoading, isError } = useGetMetricsQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  if (isError || !metrics) {
    return (
      <div className="p-6 rounded-2xl bg-red-900/20 border border-red-900/50 text-red-400">
        Failed to load platform metrics.
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Platform Overview</h1>
        <p className="text-zinc-400 mt-2">Monitor global activity and platform health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Students"
          value={metrics.students.total}
          subtitle={`${metrics.students.active} active · ${metrics.students.suspended} suspended`}
          icon={GraduationCap}
          colorClass="bg-blue-500 text-blue-400"
        />
        
        <MetricCard
          title="Total Mentors"
          value={metrics.mentors.total}
          subtitle={`${metrics.mentors.active} active · ${metrics.mentors.suspended} suspended`}
          icon={Users}
          colorClass="bg-emerald-500 text-emerald-400"
        />

        <MetricCard
          title="Lifetime Sessions"
          value={metrics.sessions.total}
          icon={Calendar}
          colorClass="bg-purple-500 text-purple-400"
        />

        <MetricCard
          title="Queue Size"
          value={metrics.tickets.pending}
          subtitle="Tickets awaiting approval"
          icon={Ticket}
          colorClass="bg-orange-500 text-orange-400"
        />
      </div>
    </div>
  )
}
