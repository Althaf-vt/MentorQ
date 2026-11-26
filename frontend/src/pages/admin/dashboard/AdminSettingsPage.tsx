import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/store/api/adminApi'
import { Save, CheckCircle2 } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  Loader,
  Textarea,
} from '@/design-system'

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
    setValue,
    watch,
    reset: resetForm,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  })

  const allowStudentReg = watch('allowStudentRegistration')
  const allowMentorReg = watch('allowMentorRegistration')

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
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader />
        <p className="text-xs font-mono text-[var(--mqds-muted)]">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-body">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight text-[var(--mqds-text,#f4f7f2)]">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-[var(--mqds-muted)] mt-1 font-mono">
          Global platform metadata, feature flags, and access toggles
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Info Card */}
        <Card
          variant="paper"
          className="p-6 bg-[var(--mqds-surface,#272440)] border border-[var(--mqds-border,#89839b)]/30 shadow-xs space-y-5"
        >
          <div className="border-b border-[var(--mqds-border,#89839b)]/20 pb-3">
            <h2 className="text-sm font-bold font-headline text-[var(--mqds-text)]">
              General Platform Information
            </h2>
            <p className="text-xs text-[var(--mqds-muted)] font-mono mt-0.5">
              Basic identification parameters
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Platform Name"
              {...register('platformName')}
              error={errors.platformName?.message}
            />

            <Textarea
              label="Platform Description"
              rows={3}
              {...register('platformDescription')}
              error={errors.platformDescription?.message}
            />

            <Input
              label="Logo URL"
              type="url"
              {...register('logoUrl')}
              error={errors.logoUrl?.message}
            />
          </div>
        </Card>

        {/* Registration Controls Card */}
        <Card
          variant="paper"
          className="p-6 bg-[var(--mqds-surface,#272440)] border border-[var(--mqds-border,#89839b)]/30 shadow-xs space-y-5"
        >
          <div className="border-b border-[var(--mqds-border,#89839b)]/20 pb-3">
            <h2 className="text-sm font-bold font-headline text-[var(--mqds-text)]">
              Registration Controls
            </h2>
            <p className="text-xs text-[var(--mqds-muted)] font-mono mt-0.5">
              Control scholar and mentor onboarding portals
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--mqds-hover,#3b355a)]/40 border border-[var(--mqds-border,#89839b)]/20">
              <div>
                <p className="text-xs font-semibold text-[var(--mqds-text)]">
                  Student Registration
                </p>
                <p className="text-[11px] text-[var(--mqds-muted)] font-mono">
                  Allow new students to create platform accounts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue('allowStudentRegistration', !allowStudentReg, { shouldDirty: true })}
                className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none cursor-pointer ${
                  allowStudentReg ? 'bg-[var(--mqds-primary)]' : 'bg-[var(--mqds-border,#89839b)]/40'
                }`}
                aria-label="Toggle Student Registration"
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    allowStudentReg ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--mqds-hover,#3b355a)]/40 border border-[var(--mqds-border,#89839b)]/20">
              <div>
                <p className="text-xs font-semibold text-[var(--mqds-text)]">
                  Mentor Registration
                </p>
                <p className="text-[11px] text-[var(--mqds-muted)] font-mono">
                  Allow new mentors to apply for instructor accounts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue('allowMentorRegistration', !allowMentorReg, { shouldDirty: true })}
                className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none cursor-pointer ${
                  allowMentorReg ? 'bg-[var(--mqds-primary)]' : 'bg-[var(--mqds-border,#89839b)]/40'
                }`}
                aria-label="Toggle Mentor Registration"
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    allowMentorReg ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            variant="primary"
            disabled={!isDirty || isUpdating}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isUpdating ? 'Saving Changes...' : 'Save Settings'}</span>
          </Button>

          {isSuccess && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings updated successfully</span>
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
