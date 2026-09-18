import React from 'react'
import { Navigate } from 'react-router-dom'
import { useRoleAuth } from '@/store/hooks/useRoleAuth'

interface PublicRouteProps {
  children: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useRoleAuth()

  if (isAuthenticated && user) {
    if (user.role === 'MENTOR') {
      return <Navigate to="/mentor/dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
