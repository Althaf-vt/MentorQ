import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, ArrowLeft, CheckCircle, ShieldCheck, Clock } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  OtpInput,
} from '@/design-system'
import { useSendOtpMutation, useVerifyOtpMutation } from '@/store/api/authApi'

export const PasswordResetPage: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(60)
  const [canResend, setCanResend] = useState<boolean>(false)

  const [sendOtp, { isLoading: isSending }] = useSendOtpMutation()
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation()

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    } else if (countdown === 0) {
      setCanResend(true)
    }
    return () => clearTimeout(timer)
  }, [step, countdown])

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    if (!email) return
    try {
      await sendOtp({ email }).unwrap()
      setStep('otp')
      setCountdown(60)
      setCanResend(false)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      setErrorMessage(error.data?.message || 'Failed to send OTP code.')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    if (otp.length !== 6) {
      setErrorMessage('Please enter the 6-digit code.')
      return
    }
    try {
      await verifyOtp({ email, otp }).unwrap()
      setStep('success')
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      setErrorMessage(error.data?.message || 'Invalid or expired OTP code.')
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    try {
      await sendOtp({ email }).unwrap()
      setCountdown(60)
      setCanResend(false)
      setErrorMessage(null)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      setErrorMessage(error.data?.message || 'Could not resend OTP.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--mqds-canvas,#faf9f7)] flex flex-col justify-between">
      <header className="w-full py-6 px-6 flex items-center justify-between border-b border-[var(--mqds-border-subtle,#e1e3e0)] bg-[var(--mqds-surface,#ffffff)]/80 backdrop-blur-xs">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--mqds-primary)] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-xl text-[var(--mqds-text)]">
            Mentor<span className="text-[var(--mqds-primary)]">Q</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card variant="paper" className="w-full max-w-md p-8 sm:p-10 shadow-lg border border-[var(--mqds-paper-border)]">
          {step === 'email' && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--mqds-hover)] text-[var(--mqds-primary)] flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="font-headline text-2xl font-bold text-[var(--mqds-text)] mb-2">Reset password</h2>
              <p className="font-body text-sm text-[var(--mqds-muted)] mb-6">
                Enter your email address and we will send a 6-digit verification code.
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--mqds-warning-surface)] border border-[var(--mqds-danger-border)] text-xs text-[var(--mqds-danger)]">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSendEmail} className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSending}
                  className="w-full !min-h-[46px] justify-center mt-2"
                >
                  <span>{isSending ? 'Sending Code...' : 'Send Verification Code'}</span>
                  <span aria-hidden="true">&rarr;</span>
                </Button>
              </form>
            </div>
          )}

          {step === 'otp' && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--mqds-hover)] text-[var(--mqds-primary)] flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="font-headline text-2xl font-bold text-[var(--mqds-text)] mb-2">Check your email</h2>
              <p className="font-body text-sm text-[var(--mqds-muted)] mb-6">
                We sent a 6-digit code to <span className="font-semibold text-[var(--mqds-text)]">{email}</span>
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--mqds-warning-surface)] border border-[var(--mqds-danger-border)] text-xs text-[var(--mqds-danger)]">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <OtpInput
                  label="6-Digit Verification Code"
                  value={otp}
                  onValueChange={setOtp}
                  error={errorMessage || undefined}
                />

                <div className="flex items-center justify-between text-xs text-[var(--mqds-muted)]">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{canResend ? 'Code expired' : `Resend in 0:${countdown.toString().padStart(2, '0')}`}</span>
                  </div>
                  <Button
                    type="button"
                    variant="text"
                    disabled={!canResend}
                    onClick={handleResend}
                    className="!p-0 !min-h-0 text-xs font-semibold"
                  >
                    Resend Code
                  </Button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isVerifying}
                  className="w-full !min-h-[46px] justify-center"
                >
                  <span>{isVerifying ? 'Verifying...' : 'Verify Code'}</span>
                  <span aria-hidden="true">&rarr;</span>
                </Button>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[var(--mqds-success-surface)] text-[var(--mqds-success-text)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="font-headline text-2xl font-bold text-[var(--mqds-text)] mb-2">Code Verified!</h2>
              <p className="font-body text-sm text-[var(--mqds-muted)] mb-6">
                Your email has been verified. You can now securely log back in.
              </p>
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate('/login')}
                className="w-full !min-h-[46px] justify-center"
              >
                Continue to Login
              </Button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--mqds-border-subtle)] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--mqds-muted)] hover:text-[var(--mqds-primary)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </Card>
      </main>

      <footer className="w-full py-6 px-6 text-center text-xs text-[var(--mqds-muted)] font-mono border-t border-[var(--mqds-border-subtle,#e1e3e0)]/50">
        <span>&copy; 2025 MentorQ Platform. All rights reserved.</span>
      </footer>
    </div>
  )
}
