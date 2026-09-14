import React, { useState, useEffect, useRef } from 'react'
import { User as UserIcon, Settings, Sliders, CheckCircle, Camera, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  useGetMeQuery,
  useUpdateMeMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} from '@/store/api/authApi'
import { updateUser } from '@/store/slices/authSlice'
import { Link } from 'react-router-dom'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string)?.replace('/api/v1', '') || 'http://localhost:3133'

const settingsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  bio: z.string().max(300, 'Bio must be less than 300 characters').optional().or(z.literal('')),
  socialLinks: z.object({
    linkedin: z.string()
      .regex(/^https:\/\/(www\.)?linkedin\.com\/.*/, 'Must be a valid LinkedIn profile URL')
      .optional().or(z.literal('')),
    github: z.string()
      .regex(/^https:\/\/(www\.)?github\.com\/.*/, 'Must be a valid GitHub profile URL')
      .optional().or(z.literal('')),
  }).optional(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export const UserSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { data: sUser, refetch } = useGetMeQuery()
  const [updateMe, { isLoading }] = useUpdateMeMutation()
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation()
  const [deleteAvatar, { isLoading: isDeleting }] = useDeleteAvatarMutation()
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentUser = sUser?.data || user

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
      socialLinks: {
        linkedin: '',
        github: '',
      },
    },
  })

  useEffect(() => {
    if (currentUser) {
      reset({
        fullName: currentUser.fullName || '',
        bio: currentUser.bio || '',
        socialLinks: {
          linkedin: currentUser.socialLinks?.linkedin || '',
          github: currentUser.socialLinks?.github || '',
        },
      })
    }
  }, [sUser, user, reset])

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSave = async (data: SettingsFormValues) => {
    try {
      const res = await updateMe({ 
        fullName: data.fullName, 
        bio: data.bio,
        socialLinks: {
          linkedin: data.socialLinks?.linkedin || undefined,
          github: data.socialLinks?.github || undefined,
        }
      }).unwrap()
      if (res.data) {
        dispatch(updateUser(res.data))
        refetch()
        showSuccess('Profile updated successfully!')
      }
    } catch {
      setSuccess('Failed to update.')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const res = await uploadAvatar(file).unwrap()
      if (res.data) {
        dispatch(updateUser(res.data))
        showSuccess('Photo uploaded successfully!')
      }
    } catch {
      setSuccess('Failed to upload photo.')
    }

    // Reset the file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAvatarDelete = async () => {
    try {
      const res = await deleteAvatar().unwrap()
      if (res.data) {
        dispatch(updateUser(res.data))
        showSuccess('Photo removed successfully!')
      }
    } catch {
      setSuccess('Failed to remove photo.')
    }
  }

  /** Resolve an avatarUrl (which may be a relative path) to a full URL. */
  const resolveAvatarUrl = (url?: string) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${API_BASE}${url}`
  }

  const avatarSrc = resolveAvatarUrl(currentUser?.avatarUrl)

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

          {/* ── Profile Photo Section ───────────────────────────── */}
          <div className="bg-[#FAFAF8] border border-[#E8E6E1] rounded-2xl p-6">
            <h2 className="font-headline text-base font-semibold border-b pb-2 mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              {/* Avatar Preview */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-4 ring-[#E8E6E1] shadow-sm">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {currentUser?.fullName?.charAt(0)?.toUpperCase() || <UserIcon className="w-8 h-8" />}
                    </span>
                  )}
                </div>
                {(isUploading || isDeleting) && (
                  <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dim text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-70 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {currentUser?.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                {currentUser?.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarDelete}
                    disabled={isUploading || isDeleting}
                    className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-70 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Photo
                  </button>
                )}
                <p className="text-[10px] text-[#5d605e]">JPG, PNG or GIF. Max 5 MB.</p>
              </div>
            </div>
          </div>

          {/* ── Basic Details Form ──────────────────────────────── */}
          <form onSubmit={handleSubmit(handleSave)} className="bg-[#FAFAF8] border border-[#E8E6E1] rounded-2xl p-6 space-y-4">
            <h2 className="font-headline text-base font-semibold border-b pb-2">Basic Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5d605e] mb-1">Full Name</label>
                <input
                  className={`bg-[#F5F4F0] border focus:border-primary w-full px-3 py-2 rounded-xl text-sm outline-none ${errors.fullName ? 'border-red-500' : 'border-[#DDD9D2]'}`}
                  type="text"
                  {...register('fullName')}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5d605e] mb-1">Email Address</label>
                <input
                  className="bg-[#F5F4F0] border border-[#DDD9D2] w-full px-3 py-2 rounded-xl text-sm outline-none opacity-70 cursor-not-allowed"
                  type="email"
                  disabled
                  value={user?.email || ''}
                  title="Email managed via Google login"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5d605e] mb-1">Bio</label>
                <textarea
                  className={`bg-[#F5F4F0] border focus:border-primary w-full p-3 rounded-xl text-sm outline-none ${errors.bio ? 'border-red-500' : 'border-[#DDD9D2]'}`}
                  rows={3}
                  {...register('bio')}
                />
                {errors.bio && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.bio.message}</p>}
              </div>
            </div>
            
            <h2 className="font-headline text-base font-semibold border-b pb-2 pt-4">Social Links (Optional)</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5d605e] mb-1">LinkedIn Profile URL</label>
                <input
                  className={`bg-[#F5F4F0] border focus:border-primary w-full px-3 py-2 rounded-xl text-sm outline-none ${errors.socialLinks?.linkedin ? 'border-red-500' : 'border-[#DDD9D2]'}`}
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  {...register('socialLinks.linkedin')}
                />
                {errors.socialLinks?.linkedin && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.socialLinks.linkedin.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5d605e] mb-1">GitHub Profile URL</label>
                <input
                  className={`bg-[#F5F4F0] border focus:border-primary w-full px-3 py-2 rounded-xl text-sm outline-none ${errors.socialLinks?.github ? 'border-red-500' : 'border-[#DDD9D2]'}`}
                  type="url"
                  placeholder="https://github.com/username"
                  {...register('socialLinks.github')}
                />
                {errors.socialLinks?.github && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.socialLinks.github.message}</p>}
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

