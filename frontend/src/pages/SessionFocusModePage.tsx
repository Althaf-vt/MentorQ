import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mic, MicOff, Monitor, MessageSquare, Square, Clock } from 'lucide-react'
import { useGetTicketByIdQuery } from '@/store/api/ticketApi'
import { useGetActiveStudentSessionQuery, useGetActiveMentorSessionQuery, useEndSessionMutation } from '@/store/api/sessionApi'
import { useGetSessionMessagesQuery, useSendMessageMutation } from '@/store/api/chatApi'
import { useCreateReviewMutation } from '@/store/api/reviewApi'
import { socketService } from '@/services/socket.service'
import { useAppSelector } from '@/store/hooks'
import { SessionChatDrawer } from '@/components/session/SessionChatDrawer'
import { PostSessionReviewModal } from '@/components/session/PostSessionReviewModal'

export const SessionFocusModePage: React.FC = () => {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const user = useAppSelector(s => s.auth.user)
  const [mic, setMic] = useState(true)
  const [screen, setScreen] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)
  const [showRating, setShowRating] = useState(false)

  const { data: ticket } = useGetTicketByIdQuery(ticketId || '', { skip: !ticketId })
  const { data: stdSess, refetch: refStd } = useGetActiveStudentSessionQuery()
  const { data: mtrSess, refetch: refMtr } = useGetActiveMentorSessionQuery()
  const activeSess = stdSess || mtrSess
  const sId = activeSess?._id

  const { data: messages = [], refetch: refMsg } = useGetSessionMessagesQuery(sId || '', { skip: !sId })
  const [sendMsg] = useSendMessageMutation()
  const [endSess, { isLoading: isEnding }] = useEndSessionMutation()
  const [createReview, { isLoading: isReviewing }] = useCreateReviewMutation()
  const [timeLeft, setTimeLeft] = useState(15 * 60)

  useEffect(() => {
    if (!activeSess) return
    const alloc = (activeSess.allocated_minutes || 15) + (activeSess.extended_minutes || 0)
    const start = new Date(activeSess.started_at || activeSess.createdAt).getTime()
    const update = () => setTimeLeft(Math.max(0, Math.floor((start + alloc * 60 * 1000 - Date.now()) / 1000)))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [activeSess])

  useEffect(() => {
    if (!sId) return
    socketService.connect()
    socketService.emit('joinSession', sId)
    const cb = () => { refStd(); refMtr(); refMsg() }
    socketService.on('sessionUpdate', cb)
    return () => { socketService.emit('leaveSession', sId); socketService.off('sessionUpdate', cb) }
  }, [sId, refStd, refMtr, refMsg])

  const handleSendMessage = async (text: string) => { if (sId) { await sendMsg({ sessionId: sId, message_text: text }).unwrap(); refMsg() } }
  const handleEndSession = async () => { if (!sId) return; try { await endSess({ id: sId }).unwrap(); setShowRating(true) } catch { setShowRating(true) } }
  const handleReviewSubmit = async (rating: number, feedbackText: string) => {
    if (sId) { try { await createReview({ sessionId: sId, rating, feedbackText }).unwrap() } catch (e) { console.error(e) } }
    setShowRating(false)
    navigate(user?.role === 'MENTOR' ? '/mentor' : '/student')
  }

  const format = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  return (
    <div className="relative min-h-[92vh] w-full bg-[#f5f4f0] text-slate-900 flex flex-col justify-between font-body">
      <header className="relative z-20 px-6 py-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <h1 className="font-bold text-sm text-slate-900">{ticket?.topic || 'Live Session'}</h1>
            <p className="text-[10px] text-slate-500">Live Focus Mode</p>
          </div>
        </div>
        <button onClick={() => setChatOpen(!chatOpen)} className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${chatOpen ? 'bg-[#5948d3] text-white border-[#5948d3]' : 'bg-white text-slate-700'}`}>
          <MessageSquare className="w-3 h-3" />
          <span>Chat ({messages.length})</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="relative flex flex-col items-center justify-center w-64 h-64 rounded-full border-4 border-[#5948d3]/20 bg-white shadow-xl">
            <Clock className="w-8 h-8 text-[#5948d3] mb-1" />
            <span className="font-mono text-4xl font-extrabold tracking-tight">{format(timeLeft)}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Remaining Time</span>
          </div>
          <p className="text-xs text-slate-600 max-w-sm">{ticket?.description || 'Active live collaboration'}</p>
        </div>
        {chatOpen && <SessionChatDrawer messages={messages} currentUserId={user?.id} onClose={() => setChatOpen(false)} onSendMessage={handleSendMessage} />}
      </div>

      <footer className="px-6 py-3 bg-white border-t flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setMic(!mic)} className={`p-2.5 rounded-full ${mic ? 'bg-slate-100 text-slate-700' : 'bg-red-500 text-white'}`}>{mic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}</button>
          <button onClick={() => setScreen(!screen)} className={`p-2.5 rounded-full ${screen ? 'bg-[#5948d3] text-white' : 'bg-slate-100 text-slate-700'}`}><Monitor className="w-4 h-4" /></button>
        </div>
        <button onClick={handleEndSession} disabled={isEnding} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full shadow flex items-center gap-2 disabled:opacity-50">
          <Square className="w-3.5 h-3.5 fill-white" />
          <span>{isEnding ? 'Ending...' : 'End Session'}</span>
        </button>
      </footer>

      {showRating && <PostSessionReviewModal onSubmit={handleReviewSubmit} isSubmitting={isReviewing} />}
    </div>
  )
}
