import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, User as UserIcon, LogOut, Settings, Sliders, Bell, LayoutDashboard, ListCollapse } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { NotificationDrawer } from './NotificationDrawer'
import { useGetUserNotificationsQuery } from '@/store/api/notificationApi'
import type { Notification } from '@/types/operational.types'

export const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const { data: notifications = [] } = useGetUserNotificationsQuery(undefined, { skip: !isAuthenticated })
  const unreadCount = notifications.filter((n: Notification) => !n.read_status).length

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const getDashboardPath = () => {
    if (user?.role === 'ADMIN') return '/admin'
    if (user?.role === 'MENTOR') return '/mentor'
    return '/student'
  }

  return (
    <header className="w-full bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#E5E4DE] sticky top-0 z-30 font-body">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to={isAuthenticated ? getDashboardPath() : '/'} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-[#303331]">
              Mentor<span className="text-primary">Q</span>
            </span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to={getDashboardPath()}
                className="px-3.5 py-2 text-sm font-medium text-[#5d605e] hover:text-[#303331] hover:bg-[#eeeeeb] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              {user?.role === 'STUDENT' && (
                <Link
                  to="/history"
                  className="px-3.5 py-2 text-sm font-medium text-[#5d605e] hover:text-[#303331] hover:bg-[#eeeeeb] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ListCollapse className="w-4 h-4" />
                  <span>History Archive</span>
                </Link>
              )}
              {user?.role === 'MENTOR' && (
                <Link
                  to="/mentor/configuration"
                  className="px-3.5 py-2 text-sm font-medium text-[#5d605e] hover:text-[#303331] hover:bg-[#eeeeeb] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Mentor Config</span>
                </Link>
              )}
              <Link
                to="/settings"
                className="px-3.5 py-2 text-sm font-medium text-[#5d605e] hover:text-[#303331] hover:bg-[#eeeeeb] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-[#797b79] hover:text-primary hover:bg-[#eeeeeb] rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white font-sora font-bold text-[9px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-[#303331] leading-tight">{user.fullName}</p>
                  <p className="text-[10px] text-[#797b79] capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-[#797b79] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-[#303331] hover:text-primary">
                Sign In
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-dim text-white rounded-lg shadow-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
      {notifOpen && <NotificationDrawer onClose={() => setNotifOpen(false)} />}
    </header>
  )
}


