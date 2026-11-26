import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminForgotPasswordMutation } from '@/store/api/adminAuthApi'
import { ArrowLeft } from 'lucide-react'
import { Button, Input } from '@/design-system'

const adminForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type AdminForgotPasswordFormData = z.infer<typeof adminForgotPasswordSchema>

export function AdminForgotPasswordPage() {
  const navigate = useNavigate()
  const [forgotPassword, { isLoading, error, isSuccess }] = useAdminForgotPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminForgotPasswordFormData>({
    resolver: zodResolver(adminForgotPasswordSchema),
  })

  const onSubmit = async (data: AdminForgotPasswordFormData) => {
    try {
      await forgotPassword(data).unwrap()
      navigate('/admin/verify-otp', { state: { email: data.email } })
    } catch (err) {
      console.error('Failed to send OTP', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-headline font-bold text-[var(--mqds-text,#f4f7f2)]">
          Reset Admin Password
        </h2>
        <p className="mt-1 text-xs font-mono text-[var(--mqds-muted,#cbc6df)]">
          Enter your registered admin email address to receive an OTP code
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="p-3 rounded-xl bg-[var(--mqds-danger,#9b253b)]/30 text-[var(--mqds-error,#ffb4bd)] text-xs border border-[var(--mqds-danger-border,#b45965)]">
            {'data' in error ? ((error.data as { message?: string }).message || 'Failed to process request.') : 'Failed to process request.'}
          </div>
        )}

        {isSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 text-emerald-300 text-xs border border-emerald-800">
            If an admin account exists, a verification code has been dispatched.
          </div>
        )}

        <Input
          label="Admin Email Address"
          type="email"
          placeholder="admin@mentorq.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="w-full justify-center !min-h-[44px] mt-2"
        >
          <span>{isLoading ? 'Dispatching Code...' : 'Send Verification Code'}</span>
          <span aria-hidden="true">&rarr;</span>
        </Button>

        <div className="text-center pt-2">
          <Button
            type="button"
            variant="text"
            onClick={() => navigate('/admin/login')}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--mqds-muted)] hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to admin login</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
