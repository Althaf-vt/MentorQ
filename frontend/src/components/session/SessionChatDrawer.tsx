import React, { useState, useRef, useEffect } from 'react'
import { darkTheme } from '@/design-system'
import type { Message } from '@/types/operational.types'

export interface SessionChatDrawerProps {
  messages: Message[]
  currentUserId?: string
  mentorName?: string
  studentName?: string
  onClose?: () => void
  onSendMessage: (text: string) => void
  isMentor?: boolean
  isEnded?: boolean
  className?: string
}

export const SessionChatDrawer: React.FC<SessionChatDrawerProps> = ({
  messages,
  currentUserId,
  mentorName,
  studentName,
  onClose,
  onSendMessage,
  isMentor = false,
  isEnded = false,
  className = '',
}) => {
  const [msg, setMsg] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (e?: React.FormEvent, txt?: string) => {
    if (e) e.preventDefault()
    const content = txt || msg
    if (!content.trim()) return
    onSendMessage(content.trim())
    if (!txt) setMsg('')
  }

  const QUICK_CHIPS = isMentor
    ? ['Try this approach', 'Great progress!', 'Let me check', 'Review this link']
    : ['Here is the error', 'Makes sense!', 'Could you clarify?', 'Testing now']

  return (
    <aside
      className={`live-chat ${className}`}
      data-mqds={darkTheme}
      aria-label="Live Session Chat"
    >
      {/* ── Chat Header ────────────────────────────────────────── */}
      <div className="live-chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2
            id="live-chat-title"
            style={{ margin: 0, fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}
          >
            Live discussion
          </h2>
          <span>Real-time</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            style={{
              background: 'transparent',
              border: '1px solid #51496f',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'grid',
              placeItems: 'center',
              color: '#f4f7f2',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        )}
      </div>

      {/* ── Scrollable Message Thread ──────────────────────────── */}
      <div
        className="live-thread"
        ref={threadRef}
        role="log"
        aria-label="Session messages"
        tabIndex={0}
      >
        {messages.length === 0 ? (
          <p style={{ color: '#d5d0e8', margin: 0, fontSize: '0.85rem' }}>
            No messages yet. Send a note or choose a quick suggestion below to collaborate.
          </p>
        ) : (
          messages.map((m) => {
            const isStudent =
              m.sender_id === currentUserId ? !isMentor : isMentor
            const author = isStudent ? 'student' : 'mentor'
            const authorLabel = isStudent
              ? isMentor
                ? studentName || 'Student'
                : 'You'
              : isMentor
              ? 'You'
              : mentorName || 'Mentor'

            const timeStr = m.sent_at
              ? new Date(m.sent_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''

            return (
              <article
                key={m._id}
                className="live-message"
                data-author={author}
              >
                <div>
                  <strong>{authorLabel}</strong>
                  {timeStr && <time>{timeStr}</time>}
                </div>
                <p>{m.message_text}</p>
              </article>
            )
          })
        )}
      </div>

      {/* ── Footer: Quick Chips & Composer ───────────────────── */}
      <div>
        {!isEnded && (
          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid #cbc6df26',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSend(undefined, chip)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 16,
                  background: '#302c4c',
                  border: '1px solid #51496f',
                  color: '#ded0fa',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--mqds-font-mono)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {isEnded ? (
          <p className="live-chat-closed">
            This session has ended. You can still read the conversation here.
          </p>
        ) : (
          <form className="live-composer" onSubmit={(e) => handleSend(e)}>
            <label htmlFor="session-message">
              {isMentor ? 'Message your student' : 'Message your mentor'}
            </label>
            <div>
              <input
                id="session-message"
                type="text"
                value={msg}
                maxLength={1000}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Write a message or paste a link…"
              />
              <button className="cta" type="submit" disabled={!msg.trim()}>
                Send <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </aside>
  )
}
