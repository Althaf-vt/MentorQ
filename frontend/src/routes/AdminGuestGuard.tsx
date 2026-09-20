import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

interface AdminGuestGuardProps {
  children: React.ReactNode
}

/**
 * Ensures the user is NOT logged in as an Admin.
 * If they are already an Admin, it redirects them to the admin dashboard.
 * It strictly ignores any student or mentor tokens.
 */
export const AdminGuestGuard: React.FC<AdminGuestGuardProps> = ({ children }) => {
  const adminToken = useAppSelector((state) => state.auth.adminToken)
  const adminUser = useAppSelector((state) => state.auth.adminUser)

  if (adminToken && adminUser && adminUser.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
}
