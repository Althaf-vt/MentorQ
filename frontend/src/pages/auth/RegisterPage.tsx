import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, AlertCircle, GraduationCap, Briefcase } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Button,
  Card,
  Input,
  Checkbox,
  Badge,
} from '@/design-system'
import { useRegisterMutation } from '@/store/api/authApi'
import { useToastStore } from '@/store/toastStore'

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
  const showToast = useToastStore((state) => state.showToast)
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
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--mqds-canvas,#faf9f7)] flex flex-col lg:flex-row justify-between items-stretch">
      {/* Brand Hero Column */}
      <section className="hidden lg:flex lg:w-1/2 bg-[var(--mqds-hover,#f4efe8)] border-r border-[var(--mqds-border-subtle,#d5c4ae)] p-12 flex-col justify-between">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--mqds-primary)] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-2xl tracking-tight text-[var(--mqds-text)]">
            Mentor<span className="text-[var(--mqds-primary)]">Q</span>
          </span>
        </Link>
        <div className="my-auto py-8 max-w-lg">
          <div className="mb-6">
            <Badge tone="info">
              <span className="w-2 h-2 rounded-full bg-[var(--mqds-accent)] mr-2 animate-pulse" />
              Join the Engineering Community
            </Badge>
          </div>
          <h1 className="font-headline text-4xl font-bold text-[var(--mqds-text)] leading-tight mb-6">
            Get 1-on-1 mentorship whenever you are stuck.
          </h1>
          <p className="font-body text-[var(--mqds-muted)] text-base leading-relaxed">
            Create your account to request live focus sessions, get queue admission tickets, or offer your mentorship to aspiring engineers.
          </p>
        </div>
        <div className="text-xs text-[var(--mqds-muted)] font-mono">
          <span>&copy; 2025 MentorQ Platform</span>
        </div>
      </section>

      {/* Registration Form Column */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <Card variant="paper" className="w-full max-w-md p-8 sm:p-10 shadow-lg border border-[var(--mqds-paper-border)]">
          <h2 className="font-headline text-3xl font-bold text-[var(--mqds-text)] mb-2">Create an account</h2>
          <p className="font-body text-sm text-[var(--mqds-muted)] mb-6">Choose your role and get started.</p>

          {/* Role Toggle Selector */}
          <div className="bg-[var(--mqds-hover,#eeeeeb)] p-1 rounded-xl flex gap-1 mb-6 border border-[var(--mqds-border-subtle)]">
            <button
              type="button"
              onClick={() => setValue('role', 'STUDENT')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                watchRole === 'STUDENT'
                  ? 'bg-[var(--mqds-primary)] text-white shadow-xs'
                  : 'text-[var(--mqds-muted)] hover:text-[var(--mqds-text)]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student / Mentee</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'MENTOR')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                watchRole === 'MENTOR'
                  ? 'bg-[var(--mqds-primary)] text-white shadow-xs'
                  : 'text-[var(--mqds-muted)] hover:text-[var(--mqds-text)]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Mentor / Guide</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--mqds-warning-surface)] border border-[var(--mqds-danger-border)] text-sm text-[var(--mqds-danger)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              id="register-name"
              placeholder="Alex Chen"
              error={errors.fullName?.message}
              {...registerField('fullName')}
            />

            <Input
              label="Email"
              type="email"
              id="register-email"
              placeholder="alex@company.com"
              error={errors.email?.message}
              {...registerField('email')}
            />

            <div className="mqds-field">
              <label htmlFor="register-password">Password</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  {...registerField('password')}
                  placeholder="••••••••"
                  className="mqds-control pr-10"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mqds-muted)] hover:text-[var(--mqds-text)] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <span className="mqds-field-error text-xs">{errors.password.message}</span>}
            </div>

            <div className="flex flex-col gap-1 pt-1">
              <Checkbox
                id="terms"
                label={
                  <span className="text-xs text-[var(--mqds-muted)]">
                    I agree to the Terms & Privacy Policy
                  </span>
                }
                {...registerField('agreeTerms')}
              />
              {errors.agreeTerms && <p className="text-[var(--mqds-danger)] text-xs mt-1 text-left">{errors.agreeTerms.message}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full !min-h-[46px] mt-2 justify-center"
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
              <span aria-hidden="true">&rarr;</span>
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--mqds-border-subtle)]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--mqds-surface,#faf9f7)] px-2 text-[var(--mqds-muted)] font-mono text-[10px]">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3133/api/v1'
              window.location.href = `${apiBase}/auth/google`
            }}
            className="w-full !min-h-[44px] justify-center gap-2.5"
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
          </Button>

          <p className="mt-6 text-center text-sm text-[var(--mqds-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--mqds-primary)] font-semibold hover:underline ml-1">
              Log in
            </Link>
          </p>
        </Card>
      </section>
    </main>
  )
}
