import { useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
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
  const activeRole: ActiveRole = pathname === '/mentor' || pathname.startsWith('/mentor/') ? 'mentor' : 'student'

  const authState = useAppSelector(state => state.auth)

  const token = activeRole === 'mentor' ? authState.mentorToken : authState.studentToken
  const user = activeRole === 'mentor' ? authState.mentorUser : authState.studentUser

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    activeRole,
  }
}
