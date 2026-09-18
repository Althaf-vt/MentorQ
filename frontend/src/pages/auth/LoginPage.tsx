import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useLoginMutation } from '@/store/api/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'
import { useToast } from '@/context/ToastContext'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginPageProps {
  expectedRole?: 'MENTOR' | 'STUDENT'
}

export const LoginPage: React.FC<LoginPageProps> = ({ expectedRole = 'STUDENT' }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const [login, { isLoading }] = useLoginMutation()

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')
    if (token && userParam) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userParam))
        if (parsedUser.role !== expectedRole) {
          showToast(`Please use the ${parsedUser.role === 'MENTOR' ? 'Mentor' : 'Student'} login portal.`, 'error')
          // Clean up the URL
          navigate(expectedRole === 'MENTOR' ? '/mentor/login' : '/login', { replace: true })
          return
        }
        dispatch(setCredentials({ token, user: parsedUser }))
        showToast('Logged in with Google successfully!', 'success')
        navigate(parsedUser.role === 'MENTOR' ? '/mentor/dashboard' : '/dashboard')
      } catch (err) {
        console.error('Failed to parse Google user', err)
      }
    }
  }, [searchParams, dispatch, navigate, showToast, expectedRole])

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage(null)
    try {
      const res = await login({ email: data.email, password: data.password, expectedRole }).unwrap()
      if (res.user.role !== expectedRole) {
        const msg = `Please use the ${res.user.role === 'MENTOR' ? 'Mentor' : 'Student'} login portal.`
        setErrorMessage(msg)
        showToast(msg, 'error')
        return
      }
      dispatch(setCredentials({ token: res.access_token, user: res.user }))
      showToast('Logged in successfully!', 'success')
      navigate(res.user.role === 'MENTOR' ? '/mentor/dashboard' : '/dashboard')
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      const msg = error.data?.message || 'Invalid email or password.'
      setErrorMessage(msg)
      showToast(msg, 'error')
      if (msg.includes('Please verify your email')) {
        navigate('/verify-otp', { state: { email: data.email, expectedRole } })
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] flex flex-col lg:flex-row justify-between items-stretch">
      <section className="hidden lg:flex lg:w-1/2 bg-[#f4f4f1] border-r border-[#b0b2b0]/30 p-12 flex-col justify-between">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-2xl tracking-tight text-[#303331]">
            Mentor<span className="text-primary">Q</span>
          </span>
        </Link>
        <div className="my-auto py-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#b0b2b0]/30 mb-6 text-xs font-label text-[#5d605e]">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>140+ Mentors Online Now</span>
          </div>
          <h1 className="font-headline text-4xl font-bold text-[#303331] tracking-tight leading-[1.15] mb-6">
            Accelerate your learning curve in real-time.
          </h1>
          <p className="font-body text-[#5d605e] text-base leading-relaxed mb-8">
            Connect with verified senior engineers for instant 1-on-1 guidance.
          </p>
        </div>
        <div className="text-xs text-[#797b79] font-label">
          <span>&copy; 2025 MentorQ Platform</span>
        </div>
      </section>

      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-headline text-3xl font-bold text-[#303331] tracking-tight mb-2">
              {expectedRole === 'MENTOR' ? 'Mentor Login' : 'Welcome back'}
            </h2>
            <p className="font-body text-sm text-[#5d605e]">Enter your credentials to access your MentorQ dashboard.</p>
          </div>
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-[#f97386]/10 border border-[#a8364b]/20 flex items-start gap-3 text-sm text-[#a8364b]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-body">{errorMessage}</div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-label font-medium uppercase tracking-wider text-[#303331] mb-1.5">Email</label>
              <input
                type="email"
                {...registerField('email')}
                placeholder="name@company.com"
                className="w-full h-11 px-4 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm text-[#303331] focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 text-left">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-label font-medium uppercase tracking-wider text-[#303331]">Password</label>
                <Link to="/forgot-password" className="text-xs font-body font-medium text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...registerField('password')}
                  placeholder="••••••••"
                  className="w-full h-11 pl-4 pr-11 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm text-[#303331] focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#797b79] hover:text-[#303331]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 text-left">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary-dim text-white font-body font-medium text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
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
              window.location.href = `${apiBase}/auth/google?state=${expectedRole}`
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

          <p className="mt-8 text-center text-sm font-body text-[#5d605e]">
            Don&apos;t have an account? <Link to="/register" className="text-primary font-semibold hover:underline ml-1">Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
