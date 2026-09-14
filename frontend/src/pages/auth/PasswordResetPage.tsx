import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Mail, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, Clock } from 'lucide-react'
import { useSendOtpMutation, useVerifyOtpMutation } from '@/store/api/authApi'

export const PasswordResetPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(60)
  const [canResend, setCanResend] = useState<boolean>(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
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

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const updated = [...otpDigits]
    updated[index] = value.slice(-1)
    setOtpDigits(updated)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    const code = otpDigits.join('')
    if (code.length !== 6) {
      setErrorMessage('Please enter the 6-digit code.')
      return
    }
    try {
      await verifyOtp({ email, otp: code }).unwrap()
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
    <div className="min-h-screen bg-[#faf9f7] flex flex-col justify-between">
      <header className="w-full py-6 px-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-xl text-[#303331]">Mentor<span className="text-primary">Q</span></span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#e1e3e0] shadow-sm p-8">
          {step === 'email' && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="font-headline text-2xl font-bold text-[#303331] mb-2">Reset password</h2>
              <p className="font-body text-sm text-[#5d605e] mb-6">
                Enter your email address and we will send a 6-digit verification code.
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase text-[#303331] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-11 px-4 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm text-[#303331] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full h-12 rounded-full bg-primary hover:bg-primary-dim text-white font-medium text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Send Verification Code</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </div>
          )}
          {step === 'otp' && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="font-headline text-2xl font-bold text-[#303331] mb-2">Check your email</h2>
              <p className="font-body text-sm text-[#5d605e] mb-6">
                We sent a 6-digit code to <span className="font-semibold text-[#303331]">{email}</span>
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-between gap-1 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-13 text-center font-headline text-xl font-bold rounded-xl border border-[#b0b2b0]/50 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-[#5d605e]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{canResend ? 'Code expired' : `Resend in 0:${countdown.toString().padStart(2, '0')}`}</span>
                  </div>
                  <button
                    type="button"
                    disabled={!canResend}
                    onClick={handleResend}
                    className={`font-medium ${canResend ? 'text-primary hover:underline cursor-pointer' : 'text-[#b0b2b0] cursor-not-allowed'}`}
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full h-12 rounded-full bg-primary hover:bg-primary-dim text-white font-medium text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isVerifying ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Verify Code</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="font-headline text-2xl font-bold text-[#303331] mb-2">Code Verified!</h2>
              <p className="font-body text-sm text-[#5d605e] mb-6">
                Your email has been verified. You can now securely log back in.
              </p>
              <Link
                to="/login"
                className="w-full h-12 rounded-full bg-primary hover:bg-primary-dim text-white font-medium text-sm shadow-md flex items-center justify-center gap-2"
              >
                Continue to Login
              </Link>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[#e1e3e0] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#5d605e] hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </main>
      <footer className="w-full py-6 px-6 text-center text-xs text-[#797b79]">
        <span>&copy; 2025 MentorQ. All rights reserved.</span>
      </footer>
    </div>
  )
}
