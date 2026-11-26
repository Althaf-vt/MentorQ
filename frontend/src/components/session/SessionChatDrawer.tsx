import React, { useState, useRef, useEffect } from 'react'
import { Send, X, Sparkles } from 'lucide-react'
import { Button } from '@/design-system'
import type { Message } from '@/types/operational.types'

interface SessionChatDrawerProps {
  messages: Message[]
  currentUserId?: string
  onClose: () => void
  onSendMessage: (text: string) => void
}

export const SessionChatDrawer: React.FC<SessionChatDrawerProps> = ({
  messages,
  currentUserId,
  onClose,
  onSendMessage,
}) => {
  const [msg, setMsg] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  const QUICK_CHIPS = ['Try this approach', 'Great progress!', 'Let me check', 'Review this link']

  return (
    <aside
      className="w-full md:w-88 bg-[var(--mqds-surface,#ffffff)] border-l border-[var(--mqds-border-subtle,#e1e3e0)] flex flex-col justify-between h-[50vh] md:h-full shadow-lg z-30 font-body"
      aria-label="Live Session Chat"
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--mqds-border-subtle)] flex items-center justify-between bg-[var(--mqds-canvas,#faf9f7)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[var(--mqds-hover)] text-[var(--mqds-primary)] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-headline uppercase tracking-wider text-[var(--mqds-text)]">
              Live Chat &amp; Guidance
            </h2>
            <p className="text-[10px] font-mono text-[var(--mqds-muted)]">Real-time peer messages</p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={onClose}
          className="!p-1.5 !min-h-0 text-xs"
          aria-label="Close chat"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[var(--mqds-canvas)]/40 text-xs">
        {messages.length === 0 ? (
          <div className="text-center py-12 px-4 text-[var(--mqds-muted)] space-y-1">
            <p className="font-semibold text-xs text-[var(--mqds-text)]">No messages yet</p>
            <p className="text-[11px]">Send a note or tap one of the quick chips below to collaborate.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId
            const timeStr = m.sent_at
              ? new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''
            return (
              <div key={m._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[85%] shadow-xs leading-relaxed ${
                    isMe
                      ? 'bg-[var(--mqds-primary)] text-white rounded-br-xs'
                      : 'bg-[var(--mqds-surface)] text-[var(--mqds-text)] border border-[var(--mqds-border-subtle)] rounded-bl-xs'
                  }`}
                >
                  <p className="break-words">{m.message_text}</p>
                </div>
                {timeStr && (
                  <span className="text-[10px] font-mono text-[var(--mqds-muted)] px-1 mt-0.5">
                    {timeStr}
                  </span>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="p-2.5 border-t border-[var(--mqds-border-subtle)] bg-[var(--mqds-canvas)] flex gap-2 overflow-x-auto text-[11px]">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleSend(undefined, chip)}
            className="px-3 py-1 rounded-full bg-[var(--mqds-surface)] border border-[var(--mqds-border-subtle)] text-[var(--mqds-text)] hover:bg-[var(--mqds-hover)] hover:text-[var(--mqds-primary)] transition-colors whitespace-nowrap font-mono text-xs cursor-pointer shadow-2xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Message Input Footer */}
      <form
        onSubmit={(e) => handleSend(e)}
        className="p-3 border-t border-[var(--mqds-border-subtle)] flex items-center gap-2 bg-[var(--mqds-surface)]"
      >
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Type message or paste link..."
          className="mqds-control flex-1 !min-h-[38px] !text-xs !py-1.5"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!msg.trim()}
          className="!p-2 !min-h-[38px] flex items-center justify-center shrink-0"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </aside>
  )
}
