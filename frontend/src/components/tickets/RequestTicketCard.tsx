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
  const isApproved = status === 'APPROVED'

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
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <Card
      className={['dashboard-request-ticket', className].filter(Boolean).join(' ')}
      variant="ticket"
      interactive
      data-mqds={lightTheme}
      stub={
        <div className="stub">
          <strong>
            {isActive
              ? 'Ready'
              : queuePosition != null
              ? `#${queuePosition}`
              : isQueued
              ? `#${shortId.slice(-2)}`
              : status}
          </strong>
          <span>
            {isActive
              ? 'Mentor is ready'
              : isQueued
              ? 'In queue'
              : isApproved
              ? 'Mentor assigned'
              : status.toLowerCase()}
          </span>
          <small>
            {isActive
              ? 'Enter room now'
              : isQueued
              ? (queuePosition != null ? `Position #${queuePosition}` : `${requestedMinutes} min session`)
              : dateStr || `${requestedMinutes} min session`}
          </small>
        </div>
      }
    >
      <div className="body">
        <div className="stamp" aria-hidden="true">&lt;/&gt;</div>
        <div>
          <small>
            {mentorName ? `${mentorName} / ` : ''}{requestedMinutes} min session
            {dateStr && ` • ${dateStr}`}
          </small>
          <h2>{topic}</h2>
          {description && (
            <p
              className="font-body text-xs line-clamp-1 mb-2 opacity-80"
              style={{ color: 'var(--mqds-muted-ink)' }}
            >
              {description}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} tone="neutral" className="text-[10px] font-mono">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="dashboard-ticket-action">
            <TicketAction onClick={handleAction}>
              {effectiveActionLabel}
            </TicketAction>
          </div>
        </div>
      </div>
    </Card>
  )
}
