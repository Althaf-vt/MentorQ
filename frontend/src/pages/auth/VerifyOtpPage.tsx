import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, ShieldCheck, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import { useSendOtpMutation, useVerifyOtpMutation } from '@/store/api/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'
import { useToast } from '@/context/ToastContext'

export const VerifyOtpPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { showToast } = useToast()

  const initialEmail = location.state?.email || ''
  const expectedRole = location.state?.expectedRole as 'MENTOR' | 'STUDENT' | undefined
  const [email, setEmail] = useState<string>(initialEmail)
  const [step, setStep] = useState<'enter-email' | 'enter-otp'>(initialEmail ? 'enter-otp' : 'enter-email')

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(60)
  const [canResend, setCanResend] = useState<boolean>(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [sendOtp, { isLoading: isSending }] = useSendOtpMutation()
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation()

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'enter-otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    } else if (countdown === 0) {
      setCanResend(true)
    }
    return () => clearTimeout(timer)
  }, [step, countdown])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    if (!email) return
    try {
      await sendOtp({ email }).unwrap()
      setStep('enter-otp')
      setCountdown(60)
      setCanResend(false)
      showToast('Verification code sent successfully!', 'success')
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      const msg = error.data?.message || 'Failed to send OTP code.'
      setErrorMessage(msg)
      showToast(msg, 'error')
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
      const res = await verifyOtp({ email, otp: code, expectedRole }).unwrap()
      if (res.access_token && res.user) {
        dispatch(setCredentials({ token: res.access_token, user: res.user }))
        showToast('Email verified successfully! Welcome to MentorQ.', 'success')
        navigate(res.user.role === 'MENTOR' ? '/mentor/dashboard' : '/dashboard')
      } else {
        showToast('Email verified! Please log in.', 'success')
        navigate('/login')
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      const msg = error.data?.message || 'Invalid or expired OTP code.'
      setErrorMessage(msg)
      showToast(msg, 'error')
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    try {
      await sendOtp({ email }).unwrap()
      setCountdown(60)
      setCanResend(false)
      setErrorMessage(null)
      showToast('A new code has been sent!', 'success')
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      const msg = error.data?.message || 'Could not resend OTP.'
      setErrorMessage(msg)
      showToast(msg, 'error')
    }
  }


  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col justify-between">
      <header className="w-full py-6 px-6 flex items-center justify-between border-b border-[#e1e3e0]/50 bg-white">
        <Link to={expectedRole === 'MENTOR' ? '/mentor/login' : '/login'} className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-xl text-[#303331]">
            Mentor<span className="text-primary">Q</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#e1e3e0] shadow-sm p-8">
          {step === 'enter-email' && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="font-headline text-2xl font-bold text-[#303331] mb-2">Verify your email</h2>
              <p className="font-body text-sm text-[#5d605e] mb-6">
                Enter your email address and we will send a 6-digit verification code to activate your account.
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
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
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {step === 'enter-otp' && (
            <div>
              <button
                onClick={() => setStep('enter-email')}
                className="inline-flex items-center gap-1.5 text-xs text-[#5d605e] hover:text-[#303331] mb-4 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change email</span>
              </button>

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
                <div className="flex justify-between gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      ref={(el) => {
                        inputRefs.current[idx] = el
                      }}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-12 h-12 text-center rounded-xl border border-[#b0b2b0]/50 bg-white text-lg font-bold text-[#303331] focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-[#5d605e]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'You can now resend code'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!canResend}
                    onClick={handleResend}
                    className={`font-semibold uppercase tracking-wider ${
                      canResend
                        ? 'text-primary hover:underline cursor-pointer'
                        : 'text-[#b0b2b0] cursor-not-allowed'
                    }`}
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full h-12 rounded-full bg-primary hover:bg-primary-dim text-white font-medium text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isVerifying ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify and Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full py-6 text-center text-xs text-[#797b79] border-t border-[#e1e3e0]/50 bg-white">
        <span>&copy; 2025 MentorQ Platform. All rights reserved.</span>
      </footer>
    </div>
  )
}


