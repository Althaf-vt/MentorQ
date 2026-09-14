import { baseApi } from './baseApi'
import type { Review } from '@/types/operational.types'

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createReview: builder.mutation<
      Review,
      { sessionId: string; rating: number; feedbackText: string }
    >({
      query: (body) => ({
        url: '/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Review'],
    }),

    getMentorReviews: builder.query<Review[], string>({
      query: (mentorId) => `/reviews/mentor/${mentorId}`,
      providesTags: ['Review'],
    }),

    getSessionReview: builder.query<Review | null, string>({
      query: (sessionId) => `/reviews/session/${sessionId}`,
      providesTags: ['Review'],
    }),
  }),
})

export const {
  useCreateReviewMutation,
  useGetMentorReviewsQuery,
  useGetSessionReviewQuery,
} = reviewApi
