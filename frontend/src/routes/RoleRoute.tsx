import React from 'react'
import { Navigate } from 'react-router-dom'
import { useRoleAuth } from '@/store/hooks/useRoleAuth'
import type { UserRole } from '@/types/auth.types'

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useRoleAuth()

  if (!isAuthenticated || !user) {
    if (window.location.pathname.startsWith('/mentor')) {
      return <Navigate to="/mentor/login" replace />
    }
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to the appropriate dashboard for their actual role
    if (user.role === 'MENTOR') {
      return <Navigate to="/mentor/dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
