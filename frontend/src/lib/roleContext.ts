import type { User } from '@/types/auth.types'

// ---------------------------------------------------------------------------
// Role Context Utility
// ---------------------------------------------------------------------------
// Provides namespaced localStorage access so that a student session and a
// mentor session can coexist in the same browser without colliding.
//
// The "active role" is derived from the current URL path:
//   /mentor/*  →  'mentor'
//   everything else  →  'student'
// ---------------------------------------------------------------------------

export type ActiveRole = 'student' | 'mentor'

/**
 * Derive the active role from the current browser URL.
 * Any path starting with /mentor is considered the mentor context.
 */
export function getActiveRole(): ActiveRole {
  if (typeof window === 'undefined') return 'student'
  const p = window.location.pathname
  return (p === '/mentor' || p.startsWith('/mentor/')) ? 'mentor' : 'student'
}

/**
 * Build a namespaced localStorage key.
 * e.g. getStorageKey('token', 'mentor') → 'mentor_token'
 */
export function getStorageKey(key: string, role?: ActiveRole): string {
  const r = role ?? getActiveRole()
  return `${r}_${key}`
}

// ---- Token helpers --------------------------------------------------------

export function getToken(role?: ActiveRole): string | null {
  return localStorage.getItem(getStorageKey('token', role))
}

export function setToken(token: string, role?: ActiveRole): void {
  localStorage.setItem(getStorageKey('token', role), token)
}

// ---- User helpers ---------------------------------------------------------

export function getUser(role?: ActiveRole): User | null {
  const raw = localStorage.getItem(getStorageKey('user', role))
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setUser(user: User, role?: ActiveRole): void {
  localStorage.setItem(getStorageKey('user', role), JSON.stringify(user))
}

// ---- Session lifecycle ----------------------------------------------------

/**
 * Persist both token and user for a given role.
 */
export function saveSession(token: string, user: User, role?: ActiveRole): void {
  const r = role ?? roleFromUser(user)
  setToken(token, r)
  setUser(user, r)
}

/**
 * Clear *only* the session data for the specified role.
 * The other role's session remains completely untouched.
 */
export function clearSession(role?: ActiveRole): void {
  const r = role ?? getActiveRole()
  localStorage.removeItem(getStorageKey('token', r))
  localStorage.removeItem(getStorageKey('user', r))
}

// ---- Helpers --------------------------------------------------------------

/**
 * Map a User's role enum to the ActiveRole key used for storage.
 */
export function roleFromUser(user: User): ActiveRole {
  return user.role === 'MENTOR' ? 'mentor' : 'student'
}
