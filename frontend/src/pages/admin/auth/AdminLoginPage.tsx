import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch } from 'react-redux'
import { setCredentials } from '@/store/slices/authSlice'
import { useAdminLoginMutation } from '@/store/api/adminAuthApi'
import { Loader2 } from 'lucide-react'
import type { User } from '@/types/auth.types'

const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type AdminLoginFormData = z.infer<typeof adminLoginSchema>

export function AdminLoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [adminLogin, { isLoading, error }] = useAdminLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  })

  const onSubmit = async (data: AdminLoginFormData) => {
    try {
      const response = await adminLogin(data).unwrap()
      dispatch(
        setCredentials({
          token: response.access_token,
          // Cast the AdminUser to User type required by the slice
          user: {
            _id: response.admin.id,
            email: response.admin.email,
            role: response.admin.role,
            full_name: 'Admin User',
            is_verified: true,
          } as unknown as User, 
        }),
      )
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      console.error('Failed to log in', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Sign in to your account</h2>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="p-3 rounded-xl bg-red-900/50 text-red-200 text-sm border border-red-800">
            {'data' in error ? (error.data as any).message : 'Login failed. Please check your credentials.'}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300">Email address</label>
          <div className="mt-1">
            <input
              type="email"
              {...register('email')}
              className="block w-full rounded-xl bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm transition-colors py-2 px-3"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-300">Password</label>
            <button
              type="button"
              onClick={() => navigate('/admin/forgot-password')}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="mt-1">
            <input
              type="password"
              {...register('password')}
              className="block w-full rounded-xl bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm transition-colors py-2 px-3"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-zinc-900 bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
