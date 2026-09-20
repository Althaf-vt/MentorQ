import { baseApi } from './baseApi'
import type { User } from '@/types/auth.types'
import { updateUser } from '../slices/authSlice'

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
    getFavoriteMentors: builder.query<{ status: string; data: User[] }, void>({
      query: () => '/users/me/favorites',
      providesTags: ['FavoriteMentors'],
    }),
    addFavoriteMentor: builder.mutation<{ status: string; data: User }, string>({
      query: (mentorId) => ({
        url: `/users/favorites/${mentorId}`,
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Directory', 'FavoriteMentors'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(updateUser(data.data))
        } catch { /* handled by component */ }
      },
    }),
    removeFavoriteMentor: builder.mutation<{ status: string; data: User }, string>({
      query: (mentorId) => ({
        url: `/users/favorites/${mentorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User', 'Directory', 'FavoriteMentors'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(updateUser(data.data))
        } catch { /* handled by component */ }
      },
    }),
  }),
})

export const {
  useGetMentorsDirectoryQuery,
  useGetFavoriteMentorsQuery,
  useAddFavoriteMentorMutation,
  useRemoveFavoriteMentorMutation,
} = directoryApi
