import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

interface PublicRouteProps {
  children: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  if (isAuthenticated && user) {
    if (user.role === 'MENTOR') {
      return <Navigate to="/mentor/configuration" replace />
    }
    return <Navigate to="/settings" replace />
  }

  return <>{children}</>
}
