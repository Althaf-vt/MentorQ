import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/store/api/adminApi'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'
const settingsSchema = z.object({
  allowStudentRegistration: z.boolean(),
  allowMentorRegistration: z.boolean(),
  platformName: z.string().min(2, 'Platform name must be at least 2 characters').max(50),
  platformDescription: z.string().max(200, 'Description is too long'),
  logoUrl: z.string().url('Must be a valid URL'),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export function AdminSettingsPage() {
  const { data: settings, isLoading: isFetching } = useGetSettingsQuery()
  const [updateSettings, { isLoading: isUpdating, isSuccess, reset }] = useUpdateSettingsMutation()

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  })

  // Initialize form when data is loaded
  useEffect(() => {
    if (settings) {
      resetForm({
        allowStudentRegistration: settings.allowStudentRegistration,
        allowMentorRegistration: settings.allowMentorRegistration,
        platformName: settings.platformName,
        platformDescription: settings.platformDescription,
        logoUrl: settings.logoUrl,
      })
    }
  }, [settings, resetForm])

  // Reset success message after 3 seconds
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => reset(), 3000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, reset])

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateSettings(data).unwrap()
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Platform Settings</h1>
        <p className="text-zinc-400 mt-2">Manage global configurations and feature flags.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white">General Information</h2>
            <p className="text-sm text-zinc-400 mt-1">Basic details about your platform.</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Platform Name</label>
              <input
                type="text"
                {...register('platformName')}
                className="mt-2 block w-full rounded-xl bg-zinc-800 border-zinc-700 text-white focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 px-3"
              />
              {errors.platformName && <p className="mt-1 text-sm text-red-400">{errors.platformName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Platform Description</label>
              <textarea
                {...register('platformDescription')}
                rows={3}
                className="mt-2 block w-full rounded-xl bg-zinc-800 border-zinc-700 text-white focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 px-3 resize-none"
              />
              {errors.platformDescription && <p className="mt-1 text-sm text-red-400">{errors.platformDescription.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Logo URL</label>
              <input
                type="text"
                {...register('logoUrl')}
                className="mt-2 block w-full rounded-xl bg-zinc-800 border-zinc-700 text-white focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 px-3"
              />
              {errors.logoUrl && <p className="mt-1 text-sm text-red-400">{errors.logoUrl.message}</p>}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white">Registration Controls</h2>
            <p className="text-sm text-zinc-400 mt-1">Enable or disable new sign-ups.</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-zinc-200">Student Registration</label>
                <p className="text-sm text-zinc-400">Allow new students to create accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('allowStudentRegistration')} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-zinc-200">Mentor Registration</label>
                <p className="text-sm text-zinc-400">Allow new mentors to apply</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('allowMentorRegistration')} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={!isDirty || isUpdating}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
          
          {isSuccess && (
            <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-left-4">
              <CheckCircle2 className="w-5 h-5" />
              Settings updated successfully
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
