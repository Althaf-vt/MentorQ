import { baseApi } from './baseApi'
import type { Session } from '@/types/operational.types'

export const sessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startSession: builder.mutation<Session, string>({
      query: (ticketId) => ({
        url: `/sessions/start/${ticketId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Ticket', 'Queue'],
    }),

    endSession: builder.mutation<Session, { id: string; resolution_notes?: string }>({
      query: ({ id, resolution_notes }) => ({
        url: `/sessions/${id}/end`,
        method: 'POST',
        body: { resolution_notes },
      }),
      invalidatesTags: ['Ticket', 'Queue'],
    }),

    getActiveMentorSession: builder.query<Session | null, void>({
      query: () => '/sessions/active/mentor',
      providesTags: ['Ticket'],
    }),

    getActiveStudentSession: builder.query<Session | null, void>({
      query: () => '/sessions/active/student',
      providesTags: ['Ticket'],
    }),

    getSessionByTicketId: builder.query<Session | null, string>({
      query: (ticketId) => `/sessions/ticket/${ticketId}`,
      providesTags: ['Ticket'],
    }),
  }),
})

export const {
  useStartSessionMutation,
  useEndSessionMutation,
  useGetActiveMentorSessionQuery,
  useGetActiveStudentSessionQuery,
  useGetSessionByTicketIdQuery,
} = sessionApi
