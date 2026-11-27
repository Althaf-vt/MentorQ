import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch } from 'react-redux'
import { setCredentials } from '@/store/slices/authSlice'
import { useAdminLoginMutation } from '@/store/api/adminAuthApi'
import { Button, Input } from '@/design-system'
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
        <h2 className="text-xl font-headline font-bold text-[var(--mqds-text,#f4f7f2)]">
          Admin Sign In
        </h2>
        <p className="text-xs text-[var(--mqds-muted,#cbc6df)] mt-1 font-mono">
          Enter credentials to access administrative controls
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="p-3 rounded-xl bg-[var(--mqds-danger,#9b253b)]/30 text-[var(--mqds-error,#ffb4bd)] text-xs border border-[var(--mqds-danger-border,#b45965)]">
            {'data' in error ? ((error.data as { message?: string }).message || 'Login failed.') : 'Login failed. Please check credentials.'}
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="admin@mentorq.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--mqds-text)]">
              Password
            </span>
            <button
              type="button"
              onClick={() => navigate('/admin/forgot-password')}
              className="text-xs text-[var(--mqds-accent,#c5baff)] hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <Input
            label=""
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="w-full justify-center !min-h-[44px] mt-2"
        >
          <span>{isLoading ? 'Signing In...' : 'Sign In to Console'}</span>
          <span aria-hidden="true">&rarr;</span>
        </Button>
      </form>
    </div>
  )
}
