import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, User } from '@/types/auth.types'

const storedToken = localStorage.getItem('token')
const storedUser = localStorage.getItem('user')

let parsedUser: User | null = null
if (storedUser) {
  try {
    parsedUser = JSON.parse(storedUser)
  } catch {
    parsedUser = null
  }
}

const initialState: AuthState = {
  token: storedToken || null,
  user: parsedUser,
  isAuthenticated: Boolean(storedToken),
  isLoading: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: User }>,
    ) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.isAuthenticated = true
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem('user', JSON.stringify(state.user))
      }
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})

export const { setCredentials, updateUser, logout } = authSlice.actions
export default authSlice.reducer
