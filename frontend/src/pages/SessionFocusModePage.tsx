import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mic, MicOff, Monitor, MessageSquare, Square, Clock, AlertCircle, Share2, Video } from 'lucide-react'
import { useGetTicketByIdQuery } from '@/store/api/ticketApi'
import {
  useGetActiveStudentSessionQuery,
  useGetActiveMentorSessionQuery,
  useGetSessionByTicketIdQuery,
  useEndSessionMutation,
} from '@/store/api/sessionApi'
import { useGetSessionMessagesQuery, useSendMessageMutation } from '@/store/api/chatApi'
import { useCreateReviewMutation } from '@/store/api/reviewApi'
import { socketService } from '@/services/socket.service'
import { useAppSelector } from '@/store/hooks'
import { SessionChatDrawer } from '@/components/session/SessionChatDrawer'
import { PostSessionReviewModal } from '@/components/session/PostSessionReviewModal'
import type { Message } from '@/types/operational.types'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
}

export const SessionFocusModePage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)

  // Media state
  const [mic, setMic] = useState(true)
  const [screen, setScreen] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)
  const [showRating, setShowRating] = useState(false)
  const [localMessages, setLocalMessages] = useState<Message[]>([])

  // Stream and WebRTC references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localAudioStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const screenVideoRef = useRef<HTMLVideoElement | null>(null)
  const makingOfferRef = useRef<boolean>(false)
  const ignoreOfferRef = useRef<boolean>(false)

  // Fetch ticket and session data
  const { data: ticket } = useGetTicketByIdQuery(ticketId || '', { skip: !ticketId })
  const { data: ticketSession, refetch: refTicketSess } = useGetSessionByTicketIdQuery(ticketId || '', { skip: !ticketId })
  const { data: stdSess, refetch: refStd } = useGetActiveStudentSessionQuery()
  const { data: mtrSess, refetch: refMtr } = useGetActiveMentorSessionQuery()

  const activeSess = ticketSession || stdSess || mtrSess
  const sId = activeSess?._id

  // Chat queries & mutations
  const { data: serverMessages = [], refetch: refMsg } = useGetSessionMessagesQuery(sId || '', { skip: !sId })
  const [sendMsg] = useSendMessageMutation()
  const [endSess, { isLoading: isEnding }] = useEndSessionMutation()
  const [createReview, { isLoading: isReviewing }] = useCreateReviewMutation()

  // Live countdown timer state
  const [timeLeft, setTimeLeft] = useState(15 * 60)

  // Sync server messages into localMessages
  useEffect(() => {
    if (serverMessages.length > 0) {
      setLocalMessages((prev) => {
        const merged = [...prev]
        serverMessages.forEach((sm) => {
          const idx = merged.findIndex((m) => m._id === sm._id)
          if (idx !== -1) {
            merged[idx] = sm
          } else {
            merged.push(sm)
          }
        })
        return merged
      })
    }
  }, [serverMessages])

  // Countdown timer synchronization
  useEffect(() => {
    const alloc = (activeSess?.allocated_minutes || ticket?.requested_minutes || 15) + (activeSess?.extended_minutes || 0)
    const startTimeRaw = activeSess?.started_at || (ticket as any)?.updatedAt || (ticket as any)?.created_at
    const start = startTimeRaw ? new Date(startTimeRaw).getTime() : Date.now()
    const endTime = start + alloc * 60 * 1000

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [activeSess, ticket])

  // WebRTC Perfect Negotiation & Audio Signaling Lifecycle
  useEffect(() => {
    const isPolite = user?.role !== 'MENTOR'
    const sessionId = sId || ticketId
    if (!sessionId) return

    const pc = new RTCPeerConnection(RTC_CONFIG)
    peerConnectionRef.current = pc

    // ICE candidates dispatch
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketService.emit('webrtc_signal', {
          sessionId,
          data: { type: 'ice-candidate', candidate },
        })
      }
    }

    // Remote audio track handling
    pc.ontrack = (event) => {
      if (event.track.kind === 'audio') {
        const stream = event.streams[0] || new MediaStream([event.track])
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream
          remoteAudioRef.current.play().catch((err) => console.warn('Remote audio playback error:', err))
        }
      }
    }

    // Perfect negotiation: offer generation
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true
        await pc.setLocalDescription()
        socketService.emit('webrtc_signal', {
          sessionId,
          data: { type: 'offer', sdp: pc.localDescription },
        })
      } catch (err) {
        console.error('WebRTC negotiation error:', err)
      } finally {
        makingOfferRef.current = false
      }
    }

    // Acquire local microphone audio and attach to peer connection
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        localAudioStreamRef.current = stream
        stream.getAudioTracks().forEach((track) => {
          track.enabled = mic
          try {
            pc.addTrack(track, stream)
          } catch (e) {
            console.warn('Error adding audio track to pc:', e)
          }
        })
      })
      .catch((err) => {
        console.warn('Microphone permission not granted yet or unavailable:', err)
      })

    // WebRTC signaling receiver
    const onWebRtcSignal = async (payload: { senderId: string; data: any }) => {
      const data = payload?.data
      if (!data || !peerConnectionRef.current) return
      const currentPc = peerConnectionRef.current

      try {
        if (data.type === 'offer') {
          const offerCollision = makingOfferRef.current || currentPc.signalingState !== 'stable'
          ignoreOfferRef.current = !isPolite && offerCollision
          if (ignoreOfferRef.current) {
            return
          }
          await currentPc.setRemoteDescription(new RTCSessionDescription(data.sdp))
          await currentPc.setLocalDescription()
          socketService.emit('webrtc_signal', {
            sessionId,
            data: { type: 'answer', sdp: currentPc.localDescription },
          })
        } else if (data.type === 'answer') {
          if (currentPc.signalingState === 'have-local-offer') {
            await currentPc.setRemoteDescription(new RTCSessionDescription(data.sdp))
          }
        } else if (data.type === 'ice-candidate') {
          try {
            await currentPc.addIceCandidate(new RTCIceCandidate(data.candidate))
          } catch (err) {
            if (!ignoreOfferRef.current) {
              console.warn('Error adding ICE candidate:', err)
            }
          }
        }
      } catch (err) {
        console.error('Error handling incoming WebRTC signal:', err)
      }
    }

    socketService.on('webrtc_signal', onWebRtcSignal)

    return () => {
      socketService.off('webrtc_signal', onWebRtcSignal)
      pc.close()
      peerConnectionRef.current = null
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getTracks().forEach((t) => t.stop())
        localAudioStreamRef.current = null
      }
    }
  }, [sId, ticketId, user?.role])

  // WebSocket lifecycle & event listeners
  useEffect(() => {
    socketService.connect()

    if (sId) {
      socketService.emit('joinSession', sId)
    }
    if (ticketId) {
      socketService.emit('joinTicket', ticketId)
    }
    if (user?.id) {
      socketService.emit('joinUser', user.id)
    }

    const onSessionUpdate = () => {
      refTicketSess()
      refStd()
      refMtr()
      refMsg()
    }

    const onTimerSync = (data: { remainingSeconds: number }) => {
      if (typeof data?.remainingSeconds === 'number') {
        setTimeLeft(data.remainingSeconds)
      }
    }

    const onReceiveMessage = (msg: Message) => {
      setLocalMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev
        return [...prev, msg]
      })
    }

    const onSessionEnded = () => {
      setShowRating(true)
    }

    socketService.on('sessionUpdate', onSessionUpdate)
    socketService.on('timer_sync', onTimerSync)
    socketService.on('receiveMessage', onReceiveMessage)
    socketService.on('newMessage', onReceiveMessage)
    socketService.on('session_ended', onSessionEnded)

    return () => {
      if (sId) socketService.emit('leaveSession', sId)
      if (ticketId) socketService.emit('leaveTicket', ticketId)
      socketService.off('sessionUpdate', onSessionUpdate)
      socketService.off('timer_sync', onTimerSync)
      socketService.off('receiveMessage', onReceiveMessage)
      socketService.off('newMessage', onReceiveMessage)
      socketService.off('session_ended', onSessionEnded)
    }
  }, [sId, ticketId, user?.id, refTicketSess, refStd, refMtr, refMsg])

  // Microphone toggle & WebRTC audio track control
  const handleToggleMic = async () => {
    const nextMic = !mic
    try {
      if (!localAudioStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        localAudioStreamRef.current = stream
        if (peerConnectionRef.current) {
          stream.getAudioTracks().forEach((track) => {
            track.enabled = nextMic
            peerConnectionRef.current?.addTrack(track, stream)
          })
        }
        setMic(nextMic)
        return
      }

      localAudioStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextMic
      })
      setMic(nextMic)
    } catch (err) {
      console.warn('Microphone permission or hardware access unavailable:', err)
      setMic(false)
    }
  }

  // Screen sharing toggle & WebRTC track control
  const handleToggleScreen = async () => {
    if (screen) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop())
        screenStreamRef.current = null
      }
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null
      }
      setScreen(false)
      socketService.emit('webrtc_signal', {
        sessionId: sId || ticketId,
        data: { type: 'screen_stopped' },
      })
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = stream
        setScreen(true)

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream
          screenVideoRef.current.play().catch(console.error)
        }

        socketService.emit('webrtc_signal', {
          sessionId: sId || ticketId,
          data: { type: 'screen_started' },
        })

        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          videoTrack.onended = () => {
            if (screenStreamRef.current) {
              screenStreamRef.current.getTracks().forEach((t) => t.stop())
              screenStreamRef.current = null
            }
            if (screenVideoRef.current) {
              screenVideoRef.current.srcObject = null
            }
            setScreen(false)
            socketService.emit('webrtc_signal', {
              sessionId: sId || ticketId,
              data: { type: 'screen_stopped' },
            })
          }
        }
      } catch (err) {
        console.warn('Screen share cancelled or rejected:', err)
        setScreen(false)
      }
    }
  }

  // Message sending with optimistic local updates
  const handleSendMessage = async (text: string) => {
    const tempId = `temp_${Date.now()}`
    const optimisticMsg: Message = {
      _id: tempId,
      session_id: (sId || ticketId) as any,
      sender_id: (user?.id || 'me') as any,
      message_text: text,
      sent_at: new Date().toISOString() as any,
    }

    // Optimistically update chat immediately
    setLocalMessages((prev) => [...prev, optimisticMsg])

    // Broadcast over WebSocket for real-time delivery
    socketService.emit('sendMessage', {
      sessionId: sId || ticketId,
      message: optimisticMsg,
    })

    if (sId) {
      try {
        const confirmed = await sendMsg({ sessionId: sId, message_text: text }).unwrap()
        setLocalMessages((prev) => prev.map((m) => (m._id === tempId ? confirmed : m)))
        refMsg()
      } catch (err) {
        console.error('Failed to persist message via REST API:', err)
      }
    }
  }

  // Session completion & ratings
  const handleEndSession = async () => {
    if (sId) {
      try {
        await endSess({ id: sId }).unwrap()
        setShowRating(true)
      } catch {
        setShowRating(true)
      }
    } else {
      setShowRating(true)
    }
  }

  const handleReviewSubmit = async (rating: number, feedbackText: string) => {
    if (sId) {
      try {
        await createReview({ sessionId: sId, rating, feedbackText }).unwrap()
      } catch (e) {
        console.error(e)
      }
    }
    setShowRating(false)
    navigate(user?.role === 'MENTOR' ? '/mentor' : '/student')
  }

  const format = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="relative min-h-[92vh] w-full bg-[#f5f4f0] text-slate-900 flex flex-col justify-between font-body">
      {/* Hidden audio element for receiving peer audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Header */}
      <header className="relative z-20 px-6 py-4 border-b bg-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <h1 className="font-bold text-sm text-slate-900">{ticket?.topic || 'Live Focus Session'}</h1>
            <p className="text-[10px] text-slate-500">
              Live Focus Mode • Ticket #{ticketId?.slice(-6) || ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              chatOpen
                ? 'bg-[#5948d3] text-white border-[#5948d3] shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat ({localMessages.length})</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 overflow-y-auto">
          {/* Active Screen Share Video Container */}
          {screen && (
            <div className="w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-[#5948d3]/30 aspect-video relative flex items-center justify-center">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur px-3 py-1 rounded-full text-[10px] text-white font-medium flex items-center gap-1.5">
                <Share2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Screen Sharing Active</span>
              </div>
            </div>
          )}

          {/* Synchronized Countdown Timer */}
          <div className="relative flex flex-col items-center justify-center w-60 h-60 rounded-full border-4 border-[#5948d3]/20 bg-white shadow-xl">
            <Clock className="w-7 h-7 text-[#5948d3] mb-1 animate-pulse" />
            <span
              className={`font-mono text-4xl font-extrabold tracking-tight ${
                timeLeft < 180 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {format(timeLeft)}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Remaining Time</span>
            {timeLeft === 0 && (
              <span className="text-[10px] font-bold text-rose-500 mt-1">Time Expired</span>
            )}
          </div>

          <div className="max-w-md bg-white p-4 rounded-xl border shadow-sm text-left">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Doubt Scope</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ticket?.description || 'Active live collaboration session between mentor and student.'}
            </p>
          </div>
        </div>

        {/* Chat Drawer with Optimistic Updates */}
        {chatOpen && (
          <SessionChatDrawer
            messages={localMessages}
            currentUserId={user?.id}
            onClose={() => setChatOpen(false)}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>

      {/* Control Footer */}
      <footer className="px-6 py-3 bg-white border-t flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2">
          {/* Audio Mic Toggle */}
          <button
            onClick={handleToggleMic}
            title={mic ? 'Mute Microphone' : 'Unmute Microphone'}
            className={`p-2.5 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              mic
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
            }`}
          >
            {mic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{mic ? 'Mute' : 'Unmuted'}</span>
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={handleToggleScreen}
            title={screen ? 'Stop Screen Sharing' : 'Share Screen'}
            className={`p-2.5 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              screen
                ? 'bg-[#5948d3] hover:bg-[#4837b5] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">{screen ? 'Sharing' : 'Share Screen'}</span>
          </button>
        </div>

        {/* End Session Button */}
        <button
          onClick={handleEndSession}
          disabled={isEnding}
          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          <Square className="w-3.5 h-3.5 fill-white" />
          <span>{isEnding ? 'Ending...' : 'End Session'}</span>
        </button>
      </footer>

      {/* Post Session Review Modal */}
      {showRating && (
        <PostSessionReviewModal onSubmit={handleReviewSubmit} isSubmitting={isReviewing} />
      )}
    </div>
  )
}
