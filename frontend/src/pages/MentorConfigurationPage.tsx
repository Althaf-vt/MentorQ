import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Sliders, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { useGetMyMentorProfileQuery, useUpdateMyMentorProfileMutation } from '@/store/api/mentorApi'

const mentorConfigSchema = z.object({
  is_online: z.boolean(),
  daily_available_minutes: z.number().min(15).max(1440),
  operating_hours: z.object({
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format (e.g. 09:00)'),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format (e.g. 17:00)'),
    timezone: z.string(),
  }).refine(data => {
    if (!data.start || !data.end) return true;
    const [startH, startM] = data.start.split(':').map(Number);
    const [endH, endM] = data.end.split(':').map(Number);
    return startH < endH || (startH === endH && startM < endM);
  }, { message: "Start time must be before end time", path: ["start"] }),
  expertise_tags: z.array(z.string()),
}).refine(data => {
  if (!data.operating_hours.start || !data.operating_hours.end) return true;
  const [startH, startM] = data.operating_hours.start.split(':').map(Number);
  const [endH, endM] = data.operating_hours.end.split(':').map(Number);
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  return data.daily_available_minutes <= totalMinutes;
}, { message: "Daily availability cannot exceed total operating hours window", path: ["daily_available_minutes"] })

type MentorConfigFormValues = z.infer<typeof mentorConfigSchema>

export const MentorConfigurationPage: React.FC = () => {
  const { data: profileData, refetch } = useGetMyMentorProfileQuery()
  const [updateProfile, { isLoading }] = useUpdateMyMentorProfileMutation()
  const [success, setSuccess] = useState<string | null>(null)

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
    try {
      await updateProfile({
        is_online: data.is_online,
        daily_available_minutes: data.daily_available_minutes,
        operating_hours: data.operating_hours,
        expertise_tags: data.expertise_tags,
      }).unwrap()
      refetch()
      setSuccess('Configuration updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setSuccess('Failed to update.')
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#1E293B] font-body p-6 text-left">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="font-headline text-sm font-bold text-slate-900">Configuration</p>
              <p className="text-[10px] text-slate-500">Configure mentor profile</p>
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
            {/* Online Status */}
            <div className="bg-[#FAFAF8] border border-[#E5E4DE] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" />
                Online Status
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Available for On-Demand calls</p>
                  <p className="text-xs text-slate-500">Students can find you online and request instantly</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('is_online', !isOnline)}
                  className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none cursor-pointer ${
                    isOnline ? 'bg-brand' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      isOnline ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Daily Availability */}
            <div className="bg-[#FAFAF8] border border-[#E5E4DE] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900">Daily Availability (minutes)</h2>
                <span className="text-sm font-semibold text-brand">{dailyMinutes} min</span>
              </div>
              <input
                type="number"
                min="15"
                max="1440"
                step="15"
                {...register('daily_available_minutes', { valueAsNumber: true })}
                className={`bg-[#F5F4F0] border focus:border-brand rounded-xl px-3 py-2 text-sm w-full outline-none ${errors.daily_available_minutes ? 'border-red-500' : 'border-[#E5E4DE]'}`}
              />
              {errors.daily_available_minutes && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.daily_available_minutes.message}</p>
              )}
            </div>

            {/* Operating Hours */}
            <div className="bg-[#FAFAF8] border border-[#E5E4DE] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand" />
                Operating Hours
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="HH:mm (24h)"
                    {...register('operating_hours.start')}
                    className={`bg-[#F5F4F0] border focus:border-brand rounded-xl px-3 py-2 text-sm w-full outline-none ${errors.operating_hours?.start ? 'border-red-500' : 'border-[#E5E4DE]'}`}
                  />
                  {errors.operating_hours?.start && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.operating_hours.start.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">End Time</label>
                  <input
                    type="text"
                    placeholder="HH:mm (24h)"
                    {...register('operating_hours.end')}
                    className={`bg-[#F5F4F0] border focus:border-brand rounded-xl px-3 py-2 text-sm w-full outline-none ${errors.operating_hours?.end ? 'border-red-500' : 'border-[#E5E4DE]'}`}
                  />
                  {errors.operating_hours?.end && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.operating_hours.end.message}</p>
                  )}
                </div>
              </div>
            </div>

            {isDirty && (
              <button
                type="submit"
                disabled={isLoading}
                className="bg-brand hover:bg-brand-600 text-white rounded-xl px-6 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-70 animate-in fade-in"
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}
