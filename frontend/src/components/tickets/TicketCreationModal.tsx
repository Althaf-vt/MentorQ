import React, { useState } from 'react'
import { X, Send, Clock, Tag, AlertCircle, Check } from 'lucide-react'
import { useCreateTicketMutation } from '@/store/api/ticketApi'
import { useToast } from '@/context/ToastContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CATS = ['React', 'System Design', 'Database', 'API Design', 'DevOps', 'Frontend', 'Backend']

const ticketSchema = z.object({
  topic: z.string()
    .min(5, 'Topic must be at least 5 characters.')
    .max(100, 'Topic must be less than 100 characters.')
    .regex(/^[a-zA-Z].{2,}/, 'Topic must contain meaningful alphanumeric text.'),
  description: z.string()
    .min(15, 'Description must be at least 15 characters.')
    .max(1000, 'Description must be less than 1000 characters.')
    .regex(/[a-zA-Z]{3,}/, 'Description must be coherent prose.'),
  requested_minutes: z.number().min(5, 'Duration must be at least 5 minutes.'),
  tags: z.array(z.string().min(2).max(20).regex(/^[a-zA-Z0-9]+$/))
    .min(1, 'Please select at least 1 tag.')
    .max(5, 'You can select up to 5 tags.')
})

type TicketFormValues = z.infer<typeof ticketSchema>

export const TicketCreationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast()
  const [createTicket, { isLoading }] = useCreateTicketMutation()
  const [globalError, setGlobalError] = useState('')
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      topic: '',
      description: '',
      requested_minutes: 15,
      tags: ['React']
    }
  })

  if (!isOpen) return null

  const selectedTags = watch('tags')

  const toggleTag = (t: string) => {
    const current = selectedTags || []
    if (current.includes(t)) {
      setValue('tags', current.filter(x => x !== t), { shouldValidate: true })
    } else {
      if (current.length < 5) {
        setValue('tags', [...current, t], { shouldValidate: true })
      }
    }
  }

  const onSubmit = async (data: TicketFormValues) => {
    setGlobalError('')
    try {
      await createTicket(data).unwrap()
      showToast('Mentorship request submitted successfully!', 'success')
      reset()
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      const errMsg = err?.data?.message || 'Failed to submit ticket.'
      setGlobalError(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg)
      showToast('Validation failed. Please check your inputs.', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#faf9f7] rounded-2xl shadow-2xl border border-[#e1e3e0] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e0] bg-white">
          <div>
            <h2 className="font-bold text-lg text-slate-800">Request Mentorship Session</h2>
            <p className="text-xs text-slate-500">Submit your question to enter the queue</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {globalError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{globalError}</div>}
          
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Topic</label>
            <input 
              type="text" 
              {...register('topic')}
              placeholder="e.g. Debugging React useEffect loop" 
              className={`w-full px-3 py-2 rounded-xl border text-sm bg-white ${errors.topic ? 'border-red-500 focus:ring-red-500' : ''}`} 
            />
            {errors.topic && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.topic.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Description</label>
            <textarea 
              rows={3} 
              {...register('description')}
              placeholder="Problem description..." 
              className={`w-full px-3 py-2 rounded-xl border text-sm bg-white resize-none ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`} 
            />
            {errors.description && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-700 flex items-center gap-1 mb-1"><Clock className="w-3.5 h-3.5 text-[#5948d3]" /> Duration (Minutes)</label>
            <input 
              type="number"
              min="5"
              step="1"
              {...register('requested_minutes', { valueAsNumber: true })}
              className={`w-full px-3 py-2 rounded-xl border text-sm bg-white ${errors.requested_minutes ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.requested_minutes && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.requested_minutes.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-700 flex items-center gap-1 mb-1"><Tag className="w-3.5 h-3.5 text-[#5948d3]" /> Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {CATS.map(c => (
                <button 
                  key={c} 
                  type="button" 
                  onClick={() => toggleTag(c)} 
                  className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${selectedTags.includes(c) ? 'bg-[#5948d3] text-white' : 'bg-[#eeeeeb] text-slate-700'}`}
                >
                  {c}{selectedTags.includes(c) && <Check className="w-3 h-3" strokeWidth={3} />}
                </button>
              ))}
            </div>
            {errors.tags && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.tags.message}</p>}
          </div>

          <div className="pt-3 border-t border-[#e1e3e0] flex justify-between items-center">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-slate-600 text-sm">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-5 py-2 rounded-full bg-[#5948d3] hover:bg-[#4d39c7] text-white text-sm flex items-center gap-2 shadow disabled:opacity-50">
              <span>{isLoading ? 'Submitting...' : 'Submit Ticket'}</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
