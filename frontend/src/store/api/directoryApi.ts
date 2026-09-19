import { baseApi } from './baseApi'
import type { User } from '@/types/auth.types'

export interface DirectoryMentor extends User {
  mentorProfile: {
    _id: string
    user_id: string
    expertise_tags: string[]
    daily_available_minutes: number
    remaining_minutes_today: number
    rating_avg: number
    operating_hours: {
      start: string
      end: string
      timezone: string
    }
  }
}

export const directoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMentorsDirectory: builder.query<{ status: string; data: DirectoryMentor[] }, void>({
      query: () => '/users/mentors/directory',
      providesTags: ['Directory'],
    }),
    addFavoriteMentor: builder.mutation<{ status: string; data: User }, string>({
      query: (mentorId) => ({
        url: `/users/favorites/${mentorId}`,
        method: 'POST',
      }),
      // We invalidate User so the current user's favoriteMentors array updates
      invalidatesTags: ['User'],
    }),
    removeFavoriteMentor: builder.mutation<{ status: string; data: User }, string>({
      query: (mentorId) => ({
        url: `/users/favorites/${mentorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useGetMentorsDirectoryQuery,
  useAddFavoriteMentorMutation,
  useRemoveFavoriteMentorMutation,
} = directoryApi
