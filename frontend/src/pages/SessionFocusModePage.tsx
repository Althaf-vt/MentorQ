import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mic, MicOff, Monitor, MessageSquare, Share2 } from 'lucide-react'
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
import { useRoleAuth } from '@/store/hooks/useRoleAuth'
import { SessionChatDrawer } from '@/components/session/SessionChatDrawer'
import { PostSessionReviewModal } from '@/components/session/PostSessionReviewModal'
import mentorQLogo from '@/assets/mentorq-logo.svg?inline'
import {
  Badge,
  Button,
  Modal,
  lightTheme,
} from '@/design-system'
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
  const { user, activeRole } = useRoleAuth()

  // Media state - Microphone is MUTED by default on session entry
  const [mic, setMic] = useState(false)
  const [screen, setScreen] = useState(false)
  const [remoteScreen, setRemoteScreen] = useState(false)
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null)
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null)
  const [chatOpen, setChatOpen] = useState(true)
  const [showRating, setShowRating] = useState(false)
  const [studentRefused, setStudentRefused] = useState(false)
  const [peerEndedInfo, setPeerEndedInfo] = useState<{ endedByRole?: string; endedByUserId?: string } | null>(null)
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [isConfirmingStopScreen, setIsConfirmingStopScreen] = useState(false)

  // Stream and WebRTC references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const audioTransceiverRef = useRef<RTCRtpTransceiver | null>(null)
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
  const { data: ticketSession } = useGetSessionByTicketIdQuery(ticketId || '', { skip: !ticketId })
  const { data: stdSess } = useGetActiveStudentSessionQuery()
  const { data: mtrSess } = useGetActiveMentorSessionQuery()

  const activeSess = ticketSession || stdSess || mtrSess
  const sId = activeSess?._id

  // Chat queries & mutations
  const { data: serverMessages = [], refetch: refMsg } = useGetSessionMessagesQuery(sId || '', { skip: !sId })
  const [sendMsg] = useSendMessageMutation()
  const [endSess, { isLoading: isEnding }] = useEndSessionMutation()
  const [createReview, { isLoading: isReviewing }] = useCreateReviewMutation()

  // Live countdown timer state
  const totalDurationMinutes = ticket?.requested_minutes || 15
  const [timeLeft, setTimeLeft] = useState(totalDurationMinutes * 60)

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

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || peerEndedInfo) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [timeLeft, peerEndedInfo])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localAudioStreamRef.current?.getTracks().forEach((t) => t.stop())
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
    }
  }, [])

  // WebRTC & Socket setup
  useEffect(() => {
    socketService.connect()
    if (sId) {
      socketService.emit('joinSession', sId)
    }

    const initPeerConnection = () => {
      if (peerConnectionRef.current) return
      const pc = new RTCPeerConnection(RTC_CONFIG)
      peerConnectionRef.current = pc

      const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' })
      audioTransceiverRef.current = audioTransceiver

      pc.ontrack = (event) => {
        if (event.track.kind === 'audio') {
          const stream = event.streams[0] || new MediaStream([event.track])
          remoteAudioStreamRef.current = stream
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream
          }
        } else if (event.track.kind === 'video') {
          const stream = event.streams[0] || new MediaStream([event.track])
          setRemoteScreenStream(stream)
          setRemoteScreen(true)
          if (remoteScreenVideoRef.current) {
            remoteScreenVideoRef.current.srcObject = stream
          }
          event.track.onended = () => {
            setRemoteScreen(false)
            setRemoteScreenStream(null)
          }
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && sId) {
          socketService.emit('ice_candidate', {
            sessionId: sId,
            candidate: event.candidate,
          })
        }
      }

      pc.onnegotiationneeded = async () => {
        try {
          makingOfferRef.current = true
          await pc.setLocalDescription()
          if (sId && pc.localDescription) {
            socketService.emit('webrtc_offer', {
              sessionId: sId,
              sdp: pc.localDescription,
            })
          }
        } catch (err) {
          console.error('Negotiation error:', err)
        } finally {
          makingOfferRef.current = false
        }
      }
    }

    initPeerConnection()

    // Socket message handlers
    const onReceiveMessage = (data: Message) => {
      setLocalMessages((prev) => {
        const exists = prev.some((m) => m._id === data._id)
        if (exists) return prev
        const tempIdx = prev.findIndex(
          (m) => m._id.startsWith('temp_') && m.message_text === data.message_text && m.sender_id === data.sender_id
        )
        if (tempIdx !== -1) {
          const copy = [...prev]
          copy[tempIdx] = data
          return copy
        }
        return [...prev, data]
      })
    }

    const onOffer = async (data: { sdp: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current
      if (!pc) return
      try {
        const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable'
        ignoreOfferRef.current = !user?.id && offerCollision
        if (ignoreOfferRef.current) return

        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        if (sId) {
          socketService.emit('webrtc_answer', {
            sessionId: sId,
            sdp: pc.localDescription,
          })
        }
        while (iceCandidatesQueueRef.current.length > 0) {
          const candidate = iceCandidatesQueueRef.current.shift()
          if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate))
        }
      } catch (err) {
        console.error('Error handling offer:', err)
      }
    }

    const onAnswer = async (data: { sdp: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current
      if (!pc) return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        while (iceCandidatesQueueRef.current.length > 0) {
          const candidate = iceCandidatesQueueRef.current.shift()
          if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate))
        }
      } catch (err) {
        console.error('Error handling answer:', err)
      }
    }

    const onCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current
      if (!pc) return
      try {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
        } else {
          iceCandidatesQueueRef.current.push(data.candidate)
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err)
      }
    }

    const onPeerEnded = (data: { endedByRole?: string; endedByUserId?: string }) => {
      setPeerEndedInfo(data)
      setShowRating(true)
    }

    const onStudentRefused = () => {
      setStudentRefused(true)
    }

    socketService.on('receive_session_message', onReceiveMessage)
    socketService.on('webrtc_offer', onOffer)
    socketService.on('webrtc_answer', onAnswer)
    socketService.on('ice_candidate', onCandidate)
    socketService.on('session_ended_by_peer', onPeerEnded)
    socketService.on('student_refused_session', onStudentRefused)

    return () => {
      socketService.off('receive_session_message', onReceiveMessage)
      socketService.off('webrtc_offer', onOffer)
      socketService.off('webrtc_answer', onAnswer)
      socketService.off('ice_candidate', onCandidate)
      socketService.off('session_ended_by_peer', onPeerEnded)
      socketService.off('student_refused_session', onStudentRefused)
    }
  }, [sId, user?.id])

  // Mic toggling
  const handleToggleMic = async () => {
    if (!mic) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        localAudioStreamRef.current = stream
        const audioTrack = stream.getAudioTracks()[0]
        if (audioTransceiverRef.current) {
          audioTransceiverRef.current.sender.replaceTrack(audioTrack)
          audioTransceiverRef.current.direction = 'sendrecv'
        }
        setMic(true)
      } catch (err) {
        console.error('Mic access error:', err)
      }
    } else {
      localAudioStreamRef.current?.getTracks().forEach((t) => t.stop())
      localAudioStreamRef.current = null
      if (audioTransceiverRef.current) {
        audioTransceiverRef.current.sender.replaceTrack(null)
      }
      setMic(false)
    }
  }

  // Screen sharing
  const handleToggleScreen = async () => {
    if (!screen) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = stream
        setLocalScreenStream(stream)
        setScreen(true)

        const videoTrack = stream.getVideoTracks()[0]
        const pc = peerConnectionRef.current
        if (pc) {
          const sender = pc.addTrack(videoTrack, stream)
          screenSenderRef.current = sender
        }

        videoTrack.onended = () => {
          stopLocalScreenShare()
        }
      } catch (err) {
        console.error('Screen share error:', err)
      }
    } else {
      setIsConfirmingStopScreen(true)
    }
  }

  const stopLocalScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    screenStreamRef.current = null
    setLocalScreenStream(null)
    setScreen(false)

    if (screenSenderRef.current && peerConnectionRef.current) {
      try {
        peerConnectionRef.current.removeTrack(screenSenderRef.current)
      } catch (e) {
        console.warn(e)
      }
      screenSenderRef.current = null
    }
  }

  // Send message
  const handleSendMessage = async (text: string) => {
    if (!sId || !text.trim()) return
    const now = new Date().toISOString()
    const tempMessage: Message = {
      _id: `temp_${Date.now()}`,
      session_id: sId,
      sender_id: user?.id || '',
      message_text: text.trim(),
      sent_at: now,
      read_status: false,
      createdAt: now,
      updatedAt: now,
    }
    setLocalMessages((prev) => [...prev, tempMessage])

    try {
      await sendMsg({ sessionId: sId, message_text: text.trim() }).unwrap()
      refMsg()
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  // End session
  const handleEndSession = async () => {
    setConfirmEnd(false)
    if (!sId) return
    try {
      await endSess({ id: sId }).unwrap()
      if (sId) {
        socketService.emit('session_ended', {
          sessionId: sId,
          endedByRole: activeRole?.toUpperCase() || 'USER',
          endedByUserId: user?.id,
        })
      }
      setShowRating(true)
    } catch (err) {
      console.error('Failed to end session:', err)
      setShowRating(true)
    }
  }

  // Review submission
  const handleReviewSubmit = async (rating: number, feedbackText: string) => {
    if (sId) {
      try {
        await createReview({
          sessionId: sId,
          rating,
          feedbackText,
        }).unwrap()
      } catch (err) {
        console.error('Review submit error:', err)
      }
    }
    setShowRating(false)
    if (activeRole === 'mentor') {
      navigate('/mentor/dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  const handleAcknowledgeRefusal = () => {
    setStudentRefused(false)
    navigate('/mentor/dashboard')
  }

  const formatTimer = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const hasLocalScreen = Boolean(screen && localScreenStream)
  const hasRemoteScreen = Boolean(remoteScreen && remoteScreenStream)
  const isDualScreen = hasLocalScreen && hasRemoteScreen
  const progress = Math.max(0, Math.min(1, timeLeft / (totalDurationMinutes * 60)))
  const isEnded = timeLeft === 0 || Boolean(peerEndedInfo)

  const mentorNameDisplay =
    ticket?.mentor_id &&
    typeof ticket.mentor_id === 'object' &&
    'fullName' in ticket.mentor_id
      ? (ticket.mentor_id as { fullName?: string }).fullName
      : 'Mentor'

  return (
    <main className="preview-main live-room" aria-labelledby="live-title">
      {/* Hidden audio element for receiving peer audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* ── Live Room Top Bar ────────────────────────────────────── */}
      <div className="live-room-top">
        <img
          className="brand-mark"
          src={mentorQLogo}
          alt="MentorQ"
          width="58"
          height="38"
        />

        <div
          className="live-room-status"
          role="status"
          data-ended={isEnded}
        >
          <i aria-hidden="true" />
          <span>{isEnded ? 'Session ended' : 'Live focus session'}</span>
        </div>

        {ticketId && (
          <Badge tone="info" className="font-mono text-xs">
            #{ticketId.slice(-6).toUpperCase()}
          </Badge>
        )}

        {isEnded ? (
          <button
            className="play-intro live-exit"
            type="button"
            onClick={() =>
              navigate(activeRole === 'mentor' ? '/mentor/dashboard' : '/dashboard')
            }
          >
            Back to dashboard
          </button>
        ) : (
          <button
            className="live-end"
            type="button"
            onClick={() => setConfirmEnd(true)}
          >
            End session
          </button>
        )}
      </div>

      {/* ── 2-Column Live Layout ──────────────────────────────────── */}
      <div className="live-layout">
        {/* Left Column: Ticket details, timer clock & media viewport */}
        <section
          className="live-session-ticket"
          aria-labelledby="live-title"
          data-mqds={lightTheme}
        >
          <p className="live-mentor-name">
            {activeRole === 'mentor'
              ? `Working with Student`
              : `Guided by ${mentorNameDisplay}`}
          </p>
          <h1 id="live-title">{ticket?.topic || 'Focus Session'}</h1>

          {/* Prominent Live Clock matching preview.html */}
          <div className="live-clock">
            <span>{isEnded ? 'Time left at end' : 'Time remaining'}</span>
            <strong
              role="timer"
              aria-label={`${timeLeft} seconds remaining`}
            >
              {formatTimer(timeLeft)}
            </strong>
            <progress
              max="1"
              value={progress}
              aria-label="Time remaining in this session"
            />
          </div>

          {/* Doubt Scope / Problem Description */}
          {ticket?.description && !hasLocalScreen && !hasRemoteScreen && (
            <div
              style={{
                margin: '20px 28px',
                padding: '14px 18px',
                borderRadius: 9,
                background: '#fffdfa',
                border: '1px solid #dacbe7',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                color: 'var(--mqds-ink)',
              }}
            >
              <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--mqds-muted-ink)', marginBottom: 4 }}>
                Session Scope
              </strong>
              {ticket.description}
            </div>
          )}

          {/* Active Screen Sharing Viewport */}
          {(hasLocalScreen || hasRemoteScreen) && (
            <div style={{ margin: '20px 28px' }}>
              {isDualScreen ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="w-full bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                    <video
                      ref={(el) => {
                        screenVideoRef.current = el
                        if (el && localScreenStream && el.srcObject !== localScreenStream) {
                          el.srcObject = localScreenStream
                          el.play().catch(() => {})
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-black/80 px-2.5 py-1 rounded-full text-[10px] text-white flex items-center gap-1 font-mono">
                      <Share2 className="w-3 h-3 text-emerald-400" />
                      <span>Your Screen</span>
                    </div>
                  </div>

                  <div className="w-full bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                    <video
                      ref={(el) => {
                        remoteScreenVideoRef.current = el
                        if (el && remoteScreenStream && el.srcObject !== remoteScreenStream) {
                          el.srcObject = remoteScreenStream
                          el.play().catch(() => {})
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-black/80 px-2.5 py-1 rounded-full text-[10px] text-white flex items-center gap-1 font-mono">
                      <Share2 className="w-3 h-3 text-[#c8aff7]" />
                      <span>{activeRole === 'mentor' ? "Student's Screen" : "Mentor's Screen"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                  <video
                    ref={(el) => {
                      const targetStream = localScreenStream || remoteScreenStream
                      if (el && targetStream && el.srcObject !== targetStream) {
                        el.srcObject = targetStream
                        el.play().catch(() => {})
                      }
                    }}
                    autoPlay
                    playsInline
                    muted={Boolean(localScreenStream)}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 px-2.5 py-1 rounded-full text-[10px] text-white flex items-center gap-1 font-mono">
                    <Share2 className="w-3 h-3 text-emerald-400" />
                    <span>{hasLocalScreen ? 'Your Screen (Sharing)' : 'Peer Screen'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Media Control Toolbar */}
          <div
            style={{
              padding: '14px 28px',
              borderTop: '1px solid #dacbe7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Mic toggle */}
              <Button
                variant={mic ? 'secondary' : 'danger'}
                onClick={handleToggleMic}
                className="flex items-center gap-1.5 text-xs !min-h-0 !py-1.5"
                title={mic ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {mic ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                <span>{mic ? 'Mute' : 'Unmute'}</span>
              </Button>

              {/* Screen share toggle */}
              <Button
                variant={screen ? 'primary' : 'secondary'}
                onClick={handleToggleScreen}
                className="flex items-center gap-1.5 text-xs !min-h-0 !py-1.5"
                title={screen ? 'Stop Screen Sharing' : 'Share Screen'}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{screen ? 'Sharing' : 'Share Screen'}</span>
              </Button>
            </div>

            {/* Chat toggle for compact views */}
            <Button
              variant={chatOpen ? 'secondary' : 'primary'}
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center gap-1.5 text-xs !min-h-0 !py-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{chatOpen ? 'Hide Chat' : `Chat (${localMessages.length})`}</span>
            </Button>
          </div>
        </section>

        {/* Right Column: Real-time Live Session Chat Drawer */}
        {chatOpen && (
          <SessionChatDrawer
            messages={localMessages}
            currentUserId={user?.id}
            mentorName={mentorNameDisplay}
            studentName={ticket?.student_id && typeof ticket.student_id === 'object' && 'fullName' in ticket.student_id ? (ticket.student_id as { fullName?: string }).fullName : 'Student'}
            onClose={() => setChatOpen(false)}
            onSendMessage={handleSendMessage}
            isMentor={activeRole === 'mentor'}
            isEnded={isEnded}
          />
        )}
      </div>

      {/* ── End Session Confirmation Modal ───────────────────────── */}
      <Modal
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        variant="danger"
        title="End this session?"
        description="The timer will stop, audio and screen sharing will disconnect, and the chat will become read-only. You will then be prompted to leave review feedback."
        actions={
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="secondary" onClick={() => setConfirmEnd(false)}>
              Keep session going
            </Button>
            <Button
              variant="danger"
              disabled={isEnding || isReviewing}
              onClick={handleEndSession}
            >
              {isEnding ? 'Ending…' : 'End session'}
            </Button>
          </div>
        }
      />

      {/* ── Stop Screen Share Confirmation Modal ─────────────────── */}
      <Modal
        open={isConfirmingStopScreen}
        onOpenChange={setIsConfirmingStopScreen}
        variant="danger"
        title="Stop Sharing Screen?"
        description="Are you sure you want to stop sharing your screen? Your peer will no longer be able to see it."
        actions={
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="secondary" onClick={() => setIsConfirmingStopScreen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                stopLocalScreenShare()
                setIsConfirmingStopScreen(false)
              }}
            >
              Stop Sharing
            </Button>
          </div>
        }
      />

      {/* ── Post Session Review Modal ────────────────────────────── */}
      {showRating && (
        <PostSessionReviewModal
          onSubmit={handleReviewSubmit}
          onCancel={peerEndedInfo ? undefined : () => setShowRating(false)}
          isSubmitting={isEnding || isReviewing}
          isForcedEnd={Boolean(peerEndedInfo)}
          endedByRole={peerEndedInfo?.endedByRole}
        />
      )}

      {/* ── Student Refused Modal ────────────────────────────────── */}
      <Modal
        open={studentRefused}
        onOpenChange={(open) => {
          if (!open) handleAcknowledgeRefusal()
        }}
        variant="ticket"
        ticketHeader={{
          leading: 'MQ',
          label: 'SESSION NOTICE',
        }}
        title="Session Declined"
        description="The student declined to join the focus session. The session has concluded."
        actions={
          <Button variant="primary" onClick={handleAcknowledgeRefusal} className="w-full justify-center">
            Go to Dashboard
          </Button>
        }
      />
    </main>
  )
}
