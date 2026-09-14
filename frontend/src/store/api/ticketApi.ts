import { baseApi } from './baseApi'
import type { Ticket } from '@/types/operational.types'

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTicket: builder.mutation<
      Ticket,
      {
        topic: string
        description: string
        requested_minutes?: number
        tags?: string[]
        mentor_id?: string
      }
    >({
      query: (body) => ({
        url: '/tickets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Ticket', 'Queue'],
    }),

    getStudentTickets: builder.query<Ticket[], void>({
      query: () => '/tickets/student',
      providesTags: ['Ticket'],
    }),

    getMentorTickets: builder.query<Ticket[], void>({
      query: () => '/tickets/mentor',
      providesTags: ['Ticket'],
    }),

    getTicketById: builder.query<Ticket, string>({
      query: (id) => `/tickets/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Ticket', id }],
    }),

    updateTicketStatus: builder.mutation<
      Ticket,
      { id: string; status: string; feedback_note?: string }
    >({
      query: ({ id, status, feedback_note }) => ({
        url: `/tickets/${id}/status`,
        method: 'PATCH',
        body: { status, feedback_note },
      }),
      invalidatesTags: ['Ticket', 'Queue'],
    }),

    getQueuePosition: builder.query<{ position: number }, string>({
      query: (id) => `/tickets/${id}/queue-position`,
      providesTags: ['Queue'],
    }),
  }),
})

export const {
  useCreateTicketMutation,
  useGetStudentTicketsQuery,
  useGetMentorTicketsQuery,
  useGetTicketByIdQuery,
  useUpdateTicketStatusMutation,
  useGetQueuePositionQuery,
} = ticketApi
