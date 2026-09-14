import { baseApi } from './baseApi'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/types/auth.types'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    sendOtp: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/otp/send',
        method: 'POST',
        body,
      }),
    }),
    verifyOtp: builder.mutation<
      { message: string },
      { email: string; otp: string }
    >({
      query: (body) => ({
        url: '/auth/otp/verify',
        method: 'POST',
        body,
      }),
    }),
    getMe: builder.query<{ status: string; data: User }, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    updateMe: builder.mutation<
      { status: string; data: User },
      Partial<User> & Record<string, unknown>
    >({
      query: (updateData) => {
        const { fullName, avatarUrl, ...rest } = updateData
        return {
          url: '/users/me',
          method: 'PATCH',
          body: {
            ...rest,
            ...(fullName ? { full_name: fullName } : {}),
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          },
        }
      },
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetMeQuery,
  useUpdateMeMutation,
} = authApi
