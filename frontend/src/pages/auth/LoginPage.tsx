import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from 'lucide-react'
import { useLoginMutation } from '@/store/api/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.')
      return
    }

    try {
      const res = await login({ email, password }).unwrap()
      dispatch(setCredentials({ token: res.access_token, user: res.user }))
      navigate(res.user.role === 'MENTOR' ? '/mentor/configuration' : '/settings')
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      setErrorMessage(error.data?.message || 'Invalid email or password.')
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
            <h2 className="font-headline text-3xl font-bold text-[#303331] tracking-tight mb-2">Welcome back</h2>
            <p className="font-body text-sm text-[#5d605e]">Enter your credentials to access your MentorQ dashboard.</p>
          </div>
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-[#f97386]/10 border border-[#a8364b]/20 flex items-start gap-3 text-sm text-[#a8364b]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-body">{errorMessage}</div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-label font-medium uppercase tracking-wider text-[#303331] mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="w-full h-11 px-4 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm text-[#303331] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-label font-medium uppercase tracking-wider text-[#303331]">Password</label>
                <Link to="/forgot-password" className="text-xs font-body font-medium text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 pl-4 pr-11 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm text-[#303331] focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#797b79] hover:text-[#303331]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full h-12 rounded-full bg-primary hover:bg-primary-dim text-white font-body font-medium text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <p className="mt-8 text-center text-sm font-body text-[#5d605e]">
            Don&apos;t have an account? <Link to="/register" className="text-primary font-semibold hover:underline ml-1">Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
