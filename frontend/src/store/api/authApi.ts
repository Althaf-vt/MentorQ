import { baseApi } from './baseApi'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  UserRole,
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
      AuthResponse & { message: string },
      { email: string; otp: string; expectedRole?: UserRole }
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
        const { fullName, avatarUrl, socialLinks, ...rest } = updateData
        return {
          url: '/users/me',
          method: 'PATCH',
          body: {
            ...rest,
            ...(fullName ? { full_name: fullName } : {}),
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
            ...(socialLinks ? { social_links: socialLinks } : {}),
          },
        }
      },
      invalidatesTags: ['User'],
    }),

    // ---- Avatar Management -------------------------------------------------
    uploadAvatar: builder.mutation<{ status: string; data: User }, File>({
      query: (file) => {
        const formData = new FormData()
        formData.append('avatar', file)
        return {
          url: '/users/me/avatar',
          method: 'POST',
          body: formData,
          // Let the browser set Content-Type with the multipart boundary
          formData: true,
        }
      },
      invalidatesTags: ['User'],
    }),

    deleteAvatar: builder.mutation<{ status: string; data: User }, void>({
      query: () => ({
        url: '/users/me/avatar',
        method: 'DELETE',
      }),
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
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} = authApi

