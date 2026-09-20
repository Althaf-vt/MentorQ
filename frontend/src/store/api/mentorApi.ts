import { baseApi } from './baseApi'
import type { MentorProfile, UpdateMentorProfileRequest } from '@/types/auth.types'

export const mentorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyMentorProfile: builder.query<{ status: string; data: MentorProfile }, void>({
      query: () => '/mentors/me',
      providesTags: ['Mentor'],
    }),
    updateMyMentorProfile: builder.mutation<
      { status: string; data: MentorProfile },
      UpdateMentorProfileRequest
    >({
      query: (updateData) => ({
        url: '/mentors/me',
        method: 'PATCH',
        body: updateData,
      }),
      invalidatesTags: ['Mentor'],
    }),
    getOnlineMentors: builder.query<{ status: string; data: MentorProfile[] }, void>({
      query: () => '/mentors/online',
      providesTags: ['Mentor'],
    }),
  }),
})

export const {
  useGetMyMentorProfileQuery,
  useUpdateMyMentorProfileMutation,
  useGetOnlineMentorsQuery,
} = mentorApi
