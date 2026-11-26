import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Sparkles,
  User as UserIcon,
  LogOut,
  Settings,
  Sliders,
  LayoutDashboard,
  ListCollapse,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import {
  NotificationBell,
  Avatar,
  Button,
  Modal,
} from '@/design-system'
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
    <header className="w-full bg-[var(--mqds-surface,#faf9f7)]/95 backdrop-blur-md border-b border-[var(--mqds-border-subtle,#e5e4de)] sticky top-0 z-50 font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-10">
          {/* Hamburger Menu Toggle for Mobile / Tablet viewports */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-1 text-[var(--mqds-muted,#5d605e)] hover:text-[var(--mqds-text,#303331)] hover:bg-[var(--mqds-hover,#eeeeeb)] rounded-xl transition-colors md:hidden cursor-pointer"
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
            <div className="w-9 h-9 rounded-xl bg-[var(--mqds-primary,#5948d3)] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-[var(--mqds-text,#303331)]">
              Mentor<span className="text-[var(--mqds-primary,#5948d3)]">Q</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to={getDashboardPath()}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive(getDashboardPath())
                    ? 'text-[var(--mqds-primary)] bg-[var(--mqds-hover)] font-semibold'
                    : 'text-[var(--mqds-muted,#5d605e)] hover:text-[var(--mqds-text,#303331)] hover:bg-[var(--mqds-hover,#eeeeeb)]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              {user?.role === 'STUDENT' && (
                <>
                  <Link
                    to="/mentors"
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive('/mentors') || isActive('/mentors/favorites')
                        ? 'text-[var(--mqds-primary)] bg-[var(--mqds-hover)] font-semibold'
                        : 'text-[var(--mqds-muted,#5d605e)] hover:text-[var(--mqds-text,#303331)] hover:bg-[var(--mqds-hover,#eeeeeb)]'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Find Mentors</span>
                  </Link>
                  <Link
                    to="/history"
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive('/history')
                        ? 'text-[var(--mqds-primary)] bg-[var(--mqds-hover)] font-semibold'
                        : 'text-[var(--mqds-muted,#5d605e)] hover:text-[var(--mqds-text,#303331)] hover:bg-[var(--mqds-hover,#eeeeeb)]'
                    }`}
                  >
                    <ListCollapse className="w-4 h-4" />
                    <span>History Archive</span>
                  </Link>
                </>
              )}
              {user?.role === 'MENTOR' && (
                <Link
                  to="/mentor/configuration"
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/mentor/configuration')
                      ? 'text-[var(--mqds-primary)] bg-[var(--mqds-hover)] font-semibold'
                      : 'text-[var(--mqds-muted,#5d605e)] hover:text-[var(--mqds-text,#303331)] hover:bg-[var(--mqds-hover,#eeeeeb)]'
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
                    ? 'text-[var(--mqds-primary)] bg-[var(--mqds-hover)] font-semibold'
                    : 'text-[var(--mqds-muted,#5d605e)] hover:text-[var(--mqds-text,#303331)] hover:bg-[var(--mqds-hover,#eeeeeb)]'
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
              <NotificationBell
                count={unreadCount}
                expanded={notifOpen}
                onClick={() => setNotifOpen(!notifOpen)}
              />

              <div className="flex items-center gap-2">
                <Avatar
                  src={resolveAvatarUrl(user.avatarUrl) || undefined}
                  name={user.fullName || 'User'}
                  size="sm"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-[var(--mqds-text,#303331)] leading-tight truncate max-w-[120px]">{user.fullName}</p>
                  <p className="text-[10px] text-[var(--mqds-muted,#797b79)] capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>

              <Button
                type="button"
                variant="danger-subtle"
                onClick={() => setLogoutModalOpen(true)}
                title="Log out"
                aria-label="Log out"
                className="!min-h-[36px] !px-2.5"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
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
          <div className="relative w-72 max-w-[80vw] bg-[var(--mqds-surface,#ffffff)] h-[calc(100vh-4rem)] shadow-2xl border-r border-[var(--mqds-border-subtle,#E5E4DE)] flex flex-col justify-between p-4 z-10 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              {/* User Identity Banner in Drawer */}
              <div className="p-3 bg-[var(--mqds-hover,#faf9f7)] rounded-xl border border-[var(--mqds-border-subtle,#ecebe6)] flex items-center gap-3">
                <Avatar
                  src={resolveAvatarUrl(user?.avatarUrl) || undefined}
                  name={user?.fullName || 'User'}
                  size="md"
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-[var(--mqds-text,#303331)] truncate">{user?.fullName || 'User'}</p>
                  <p className="text-[10px] text-[var(--mqds-primary)] font-semibold uppercase">{user?.role?.toLowerCase()} Account</p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[var(--mqds-muted)] uppercase tracking-wider px-2 py-1">Navigation</p>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                    isActive(getDashboardPath())
                      ? 'bg-[var(--mqds-primary)] text-white font-bold shadow-xs'
                      : 'text-[var(--mqds-text)] hover:bg-[var(--mqds-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>

                {user?.role === 'STUDENT' && (
                  <>
                    <Link
                      to="/mentors"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        isActive('/mentors') || isActive('/mentors/favorites')
                          ? 'bg-[var(--mqds-primary)] text-white font-bold shadow-xs'
                          : 'text-[var(--mqds-text)] hover:bg-[var(--mqds-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <UserIcon className="w-4 h-4" />
                        <span>Find Mentors</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        isActive('/history')
                          ? 'bg-[var(--mqds-primary)] text-white font-bold shadow-xs'
                          : 'text-[var(--mqds-text)] hover:bg-[var(--mqds-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ListCollapse className="w-4 h-4" />
                        <span>History Archive</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                  </>
                )}

                {user?.role === 'MENTOR' && (
                  <Link
                    to="/mentor/configuration"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                      isActive('/mentor/configuration')
                        ? 'bg-[var(--mqds-primary)] text-white font-bold shadow-xs'
                        : 'text-[var(--mqds-text)] hover:bg-[var(--mqds-hover)]'
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
                      ? 'bg-[var(--mqds-primary)] text-white font-bold shadow-xs'
                      : 'text-[var(--mqds-text)] hover:bg-[var(--mqds-hover)]'
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
            <div className="pt-4 border-t border-[var(--mqds-border-subtle)]">
              <Button
                type="button"
                variant="danger-subtle"
                onClick={() => setLogoutModalOpen(true)}
                className="w-full justify-start gap-2.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {notifOpen && <NotificationDrawer onClose={() => setNotifOpen(false)} />}

      {/* Logout Confirmation Modal using Design System Modal */}
      <Modal
        open={logoutModalOpen}
        onOpenChange={setLogoutModalOpen}
        title="Sign Out?"
        description="Are you sure you want to sign out of MentorQ?"
        variant="danger"
        actions={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setLogoutModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setLogoutModalOpen(false)
                handleLogout()
              }}
            >
              Sign Out
            </Button>
          </div>
        }
      />
    </header>
  )
}
