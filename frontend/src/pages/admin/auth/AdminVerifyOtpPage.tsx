import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminVerifyOtpMutation, useAdminForgotPasswordMutation } from '@/store/api/adminAuthApi'
import { ArrowLeft, Clock } from 'lucide-react'
import { Button, OtpInput } from '@/design-system'

export function AdminVerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  const [verifyOtp, { isLoading, error }] = useAdminVerifyOtpMutation()
  const [resendOtp, { isLoading: isResending }] = useAdminForgotPasswordMutation()

  const [otp, setOtp] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    if (otp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code.')
      return
    }

    try {
      const response = await verifyOtp({ email, otp }).unwrap()
      navigate('/admin/reset-password', { state: { token: response.resetToken } })
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string } }
      setErrorMessage(errorObj?.data?.message || 'Invalid verification code.')
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
        <h2 className="text-xl font-headline font-bold text-[var(--mqds-text,#f4f7f2)]">
          Verify Admin OTP
        </h2>
        <p className="mt-1 text-xs font-mono text-[var(--mqds-muted,#cbc6df)]">
          Enter the 6-digit verification code sent to <br />
          <span className="font-semibold text-white">{email}</span>
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        {(error || errorMessage) && (
          <div className="p-3 rounded-xl bg-[var(--mqds-danger,#9b253b)]/30 text-[var(--mqds-error,#ffb4bd)] text-xs border border-[var(--mqds-danger-border,#b45965)]">
            {errorMessage || (error && 'data' in error ? ((error.data as { message?: string }).message || 'Invalid code.') : 'Invalid verification code.')}
          </div>
        )}

        <OtpInput
          label="6-Digit Admin Verification Code"
          value={otp}
          onValueChange={setOtp}
          error={errorMessage || undefined}
        />

        <div className="flex items-center justify-between text-xs font-mono text-[var(--mqds-muted)]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {countdown > 0 ? `Resend in ${countdown}s` : 'You can now resend'}
            </span>
          </div>

          <Button
            type="button"
            variant="text"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className="!p-0 !min-h-0 text-xs font-semibold text-[var(--mqds-accent,#c5baff)] disabled:opacity-40"
          >
            {isResending ? 'Sending...' : 'Resend Code'}
          </Button>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || otp.length !== 6}
          className="w-full justify-center !min-h-[44px]"
        >
          <span>{isLoading ? 'Verifying...' : 'Verify Code & Proceed'}</span>
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
