import React, { useState, useEffect } from 'react'
import { User as UserIcon, Settings, Sliders, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { useGetMeQuery, useUpdateMeMutation } from '@/store/api/authApi'
import { updateUser } from '@/store/slices/authSlice'
import { Link } from 'react-router-dom'

const settingsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  bio: z.string().max(300, 'Bio must be less than 300 characters'),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export const UserSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { data: sUser, refetch } = useGetMeQuery()
  const [updateMe, { isLoading }] = useUpdateMeMutation()
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: '',
      bio: '',
    },
  })

  useEffect(() => {
    const u = sUser?.data || user
    if (u) {
      reset({
        fullName: u.fullName || '',
        bio: u.bio || '',
      })
    }
  }, [sUser, user, reset])

  const handleSave = async (data: SettingsFormValues) => {
    try {
      const res = await updateMe({ fullName: data.fullName, bio: data.bio }).unwrap()
      if (res.data) {
        dispatch(updateUser(res.data))
        refetch()
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch {
      setSuccess('Failed to update.')
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#303331] font-body p-6 text-left">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <p className="font-headline text-sm font-bold">Settings</p>
              <p className="text-[10px] text-[#5d605e]">Manage account details</p>
            </div>
          </div>
          <nav className="flex flex-row md:flex-col gap-1">
            <span className="px-3 py-2 bg-primary/10 text-primary rounded-xl font-semibold flex items-center gap-2 text-sm">
              <UserIcon className="w-4 h-4" />
              <span>Personal Info</span>
            </span>
            {user?.role === 'MENTOR' && (
              <Link
                to="/mentor/configuration"
                className="text-[#5d605e] hover:text-[#303331] rounded-xl px-3 py-2 flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>Mentor Config</span>
                </div>
              </Link>
            )}
          </nav>
        </aside>

        <section className="flex-1 space-y-6">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(handleSave)} className="bg-[#FAFAF8] border border-[#E8E6E1] rounded-2xl p-6 space-y-4">
            <h2 className="font-headline text-base font-semibold border-b pb-2">Basic Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5d605e] mb-1">Full Name</label>
                <input
                  className="bg-[#F5F4F0] border border-[#DDD9D2] focus:border-primary w-full px-3 py-2 rounded-xl text-sm outline-none"
                  type="text"
                  {...register('fullName')}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5d605e] mb-1">Email Address</label>
                <input
                  className="bg-[#F5F4F0] border border-[#DDD9D2] w-full px-3 py-2 rounded-xl text-sm outline-none opacity-70"
                  type="email"
                  disabled
                  value={user?.email || ''}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5d605e] mb-1">Bio</label>
                <textarea
                  className="bg-[#F5F4F0] border border-[#DDD9D2] focus:border-primary w-full p-3 rounded-xl text-sm outline-none"
                  rows={3}
                  {...register('bio')}
                />
                {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
              </div>
            </div>
            {isDirty && (
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary-dim text-white rounded-xl px-5 py-2 text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-70 animate-in fade-in"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}
