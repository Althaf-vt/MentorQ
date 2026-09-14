import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { PasswordResetPage } from './pages/auth/PasswordResetPage'
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
import { useAppSelector } from './store/hooks'
import './App.css'

function RootRedirect() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }
  if (user.role === 'MENTOR') {
    return <Navigate to="/mentor" replace />
  }
  return <Navigate to="/student" replace />
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#faf9f7] flex flex-col font-body">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><PasswordResetPage /></PublicRoute>} />

            {/* Protected Student Routes */}
            <Route path="/student" element={<RoleRoute allowedRoles={['STUDENT', 'ADMIN']}><StudentDashboardPage /></RoleRoute>} />
            <Route path="/queue/:ticketId" element={<ProtectedRoute><QueueTrackerPage /></ProtectedRoute>} />
            <Route path="/history" element={<RoleRoute allowedRoles={['STUDENT', 'ADMIN']}><TicketHistoryArchivePage /></RoleRoute>} />

            {/* Protected Mentor Routes */}
            <Route path="/mentor" element={<RoleRoute allowedRoles={['MENTOR', 'ADMIN']}><MentorDashboardPage /></RoleRoute>} />
            <Route path="/mentor/configuration" element={<RoleRoute allowedRoles={['MENTOR', 'ADMIN']}><MentorConfigurationPage /></RoleRoute>} />

            {/* Live Focus Session Mode */}
            <Route path="/focus/:ticketId" element={<ProtectedRoute><SessionFocusModePage /></ProtectedRoute>} />

            {/* Shared Settings */}
            <Route path="/settings" element={<ProtectedRoute><UserSettingsPage /></ProtectedRoute>} />

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


