import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useRoleAuth } from '@/store/hooks/useRoleAuth'
import type { UserRole } from '@/types/auth.types'

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useRoleAuth()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    if (
      location.pathname === '/mentor' ||
      location.pathname.startsWith('/mentor/')
    ) {
      return <Navigate to="/mentor/login" state={{ from: location }} replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (user.role === 'MENTOR') {
      return <Navigate to="/mentor/dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
