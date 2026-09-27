import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Settings, Users, ShieldAlert } from 'lucide-react'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { clearSession } from '@/lib/roleContext'
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
    <div className="flex h-screen bg-zinc-950 text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Admin</h1>
            <p className="text-xs text-zinc-400">Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-red-500/10 text-red-400'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                )}
              >
                <item.icon
                  className={clsx(
                    'w-5 h-5 transition-transform duration-200',
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  )}
                />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
