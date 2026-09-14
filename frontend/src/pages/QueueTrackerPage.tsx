import React, { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Clock, ArrowLeft, AlertCircle, CheckCircle2, Loader2, PlayCircle, XCircle } from 'lucide-react'
import { useGetTicketByIdQuery, useGetQueuePositionQuery, useUpdateTicketStatusMutation } from '@/store/api/ticketApi'
import { socketService } from '@/services/socket.service'

export const QueueTrackerPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const { data: ticket, isLoading, refetch } = useGetTicketByIdQuery(ticketId || '', { skip: !ticketId })
  const { data: posData, refetch: refetchPos } = useGetQueuePositionQuery(ticketId || '', { skip: !ticketId || ticket?.status !== 'PENDING' })
  const [updateStatus, { isLoading: isCancelling }] = useUpdateTicketStatusMutation()

  useEffect(() => {
    socketService.connect()
    const onUp = () => { refetch(); refetchPos() }
    socketService.on('queueUpdate', onUp)
    socketService.on('sessionUpdate', onUp)
    return () => {
      socketService.off('queueUpdate', onUp)
      socketService.off('sessionUpdate', onUp)
    }
  }, [refetch, refetchPos])

  if (isLoading) return <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2"><Loader2 className="animate-spin text-[#5948d3]" /><p className="text-xs text-slate-500">Loading...</p></div>
  if (!ticket) return <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border text-center space-y-3"><AlertCircle className="mx-auto text-red-500" /><p className="text-sm">Ticket not found.</p><Link to="/student" className="inline-block px-4 py-2 bg-[#5948d3] text-white text-xs rounded-full">Back to Dashboard</Link></div>

  const pos = posData?.position ?? 1
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('/student')} className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold"><ArrowLeft className="w-4 h-4" /> Back</button>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5948d3]/10 text-[#5948d3]">Ticket #{ticket._id.slice(-6)}</span>
      </div>

      <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{ticket.topic}</h1>
          <p className="text-xs text-slate-500 mt-1">{ticket.description}</p>
        </div>

        {ticket.status === 'PENDING' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f4f4f1] p-4 rounded-xl flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#5948d3] text-white flex items-center justify-center font-bold text-lg">#{pos}</span>
              <div><p className="text-[10px] uppercase text-slate-400 font-semibold">Queue Position</p><p className="text-xs font-bold text-slate-700">{pos === 1 ? 'Next!' : `${pos - 1} ahead`}</p></div>
            </div>
            <div className="bg-[#f4f4f1] p-4 rounded-xl flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center"><Clock className="w-5 h-5" /></span>
              <div><p className="text-[10px] uppercase text-slate-400 font-semibold">Est. Wait</p><p className="text-xs font-bold text-slate-700">~{pos * 10}m</p></div>
            </div>
          </div>
        )}

        {ticket.status === 'ACTIVE' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" /><p className="text-xs font-bold text-emerald-900">Your session is active!</p></div>
            <button onClick={() => navigate(`/session/${ticket._id}`)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-full font-bold flex items-center gap-1"><PlayCircle className="w-4 h-4" /> Enter Focus Mode</button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex gap-1">{ticket.tags?.map(t => <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">#{t}</span>)}</div>
          {ticket.status === 'PENDING' && (
            <button onClick={async () => { if (confirm('Cancel ticket?')) { await updateStatus({ id: ticket._id, status: 'CANCELLED' }); navigate('/student') } }} disabled={isCancelling} className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs rounded-lg flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Cancel</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-3">Timeline</h3>
        <div className="space-y-3">
          {ticket.status_history?.map((h, i) => (
            <div key={i} className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5948d3] mt-1.5" />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-800">{h.status}</p>
                <p className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                {h.feedback_note && <p className="text-xs text-slate-500 italic mt-0.5">{h.feedback_note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
