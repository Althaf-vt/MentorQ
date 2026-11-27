import React, { useRef, useState } from 'react'
import {
  Badge,
  Button,
  Modal,
  Textarea,
  cardTiltHandlers,
  lightTheme,
} from '@/design-system'

export interface SessionMessageItem {
  author: 'student' | 'mentor' | string
  text: string
  at?: string | number
}

export interface SessionFeedbackData {
  rating: number
  comment?: string
}

export interface SessionNoteItem {
  id?: string
  title: string
  description?: string
  format?: string
  price?: number
  mentor?: string
}

export interface SessionDetailData {
  id: string
  title: string
  mentor?: string
  student?: string
  endedAt?: string | number | Date
  outcome?: string
  guidance?: string
  notes?: SessionNoteItem[]
  messages?: SessionMessageItem[]
  feedback?: SessionFeedbackData
}

export interface SessionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  session: SessionDetailData | null
  onFeedback?: (sessionId: string, feedback: { rating: number; comment?: string }) => void
}

const detailTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

interface DetailContentProps {
  session: SessionDetailData
  onClose: () => void
  onFeedback?: (sessionId: string, feedback: { rating: number; comment?: string }) => void
}

const SessionDetailContent: React.FC<DetailContentProps> = ({
  session,
  onClose,
  onFeedback,
}) => {
  const feedbackTrigger = useRef<HTMLButtonElement>(null)
  const [editing, setEditing] = useState(false)
  const [expandedNote, setExpandedNote] = useState(false)
  const [rating, setRating] = useState(session.feedback?.rating ?? 0)
  const [comment, setComment] = useState(session.feedback?.comment ?? '')
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const endedDate = (() => {
    if (!session.endedAt) return new Date()
    const d = new Date(session.endedAt)
    return isNaN(d.getTime()) ? new Date() : d
  })()

  const stopEditing = () => {
    setEditing(false)
    requestAnimationFrame(() => feedbackTrigger.current?.focus())
  }

  const saveFeedback = (event: React.FormEvent) => {
    event.preventDefault()
    if (!rating) return
    onFeedback?.(session.id, { rating, comment: comment.trim() })
    setFeedbackMessage('Feedback saved.')
    stopEditing()
  }

  return (
    <div data-mqds={lightTheme}>
      <Modal
        variant="ticket"
        className="session-detail"
        open={true}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
        title={session.title}
        ticketHeader={{
          label: <Badge tone="success">Completed</Badge>,
        }}
        description={
          <>
            {session.mentor || 'Mentor'} <span aria-hidden="true">&middot;</span>{' '}
            <time dateTime={endedDate.toISOString()}>
              {detailTime.format(endedDate)}
            </time>
          </>
        }
        actions={<Button onClick={onClose}>Done</Button>}
      >
        {/* Outcome banner */}
        {session.outcome && (
          <div className="session-outcome">
            <h3>Outcome</h3>
            <p>{session.outcome}</p>
          </div>
        )}

        {/* Archived guidance note card */}
        {(session.guidance || (session.notes && session.notes.length > 0)) && (
          <div className="note-tilt-area" {...cardTiltHandlers}>
            <div className="mqds-tilt-surface note-tilt-surface">
              <article className="mentor-note" data-paid="false">
                <div className="note-art" aria-hidden="true">
                  <span className="note-art-circle" />
                  <span className="note-art-ellipse" />
                </div>
                <div className="note-copy">
                  <div className="note-meta">
                    <span>Guidance Note</span>
                    <strong>Archived</strong>
                  </div>
                  <h3>{session.notes?.[0]?.title || 'Mentor Guidance'}</h3>
                  <p>
                    {session.guidance ||
                      session.notes?.[0]?.description ||
                      'Session notes archived by mentor.'}
                  </p>
                  <small>{session.mentor || 'Mentor'}</small>
                  {expandedNote && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.45)',
                        color: 'var(--note-ink)',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {session.guidance || session.notes?.[0]?.description}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="note-action"
                  aria-expanded={expandedNote}
                  onClick={() => setExpandedNote(!expandedNote)}
                >
                  <span>{expandedNote ? 'Collapse note' : 'Read full note'}</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </article>
            </div>
          </div>
        )}

        {/* Archived dark chat transcript */}
        <section className="session-archive" aria-labelledby="archive-title">
          <div className="live-chat-header">
            <h3 id="archive-title">Archived chat</h3>
            <span>Read only</span>
          </div>
          {session.messages && session.messages.length > 0 ? (
            <div
              className="live-thread"
              role="region"
              aria-label="Archived session messages"
              tabIndex={0}
            >
              {session.messages.map((msg, index) => {
                const msgTime = msg.at
                  ? typeof msg.at === 'number'
                    ? new Date(msg.at)
                    : new Date(String(msg.at))
                  : null
                const isValidTime = msgTime && !isNaN(msgTime.getTime())

                return (
                  <article
                    key={index}
                    className="live-message"
                    data-author={msg.author}
                  >
                    <div>
                      <strong>
                        {msg.author === 'mentor'
                          ? session.mentor || 'Mentor'
                          : 'You'}
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
              })}
            </div>
          ) : (
            <p>No messages in this session.</p>
          )}
        </section>

        {/* Feedback section */}
        <section className="session-feedback" aria-labelledby="feedback-title">
          <h3 id="feedback-title">Feedback</h3>
          {!editing && session.feedback && (
            <div className="session-saved-feedback">
              <strong>{session.feedback.rating} / 5</strong>
              {session.feedback.comment && <p>{session.feedback.comment}</p>}
            </div>
          )}
          {!editing ? (
            <Button
              ref={feedbackTrigger}
              onClick={() => {
                setRating(session.feedback?.rating ?? 0)
                setComment(session.feedback?.comment ?? '')
                setEditing(true)
                setFeedbackMessage('')
              }}
            >
              {session.feedback ? 'Edit feedback' : 'Leave feedback'}{' '}
              <span aria-hidden="true">&rarr;</span>
            </Button>
          ) : (
            <form className="session-feedback-form" onSubmit={saveFeedback}>
              <fieldset>
                <legend>How helpful was this session?</legend>
                <div className="session-rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="session-rating"
                        checked={rating === value}
                        required
                        autoFocus={rating === value || (!rating && value === 1)}
                        onChange={() => setRating(value)}
                        aria-label={`${value} out of 5`}
                      />
                      <span aria-hidden="true">{value}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Textarea
                id="session-comment"
                label="Comment (optional)"
                maxLength={500}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <div className="session-feedback-actions">
                <Button variant="secondary" onClick={stopEditing}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!rating}>
                  Save feedback <span aria-hidden="true">&rarr;</span>
                </Button>
              </div>
            </form>
          )}
          <div className="session-feedback-status" role="status">
            {feedbackMessage}
          </div>
        </section>
      </Modal>
    </div>
  )
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  isOpen,
  onClose,
  session,
  onFeedback,
}) => {
  if (!isOpen || !session) return null

  return (
    <SessionDetailContent
      key={session.id}
      session={session}
      onClose={onClose}
      onFeedback={onFeedback}
    />
  )
}
