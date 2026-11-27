import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetTicketByIdQuery, useGetQueuePositionQuery, useUpdateTicketStatusMutation } from '@/store/api/ticketApi'
import { socketService } from '@/services/socket.service'
import { playNotificationSound } from '@/utils/audioUtils'
import { useAppSelector } from '@/store/hooks'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Skeleton,
  TicketAction,
  lightTheme,
} from '@/design-system'

export const QueueTrackerPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const { data: ticket, isLoading, refetch } = useGetTicketByIdQuery(ticketId || '', { skip: !ticketId })
  const { data: posData, refetch: refetchPos } = useGetQueuePositionQuery(ticketId || '', {
    skip: !ticketId || ticket?.status !== 'PENDING',
  })
  const [updateStatus, { isLoading: isCancelling }] = useUpdateTicketStatusMutation()
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  useEffect(() => {
    socketService.connect()
    if (ticketId) socketService.emit('joinTicket', ticketId)
    if (user?.id) socketService.emit('joinUser', user.id)

    const onQueueUp = () => { refetch(); refetchPos() }
    const onFocusStarted = () => { playNotificationSound(); refetch(); refetchPos() }

    socketService.on('focus_mode_started', onFocusStarted)
    socketService.on('queueUpdate', onQueueUp)
    socketService.on('sessionUpdate', onQueueUp)

    return () => {
      if (ticketId) socketService.emit('leaveTicket', ticketId)
      socketService.off('focus_mode_started', onFocusStarted)
      socketService.off('queueUpdate', onQueueUp)
      socketService.off('sessionUpdate', onQueueUp)
    }
  }, [ticketId, user?.id, refetch, refetchPos])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="preview-main" style={{ paddingTop: 40 }}>
        <Skeleton variant="ticket" label="Loading request details…" />
      </main>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!ticket) {
    return (
      <main className="preview-main" style={{ paddingTop: 40 }}>
        <EmptyState
          title="Request Not Found"
          description="This request could not be found or has already expired."
          action={
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          }
        />
      </main>
    )
  }

  const currentTicketId = ticket._id || (ticket as { id?: string }).id || ticketId || ''
  const pos = posData?.position ?? 1
  const waitMinutes = pos * 10

  const isQueued = ticket.status === 'PENDING'
  const isActive = ticket.status === 'ACTIVE' || ticket.status === 'APPROVED'
  const isCompleted = ticket.status === 'COMPLETED'
  const isCancelled = ticket.status === 'CANCELLED'
  const isClosed = isCancelled || isCompleted

  const ahead = isQueued ? Math.max(0, pos - 1) : 0

  const badgeTone: 'info' | 'warning' | 'success' | 'danger' | 'neutral' =
    isCancelled ? 'danger' : isActive ? 'success' : isCompleted ? 'info' : 'warning'

  const badgeLabel = isCancelled
    ? 'Cancelled'
    : isActive
    ? 'Session ready'
    : isCompleted
    ? 'Completed'
    : 'In queue'

  // Progress step states
  const stepMentorReview: 'complete' | 'current' | 'upcoming' =
    isQueued || isActive || isCompleted ? 'complete' : 'current'
  const stepInQueue: 'complete' | 'current' | 'upcoming' =
    isActive || isCompleted ? 'complete' : isQueued ? 'current' : 'upcoming'
  const stepSession: 'complete' | 'current' | 'upcoming' =
    isCompleted ? 'complete' : isActive ? 'current' : 'upcoming'

  return (
    <main className="preview-main" style={{ paddingTop: 40 }}>

      {/* ── Dashboard-ticket stub Card (perforated ticket preview) ──── */}
      <Card
        data-mqds={lightTheme}
        className="dashboard-request-ticket"
        variant="ticket"
        interactive
        stub={
          <div
            className="stub"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 4,
              padding: '16px 14px',
            }}
          >
            <strong
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--mqds-ink)',
              }}
            >
              {isQueued ? `#${pos}` : isCancelled ? '—' : isCompleted ? '✓' : '→'}
            </strong>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--mqds-muted-ink)' }}>
              {isQueued
                ? 'in queue'
                : isCancelled
                ? 'cancelled'
                : isCompleted
                ? 'completed'
                : 'session ready'}
            </span>
            {isQueued && (
              <small style={{ fontSize: '0.72rem', color: 'var(--mqds-muted-ink)', marginTop: 2 }}>
                ~{waitMinutes} min
              </small>
            )}
          </div>
        }
      >
        {/* Body: horizontal layout (stamp left, content right) */}
        <div className="body">
          <div className="stamp" aria-hidden="true">{'</>'}</div>
          <div>
            <small style={{ color: 'var(--mqds-muted-ink)', fontSize: '0.78rem' }}>
              {ticket.requested_minutes || 15} min session
            </small>
            <h2
              style={{
                margin: '4px 0 8px',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--mqds-ink)',
              }}
            >
              {ticket.topic}
            </h2>
            <div className="dashboard-ticket-action">
              <TicketAction
                onClick={() =>
                  isActive ? navigate(`/focus/${currentTicketId}`) : undefined
                }
              >
                {isQueued ? 'View queue' : isActive ? 'Join session' : 'View request'}
              </TicketAction>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Detail card (request-detail-content laid out inline) ───── */}
      <Card
        data-mqds={lightTheme}
        variant="paper"
        className="request-detail"
        style={{ marginTop: 20 }}
      >
        {/* Header: title + badge + meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: '1px solid #dacbe7',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 4px',
                fontSize: '0.78rem',
                color: 'var(--mqds-muted-ink)',
                fontFamily: 'var(--mqds-font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {ticket.requested_minutes || 15} min session
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                fontWeight: 700,
                color: 'var(--mqds-ink)',
              }}
            >
              {ticket.topic}
            </h1>
          </div>
          <Badge tone={badgeTone}>{badgeLabel}</Badge>
        </div>

        {/* Detail content grid */}
        <div className="request-detail-content">

          {/* Queue facts — only when PENDING */}
          {isQueued && (
            <dl className="request-queue-facts">
              <div>
                <dt>Queue position</dt>
                <dd>#{pos}</dd>
              </div>
              <div>
                <dt>Estimated wait</dt>
                <dd>{pos === 1 ? 'Next in line' : `~${waitMinutes} min`}</dd>
              </div>
            </dl>
          )}

          {/* Summary paragraph */}
          <p className="request-detail-summary">
            {isCancelled
              ? 'You cancelled this request. It is no longer active.'
              : isCompleted
              ? 'Your session has been completed. Thank you for learning with MentorQ.'
              : isActive
              ? 'Your mentor is ready. Join your focus session now to get started.'
              : isQueued
              ? ahead === 0
                ? "You're next in line. Your mentor will claim your request shortly."
                : `${ahead} ${ahead === 1 ? 'session is' : 'sessions are'} ahead of you in the queue.`
              : 'Your request is awaiting mentor review.'}
          </p>

          {/* ACTIVE: session join banner */}
          {isActive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 8,
                background: 'var(--mqds-primary)',
                color: '#fff9ef',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Your mentor is waiting in the focus room
              </span>
              <Button
                variant="primary"
                onClick={() => navigate(`/focus/${currentTicketId}`)}
                style={{ background: '#fff9ef', color: 'var(--mqds-primary)', fontWeight: 700 }}
              >
                Join session →
              </Button>
            </div>
          )}

          {/* COMPLETED: mentor guidance callout */}
          {isCompleted && ticket.guidance_message && (
            <div
              style={{
                padding: '14px 16px',
                border: '1px solid #dacbe7',
                borderRadius: 8,
                background: '#f1e8f6',
              }}
            >
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: '0.78rem',
                  fontWeight: 650,
                  color: 'var(--mqds-muted-ink)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Mentor guidance
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  color: 'var(--mqds-ink)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {ticket.guidance_message}
              </p>
            </div>
          )}

          {/* Progress steps — not shown for cancelled */}
          {!isCancelled && (
            <ol className="request-progress" aria-label="Request progress">
              <li data-step="complete">
                Request sent <span>Completed</span>
              </li>
              <li
                data-step={stepMentorReview}
                aria-current={stepMentorReview === 'current' ? 'step' : undefined}
              >
                Mentor review{' '}
                <span>
                  {stepMentorReview === 'complete'
                    ? 'Approved'
                    : stepMentorReview === 'current'
                    ? 'Awaiting response'
                    : 'After acceptance'}
                </span>
              </li>
              <li
                data-step={stepInQueue}
                aria-current={stepInQueue === 'current' ? 'step' : undefined}
              >
                In queue{' '}
                <span>
                  {stepInQueue === 'complete'
                    ? 'Session started'
                    : stepInQueue === 'current'
                    ? 'Waiting for session'
                    : 'After approval'}
                </span>
              </li>
              <li
                data-step={stepSession}
                aria-current={stepSession === 'current' ? 'step' : undefined}
              >
                Focus session{' '}
                <span>
                  {stepSession === 'complete'
                    ? 'Completed'
                    : stepSession === 'current'
                    ? 'Live now'
                    : 'After queue'}
                </span>
              </li>
            </ol>
          )}

          {/* Cancelled meta */}
          {isCancelled && (
            <p className="request-detail-meta">Request cancelled</p>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #dacbe7',
            flexWrap: 'wrap',
          }}
        >
          {!isClosed && (
            <Button
              variant="danger-subtle"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isCancelling}
            >
              Cancel request
            </Button>
          )}
          <Button onClick={() => navigate('/dashboard')}>Done</Button>
        </div>
      </Card>

      {/* ── Cancel Confirmation Modal ────────────────────────────────── */}
      <Modal
        open={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
        variant="danger"
        title="Cancel this request?"
        description={
          isQueued
            ? "You'll lose your place in the queue. You can send a new request later."
            : 'Your mentor will no longer be able to review this request. You can send a new one later.'
        }
        actions={
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="secondary" onClick={() => setIsCancelModalOpen(false)}>
              Keep request
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
              {isCancelling ? 'Cancelling…' : 'Cancel request'}
            </Button>
          </div>
        }
      />
    </main>
  )
}
