import { baseApi } from './baseApi'
import type { Message } from '@/types/operational.types'

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessionMessages: builder.query<Message[], string>({
      query: (sessionId) => `/chat/session/${sessionId}`,
      providesTags: ['Ticket'],
    }),

    sendMessage: builder.mutation<
      Message,
      { sessionId: string; message_text: string }
    >({
      query: ({ sessionId, message_text }) => ({
        url: `/chat/session/${sessionId}`,
        method: 'POST',
        body: { message_text },
      }),
      invalidatesTags: ['Ticket'],
    }),

    markChatAsRead: builder.mutation<{ success: boolean }, string>({
      query: (sessionId) => ({
        url: `/chat/session/${sessionId}/read`,
        method: 'POST',
      }),
    }),
  }),
})

export const {
  useGetSessionMessagesQuery,
  useSendMessageMutation,
  useMarkChatAsReadMutation,
} = chatApi
