import React, { useState } from 'react'
import { X, Send, Clock, Tag, AlertCircle, Check } from 'lucide-react'
import { useCreateTicketMutation } from '@/store/api/ticketApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CATS = ['React', 'System Design', 'Database', 'API Design', 'DevOps', 'Frontend', 'Backend']
const DURS = [15, 30, 45, 60]

export const TicketCreationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [requestedMinutes, setRequestedMinutes] = useState(15)
  const [selectedTags, setSelectedTags] = useState<string[]>(['React'])
  const [errorMsg, setErrorMsg] = useState('')
  const [createTicket, { isLoading }] = useCreateTicketMutation()

  if (!isOpen) return null

  const toggleTag = (t: string) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!topic.trim() || !description.trim()) {
      setErrorMsg('Please fill in all fields.')
      return
    }
    try {
      await createTicket({ topic, description, requested_minutes: requestedMinutes, tags: selectedTags }).unwrap()
      setTopic('')
      setDescription('')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to submit ticket.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#faf9f7] rounded-2xl shadow-2xl border border-[#e1e3e0] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e0] bg-white">
          <div>
            <h2 className="font-bold text-lg text-slate-800">Request Mentorship Session</h2>
            <p className="text-xs text-slate-500">Submit your question to enter the queue</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Topic</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Debugging React useEffect loop" className="w-full px-3 py-2 rounded-xl border text-sm bg-white" required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Description</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Problem description..." className="w-full px-3 py-2 rounded-xl border text-sm bg-white resize-none" required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-700 flex items-center gap-1 mb-1"><Clock className="w-3.5 h-3.5 text-[#5948d3]" /> Duration: {requestedMinutes} min</label>
            <div className="grid grid-cols-4 gap-2">
              {DURS.map(m => (
                <button key={m} type="button" onClick={() => setRequestedMinutes(m)} className={`py-1.5 rounded-xl text-xs font-medium border ${requestedMinutes === m ? 'bg-[#5948d3] text-white' : 'bg-white text-slate-700'}`}>{m} min</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-700 flex items-center gap-1 mb-1"><Tag className="w-3.5 h-3.5 text-[#5948d3]" /> Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {CATS.map(c => (
                <button key={c} type="button" onClick={() => toggleTag(c)} className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${selectedTags.includes(c) ? 'bg-[#5948d3] text-white' : 'bg-[#eeeeeb] text-slate-700'}`}>{c}{selectedTags.includes(c) && <Check className="w-3 h-3" strokeWidth={3} />}</button>
              ))}
            </div>
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
