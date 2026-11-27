import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Card,
  TicketAction,
  lightTheme,
} from '@/design-system'

export interface RequestTicketCardProps {
  id: string
  topic: string
  description?: string
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  tags?: string[]
  requestedMinutes?: number
  createdAt?: string
  /** Optional action label for the CTA. Defaults to 'View queue' or 'Join session' */
  actionLabel?: string
  /** Optional custom click handler; defaults to navigate(/queue/:id) */
  onActionClick?: () => void
  className?: string
  /** Optional mentor name if assigned */
  mentorName?: string
  /** Optional queue position */
  queuePosition?: number
}

export const RequestTicketCard: React.FC<RequestTicketCardProps> = ({
  id,
  topic,
  description,
  status,
  tags,
  requestedMinutes = 15,
  createdAt,
  actionLabel,
  onActionClick,
  className,
  mentorName,
  queuePosition,
}) => {
  const navigate = useNavigate()

  const shortId = id ? id.slice(-6).toUpperCase() : '------'
  const isQueued = status === 'PENDING'
  const isActive = status === 'ACTIVE'

  const effectiveActionLabel =
    actionLabel || (isActive ? 'Join session' : isQueued ? 'View queue' : 'View request')

  const handleAction = () => {
    if (onActionClick) {
      onActionClick()
    } else if (isActive) {
      navigate(`/focus/${id}`)
    } else {
      navigate(`/queue/${id}`)
    }
  }

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <Card
      className={['lean-ticket-card', className].filter(Boolean).join(' ')}
      variant="ticket"
      interactive
      data-mqds={lightTheme}
      stub={
        <>
          <strong className="lean-stub-number">
            {isActive ? 'Ready' : queuePosition != null ? `#${queuePosition}` : `#${shortId.slice(-2)}`}
          </strong>
          <span className="lean-stub-label">
            {isActive ? 'Mentor ready' : isQueued ? 'In queue' : status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
          <small className="lean-stub-meta">
            {isActive
              ? 'Enter room now'
              : isQueued
              ? (queuePosition != null ? `Position #${queuePosition}` : `${requestedMinutes} min session`)
              : dateStr || `${requestedMinutes} min session`}
          </small>
        </>
      }
    >
      <div className="lean-ticket-body">
        <div className="lean-ticket-stamp" aria-hidden="true">&lt;/&gt;</div>
        <div className="lean-ticket-details">
          <div className="lean-ticket-meta">
            <span>#{shortId}</span>
            <span>{requestedMinutes} min session</span>
            {dateStr && <span>{dateStr}</span>}
            {mentorName && <span>{mentorName}</span>}
            {tags && tags.length > 0 && (
              <span className="lean-ticket-tags" role="group" aria-label={`Topics: ${tags.join(', ')}`}>
                {tags.slice(0, 2).map((tag) => <Badge key={tag} tone="neutral">#{tag}</Badge>)}
                {tags.length > 2 && <span title={tags.slice(2).join(', ')}>+{tags.length - 2} more</span>}
              </span>
            )}
          </div>
          <h3 className="lean-ticket-topic" title={topic}>{topic}</h3>
          {description && <p className="lean-ticket-description" title={description}>{description}</p>}
        </div>
        <div className="lean-ticket-action">
          <TicketAction onClick={handleAction}>{effectiveActionLabel}</TicketAction>
        </div>
      </div>
    </Card>
  )
}
