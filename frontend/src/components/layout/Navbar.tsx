import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Modal } from '@/design-system'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { useRoleAuth } from '@/store/hooks/useRoleAuth'
import { useThemeStore } from '@/store/themeStore'
import {
  NavigationDock,
  type DockDestination,
} from '@/components/preview/NavigationDock'
import { NotificationDrawer } from './NotificationDrawer'
import {
  useGetUserNotificationsQuery,
  notificationApi,
} from '@/store/api/notificationApi'
import type { Notification } from '@/types/operational.types'
import { socketService } from '@/services/socket.service'

const ICON_DASHBOARD =
  'M3 10.5 12 3l9 7.5M5 9v11h14V9M9 20v-6h6v6'
const ICON_MENTORS =
  'M15.5 21v-2a4 4 0 0 0-4-4h-5a4 4 0 0 0-4 4v2M18 15.2a4 4 0 0 1 3.5 4V21M15.5 3.2a4 4 0 0 1 0 7.6M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'
const ICON_HISTORY =
  'M3 12a9 9 0 1 1 2.6 6.4M3 6v6h6M12 7v5l3 2'
const ICON_CONFIG =
  'M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6'
const ICON_SETTINGS =
  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-2.1a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H11a1.7 1.7 0 0 0 1-1.5V5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V11a1.7 1.7 0 0 0 1.5 1H19a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z'

function getInitials(name?: string): string {
  if (!name) return 'MQ'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'MQ'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, activeRole } = useRoleAuth()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  const { data: notifications = [] } = useGetUserNotificationsQuery(undefined, {
    skip: !isAuthenticated,
  })
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length

  useEffect(() => {
    if (!isAuthenticated) return
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
  }, [isAuthenticated, dispatch])

  const destinations = useMemo<DockDestination[]>(() => {
    if (user?.role === 'MENTOR') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/mentor/dashboard',
          iconPath: ICON_DASHBOARD,
        },
        {
          id: 'config',
          label: 'Mentor Config',
          href: '/mentor/configuration',
          iconPath: ICON_CONFIG,
        },
        {
          id: 'settings',
          label: 'Settings',
          href: '/mentor/settings',
          iconPath: ICON_SETTINGS,
        },
      ]
    }
    if (user?.role === 'ADMIN') {
      return [
        {
          id: 'dashboard',
          label: 'Admin',
          href: '/admin',
          iconPath: ICON_DASHBOARD,
        },
        {
          id: 'settings',
          label: 'Settings',
          href: '/admin/settings',
          iconPath: ICON_SETTINGS,
        },
      ]
    }
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        iconPath: ICON_DASHBOARD,
      },
      {
        id: 'mentors',
        label: 'Mentors',
        href: '/mentors',
        iconPath: ICON_MENTORS,
      },
      {
        id: 'history',
        label: 'History',
        href: '/history',
        iconPath: ICON_HISTORY,
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        iconPath: ICON_SETTINGS,
      },
    ]
  }, [user?.role])

  if (!isAuthenticated || !user) {
    return null
  }

  const getDashboardPath = () => {
    if (user.role === 'ADMIN') return '/admin'
    if (user.role === 'MENTOR') return '/mentor/dashboard'
    return '/dashboard'
  }

  const getSettingsPath = () => {
    if (user.role === 'ADMIN') return '/admin/settings'
    if (user.role === 'MENTOR') return '/mentor/settings'
    return '/settings'
  }

  const resolveActiveId = (pathname: string): string => {
    if (pathname.startsWith('/mentors')) return 'mentors'
    if (pathname.startsWith('/history')) return 'history'
    if (pathname.startsWith('/mentor/configuration')) return 'config'
    if (pathname.endsWith('/settings')) return 'settings'
    return 'dashboard'
  }

  const handleLogout = () => {
    setProfileOpen(false)
    setNotifOpen(false)
    dispatch(logout(activeRole))
    navigate(activeRole === 'mentor' ? '/mentor/login' : '/login')
  }

  const initials = getInitials(user.fullName)
  const isLiveSession =
    location.pathname.startsWith('/focus/') ||
    location.pathname.startsWith('/mentor/focus/') ||
    location.pathname.startsWith('/session/')

  return (
    <>
      <NavigationDock
        theme={theme}
        onToggleTheme={toggleTheme}
        destinations={destinations}
        active={resolveActiveId(location.pathname)}
        unreadCount={unreadCount}
        notificationsOpen={notifOpen}
        onNotifications={() => setNotifOpen((prev) => !prev)}
        onProfile={() => setProfileOpen(true)}
        initials={initials}
        profileLabel={
          user.role === 'MENTOR'
            ? 'Mentor profile'
            : user.role === 'ADMIN'
              ? 'Admin profile'
              : 'Student profile'
        }
        homeHref={getDashboardPath()}
        hidden={isLiveSession}
      />

      {notifOpen && <NotificationDrawer onClose={() => setNotifOpen(false)} />}

      <Modal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        variant="ticket"
        className="student-profile-dialog"
        ticketHeader={{
          label:
            user.role === 'MENTOR'
              ? 'Mentor profile'
              : user.role === 'ADMIN'
                ? 'Administrator'
                : 'Student profile',
        }}
        title={user.fullName || 'MentorQ Account'}
        description={user.email}
        actions={
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setProfileOpen(false)
                navigate(getSettingsPath())
              }}
            >
              Account Settings
            </Button>
            <Button
              type="button"
              variant="danger-subtle"
              onClick={() => {
                setProfileOpen(false)
                setLogoutModalOpen(true)
              }}
            >
              Sign Out
            </Button>
          </div>
        }
      >
        <dl className="student-profile-summary">
          <div>
            <dt>Account Role</dt>
            <dd style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>
              {user.role.toLowerCase()}
            </dd>
          </div>
          <div>
            <dt>Theme Mode</dt>
            <dd style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>
              {theme}
            </dd>
          </div>
        </dl>
      </Modal>

      <Modal
        open={logoutModalOpen}
        onOpenChange={setLogoutModalOpen}
        title="Sign Out?"
        description="Are you sure you want to sign out of MentorQ?"
        variant="danger"
        actions={
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
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
    </>
  )
}
