import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, AlertCircle, ArrowRight, GraduationCap, Briefcase } from 'lucide-react'
import { useRegisterMutation } from '@/store/api/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'
import type { UserRole } from '@/types/auth.types'

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<UserRole>('STUDENT')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms to continue.')
      return
    }
    try {
      const res = await register({ fullName, email, password, role }).unwrap()
      dispatch(setCredentials({ token: res.access_token, user: res.user }))
      navigate(role === 'MENTOR' ? '/mentor/configuration' : '/settings')
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      setErrorMessage(error.data?.message || 'Registration failed.')
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
              onClick={() => setRole('STUDENT')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer ${
                role === 'STUDENT' ? 'bg-primary text-white shadow-sm' : 'text-[#5d605e]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student / Mentee</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('MENTOR')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer ${
                role === 'MENTOR' ? 'bg-primary text-white shadow-sm' : 'text-[#5d605e]'
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-label font-medium uppercase text-[#303331] mb-1">Full Name</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Chen" className="w-full h-11 px-4 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm text-[#303331] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-label font-medium uppercase text-[#303331] mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@company.com" className="w-full h-11 px-4 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm text-[#303331] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-label font-medium uppercase text-[#303331] mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 pl-4 pr-11 rounded-xl border border-[#b0b2b0]/50 bg-white text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#797b79]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input id="terms" type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="rounded text-primary focus:ring-primary/30" />
              <label htmlFor="terms" className="text-xs text-[#5d605e]">I agree to the Terms & Privacy Policy</label>
            </div>
            <button type="submit" disabled={isLoading} className="w-full h-12 rounded-full bg-primary hover:bg-primary-dim text-white font-medium text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#5d605e]">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline ml-1">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
