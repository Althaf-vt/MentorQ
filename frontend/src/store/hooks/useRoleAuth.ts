import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getToken, getUser } from '@/lib/roleContext'
import type { ActiveRole } from '@/lib/roleContext'
import type { User } from '@/types/auth.types'

/**
 * A hook that returns the authentication state for the role that is active
 * based on the current URL path.
 *
 * - Paths under `/mentor/*` → reads `mentor_token` / `mentor_user`
 * - All other paths        → reads `student_token` / `student_user`
 *
 * This allows a student and a mentor to be logged in simultaneously in
 * different tabs without interfering with each other.
 */
export function useRoleAuth(): {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  activeRole: ActiveRole
} {
  const { pathname } = useLocation()
  const activeRole: ActiveRole = pathname.startsWith('/mentor') ? 'mentor' : 'student'

  return useMemo(() => {
    const token = getToken(activeRole)
    const user = getUser(activeRole)
    return {
      token,
      user,
      isAuthenticated: Boolean(token),
      activeRole,
    }
  }, [activeRole])
}
