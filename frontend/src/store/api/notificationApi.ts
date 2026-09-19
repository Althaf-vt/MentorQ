import { baseApi } from './baseApi'
import type { Notification } from '@/types/operational.types'

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserNotifications: builder.query<Notification[], void>({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),

    markNotificationAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically update the cached notification list
        const patchResult = dispatch(
          notificationApi.util.updateQueryData('getUserNotifications', undefined, (draft) => {
            const notification = draft.find((n) => n._id === id)
            if (notification) {
              notification.isRead = true
            }
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),

    markAllNotificationsAsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        // Optimistically mark every notification as read
        const patchResult = dispatch(
          notificationApi.util.updateQueryData('getUserNotifications', undefined, (draft) => {
            draft.forEach((n) => {
              n.isRead = true
            })
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

export const {
  useGetUserNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} = notificationApi

