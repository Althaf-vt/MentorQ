import React, { useRef, useState } from 'react'
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  Textarea,
  darkTheme,
  lightTheme,
} from '@/design-system'

export interface TriageMessage {
  author: 'student' | 'mentor' | string
  text: string
  at?: string | number | Date
}

export interface TriageTicketItem {
  id?: string
  _id?: string
  title?: string
  topic?: string
  description?: string
  student?: string | { _id?: string; fullName?: string; email?: string }
  student_id?: string | { _id?: string; fullName?: string; email?: string }
  minutes?: number
  requested_minutes?: number
  requestedMinutes?: number
  status?: string
  tags?: string[]
  createdAt?: string | number | Date
  created_at?: string
  messages?: TriageMessage[]
}

export interface MentorTriageWorkspaceProps {
  tickets: TriageTicketItem[]
  onClaim?: (ticketId: string) => Promise<void> | void
  onDecline?: (ticketId: string) => Promise<void> | void
  onMessage?: (ticketId: string, role: string, text: string) => Promise<boolean | void> | boolean | void
  isClaiming?: boolean
  className?: string
}

export const MentorTriageWorkspace: React.FC<MentorTriageWorkspaceProps> = ({
  tickets = [],
  onClaim,
  onDecline,
  onMessage,
  isClaiming = false,
  className = '',
}) => {
  const inboxHeading = useRef<HTMLHeadingElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDiscussing, setIsDiscussing] = useState(false)
  const [draft, setDraft] = useState('')
  const [discussionFailed, setDiscussionFailed] = useState(false)
  const [declineTarget, setDeclineTarget] = useState<TriageTicketItem | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  // Safe property helpers
  const getTicketId = (t: TriageTicketItem): string => {
    const raw = t.id || t._id || ''
    return typeof raw === 'string' ? raw : String(raw)
  }

  const getTicketTopic = (t: TriageTicketItem): string => {
    return t.topic || t.title || 'Untitled request'
  }

  const getTicketDuration = (t: TriageTicketItem): number => {
    return t.requested_minutes || t.requestedMinutes || t.minutes || 15
  }

  const getStudentName = (t: TriageTicketItem): string => {
    if (typeof t.student === 'string') return t.student
    if (t.student && typeof t.student === 'object' && 'fullName' in t.student && t.student.fullName) {
      return t.student.fullName
    }
    if (t.student_id && typeof t.student_id === 'object' && 'fullName' in t.student_id && t.student_id.fullName) {
      return t.student_id.fullName
    }
    return 'Student'
  }

  // Find selected ticket (or fallback to first)
  const selected = tickets.find((t) => getTicketId(t) === selectedId) ?? tickets[0] ?? null

  const handleClaim = async (ticket: TriageTicketItem) => {
    const id = getTicketId(ticket)
    if (!id) return
    try {
      await onClaim?.(id)
      setStatusMessage(`"${getTicketTopic(ticket)}" claimed and ready for focus session.`)
      setIsDiscussing(false)
      requestAnimationFrame(() => inboxHeading.current?.focus())
    } catch {
      setStatusMessage('Failed to claim ticket. Please try again.')
    }
  }

  const handleDeclineConfirmed = async () => {
    if (!declineTarget) return
    const id = getTicketId(declineTarget)
    const topic = getTicketTopic(declineTarget)
    setDeclineTarget(null)
    try {
      await onDecline?.(id)
      setStatusMessage(`"${topic}" declined and removed from incoming queue.`)
      setIsDiscussing(false)
      requestAnimationFrame(() => inboxHeading.current?.focus())
    } catch {
      setStatusMessage('Failed to decline ticket. Please try again.')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !draft.trim()) return
    const id = getTicketId(selected)
    const text = draft.trim()
    try {
      const res = await onMessage?.(id, 'mentor', text)
      if (res === false) {
        setDiscussionFailed(true)
      } else {
        setDraft('')
        setDiscussionFailed(false)
      }
    } catch {
      setDiscussionFailed(true)
    }
  }

  return (
    <div className={`mentor-triage-workspace ${className}`}>
      {/* Status banner */}
      {statusMessage && (
        <p className="triage-status" role="status">
          {statusMessage}
        </p>
      )}

      {/* Split Triage Layout */}
      <div className="triage-layout">
        {/* Left: Dark Navy Inbox */}
        <section
          aria-label="Incoming requests"
          className="triage-inbox"
          data-mqds={darkTheme}
        >
          <h3 ref={inboxHeading} tabIndex={-1}>
            <span>Incoming requests</span>
            <span className="triage-count">{tickets.length}</span>
          </h3>

          {tickets.length > 0 ? (
            tickets.map((t) => {
              const tid = getTicketId(t)
              const topic = getTicketTopic(t)
              const duration = getTicketDuration(t)
              const isSelected = selected ? getTicketId(selected) === tid : false
              const hasMessages = t.messages && t.messages.length > 0

              return (
                <button
                  key={tid}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedId(tid)
                    setIsDiscussing(false)
                    setDraft('')
                    setDiscussionFailed(false)
                  }}
                >
                  <strong>{topic}</strong>
                  <span>
                    {duration} min{hasMessages ? ' · Discussion' : ''}
                  </span>
                </button>
              )
            })
          ) : (
            <EmptyState
              title="No requests awaiting review"
              description="New student requests entering the queue will appear here."
            />
          )}
        </section>

        {/* Right: Warm Paper Detail Card */}
        {selected ? (
          <section
            className="triage-detail"
            aria-label="Selected request"
            data-mqds={lightTheme}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge tone={selected.status === 'ACTIVE' ? 'info' : 'warning'}>
                {selected.status === 'ACTIVE' ? 'Active' : 'Awaiting review'}
              </Badge>
              {selected.tags && selected.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {selected.tags.map((tag) => (
                    <Badge key={tag} tone="neutral" style={{ fontSize: 11, fontFamily: 'var(--mqds-font-mono)' }}>
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <h3>{getTicketTopic(selected)}</h3>
            <p>
              {getStudentName(selected)}{' '}
              <span aria-hidden="true">&middot;</span>{' '}
              {getTicketDuration(selected)} min requested
            </p>

            {/* Description */}
            {selected.description && (
              <p
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 7,
                  background: 'rgba(218, 203, 231, 0.3)',
                  color: 'var(--mqds-ink)',
                  fontSize: '0.86rem',
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selected.description}
              </p>
            )}

            {/* Triage Actions */}
            <div className="triage-actions">
              <Button
                variant="primary"
                onClick={() => handleClaim(selected)}
                disabled={isClaiming}
              >
                {isClaiming ? 'Claiming…' : 'Claim ticket'}{' '}
                <span aria-hidden="true">&rarr;</span>
              </Button>

              <Button
                variant="secondary"
                aria-expanded={isDiscussing}
                onClick={() => setIsDiscussing(!isDiscussing)}
              >
                {isDiscussing ? 'Hide discussion' : 'Discuss'}
              </Button>

              <Button
                variant="danger-subtle"
                className="triage-decline"
                onClick={() => setDeclineTarget(selected)}
              >
                Decline
              </Button>
            </div>

            {/* Pre-session Discussion Section */}
            {isDiscussing && (
              <section
                className="request-discussion"
                aria-label="Pre-session discussion"
                style={{ marginTop: 16 }}
              >
                <h3>Pre-session discussion</h3>
                <div
                  className="live-thread"
                  role="log"
                  aria-label="Discussion messages"
                  tabIndex={0}
                >
                  {selected.messages && selected.messages.length > 0 ? (
                    selected.messages.map((msg, idx) => {
                      const msgTime = msg.at
                        ? typeof msg.at === 'number'
                          ? new Date(msg.at)
                          : new Date(String(msg.at))
                        : null
                      const isValidTime = msgTime && !isNaN(msgTime.getTime())

                      return (
                        <article
                          key={idx}
                          className="live-message"
                          data-author={msg.author}
                          style={{ marginBottom: 10 }}
                        >
                          <div>
                            <strong>
                              {msg.author === 'mentor'
                                ? 'You (Mentor)'
                                : getStudentName(selected)}
                            </strong>
                            {isValidTime && (
                              <time dateTime={msgTime.toISOString()}>
                                {msgTime.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </time>
                            )}
                          </div>
                          <p>{msg.text}</p>
                        </article>
                      )
                    })
                  ) : (
                    <p style={{ padding: '8px 4px' }}>
                      No messages yet. Send a quick clarifying note to the student before claiming.
                    </p>
                  )}
                </div>

                {onMessage && (
                  <form
                    className="discussion-form"
                    data-mqds={darkTheme}
                    onSubmit={handleSendMessage}
                  >
                    <Textarea
                      label="Message the student"
                      value={draft}
                      maxLength={1000}
                      rows={2}
                      onChange={(event) => {
                        setDraft(event.target.value)
                        setDiscussionFailed(false)
                      }}
                      placeholder="e.g. Please share the repo link or error snippet…"
                    />
                    {discussionFailed && (
                      <p role="alert" style={{ color: 'var(--mqds-error)', fontSize: '0.8rem', margin: 0 }}>
                        This discussion is no longer open or failed to deliver.
                      </p>
                    )}
                    <Button type="submit" disabled={!draft.trim()}>
                      Send message
                    </Button>
                  </form>
                )}
              </section>
            )}
          </section>
        ) : (
          <section
            className="triage-detail"
            aria-label="No request selected"
            data-mqds={lightTheme}
          >
            <EmptyState
              title="No request selected"
              description="Select a ticket from the inbox to review details, discuss, or claim."
            />
          </section>
        )}
      </div>

      {/* Decline Confirmation Modal */}
      {declineTarget && (
        <Modal
          open={Boolean(declineTarget)}
          onOpenChange={(open) => {
            if (!open) setDeclineTarget(null)
          }}
          variant="danger"
          title="Decline this request?"
          description={`"${getTicketTopic(
            declineTarget
          )}" will be declined and the student will be notified.`}
          actions={
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="secondary"
                onClick={() => setDeclineTarget(null)}
              >
                Keep reviewing
              </Button>
              <Button
                variant="danger"
                onClick={handleDeclineConfirmed}
              >
                Decline request
              </Button>
            </div>
          }
        />
      )}
    </div>
  )
}
