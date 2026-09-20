import { baseApi } from './baseApi'
import type {
  PlatformSettings,
  UpdatePlatformSettingsRequest,
  AdminMetrics,
  AdminUserListResponse,
  UpdateUserStatusRequest,
  AdminUserListItem,
} from '@/types/admin.types'

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMetrics: builder.query<AdminMetrics, void>({
      query: () => '/admin/metrics',
      providesTags: ['User', 'Session', 'Ticket'],
    }),
    
    getSettings: builder.query<PlatformSettings, void>({
      query: () => '/admin/settings',
      providesTags: ['Settings'],
    }),
    
    updateSettings: builder.mutation<PlatformSettings, UpdatePlatformSettingsRequest>({
      query: (data) => ({
        url: '/admin/settings',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),
    
    getUsers: builder.query<AdminUserListResponse, { page?: number; limit?: number; role?: string }>({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'PARTIAL-LIST' },
            ]
          : [{ type: 'User', id: 'PARTIAL-LIST' }],
    }),
    
    updateUserStatus: builder.mutation<AdminUserListItem, UpdateUserStatusRequest>({
      query: ({ id, status }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'PARTIAL-LIST' }],
    }),
  }),
})

export const {
  useGetMetricsQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetUsersQuery,
  useUpdateUserStatusMutation,
} = adminApi
