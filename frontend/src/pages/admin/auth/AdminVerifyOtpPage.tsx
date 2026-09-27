import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminVerifyOtpMutation, useAdminForgotPasswordMutation } from '@/store/api/adminAuthApi'
import { Loader2, ArrowLeft } from 'lucide-react'

const adminVerifyOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
})

type AdminVerifyOtpFormData = z.infer<typeof adminVerifyOtpSchema>

export function AdminVerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  const [verifyOtp, { isLoading, error }] = useAdminVerifyOtpMutation()
  const [resendOtp, { isLoading: isResending }] = useAdminForgotPasswordMutation()

  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (!email) {
      navigate('/admin/forgot-password', { replace: true })
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [email, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminVerifyOtpFormData>({
    resolver: zodResolver(adminVerifyOtpSchema),
  })

  const onSubmit = async (data: AdminVerifyOtpFormData) => {
    try {
      const response = await verifyOtp({ email, otp: data.otp }).unwrap()
      navigate('/admin/reset-password', { state: { token: response.resetToken } })
    } catch (err) {
      console.error('Failed to verify OTP', err)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    try {
      await resendOtp({ email }).unwrap()
      setCountdown(60)
    } catch (err) {
      console.error('Failed to resend OTP', err)
    }
  }

  if (!email) return null

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Check your email</h2>
        <p className="mt-2 text-sm text-zinc-400">
          We've sent a 6-digit verification code to <br/>
          <span className="font-medium text-white">{email}</span>
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="p-3 rounded-xl bg-red-900/50 text-red-200 text-sm border border-red-800">
            {'data' in error ? (error.data as any).message : 'Invalid verification code.'}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300">Verification Code</label>
          <div className="mt-1">
            <input
              type="text"
              maxLength={6}
              {...register('otp')}
              className="block w-full rounded-xl bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm transition-colors py-2 px-3 text-center tracking-widest text-lg"
              placeholder="000000"
            />
            {errors.otp && (
              <p className="mt-1 text-sm text-red-400 text-center">{errors.otp.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-zinc-900 bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
        </button>

        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className="text-sm font-medium text-white hover:text-zinc-300 transition-colors disabled:text-zinc-500 disabled:hover:text-zinc-500"
          >
            {isResending ? (
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            ) : null}
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </button>
        </div>
      </form>
    </div>
  )
}
