import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminForgotPasswordMutation } from '@/store/api/adminAuthApi'
import { Loader2, ArrowLeft } from 'lucide-react'

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
        <h2 className="text-xl font-semibold text-white">Reset your password</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Enter your email address and we'll send you a verification code.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="p-3 rounded-xl bg-red-900/50 text-red-200 text-sm border border-red-800">
            {'data' in error ? (error.data as any).message : 'Failed to process request.'}
          </div>
        )}

        {isSuccess && (
          <div className="p-3 rounded-xl bg-emerald-900/50 text-emerald-200 text-sm border border-emerald-800">
            If an account exists, an OTP has been sent.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300">Email address</label>
          <div className="mt-1">
            <input
              type="email"
              {...register('email')}
              className="block w-full rounded-xl bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm transition-colors py-2 px-3"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-zinc-900 bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send verification code'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </button>
        </div>
      </form>
    </div>
  )
}
