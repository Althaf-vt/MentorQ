import React, { useState, useEffect } from 'react'
import { Sliders, Clock, Calendar, CheckCircle } from 'lucide-react'
import { useGetMyMentorProfileQuery, useUpdateMyMentorProfileMutation } from '@/store/api/mentorApi'

export const MentorConfigurationPage: React.FC = () => {
  const { data: profileData, refetch } = useGetMyMentorProfileQuery()
  const [updateProfile, { isLoading }] = useUpdateMyMentorProfileMutation()

  const [isOnline, setIsOnline] = useState(true)
  const [dailyMinutes, setDailyMinutes] = useState(90)
  const [startTime, setStartTime] = useState('09:00 AM')
  const [endTime, setEndTime] = useState('06:00 PM')
  const [timezone] = useState('Asia/Kolkata')
  const [tags, setTags] = useState<string[]>([])
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (profileData?.data) {
      const p = profileData.data
      setIsOnline(p.is_online)
      setDailyMinutes(p.daily_available_minutes || 90)
      if (p.operating_hours) {
        setStartTime(p.operating_hours.start || '09:00 AM')
        setEndTime(p.operating_hours.end || '06:00 PM')
      }
      setTags(p.expertise_tags || [])
    }
  }, [profileData])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile({
        is_online: isOnline,
        daily_available_minutes: Number(dailyMinutes),
        operating_hours: { start: startTime, end: endTime, timezone },
        expertise_tags: tags,
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
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white"><Sliders className="w-5 h-5" /></div>
            <div>
              <p className="font-headline text-sm font-bold text-slate-900">Configuration</p>
              <p className="text-[10px] text-slate-500">Configure mentor profile</p>
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-600" /><span>{success}</span></div>}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-[#FAFAF8] border border-[#E5E4DE] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4 text-brand" />Online Status</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Available for On-Demand calls</p>
                  <p className="text-xs text-slate-500">Students can find you online and request instantly</p>
                </div>
                <button type="button" onClick={() => setIsOnline(!isOnline)} className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${isOnline ? 'bg-brand' : 'bg-slate-300'}`}><span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isOnline ? 'right-1' : 'left-1'}`} /></button>
              </div>
            </div>

            <div className="bg-[#FAFAF8] border border-[#E5E4DE] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center"><h2 className="text-base font-bold text-slate-900">Daily Availability</h2><span className="text-sm font-semibold text-brand">{dailyMinutes} min</span></div>
              <input type="range" min="15" max="180" step="15" value={dailyMinutes} onChange={e => setDailyMinutes(Number(e.target.value))} className="w-full accent-brand cursor-pointer" />
            </div>

            <div className="bg-[#FAFAF8] border border-[#E5E4DE] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-brand" />Operating Hours</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Time</label><input type="text" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-[#F5F4F0] border border-[#E5E4DE] rounded-xl px-3 py-2 text-sm w-full outline-none" /></div>
                <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">End Time</label><input type="text" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-[#F5F4F0] border border-[#E5E4DE] rounded-xl px-3 py-2 text-sm w-full outline-none" /></div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="bg-brand hover:bg-brand-600 text-white rounded-xl px-6 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">{isLoading ? 'Saving...' : 'Save Configuration'}</button>
          </form>
        </section>
      </div>
    </main>
  )
}
