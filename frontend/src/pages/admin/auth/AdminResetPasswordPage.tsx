import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminResetPasswordMutation } from '@/store/api/adminAuthApi'
import { Button, Input } from '@/design-system'

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
        <h2 className="text-xl font-headline font-bold text-[var(--mqds-text,#f4f7f2)]">
          Create New Password
        </h2>
        <p className="mt-1 text-xs font-mono text-[var(--mqds-muted,#cbc6df)]">
          Set a secure administrative password with letters and numbers
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="p-3 rounded-xl bg-[var(--mqds-danger,#9b253b)]/30 text-[var(--mqds-error,#ffb4bd)] text-xs border border-[var(--mqds-danger-border,#b45965)]">
            {'data' in error ? ((error.data as { message?: string }).message || 'Failed to reset password.') : 'Failed to reset password.'}
          </div>
        )}

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          {...register('newPassword')}
          error={errors.newPassword?.message}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="w-full justify-center !min-h-[44px] mt-2"
        >
          <span>{isLoading ? 'Resetting Password...' : 'Reset Password'}</span>
          <span aria-hidden="true">&rarr;</span>
        </Button>
      </form>
    </div>
  )
}
