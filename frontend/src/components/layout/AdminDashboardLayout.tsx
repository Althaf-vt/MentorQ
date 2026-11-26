import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Settings, Users, ShieldAlert } from 'lucide-react'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { clearSession } from '@/lib/roleContext'
import { Button } from '@/design-system'
import clsx from 'clsx'

export function AdminDashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleLogout = () => {
    clearSession('admin')
    dispatch(logout('admin'))
    navigate('/admin/login', { replace: true })
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ]

  return (
    <div
      data-mqds="dark"
      className="flex h-screen bg-[var(--mqds-canvas,#201d35)] text-[var(--mqds-text,#f4f7f2)] font-body"
    >
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--mqds-border,#89839b)]/25 bg-[var(--mqds-surface,#272440)] flex flex-col justify-between">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-[var(--mqds-border,#89839b)]/20">
            <div className="w-10 h-10 bg-[var(--mqds-danger,#9b253b)] rounded-xl flex items-center justify-center text-white shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-headline tracking-tight text-[var(--mqds-text)]">
                Admin Console
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--mqds-muted)]">
                MentorQ Control
              </p>
            </div>
          </div>

          <nav className="px-4 space-y-1.5 mt-6">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group',
                    isActive
                      ? 'bg-[var(--mqds-hover,#3b355a)] text-[var(--mqds-accent,#c5baff)] shadow-xs'
                      : 'text-[var(--mqds-muted)] hover:bg-[var(--mqds-hover)] hover:text-white'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'w-4 h-4 transition-transform duration-200',
                      isActive ? 'scale-110 text-[var(--mqds-accent)]' : 'group-hover:scale-110'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[var(--mqds-border,#89839b)]/20">
          <Button
            variant="danger-subtle"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 !py-2 text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--mqds-canvas,#201d35)]">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
