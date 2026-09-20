import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

interface AdminAuthGuardProps {
  children: React.ReactNode
}

/**
 * Ensures the user IS logged in as an Admin.
 * If they are not an Admin, it redirects them to the admin login page.
 */
export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const adminToken = useAppSelector((state) => state.auth.adminToken)
  const adminUser = useAppSelector((state) => state.auth.adminUser)
  const location = useLocation()

  if (!adminToken || !adminUser || adminUser.role !== 'ADMIN') {
    // Redirect them to the /admin/login page, but save the current location they were trying to go to
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
