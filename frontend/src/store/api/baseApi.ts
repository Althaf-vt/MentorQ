import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { getToken, setToken, clearSession, getActiveRole } from '@/lib/roleContext'
import { logout } from '@/store/slices/authSlice'

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3133/api/v1'

// ---------------------------------------------------------------------------
// Raw base query — attaches the role-namespaced Bearer token
// ---------------------------------------------------------------------------
const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    const token = getToken() // auto-resolves role from current URL
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// ---------------------------------------------------------------------------
// Wrapper with automatic 401 → refresh → retry logic
// ---------------------------------------------------------------------------
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    // Attempt to refresh the token
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    )

    if (refreshResult.data) {
      const data = refreshResult.data as { access_token: string }
      const role = getActiveRole()

      // Persist the fresh token under the correct namespace
      setToken(data.access_token, role)

      // Retry the original request with the new token
      result = await rawBaseQuery(args, api, extraOptions)
    } else {
      // Refresh failed — clear session for the current role only
      const role = getActiveRole()
      clearSession(role)
      api.dispatch(logout(role))
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Mentor', 'Ticket', 'Queue', 'Notification', 'Review', 'Directory'],
  endpoints: () => ({}),
})
