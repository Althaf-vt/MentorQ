import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Sparkles,
  User as UserIcon,
  LogOut,
  Settings,
  Sliders,
  Bell,
  LayoutDashboard,
  ListCollapse,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { useRoleAuth } from '@/store/hooks/useRoleAuth'
import { NotificationDrawer } from './NotificationDrawer'
import { useGetUserNotificationsQuery, notificationApi } from '@/store/api/notificationApi'
import type { Notification } from '@/types/operational.types'
import { socketService } from '@/services/socket.service'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string)?.replace('/api/v1', '') || 'http://localhost:3133'
function resolveAvatarUrl(url?: string) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, activeRole } = useRoleAuth()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const { data: notifications = [] } = useGetUserNotificationsQuery(undefined, { skip: !isAuthenticated })
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect()
      const invalidateNotifs = () => {
        dispatch(notificationApi.util.invalidateTags(['Notification']))
      }

      socketService.on('student_requested_mentorship', invalidateNotifs)
      socketService.on('mentor_claimed_ticket', invalidateNotifs)
      socketService.on('focus_mode_started', invalidateNotifs)
      socketService.on('session_ended', invalidateNotifs)
      socketService.on('session_ended_by_peer', invalidateNotifs)

      return () => {
        socketService.off('student_requested_mentorship', invalidateNotifs)
        socketService.off('mentor_claimed_ticket', invalidateNotifs)
        socketService.off('focus_mode_started', invalidateNotifs)
        socketService.off('session_ended', invalidateNotifs)
        socketService.off('session_ended_by_peer', invalidateNotifs)
      }
    }
  }, [isAuthenticated, dispatch])

  const handleLogout = () => {
    setMobileMenuOpen(false)
    // Only clear the current role's session
    dispatch(logout(activeRole))
    if (activeRole === 'mentor') {
      navigate('/mentor/login')
    } else {
      navigate('/login')
    }
  }

  const getDashboardPath = () => {
    if (user?.role === 'ADMIN') return '/admin'
    if (user?.role === 'MENTOR') return '/mentor/dashboard'
    return '/dashboard'
  }

  const getSettingsPath = () => {
    if (user?.role === 'MENTOR') return '/mentor/settings'
    return '/settings'
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="w-full bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#E5E4DE] sticky top-0 z-50 font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-10">
          {/* Hamburger Menu Toggle for Mobile / Tablet viewports */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-1 text-[#5d605e] hover:text-[#303331] hover:bg-[#eeeeeb] rounded-xl transition-colors md:hidden cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link
            to={isAuthenticated ? getDashboardPath() : '/'}
            className="flex items-center gap-2.5"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-[#303331]">
              Mentor<span className="text-primary">Q</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to={getDashboardPath()}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive(getDashboardPath())
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-[#5d605e] hover:text-[#303331] hover:bg-[#eeeeeb]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              {user?.role === 'STUDENT' && (
                <Link
                  to="/history"
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/history')
                      ? 'text-primary bg-primary/10 font-semibold'
                      : 'text-[#5d605e] hover:text-[#303331] hover:bg-[#eeeeeb]'
                  }`}
                >
                  <ListCollapse className="w-4 h-4" />
                  <span>History Archive</span>
                </Link>
              )}
              {user?.role === 'MENTOR' && (
                <Link
                  to="/mentor/configuration"
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/mentor/configuration')
                      ? 'text-primary bg-primary/10 font-semibold'
                      : 'text-[#5d605e] hover:text-[#303331] hover:bg-[#eeeeeb]'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Mentor Config</span>
                </Link>
              )}
              <Link
                to={getSettingsPath()}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive(getSettingsPath())
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-[#5d605e] hover:text-[#303331] hover:bg-[#eeeeeb]'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-[#797b79] hover:text-primary hover:bg-[#eeeeeb] rounded-lg transition-colors cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white font-sora font-bold text-[9px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs overflow-hidden">
                  {resolveAvatarUrl(user.avatarUrl) ? (
                    <img src={resolveAvatarUrl(user.avatarUrl)!} alt={user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    user.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-[#303331] leading-tight truncate max-w-[120px]">{user.fullName}</p>
                  <p className="text-[10px] text-[#797b79] capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLogoutModalOpen(true)}
                className="p-2 text-[#797b79] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Log out"
                aria-label="Log out"
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

      {/* Mobile Sliding Navigation Drawer (PWA readiness) */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sliding Menu Panel */}
          <div className="relative w-72 max-w-[80vw] bg-white h-[calc(100vh-4rem)] shadow-2xl border-r border-[#E5E4DE] flex flex-col justify-between p-4 z-10 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              {/* User Identity Banner in Drawer */}
              <div className="p-3 bg-[#faf9f7] rounded-xl border border-[#ecebe6] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm overflow-hidden">
                  {resolveAvatarUrl(user?.avatarUrl) ? (
                    <img src={resolveAvatarUrl(user?.avatarUrl)!} alt={user?.fullName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-[#303331] truncate">{user?.fullName || 'User'}</p>
                  <p className="text-[10px] text-primary font-semibold uppercase">{user?.role?.toLowerCase()} Account</p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Navigation</p>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                    isActive(getDashboardPath())
                      ? 'bg-primary text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-[#faf9f7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>

                {user?.role === 'STUDENT' && (
                  <Link
                    to="/history"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                      isActive('/history')
                        ? 'bg-primary text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-[#faf9f7]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ListCollapse className="w-4 h-4" />
                      <span>History Archive</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                )}

                {user?.role === 'MENTOR' && (
                  <Link
                    to="/mentor/configuration"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                      isActive('/mentor/configuration')
                        ? 'bg-primary text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-[#faf9f7]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders className="w-4 h-4" />
                      <span>Mentor Config</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                )}

                <Link
                  to={getSettingsPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                    isActive(getSettingsPath())
                      ? 'bg-primary text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-[#faf9f7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </div>
            </div>

            {/* Logout Button in Drawer Footer */}
            <div className="pt-4 border-t border-[#ecebe6]">
              <button
                onClick={() => setLogoutModalOpen(true)}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {notifOpen && <NotificationDrawer onClose={() => setNotifOpen(false)} />}

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">Sign Out?</h2>
              <p className="text-xs text-slate-500 mt-1">Are you sure you want to sign out of MentorQ?</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setLogoutModalOpen(false)} className="px-4 py-2 border rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button 
                onClick={() => {
                  setLogoutModalOpen(false)
                  handleLogout()
                }} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex justify-center items-center"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
