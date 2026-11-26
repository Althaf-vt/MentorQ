import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, ArrowLeft, CheckCircle2, PlayCircle, XCircle, MessageSquare, Radio } from 'lucide-react'
import { useGetTicketByIdQuery, useGetQueuePositionQuery, useUpdateTicketStatusMutation } from '@/store/api/ticketApi'
import { socketService } from '@/services/socket.service'
import { playNotificationSound } from '@/utils/audioUtils'
import { useAppSelector } from '@/store/hooks'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Loader,
  Modal,
} from '@/design-system'

export const QueueTrackerPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const { data: ticket, isLoading, refetch } = useGetTicketByIdQuery(ticketId || '', { skip: !ticketId })
  const { data: posData, refetch: refetchPos } = useGetQueuePositionQuery(ticketId || '', { skip: !ticketId || ticket?.status !== 'PENDING' })
  const [updateStatus, { isLoading: isCancelling }] = useUpdateTicketStatusMutation()
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  useEffect(() => {
    socketService.connect()
    if (ticketId) {
      socketService.emit('joinTicket', ticketId)
    }
    if (user?.id) {
      socketService.emit('joinUser', user.id)
    }

    const onUp = () => {
      refetch()
      refetchPos()
    }
    const onFocusStarted = (data: unknown) => {
      console.log('Focus mode started event received:', data)
      playNotificationSound()
      refetch()
      refetchPos()
    }

    socketService.on('focus_mode_started', onFocusStarted)
    socketService.on('queueUpdate', onUp)
    socketService.on('sessionUpdate', onUp)

    return () => {
      if (ticketId) socketService.emit('leaveTicket', ticketId)
      socketService.off('focus_mode_started', onFocusStarted)
      socketService.off('queueUpdate', onUp)
      socketService.off('sessionUpdate', onUp)
    }
  }, [ticketId, user?.id, refetch, refetchPos])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader />
        <p className="text-xs font-mono text-[var(--mqds-muted)]">Loading ticket status...</p>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto my-12 p-8">
        <EmptyState
          title="Ticket Not Found"
          description="The requested ticket could not be found or has expired."
          action={
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          }
        />
      </div>
    )
  }

  const pos = posData?.position ?? 1
  const currentTicketId = ticket._id || ticket.id || ticketId || ''

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation & Header */}
      <div className="flex justify-between items-center">
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          className="!p-2 !min-h-0 text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--mqds-muted)] bg-[var(--mqds-surface)] px-2.5 py-1 rounded-full border border-[var(--mqds-border-subtle)]">
            <Radio className="w-3 h-3 text-[var(--mqds-primary)] animate-pulse" />
            <span>Live Queue</span>
          </span>
          <Badge tone="info" className="font-mono text-xs">
            #{currentTicketId ? currentTicketId.slice(-6).toUpperCase() : '------'}
          </Badge>
        </div>
      </div>

      {/* Position Hero Card */}
      {ticket.status === 'PENDING' && (
        <Card variant="paper" className="p-8 sm:p-10 text-center relative overflow-hidden shadow-md border border-[var(--mqds-paper-border)]">
          <div className="relative z-10 flex justify-center mb-6">
            <Badge tone="warning" className="px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider font-semibold">
              Waiting in Queue
            </Badge>
          </div>

          {/* SVG Progress Ring */}
          <div className="relative z-10 mx-auto w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                fill="none"
                r="84"
                stroke="var(--mqds-border-subtle, #e1e3e0)"
                strokeWidth="12"
              />
              <circle
                className="transition-all duration-1000 ease-out"
                cx="100"
                cy="100"
                fill="none"
                r="84"
                stroke="var(--mqds-primary, #6c5ce7)"
                strokeDasharray="527.78"
                strokeDashoffset={Math.max(0, 527.78 - (527.78 / Math.max(pos, 1)))}
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-headline text-5xl font-bold text-[var(--mqds-primary)] tracking-tight leading-none">
                #{pos}
              </span>
              <span className="font-body text-xs font-medium text-[var(--mqds-muted)] mt-1.5 tracking-wide">
                in line
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-6 border-t border-[var(--mqds-border-subtle)] max-w-sm mx-auto">
            <div className="font-mono text-xs uppercase tracking-widest text-[var(--mqds-muted)] font-semibold">
              Estimated Wait Time
            </div>
            <div className="font-headline text-3xl font-bold text-[var(--mqds-text)] mt-1 tracking-tight">
              ~{pos * 10} minutes
            </div>
            <p className="text-xs text-[var(--mqds-muted)] mt-1">
              {pos === 1 ? 'You are next in line for mentorship!' : `${pos - 1} ticket(s) ahead of you`}
            </p>
          </div>
        </Card>
      )}

      {/* Active Session Alert Banner */}
      {ticket.status === 'ACTIVE' && (
        <div className="p-6 rounded-2xl bg-[var(--mqds-hover,#ede9fe)] border border-[var(--mqds-primary)]/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--mqds-primary)] text-white flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-headline font-bold text-[var(--mqds-text)]">
                Your Mentorship Session is Ready!
              </p>
              <p className="text-xs text-[var(--mqds-muted)]">
                A mentor has claimed your ticket and is waiting in the focus room.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate(`/focus/${currentTicketId}`)}
            className="flex items-center gap-2 whitespace-nowrap animate-pulse"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Enter Focus Mode</span>
          </Button>
        </div>
      )}

      {/* Completed Guidance Banner */}
      {ticket.status === 'COMPLETED' && ticket.guidance_message && (
        <Card variant="paper" className="p-6 border border-[var(--mqds-paper-border)] space-y-3">
          <div className="flex items-center gap-2 text-[var(--mqds-primary)] font-headline font-semibold text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>Mentor Guidance Notes</span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--mqds-surface)] border border-[var(--mqds-border-subtle)] font-body text-xs text-[var(--mqds-text)] whitespace-pre-wrap leading-relaxed">
            {ticket.guidance_message}
          </div>
        </Card>
      )}

      {/* Ticket Details Card */}
      <Card variant="paper" className="p-6 sm:p-8 border border-[var(--mqds-paper-border)] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--mqds-border-subtle)] pb-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--mqds-muted)]">
              Ticket Details
            </span>
            <h1 className="font-headline text-xl sm:text-2xl font-bold text-[var(--mqds-text)] mt-1">
              {ticket.topic}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={ticket.status === 'ACTIVE' ? 'success' : ticket.status === 'COMPLETED' ? 'info' : 'warning'}>
              {ticket.status}
            </Badge>
          </div>
        </div>

        <p className="font-body text-sm text-[var(--mqds-text)] leading-relaxed whitespace-pre-wrap">
          {ticket.description}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--mqds-border-subtle)] text-xs">
          <div className="flex items-center gap-4 text-[var(--mqds-muted)]">
            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="w-4 h-4 text-[var(--mqds-primary)]" />
              <span>{ticket.requested_minutes || 15} mins requested</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ticket.tags?.map((t) => (
                <Badge key={t} tone="neutral" className="text-[11px] font-mono">
                  #{t}
                </Badge>
              ))}
            </div>
          </div>

          {ticket.status === 'PENDING' && (
            <Button
              variant="danger-subtle"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isCancelling}
              className="flex items-center gap-1.5 text-xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Request</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Status History Timeline */}
      {ticket.status_history && ticket.status_history.length > 0 && (
        <Card variant="paper" className="p-6 border border-[var(--mqds-paper-border)] shadow-sm">
          <h3 className="font-headline font-bold text-sm text-[var(--mqds-text)] mb-4">
            Lifecycle Timeline
          </h3>
          <div className="space-y-4">
            {ticket.status_history.map((h, i) => (
              <div key={i} className="flex items-start gap-3 relative">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--mqds-primary)] mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-mono text-xs font-semibold uppercase text-[var(--mqds-text)]">
                      {h.status}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--mqds-muted)]">
                      {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {h.feedback_note && (
                    <p className="text-xs text-[var(--mqds-muted)] italic mt-0.5">
                      {h.feedback_note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        open={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
        variant="danger"
        title="Cancel Mentorship Request"
        description="Are you sure you want to cancel this mentorship request? You will lose your current position in the queue."
        actions={
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Keep Ticket
            </Button>
            <Button
              variant="danger"
              disabled={isCancelling}
              onClick={async () => {
                await updateStatus({ id: currentTicketId, status: 'CANCELLED' })
                setIsCancelModalOpen(false)
                navigate('/dashboard')
              }}
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        }
      />
    </div>
  )
}
