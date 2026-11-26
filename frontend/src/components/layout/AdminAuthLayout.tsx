import { Outlet, Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { Card } from '@/design-system'

export function AdminAuthLayout() {
  return (
    <div
      data-mqds="dark"
      className="min-h-screen bg-[var(--mqds-canvas,#201d35)] text-[var(--mqds-text,#f4f7f2)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-body selection:bg-[var(--mqds-hover)] selection:text-white"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-[var(--mqds-surface,#272440)] p-3 rounded-2xl border border-[var(--mqds-border,#89839b)]/40 group-hover:border-[var(--mqds-accent)] transition-all shadow-md">
              <Shield className="w-8 h-8 text-[var(--mqds-accent,#c5baff)]" />
            </div>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold font-headline tracking-tight text-[var(--mqds-text)]">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-xs font-mono text-[var(--mqds-muted)]">
          Secure management console for MentorQ platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card
          variant="paper"
          className="bg-[var(--mqds-surface,#272440)] py-8 px-6 shadow-2xl border border-[var(--mqds-border,#89839b)]/30 rounded-2xl sm:px-10"
        >
          <Outlet />
        </Card>
      </div>
    </div>
  )
}
