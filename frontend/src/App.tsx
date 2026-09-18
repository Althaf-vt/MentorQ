import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { PasswordResetPage } from './pages/auth/PasswordResetPage'
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage'
import { UserSettingsPage } from './pages/UserSettingsPage'
import { MentorConfigurationPage } from './pages/MentorConfigurationPage'
import { StudentDashboardPage } from './pages/StudentDashboardPage'
import { MentorDashboardPage } from './pages/MentorDashboardPage'
import { QueueTrackerPage } from './pages/QueueTrackerPage'
import { SessionFocusModePage } from './pages/SessionFocusModePage'
import { TicketHistoryArchivePage } from './pages/TicketHistoryArchivePage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { PublicRoute } from './routes/PublicRoute'
import { RoleRoute } from './routes/RoleRoute'
import { useRoleAuth } from './store/hooks/useRoleAuth'
import './App.css'

function RootRedirect() {
  const { user, isAuthenticated } = useRoleAuth()
  if (!isAuthenticated || !user) {
    // Check if the user was trying to access a mentor path
    if (window.location.pathname.startsWith('/mentor')) {
      return <Navigate to="/mentor/login" replace />
    }
    return <Navigate to="/login" replace />
  }
  if (user.role === 'MENTOR') {
    return <Navigate to="/mentor/dashboard" replace />
  }
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#faf9f7] flex flex-col font-body">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><LoginPage expectedRole="STUDENT" /></PublicRoute>} />
            <Route path="/mentor/login" element={<PublicRoute><LoginPage expectedRole="MENTOR" /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><PasswordResetPage /></PublicRoute>} />
            <Route path="/verify-otp" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />

            {/* ============================================================
                Student Routes — root base URL (no /student prefix)
               ============================================================ */}
            <Route path="/dashboard" element={<RoleRoute allowedRoles={['STUDENT', 'ADMIN']}><StudentDashboardPage /></RoleRoute>} />
            <Route path="/queue/:ticketId" element={<ProtectedRoute><QueueTrackerPage /></ProtectedRoute>} />
            <Route path="/history" element={<RoleRoute allowedRoles={['STUDENT', 'ADMIN']}><TicketHistoryArchivePage /></RoleRoute>} />
            <Route path="/focus/:ticketId" element={<ProtectedRoute><SessionFocusModePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><UserSettingsPage /></ProtectedRoute>} />

            {/* ============================================================
                Mentor Routes — all prefixed with /mentor
               ============================================================ */}
            <Route path="/mentor/dashboard" element={<RoleRoute allowedRoles={['MENTOR', 'ADMIN']}><MentorDashboardPage /></RoleRoute>} />
            <Route path="/mentor/configuration" element={<RoleRoute allowedRoles={['MENTOR', 'ADMIN']}><MentorConfigurationPage /></RoleRoute>} />
            <Route path="/mentor/focus/:ticketId" element={<ProtectedRoute><SessionFocusModePage /></ProtectedRoute>} />
            <Route path="/mentor/settings" element={<ProtectedRoute><UserSettingsPage /></ProtectedRoute>} />

            {/* Root & Fallback */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App


