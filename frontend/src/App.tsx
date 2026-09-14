import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { PasswordResetPage } from './pages/auth/PasswordResetPage'
import { UserSettingsPage } from './pages/UserSettingsPage'
import { MentorConfigurationPage } from './pages/MentorConfigurationPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { PublicRoute } from './routes/PublicRoute'
import { RoleRoute } from './routes/RoleRoute'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#faf9f7] flex flex-col">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <PasswordResetPage />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <UserSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/configuration"
              element={
                <RoleRoute allowedRoles={['MENTOR']}>
                  <MentorConfigurationPage />
                </RoleRoute>
              }
            />

            {/* Fallbacks */}
            <Route path="/" element={<Navigate to="/settings" replace />} />
            <Route path="*" element={<Navigate to="/settings" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App

