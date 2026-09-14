import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mic, MicOff, Monitor, MessageSquare, Square, Clock, Share2, Pin } from 'lucide-react'
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

  // Media state - Microphone is MUTED by default on session entry
  const [mic, setMic] = useState(false)
  const [screen, setScreen] = useState(false)
  const [remoteScreen, setRemoteScreen] = useState(false)
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null)
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null)
  const [pinnedStream, setPinnedStream] = useState<'local' | 'remote'>('remote')
  const [chatOpen, setChatOpen] = useState(true)
  const [showRating, setShowRating] = useState(false)
  const [localMessages, setLocalMessages] = useState<Message[]>([])

  // Stream and WebRTC references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localAudioStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const screenSenderRef = useRef<RTCRtpSender | null>(null)
  const screenVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteScreenVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const makingOfferRef = useRef<boolean>(false)
  const ignoreOfferRef = useRef<boolean>(false)
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([])

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
            // Also check if sm matches an optimistic temporary message
            const tempIdx = merged.findIndex(
              (m) => m._id.startsWith('temp_') && m.message_text === sm.message_text && m.sender_id === sm.sender_id
            )
            if (tempIdx !== -1) {
              merged[tempIdx] = sm
            } else {
              merged.push(sm)
            }
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

  // Unlock browser audio autoplay on user gesture
  useEffect(() => {
    const unlockAudio = () => {
      if (remoteAudioRef.current && remoteAudioStreamRef.current) {
        if (remoteAudioRef.current.paused) {
          remoteAudioRef.current.play().catch(() => {})
        }
      }
    }
    window.addEventListener('click', unlockAudio)
    window.addEventListener('keydown', unlockAudio)
    return () => {
      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  // WebRTC Perfect Negotiation & Audio/Video Signaling Lifecycle
  // Dependent strictly on ticketId and user role to prevent tear-down when session queries resolve
  useEffect(() => {
    if (!ticketId) return
    const isPolite = user?.role !== 'MENTOR'
    const sessionId = ticketId

    const pc = new RTCPeerConnection(RTC_CONFIG)
    peerConnectionRef.current = pc

    // Helper to process buffered ICE candidates
    const processPendingCandidates = async () => {
      while (iceCandidatesQueueRef.current.length > 0) {
        const cand = iceCandidatesQueueRef.current.shift()
        if (cand && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand))
          } catch (e) {
            console.warn('Error applying queued ICE candidate:', e)
          }
        }
      }
    }

    // ICE candidates dispatch
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketService.emit('webrtc_signal', {
          ticketId,
          sessionId,
          data: { type: 'ice-candidate', candidate },
        })
      }
    }

    // Remote audio and video track handling
    pc.ontrack = (event) => {
      if (event.track.kind === 'audio') {
        const stream = event.streams[0] || new MediaStream([event.track])
        remoteAudioStreamRef.current = stream
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream
          remoteAudioRef.current.play().catch((err) => console.warn('Remote audio playback error:', err))
        }
      } else if (event.track.kind === 'video') {
        const stream = event.streams[0] || new MediaStream([event.track])
        setRemoteScreenStream(stream)
        setRemoteScreen(true)

        event.track.onended = () => {
          setRemoteScreen(false)
          setRemoteScreenStream(null)
        }
      }
    }

    // Offer generator helper
    const makeOffer = async () => {
      try {
        makingOfferRef.current = true
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socketService.emit('webrtc_signal', {
          ticketId,
          sessionId,
          data: { type: 'offer', sdp: pc.localDescription },
        })
      } catch (err) {
        console.error('WebRTC offer error:', err)
      } finally {
        makingOfferRef.current = false
      }
    }

    // Perfect negotiation: offer generation
    pc.onnegotiationneeded = async () => {
      await makeOffer()
    }

    // Acquire local microphone audio muted by default
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        localAudioStreamRef.current = stream
        stream.getAudioTracks().forEach((track) => {
          track.enabled = false // Muted by default
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
        if (data.type === 'peer_ready') {
          // A peer just joined or reconnected - initiate fresh offer if Mentor/initiator
          if (user?.role === 'MENTOR') {
            await makeOffer()
          }
        } else if (data.type === 'offer') {
          const offerCollision = makingOfferRef.current || currentPc.signalingState !== 'stable'
          ignoreOfferRef.current = !isPolite && offerCollision
          if (ignoreOfferRef.current) {
            return
          }
          await currentPc.setRemoteDescription(new RTCSessionDescription(data.sdp))
          await processPendingCandidates()
          const answer = await currentPc.createAnswer()
          await currentPc.setLocalDescription(answer)
          socketService.emit('webrtc_signal', {
            ticketId,
            sessionId,
            data: { type: 'answer', sdp: currentPc.localDescription },
          })
        } else if (data.type === 'answer') {
          if (currentPc.signalingState === 'have-local-offer') {
            await currentPc.setRemoteDescription(new RTCSessionDescription(data.sdp))
            await processPendingCandidates()
          }
        } else if (data.type === 'ice-candidate') {
          try {
            if (currentPc.remoteDescription && currentPc.remoteDescription.type) {
              await currentPc.addIceCandidate(new RTCIceCandidate(data.candidate))
            } else {
              iceCandidatesQueueRef.current.push(data.candidate)
            }
          } catch (err) {
            if (!ignoreOfferRef.current) {
              console.warn('Error adding ICE candidate:', err)
            }
          }
        } else if (data.type === 'screen_started') {
          setRemoteScreen(true)
        } else if (data.type === 'screen_stopped') {
          setRemoteScreen(false)
          setRemoteScreenStream(null)
        }
      } catch (err) {
        console.error('Error handling incoming WebRTC signal:', err)
      }
    }

    socketService.on('webrtc_signal', onWebRtcSignal)

    // Notify peers that this participant is ready
    socketService.emit('webrtc_signal', {
      ticketId,
      sessionId,
      data: { type: 'peer_ready' },
    })

    return () => {
      socketService.off('webrtc_signal', onWebRtcSignal)
      if (screenSenderRef.current && pc) {
        try {
          pc.removeTrack(screenSenderRef.current)
        } catch {}
      }
      pc.close()
      peerConnectionRef.current = null
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getTracks().forEach((t) => t.stop())
        localAudioStreamRef.current = null
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop())
        screenStreamRef.current = null
      }
      iceCandidatesQueueRef.current = []
    }
  }, [ticketId, user?.role])

  // Bind local screen video element to local stream (prevents blank canvas race)
  useEffect(() => {
    if (screenVideoRef.current && localScreenStream) {
      screenVideoRef.current.srcObject = localScreenStream
      screenVideoRef.current.play().catch((e) => console.warn('Local screen video play error:', e))
    }
  }, [localScreenStream, screen])

  // Bind remote screen video element to remote stream
  useEffect(() => {
    if (remoteScreenVideoRef.current && remoteScreenStream) {
      remoteScreenVideoRef.current.srcObject = remoteScreenStream
      remoteScreenVideoRef.current.play().catch((e) => console.warn('Remote screen video play error:', e))
    }
  }, [remoteScreenStream, remoteScreen])

  // WebSocket lifecycle & chat listeners
  useEffect(() => {
    socketService.connect()

    if (ticketId) {
      socketService.emit('joinTicket', ticketId)
      socketService.emit('joinSession', ticketId)
    }
    if (sId && sId !== ticketId) {
      socketService.emit('joinSession', sId)
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
        // Prevent duplicate append by _id
        if (prev.some((m) => m._id === msg._id)) return prev

        // If from current user, reconcile with optimistic temporary message
        if (msg.sender_id === user?.id) {
          const tempIdx = prev.findIndex(
            (m) => m._id.startsWith('temp_') && m.message_text === msg.message_text
          )
          if (tempIdx !== -1) {
            const updated = [...prev]
            updated[tempIdx] = msg
            return updated
          }
        }
        return [...prev, msg]
      })
    }

    const onSessionEnded = () => {
      setShowRating(true)
    }

    socketService.on('sessionUpdate', onSessionUpdate)
    socketService.on('timer_sync', onTimerSync)
    socketService.on('receiveMessage', onReceiveMessage)
    socketService.on('session_ended', onSessionEnded)

    return () => {
      if (ticketId) {
        socketService.emit('leaveTicket', ticketId)
        socketService.emit('leaveSession', ticketId)
      }
      if (sId && sId !== ticketId) {
        socketService.emit('leaveSession', sId)
      }
      socketService.off('sessionUpdate', onSessionUpdate)
      socketService.off('timer_sync', onTimerSync)
      socketService.off('receiveMessage', onReceiveMessage)
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

  // Stop local screen sharing and cleanup WebRTC track
  const stopLocalScreenShare = () => {
    if (screenSenderRef.current && peerConnectionRef.current) {
      try {
        peerConnectionRef.current.removeTrack(screenSenderRef.current)
      } catch (e) {
        console.warn('Error removing screen sender track:', e)
      }
      screenSenderRef.current = null
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop())
      screenStreamRef.current = null
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null
    }
    setLocalScreenStream(null)
    setScreen(false)

    socketService.emit('webrtc_signal', {
      ticketId,
      sessionId: sId || ticketId,
      data: { type: 'screen_stopped' },
    })
  }

  // Screen sharing toggle & WebRTC track control
  const handleToggleScreen = async () => {
    if (screen) {
      stopLocalScreenShare()
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        screenStreamRef.current = stream
        const videoTrack = stream.getVideoTracks()[0]

        if (peerConnectionRef.current && videoTrack) {
          try {
            const sender = peerConnectionRef.current.addTrack(videoTrack, stream)
            screenSenderRef.current = sender
          } catch (e) {
            console.warn('Error adding screen video track to peer connection:', e)
          }
        }

        setLocalScreenStream(stream)
        setScreen(true)

        socketService.emit('webrtc_signal', {
          ticketId,
          sessionId: sId || ticketId,
          data: { type: 'screen_started' },
        })

        if (videoTrack) {
          videoTrack.onended = () => {
            stopLocalScreenShare()
          }
        }
      } catch (err) {
        console.warn('Screen share cancelled or rejected:', err)
        setScreen(false)
      }
    }
  }

  // Message sending with optimistic local updates & REST persistence
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

    // Persist via REST API (which automatically broadcasts authoritative message via SessionsGateway)
    if (sId) {
      try {
        const confirmed = await sendMsg({ sessionId: sId, message_text: text }).unwrap()
        setLocalMessages((prev) => {
          const exists = prev.some((m) => m._id === confirmed._id)
          if (exists) {
            return prev.filter((m) => m._id !== tempId)
          }
          return prev.map((m) => (m._id === tempId ? confirmed : m))
        })
        refMsg()
      } catch (err) {
        console.error('Failed to persist message via REST API:', err)
      }
    }
  }

  // Session completion & ratings:
  // "End Session" triggers the confirmation/rating dialog without prematurely killing the session.
  const handleEndSession = () => {
    setShowRating(true)
  }

  // The actual session termination and review creation dispatch only upon explicit confirmation.
  const handleReviewSubmit = async (rating: number, feedbackText: string) => {
    if (sId) {
      try {
        await createReview({ sessionId: sId, rating, feedbackText }).unwrap()
      } catch (e) {
        console.error('Failed to submit review:', e)
      }
      try {
        await endSess({ id: sId }).unwrap()
      } catch (e) {
        console.error('Failed to end session:', e)
      }
    }
    setShowRating(false)
    navigate(user?.role === 'MENTOR' ? '/mentor' : '/student')
  }

  const format = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const hasLocalScreen = Boolean(screen && localScreenStream)
  const hasRemoteScreen = Boolean(remoteScreen && remoteScreenStream)
  const isDualScreen = hasLocalScreen && hasRemoteScreen
  const effectivePinned = isDualScreen
    ? pinnedStream
    : hasLocalScreen
    ? 'local'
    : 'remote'

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
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
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
          {/* Active Screen Sharing Viewport (Supports Concurrent Dual Sharing + Stream Pinning) */}
          {(hasLocalScreen || hasRemoteScreen) && (
            <div className="w-full max-w-3xl flex flex-col items-center gap-3">
              <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-[#5948d3]/60 aspect-video relative flex items-center justify-center group">
                {/* Primary Pinned Video Stream */}
                {effectivePinned === 'local' ? (
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    ref={remoteScreenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Primary Stream Active Badge */}
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur px-3 py-1 rounded-full text-[10px] text-white font-medium flex items-center gap-1.5 shadow">
                  <Share2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>
                    {effectivePinned === 'local' ? 'Your Screen (Pinned)' : "Peer's Screen (Pinned)"}
                  </span>
                </div>

                {/* Dual Screen: Pin Toggle Switch Button */}
                {isDualScreen && (
                  <button
                    onClick={() => setPinnedStream(effectivePinned === 'local' ? 'remote' : 'local')}
                    className="absolute top-3 right-3 bg-black/75 backdrop-blur hover:bg-black text-white px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow"
                    title="Swap primary pinned view"
                  >
                    <Pin className="w-3 h-3 text-[#8172fe]" />
                    <span>Swap Pinned View</span>
                  </button>
                )}

                {/* Dual Screen: Floating Secondary Picture-in-Picture Preview Window */}
                {isDualScreen && (
                  <div
                    onClick={() => setPinnedStream(effectivePinned === 'local' ? 'remote' : 'local')}
                    className="absolute bottom-3 right-3 w-44 sm:w-56 aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-2xl border-2 border-[#8172fe] cursor-pointer group/pip hover:scale-105 transition-transform z-10"
                    title="Click to Pin as primary view"
                  >
                    {effectivePinned === 'local' ? (
                      <video
                        ref={remoteScreenVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <video
                        ref={screenVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover/pip:bg-black/10 transition-colors flex items-end p-1.5">
                      <span className="bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[8px] text-white font-bold flex items-center gap-1 shadow">
                        <Pin className="w-2.5 h-2.5 text-[#8172fe]" />
                        <span>{effectivePinned === 'local' ? "Peer's Screen" : 'Your Screen'} • Click to Pin</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Countdown timer badge while screen is active */}
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border shadow-xs text-xs">
                <Clock className="w-3.5 h-3.5 text-[#5948d3] animate-pulse" />
                <span className={`font-mono font-bold ${timeLeft < 180 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {format(timeLeft)}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Remaining</span>
              </div>
            </div>
          )}

          {/* Synchronized Countdown Timer (shown when no screen is being shared) */}
          {!hasLocalScreen && !hasRemoteScreen && (
            <>
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
            </>
          )}
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
            className={`p-2.5 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              mic
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
            }`}
          >
            {mic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{mic ? 'Mute' : 'Unmute'}</span>
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={handleToggleScreen}
            title={screen ? 'Stop Screen Sharing' : 'Share Screen'}
            className={`p-2.5 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              screen
                ? 'bg-[#5948d3] hover:bg-[#4837b5] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">{screen ? 'Sharing' : 'Share Screen'}</span>
          </button>
        </div>

        {/* End Session Button (Opens confirmation dialog without terminating session) */}
        <button
          onClick={handleEndSession}
          disabled={isEnding || isReviewing}
          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-white" />
          <span>End Session</span>
        </button>
      </footer>

      {/* Post Session Review & Confirmation Modal */}
      {showRating && (
        <PostSessionReviewModal
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowRating(false)}
          isSubmitting={isEnding || isReviewing}
        />
      )}
    </div>
  )
}
