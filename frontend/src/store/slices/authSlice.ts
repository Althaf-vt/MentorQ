import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, User } from '@/types/auth.types'
import {
  getToken,
  getUser,
  saveSession,
  clearSession,
  roleFromUser,
  type ActiveRole,
} from '@/lib/roleContext'

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------
// We no longer hydrate a single global session. Instead, each role has its own
// namespaced localStorage keys (student_token / mentor_token, etc.).
// The slice still tracks "current" auth for backwards-compatibility with
// components that haven't migrated to useRoleAuth() yet. On app boot we
// attempt to hydrate from BOTH role buckets so the Navbar can decide what to
// show.  Route guards use useRoleAuth() which reads directly from the
// namespaced storage.
// ---------------------------------------------------------------------------

const studentToken = getToken('student')
const studentUser = getUser('student')
const mentorToken = getToken('mentor')
const mentorUser = getUser('mentor')

const initialState: AuthState = {
  // Default to whichever session exists (prefer the one matching the current URL)
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  // Per-role state
  studentToken,
  studentUser,
  mentorToken,
  mentorUser,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: User }>,
    ) => {
      const { token, user } = action.payload
      const role = roleFromUser(user)

      // Persist to the correct namespace
      saveSession(token, user, role)

      // Update role-specific slice state
      if (role === 'mentor') {
        state.mentorToken = token
        state.mentorUser = user
      } else {
        state.studentToken = token
        state.studentUser = user
      }

      // Keep the legacy fields in sync for convenience
      state.token = token
      state.user = user
      state.isAuthenticated = true
    },

    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        const updated = { ...state.user, ...action.payload }
        state.user = updated
        const role = roleFromUser(updated)
        if (role === 'mentor') {
          state.mentorUser = updated
        } else {
          state.studentUser = updated
        }
        saveSession(
          role === 'mentor' ? state.mentorToken! : state.studentToken!,
          updated,
          role,
        )
      }
    },

    /**
     * Logout clears ONLY the specified role's session.
     * If no role is provided, it falls back to the role of the currently
     * active user in the slice.
     */
    logout: (state, action: PayloadAction<ActiveRole | undefined>) => {
      const role = action.payload ?? (state.user ? roleFromUser(state.user) : 'student')

      clearSession(role)

      if (role === 'mentor') {
        state.mentorToken = null
        state.mentorUser = null
      } else {
        state.studentToken = null
        state.studentUser = null
      }

      // If the legacy "current" fields were pointing at the logged-out role,
      // clear them too. If the OTHER role is still logged in, swap to that.
      if (state.user && roleFromUser(state.user) === role) {
        const otherRole: ActiveRole = role === 'mentor' ? 'student' : 'mentor'
        const otherToken = otherRole === 'mentor' ? state.mentorToken : state.studentToken
        const otherUser = otherRole === 'mentor' ? state.mentorUser : state.studentUser
        if (otherToken && otherUser) {
          state.token = otherToken
          state.user = otherUser
          state.isAuthenticated = true
        } else {
          state.token = null
          state.user = null
          state.isAuthenticated = false
        }
      }
    },
  },
})

export const { setCredentials, updateUser, logout } = authSlice.actions
export default authSlice.reducer
