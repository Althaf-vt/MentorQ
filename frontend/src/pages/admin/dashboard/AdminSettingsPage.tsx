import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/store/api/adminApi'
import { CheckCircle2 } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  Skeleton,
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

export const AdminSettingsPage: React.FC = () => {
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
      <div className="max-w-3xl space-y-8 font-body">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight text-[var(--mqds-text)]">
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mqds-muted)] mt-1 font-mono">
            Global platform metadata, feature flags, and access toggles
          </p>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="card" label="Loading settings…" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-body">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight text-[var(--mqds-text)]">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-[var(--mqds-muted)] mt-1 font-mono">
          Global platform metadata, feature flags, and access toggles
        </p>
      </div>

      {isSuccess && (
        <div className="p-4 rounded-xl bg-[var(--mqds-hover)] border border-[var(--mqds-border-subtle)] text-[var(--mqds-accent)] flex items-center gap-3 text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>Platform settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Info Card */}
        <Card
          className="p-6 border border-[var(--mqds-border-subtle)] shadow-xs space-y-5 !bg-[var(--mqds-surface)] !text-[var(--mqds-text)]"
          style={{ background: 'var(--mqds-surface)', color: 'var(--mqds-text)' }}
        >
          <div className="border-b border-[var(--mqds-border-subtle)] pb-3">
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
          className="p-6 border border-[var(--mqds-border-subtle)] shadow-xs space-y-5 !bg-[var(--mqds-surface)] !text-[var(--mqds-text)]"
          style={{ background: 'var(--mqds-surface)', color: 'var(--mqds-text)' }}
        >
          <div className="border-b border-[var(--mqds-border-subtle)] pb-3">
            <h2 className="text-sm font-bold font-headline text-[var(--mqds-text)]">
              Registration Controls
            </h2>
            <p className="text-xs text-[var(--mqds-muted)] font-mono mt-0.5">
              Control student and mentor onboarding portals
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--mqds-hover)]/30 border border-[var(--mqds-border-subtle)]">
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
                role="switch"
                aria-checked={allowStudentReg}
                onClick={() => setValue('allowStudentRegistration', !allowStudentReg, { shouldDirty: true })}
                className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none cursor-pointer ${
                  allowStudentReg ? 'bg-[var(--mqds-primary)]' : 'bg-[var(--mqds-border-subtle)]'
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

            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--mqds-hover)]/30 border border-[var(--mqds-border-subtle)]">
              <div>
                <p className="text-xs font-semibold text-[var(--mqds-text)]">
                  Mentor Registration
                </p>
                <p className="text-[11px] text-[var(--mqds-muted)] font-mono">
                  Allow experienced practitioners to submit mentor applications
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={allowMentorReg}
                onClick={() => setValue('allowMentorRegistration', !allowMentorReg, { shouldDirty: true })}
                className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none cursor-pointer ${
                  allowMentorReg ? 'bg-[var(--mqds-primary)]' : 'bg-[var(--mqds-border-subtle)]'
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

        {isDirty && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <span>{isUpdating ? 'Saving...' : 'Save Settings'}</span>
              <span aria-hidden="true">&rarr;</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
