import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Sliders, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { useGetMyMentorProfileQuery, useUpdateMyMentorProfileMutation } from '@/store/api/mentorApi'
import {
  Button,
  Card,
  Input,
} from '@/design-system'

const mentorConfigSchema = z.object({
  is_online: z.boolean(),
  daily_available_minutes: z.number().min(15).max(1440),
  operating_hours: z.object({
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format (e.g. 09:00)'),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format (e.g. 17:00)'),
    timezone: z.string(),
  }).refine(data => {
    if (!data.start || !data.end) return true
    const [startH, startM] = data.start.split(':').map(Number)
    const [endH, endM] = data.end.split(':').map(Number)
    return startH < endH || (startH === endH && startM < endM)
  }, { message: 'Start time must be before end time', path: ['start'] }),
  expertise_tags: z.array(z.string()),
}).refine(data => {
  if (!data.operating_hours.start || !data.operating_hours.end) return true
  const [startH, startM] = data.operating_hours.start.split(':').map(Number)
  const [endH, endM] = data.operating_hours.end.split(':').map(Number)
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM)
  return data.daily_available_minutes <= totalMinutes
}, { message: 'Daily availability cannot exceed total operating hours window', path: ['daily_available_minutes'] })

type MentorConfigFormValues = z.infer<typeof mentorConfigSchema>

export const MentorConfigurationPage: React.FC = () => {
  const { data: profileData, refetch } = useGetMyMentorProfileQuery()
  const [updateProfile, { isLoading }] = useUpdateMyMentorProfileMutation()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<MentorConfigFormValues>({
    resolver: zodResolver(mentorConfigSchema),
    defaultValues: {
      is_online: true,
      daily_available_minutes: 90,
      operating_hours: {
        start: '09:00',
        end: '18:00',
        timezone: 'Asia/Kolkata',
      },
      expertise_tags: [],
    },
  })

  const isOnline = watch('is_online')
  const dailyMinutes = watch('daily_available_minutes')

  useEffect(() => {
    if (profileData?.data) {
      const p = profileData.data
      reset({
        is_online: p.is_online,
        daily_available_minutes: p.daily_available_minutes || 90,
        operating_hours: {
          start: p.operating_hours?.start || '09:00',
          end: p.operating_hours?.end || '18:00',
          timezone: p.operating_hours?.timezone || 'Asia/Kolkata',
        },
        expertise_tags: p.expertise_tags || [],
      })
    }
  }, [profileData, reset])

  const handleSave = async (data: MentorConfigFormValues) => {
    const parsedMinutes = parseInt(String(data.daily_available_minutes), 10)
    if (isNaN(parsedMinutes) || parsedMinutes < 15 || parsedMinutes > 1440) {
      setFeedback({ type: 'error', message: 'Daily availability must be between 15 and 1440 minutes.' })
      return
    }

    try {
      await updateProfile({
        isOnline: data.is_online,
        dailyAvailability: parsedMinutes,
        operatingHours: {
          startTime: data.operating_hours.start,
          endTime: data.operating_hours.end,
          timezone: data.operating_hours.timezone,
        },
        expertiseTags: data.expertise_tags,
      }).unwrap()
      refetch()
      setFeedback({ type: 'success', message: 'Configuration updated successfully!' })
      setTimeout(() => setFeedback(null), 3000)
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update configuration.' })
    }
  }

  return (
    <main className="min-h-screen bg-[var(--mqds-canvas,#faf9f7)] text-[var(--mqds-text,#303331)] font-body p-6 text-left">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-56 shrink-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--mqds-primary)] flex items-center justify-center text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="font-headline text-sm font-bold text-[var(--mqds-text)]">Configuration</p>
              <p className="text-[10px] font-mono text-[var(--mqds-muted)]">Mentor operating limits</p>
            </div>
          </div>
        </aside>

        {/* Configuration Form */}
        <section className="flex-1 space-y-6">
          {feedback && (
            <div
              className={`border rounded-xl p-4 flex items-center gap-3 text-xs font-semibold shadow-xs ${
                feedback.type === 'success'
                  ? 'bg-[var(--mqds-hover)] border-[var(--mqds-border-subtle)] text-[var(--mqds-primary)]'
                  : 'bg-[var(--mqds-warning-surface)] border-[var(--mqds-danger-border)] text-[var(--mqds-danger)]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[var(--mqds-danger)] shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
            {/* Online Status Card */}
            <Card variant="paper" className="p-6 border border-[var(--mqds-paper-border)] shadow-xs space-y-4">
              <h2 className="text-sm font-bold font-headline text-[var(--mqds-text)] flex items-center gap-2 border-b border-[var(--mqds-border-subtle)] pb-3">
                <Clock className="w-4 h-4 text-[var(--mqds-primary)]" />
                <span>Online &amp; Queue Availability</span>
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--mqds-text)]">Available for On-Demand Calls</p>
                  <p className="text-xs text-[var(--mqds-muted)]">
                    Scholars can view you as active and claim tickets into your focus chamber.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('is_online', !isOnline, { shouldDirty: true })}
                  className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none cursor-pointer ${
                    isOnline ? 'bg-[var(--mqds-primary)]' : 'bg-[var(--mqds-border-subtle)]'
                  }`}
                  aria-label="Toggle Online Status"
                >
                  <span
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      isOnline ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </Card>

            {/* Daily Availability Card */}
            <Card variant="paper" className="p-6 border border-[var(--mqds-paper-border)] shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--mqds-border-subtle)] pb-3">
                <h2 className="text-sm font-bold font-headline text-[var(--mqds-text)]">
                  Daily Availability Pool
                </h2>
                <span className="text-xs font-mono font-bold text-[var(--mqds-primary)]">
                  {dailyMinutes} mins
                </span>
              </div>
              <Input
                label="Maximum Daily Mentoring Minutes"
                type="number"
                min={15}
                max={1440}
                step={15}
                {...register('daily_available_minutes', { valueAsNumber: true })}
                error={errors.daily_available_minutes?.message}
              />
            </Card>

            {/* Operating Hours Card */}
            <Card variant="paper" className="p-6 border border-[var(--mqds-paper-border)] shadow-xs space-y-4">
              <h2 className="text-sm font-bold font-headline text-[var(--mqds-text)] flex items-center gap-2 border-b border-[var(--mqds-border-subtle)] pb-3">
                <Calendar className="w-4 h-4 text-[var(--mqds-primary)]" />
                <span>Operating Hours Window</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Daily Start Time (HH:mm)"
                  type="time"
                  {...register('operating_hours.start')}
                  error={errors.operating_hours?.start?.message}
                />
                <Input
                  label="Daily End Time (HH:mm)"
                  type="time"
                  {...register('operating_hours.end')}
                  error={errors.operating_hours?.end?.message}
                />
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
                  <span>{isLoading ? 'Saving...' : 'Save Configuration'}</span>
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
