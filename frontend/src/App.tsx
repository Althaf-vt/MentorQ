import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Toaster } from '@/components/layout/Toaster'
import { BrandIntro } from './components/preview/BrandIntro'
import { LandingPage } from './pages/LandingPage'
import { UserSettingsPage } from './pages/UserSettingsPage'
import { MentorConfigurationPage } from './pages/MentorConfigurationPage'
import { StudentDashboardPage } from './pages/StudentDashboardPage'
import { MentorDashboardPage } from './pages/MentorDashboardPage'
import { QueueTrackerPage } from './pages/QueueTrackerPage'
import { SessionFocusModePage } from './pages/SessionFocusModePage'
import { TicketHistoryArchivePage } from './pages/TicketHistoryArchivePage'
import { AdminAuthLayout } from './components/layout/AdminAuthLayout'
import { AdminLoginPage } from './pages/admin/auth/AdminLoginPage'
import { AdminForgotPasswordPage } from './pages/admin/auth/AdminForgotPasswordPage'
import { AdminVerifyOtpPage } from './pages/admin/auth/AdminVerifyOtpPage'
import { AdminResetPasswordPage } from './pages/admin/auth/AdminResetPasswordPage'
import { AdminGuestGuard } from './routes/AdminGuestGuard'
import { AdminAuthGuard } from './routes/AdminAuthGuard'
import { AdminDashboardLayout } from './components/layout/AdminDashboardLayout'
import { AdminDashboardPage } from './pages/admin/dashboard/AdminDashboardPage'
import { AdminSettingsPage } from './pages/admin/dashboard/AdminSettingsPage'
import { AdminUsersPage } from './pages/admin/dashboard/AdminUsersPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { MentorsDirectoryPage } from './pages/MentorsDirectoryPage'
import { PublicRoute } from './routes/PublicRoute'
import { RoleRoute } from './routes/RoleRoute'
import { useRoleAuth } from './store/hooks/useRoleAuth'
import { useThemeStore } from './store/themeStore'

const INTRO_SEEN_KEY = 'mentorq-intro-seen'

function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    // Ignore storage errors in restricted browsing contexts.
  }
}

function RootFallbackRedirect() {
  const { user, isAuthenticated } = useRoleAuth()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    if (
      location.pathname === '/mentor' ||
      location.pathname.startsWith('/mentor/')
    ) {
      return <Navigate to="/mentor/login" replace />
    }
    return <Navigate to="/" replace />
  }
  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }
  if (user.role === 'MENTOR') {
    return <Navigate to="/mentor/dashboard" replace />
  }
  return <Navigate to="/dashboard" replace />
}

function AppShell() {
  const location = useLocation()
  const theme = useThemeStore((state) => state.theme)
  const isAdminRoute =
    location.pathname === '/admin' || location.pathname.startsWith('/admin/')

  const [showIntro, setShowIntro] = useState<boolean>(
    () => !isAdminRoute && !hasSeenIntro(),
  )

  const handleFinishIntro = () => {
    markIntroSeen()
    setShowIntro(false)
  }

  const handleReplayIntro = () => {
    setShowIntro(true)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-mqds', theme)
  }, [theme])

  return (
    <div
      data-mqds={theme}
      className="min-h-screen bg-[var(--mqds-canvas)] text-[var(--mqds-text)] flex flex-col font-body"
    >
      {showIntro && !isAdminRoute ? (
        <BrandIntro onFinish={handleFinishIntro} />
      ) : null}

      {!isAdminRoute ? <Navbar /> : null}
      <Toaster />

      <div className="flex-grow">
        <Routes>
          {/* Public Landing & Modal Auth Deep-Links */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage key="home" onReplayIntro={handleReplayIntro} />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LandingPage
                  key="student"
                  initialModal="student"
                  onReplayIntro={handleReplayIntro}
                />
              </PublicRoute>
            }
          />
          <Route
            path="/mentor/login"
            element={
              <PublicRoute>
                <LandingPage
                  key="mentor"
                  initialModal="mentor"
                  onReplayIntro={handleReplayIntro}
                />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <LandingPage
                  key="register"
                  initialModal="register"
                  onReplayIntro={handleReplayIntro}
                />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <LandingPage
                  key="forgot-password"
                  initialModal="forgot-password"
                  onReplayIntro={handleReplayIntro}
                />
              </PublicRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <PublicRoute>
                <LandingPage
                  key="verify-otp"
                  initialModal="verify-otp"
                  onReplayIntro={handleReplayIntro}
                />
              </PublicRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <StudentDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/queue/:ticketId"
            element={
              <ProtectedRoute>
                <QueueTrackerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <RoleRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <TicketHistoryArchivePage />
              </RoleRoute>
            }
          />
          <Route
            path="/focus/:ticketId"
            element={
              <ProtectedRoute>
                <SessionFocusModePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <UserSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentors"
            element={
              <RoleRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <MentorsDirectoryPage />
              </RoleRoute>
            }
          />
          <Route
            path="/mentors/favorites"
            element={
              <RoleRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <MentorsDirectoryPage />
              </RoleRoute>
            }
          />

          {/* Mentor Routes */}
          <Route
            path="/mentor/dashboard"
            element={
              <RoleRoute allowedRoles={['MENTOR', 'ADMIN']}>
                <MentorDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/mentor/configuration"
            element={
              <RoleRoute allowedRoles={['MENTOR', 'ADMIN']}>
                <MentorConfigurationPage />
              </RoleRoute>
            }
          />
          <Route
            path="/mentor/focus/:ticketId"
            element={
              <ProtectedRoute>
                <SessionFocusModePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentor/settings"
            element={
              <ProtectedRoute>
                <UserSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminAuthLayout />}>
            <Route
              path="login"
              element={
                <AdminGuestGuard>
                  <AdminLoginPage />
                </AdminGuestGuard>
              }
            />
            <Route
              path="forgot-password"
              element={
                <AdminGuestGuard>
                  <AdminForgotPasswordPage />
                </AdminGuestGuard>
              }
            />
            <Route
              path="verify-otp"
              element={
                <AdminGuestGuard>
                  <AdminVerifyOtpPage />
                </AdminGuestGuard>
              }
            />
            <Route
              path="reset-password"
              element={
                <AdminGuestGuard>
                  <AdminResetPasswordPage />
                </AdminGuestGuard>
              }
            />
          </Route>

          <Route
            path="/admin"
            element={
              <AdminAuthGuard>
                <AdminDashboardLayout />
              </AdminAuthGuard>
            }
          >
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="*" element={<RootFallbackRedirect />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
