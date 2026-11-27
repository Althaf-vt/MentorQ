import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  User as UserIcon,
  Settings,
  Sliders,
  CheckCircle,
  Camera,
  Trash2,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react'
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
import { useGetStudentTicketsQuery, useGetMentorTicketsQuery } from '@/store/api/ticketApi'
import { updateUser } from '@/store/slices/authSlice'
import { Link } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  SocialLinks,
  Textarea,
  lightTheme,
} from '@/design-system'
import { useThemeStore } from '@/store/themeStore'

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

  const { theme, setTheme } = useThemeStore()

  // Query completed sessions for student-profile-summary statistics
  const { data: studentTickets = [] } = useGetStudentTicketsQuery(undefined, {
    skip: user?.role === 'MENTOR',
  })
  const { data: mentorTickets = [] } = useGetMentorTicketsQuery(undefined, {
    skip: user?.role !== 'MENTOR',
  })

  const tickets = user?.role === 'MENTOR' ? mentorTickets : studentTickets
  const { completedCount, totalMinutes } = useMemo(() => {
    const completed = tickets.filter((t) => t.status === 'COMPLETED')
    const mins = completed.reduce(
      (acc, t) => acc + (t.actual_time_spent_minutes || t.requested_minutes || 0),
      0
    )
    return { completedCount: completed.length, totalMinutes: mins }
  }, [tickets])

  const currentUser = sUser?.data || user

  const {
    register,
    handleSubmit,
    reset,
    watch,
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
  }, [
    currentUser?.fullName,
    currentUser?.bio,
    currentUser?.socialLinks?.linkedin,
    currentUser?.socialLinks?.github,
    reset,
  ])

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
        },
      }).unwrap()
      if (res.data) {
        dispatch(updateUser(res.data))
        refetch()
        showSuccess('Profile updated successfully!')
      }
    } catch {
      setSuccess('Failed to update profile.')
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

  const resolveAvatarUrl = (url?: string) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${API_BASE}${url}`
  }

  const avatarSrc = resolveAvatarUrl(currentUser?.avatarUrl)
  const watchedSocials = watch('socialLinks')

  return (
    <main className="preview-main font-body pt-8 md:pt-18 pb-20">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-56 shrink-0 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--mqds-primary)] flex items-center justify-center text-white shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <p className="font-headline text-sm font-bold text-[var(--mqds-text)]">Settings</p>
              <p className="text-[10px] font-mono text-[var(--mqds-muted)]">Account &amp; preferences</p>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col gap-1.5">
            <span className="px-3.5 py-2 bg-[var(--mqds-hover)] text-[var(--mqds-accent)] rounded-xl font-semibold flex items-center gap-2 text-xs">
              <UserIcon className="w-4 h-4" />
              <span>Personal Info</span>
            </span>
            {user?.role === 'MENTOR' && (
              <Link
                to="/mentor/configuration"
                className="text-[var(--mqds-muted)] hover:text-[var(--mqds-text)] hover:bg-[var(--mqds-hover)] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>Mentor Config</span>
                </div>
              </Link>
            )}
          </nav>

          {/* Quick Profile Summary in sidebar for desktop */}
          <div className="hidden md:block pt-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--mqds-muted)] mb-2 font-semibold">
              Session Activity
            </p>
            <dl className="student-profile-summary">
              <div>
                <dt>{user?.role === 'MENTOR' ? 'Guided' : 'Sessions'}</dt>
                <dd>{completedCount}</dd>
              </div>
              <div>
                <dt>{user?.role === 'MENTOR' ? 'Mentored' : 'Learned'}</dt>
                <dd>{totalMinutes}m</dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* Settings Forms & Appearance */}
        <section className="flex-1 space-y-6">
          {success && (
            <div className="bg-[var(--mqds-hover)] border border-[var(--mqds-border-subtle)] text-[var(--mqds-accent)] rounded-xl p-4 flex items-center gap-3 shadow-xs">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold">{success}</span>
            </div>
          )}

          {/* Appearance & Theme Switcher Card */}
          <Card
            variant="paper"
            data-mqds={lightTheme}
            className="p-6 border border-[var(--mqds-paper-border)] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--mqds-border-subtle)] pb-3">
              <div>
                <h2 className="font-headline text-sm font-bold text-[var(--mqds-ink)]">
                  Appearance &amp; Theme
                </h2>
                <p className="text-[11px] font-mono text-[var(--mqds-muted-ink)]">
                  Choose your interface theme. Light mode is the default canvas.
                </p>
              </div>
              <Badge tone="info" className="text-[10px] font-mono">
                {theme.toUpperCase()} ACTIVE
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                aria-pressed={theme === 'light'}
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#fffdfa] border-[#59388e] ring-2 ring-[#59388e]/20 text-[var(--mqds-ink)]'
                    : 'bg-[#f8f2fc] border-[#dacbe7] text-[var(--mqds-muted-ink)] hover:border-[#827aa6]'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-semibold text-[var(--mqds-ink)]">
                    Light Theme
                  </strong>
                  <span className="text-[11px] text-[var(--mqds-muted-ink)]">
                    Ivory ticket surfaces on warm parchment canvas
                  </span>
                </div>
              </button>

              <button
                type="button"
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#fffdfa] border-[#59388e] ring-2 ring-[#59388e]/20 text-[var(--mqds-ink)]'
                    : 'bg-[#f8f2fc] border-[#dacbe7] text-[var(--mqds-muted-ink)] hover:border-[#827aa6]'
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-semibold text-[var(--mqds-ink)]">
                    Dark Theme
                  </strong>
                  <span className="text-[11px] text-[var(--mqds-muted-ink)]">
                    Midnight velvet backdrop with glowing lavender accents
                  </span>
                </div>
              </button>
            </div>
          </Card>

          {/* Profile Photo Section */}
          <Card
            variant="paper"
            data-mqds={lightTheme}
            className="p-6 border border-[var(--mqds-paper-border)] shadow-xs space-y-4"
          >
            <h2 className="font-headline text-sm font-bold text-[var(--mqds-ink)] border-b border-[var(--mqds-border-subtle)] pb-3">
              Profile Photo
            </h2>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar
                  name={currentUser?.fullName || 'User'}
                  src={avatarSrc || undefined}
                  size="lg"
                />
                {(isUploading || isDeleting) && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isDeleting}
                    className="flex items-center gap-2 !px-3.5 !py-2 !min-h-0 text-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{currentUser?.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  </Button>
                  {currentUser?.avatarUrl && (
                    <Button
                      type="button"
                      variant="danger-subtle"
                      onClick={handleAvatarDelete}
                      disabled={isUploading || isDeleting}
                      className="flex items-center gap-2 !px-3.5 !py-2 !min-h-0 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
                <p className="text-[11px] font-mono text-[var(--mqds-muted-ink)]">
                  JPG, PNG or WEBP. Maximum file size 5 MB.
                </p>
              </div>
            </div>

            {/* Mobile / Tablet Activity Tiles */}
            <div className="md:hidden pt-4 border-t border-[var(--mqds-border-subtle)]">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--mqds-muted-ink)] mb-2 font-semibold">
                Session Activity
              </p>
              <dl className="student-profile-summary">
                <div>
                  <dt>{user?.role === 'MENTOR' ? 'Guided' : 'Sessions'}</dt>
                  <dd>{completedCount}</dd>
                </div>
                <div>
                  <dt>{user?.role === 'MENTOR' ? 'Mentored' : 'Learned'}</dt>
                  <dd>{totalMinutes}m</dd>
                </div>
              </dl>
            </div>
          </Card>

          {/* Basic Details Form */}
          <form
            onSubmit={handleSubmit(handleSave)}
            className="space-y-6"
          >
            <Card
              variant="paper"
              data-mqds={lightTheme}
              className="p-6 border border-[var(--mqds-paper-border)] shadow-xs space-y-5"
            >
              <h2 className="font-headline text-sm font-bold text-[var(--mqds-ink)] border-b border-[var(--mqds-border-subtle)] pb-3">
                Basic Details
              </h2>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  {...register('fullName')}
                  error={errors.fullName?.message}
                />

                <div>
                  <label className="block text-xs font-semibold text-[var(--mqds-muted-ink)] mb-1 font-mono uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    className="mqds-control text-xs opacity-70 cursor-not-allowed bg-[var(--mqds-surface)]"
                    type="email"
                    disabled
                    value={user?.email || ''}
                    title="Email managed via Google login"
                  />
                </div>

                <Textarea
                  label="Bio"
                  rows={3}
                  placeholder="Share a short bio about your technical interests, stacks, and goals..."
                  {...register('bio')}
                  error={errors.bio?.message}
                />
              </div>
            </Card>

            {/* Social Profiles & Directional Link Tiles */}
            <Card
              variant="paper"
              data-mqds={lightTheme}
              className="p-6 border border-[var(--mqds-paper-border)] shadow-xs space-y-5"
            >
              <h2 className="font-headline text-sm font-bold text-[var(--mqds-ink)] border-b border-[var(--mqds-border-subtle)] pb-3">
                Social Profiles (Optional)
              </h2>
              <div className="space-y-4">
                <Input
                  label="LinkedIn Profile URL"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  {...register('socialLinks.linkedin')}
                  error={errors.socialLinks?.linkedin?.message}
                />

                <Input
                  label="GitHub Profile URL"
                  type="url"
                  placeholder="https://github.com/username"
                  {...register('socialLinks.github')}
                  error={errors.socialLinks?.github?.message}
                />

                {/* Directional interactive cursor-tracking tile preview */}
                {(watchedSocials?.linkedin || watchedSocials?.github) && (
                  <div className="pt-3 border-t border-[var(--mqds-border-subtle)]">
                    <p className="text-xs font-mono uppercase tracking-wider text-[var(--mqds-muted-ink)] mb-2">
                      Profile Tiles Preview
                    </p>
                    <SocialLinks
                      links={{
                        linkedin: watchedSocials?.linkedin,
                        github: watchedSocials?.github,
                      }}
                      variant="grid"
                    />
                  </div>
                )}
              </div>
            </Card>

            {isDirty && (
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <span>{isLoading ? 'Saving...' : 'Save Profile Changes'}</span>
                  <span aria-hidden="true">&rarr;</span>
                </Button>
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}
