import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useRoleAuth } from '@/store/hooks/useRoleAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useRoleAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    if (window.location.pathname === '/mentor' || window.location.pathname.startsWith('/mentor/')) {
      return <Navigate to="/mentor/login" state={{ from: location }} replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
