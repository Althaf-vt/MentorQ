import { baseApi } from './baseApi'
import type {
  AdminAuthResponse,
  AdminLoginRequest,
  AdminForgotPasswordRequest,
  AdminVerifyOtpRequest,
  AdminVerifyOtpResponse,
  AdminResetPasswordRequest,
} from '@/types/adminAuth.types'

export const adminAuthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    adminLogin: builder.mutation<AdminAuthResponse, AdminLoginRequest>({
      query: (credentials) => ({
        url: '/admin/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    adminForgotPassword: builder.mutation<{ message: string }, AdminForgotPasswordRequest>({
      query: (data) => ({
        url: '/admin/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    adminVerifyOtp: builder.mutation<AdminVerifyOtpResponse, AdminVerifyOtpRequest>({
      query: (data) => ({
        url: '/admin/auth/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),
    adminResetPassword: builder.mutation<{ message: string }, AdminResetPasswordRequest>({
      query: (data) => ({
        url: '/admin/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useAdminLoginMutation,
  useAdminForgotPasswordMutation,
  useAdminVerifyOtpMutation,
  useAdminResetPasswordMutation,
} = adminAuthApi
