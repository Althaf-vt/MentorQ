import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminResetPasswordMutation } from '@/store/api/adminAuthApi'
import { Loader2 } from 'lucide-react'

const adminResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type AdminResetPasswordFormData = z.infer<typeof adminResetPasswordSchema>

export function AdminResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = location.state?.token

  const [resetPassword, { isLoading, error }] = useAdminResetPasswordMutation()

  useEffect(() => {
    if (!token) {
      navigate('/admin/forgot-password', { replace: true })
    }
  }, [token, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminResetPasswordFormData>({
    resolver: zodResolver(adminResetPasswordSchema),
  })

  const onSubmit = async (data: AdminResetPasswordFormData) => {
    try {
      await resetPassword({ token, newPassword: data.newPassword }).unwrap()
      navigate('/admin/login', { replace: true })
    } catch (err) {
      console.error('Failed to reset password', err)
    }
  }

  if (!token) return null

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Create new password</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Your new password must be different from previous used passwords.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="p-3 rounded-xl bg-red-900/50 text-red-200 text-sm border border-red-800">
            {'data' in error ? (error.data as any).message : 'Failed to reset password.'}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300">New Password</label>
          <div className="mt-1">
            <input
              type="password"
              {...register('newPassword')}
              className="block w-full rounded-xl bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm transition-colors py-2 px-3"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.newPassword.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300">Confirm Password</label>
          <div className="mt-1">
            <input
              type="password"
              {...register('confirmPassword')}
              className="block w-full rounded-xl bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm transition-colors py-2 px-3"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-zinc-900 bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}
