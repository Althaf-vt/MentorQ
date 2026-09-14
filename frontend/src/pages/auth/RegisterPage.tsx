import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, AlertCircle, ArrowRight, GraduationCap, Briefcase } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRegisterMutation } from '@/store/api/authApi'
import { useToast } from '@/context/ToastContext'

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms & Privacy Policy',
  }),
  role: z.enum(['STUDENT', 'MENTOR'] as const),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const navigate = useNavigate()
  const { showToast } = useToast()
  const [register, { isLoading }] = useRegisterMutation()

  const {
    register: registerField,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      agreeTerms: false,
      role: 'STUDENT',
    },
  })

  const watchRole = watch('role')

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMessage(null)
    try {
      await register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
      }).unwrap()
      showToast('Account created! Please verify your email with the OTP sent.', 'success')
      navigate('/verify-otp', { state: { email: data.email } })
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      const msg = error.data?.message || 'Registration failed.'
      setErrorMessage(msg)
      showToast(msg, 'error')
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] flex flex-col lg:flex-row">
      <section className="hidden lg:flex lg:w-1/2 bg-[#f4f4f1] border-r border-[#b0b2b0]/30 p-12 flex-col justify-between">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-2xl text-[#303331]">
            Mentor<span className="text-primary">Q</span>
          </span>
        </Link>
        <div className="my-auto py-8 max-w-lg">
          <h1 className="font-headline text-4xl font-bold text-[#303331] leading-tight mb-6">
            Get 1-on-1 mentorship whenever you are stuck.
          </h1>
        </div>
        <div className="text-xs text-[#797b79]">
          <span>&copy; 2025 MentorQ Platform</span>
        </div>
      </section>
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="font-headline text-3xl font-bold text-[#303331] mb-2">Create an account</h2>
          <p className="font-body text-sm text-[#5d605e] mb-6">Choose your role and get started.</p>

          <div className="bg-[#e8e8e6] p-1 rounded-xl flex gap-1 mb-6">
            <button
              type="button"
              onClick={() => setValue('role', 'STUDENT')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer ${
                watchRole === 'STUDENT' ? 'bg-primary text-white shadow-sm' : 'text-[#5d605e]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student / Mentee</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'MENTOR')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer ${
                watchRole === 'MENTOR' ? 'bg-primary text-white shadow-sm' : 'text-[#5d605e]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Mentor / Guide</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-label font-medium uppercase text-[#303331] mb-1">Full Name</label>
              <input
                type="text"
                {...registerField('fullName')}
                placeholder="Alex Chen"
                className="w-full h-11 px-4 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm text-[#303331] focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1 text-left">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-label font-medium uppercase text-[#303331] mb-1">Email</label>
              <input
                type="email"
                {...registerField('email')}
                placeholder="alex@company.com"
                className="w-full h-11 px-4 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm text-[#303331] focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 text-left">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-label font-medium uppercase text-[#303331] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...registerField('password')}
                  placeholder="••••••••"
                  className="w-full h-11 pl-4 pr-11 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#797b79]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 text-left">{errors.password.message}</p>}
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-center gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  {...registerField('agreeTerms')}
                  className="rounded text-primary focus:ring-primary/30"
                />
                <label htmlFor="terms" className="text-xs text-[#5d605e]">
                  I agree to the Terms & Privacy Policy
                </label>
              </div>
              {errors.agreeTerms && <p className="text-red-500 text-xs mt-1 text-left">{errors.agreeTerms.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary-dim text-white font-medium text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e1e3e0]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#faf9f7] px-2 text-[#797b79]">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3133/api/v1'
              window.location.href = `${apiBase}/auth/google`
            }}
            className="w-full h-11 rounded-full border border-[#b0b2b0]/50 hover:bg-[#faf9f7] text-[#303331] font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <p className="mt-6 text-center text-sm text-[#5d605e]">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline ml-1">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
