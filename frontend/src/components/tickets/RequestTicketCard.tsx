import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Card,
  TicketAction,
  cardTiltHandlers,
  lightTheme,
  type BadgeProps,
} from '@/design-system'

export interface RequestTicketCardProps {
  id: string
  topic: string
  description?: string
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  tags?: string[]
  requestedMinutes?: number
  createdAt?: string
  /** Optional action label for the stub CTA. Defaults to 'Track' */
  actionLabel?: string
  /** Optional custom click handler; defaults to navigate(/queue/:id) */
  onActionClick?: () => void
  className?: string
}

/** Status → Badge tone map */
const STATUS_TONE: Record<RequestTicketCardProps['status'], BadgeProps['tone']> = {
  COMPLETED: 'success',
  ACTIVE: 'info',
  APPROVED: 'info',
  CANCELLED: 'danger',
  PENDING: 'warning',
}

export const RequestTicketCard: React.FC<RequestTicketCardProps> = ({
  id,
  topic,
  description,
  status,
  tags,
  requestedMinutes = 15,
  createdAt,
  actionLabel = 'Track',
  onActionClick,
  className,
}) => {
  const navigate = useNavigate()

  const shortId = id ? id.slice(-6).toUpperCase() : '------'
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const handleAction = () => {
    if (onActionClick) {
      onActionClick()
    } else {
      navigate(`/queue/${id}`)
    }
  }

  return (
    /* Spring tilt wrapper — matches preview.html's mqds-tilt-surface pattern */
    <div className={['min-w-0', className].filter(Boolean).join(' ')} {...cardTiltHandlers}>
      <div className="mqds-tilt-surface">
        <Card
          variant="ticket"
          interactive
          // Force light theme tokens on the warm cream ticket surface so
          // --mqds-ink (#251644) and --mqds-muted-ink (#5e526c) remain readable
          // regardless of whether the page root is in [data-mqds="dark"] mode.
          data-mqds={lightTheme}
          stub={
            /* Perforated peach stub — matches .mqds-card-stub with radial perforation */
            <div className="flex flex-col items-center justify-between h-full text-center py-3 px-2">
              {/* Status badge */}
              <Badge
                tone={STATUS_TONE[status]}
                className="font-mono uppercase text-[10px] tracking-wider"
              >
                {status}
              </Badge>

              {/* Duration display */}
              <div
                className="font-mono font-bold my-3"
                style={{
                  fontSize: 'clamp(28px, 5vw, 52px)',
                  lineHeight: 1,
                  letterSpacing: '-.06em',
                  color: '#201d35',
                }}
              >
                {requestedMinutes}
                <span
                  className="font-mono font-semibold block"
                  style={{ fontSize: 14, letterSpacing: 0, color: '#201d35cc' }}
                >
                  min
                </span>
              </div>

              {/* CTA — spring-reveal on card hover via .mqds-ticket-action CSS */}
              <TicketAction onClick={handleAction}>
                {actionLabel}
              </TicketAction>
            </div>
          }
        >
          {/* Body — flex row: skewed stamp + content */}
          <div className="flex items-center gap-5 min-w-0">
            {/* Skewed monogram stamp matching preview.html .stamp */}
            <div
              aria-hidden="true"
              style={{
                background: 'var(--mqds-primary)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                transform: 'skew(-12deg)',
                font: 'bold 22px/1 monospace',
                width: 54,
                height: 50,
                flexShrink: 0,
                borderRadius: 4,
              }}
            >
              {shortId.slice(0, 2)}
            </div>

            {/* Content column */}
            <div className="min-w-0 space-y-1.5">
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: 'var(--mqds-primary)' }}
                >
                  #{shortId}
                </span>
                {dateStr && (
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: 'var(--mqds-muted-ink)' }}
                  >
                    • {dateStr}
                  </span>
                )}
              </div>

              {/* Topic heading — matches preview .body h2 editorial size */}
              <h3
                className="font-headline font-bold leading-snug"
                style={{
                  fontSize: 'clamp(18px, 2.6vw, 28px)',
                  letterSpacing: '-.045em',
                  lineHeight: 1.08,
                  color: 'var(--mqds-ink)',
                  margin: '4px 0 6px',
                  overflowWrap: 'anywhere',
                }}
              >
                {topic}
              </h3>

              {/* Description excerpt */}
              {description && (
                <p
                  className="font-body text-xs line-clamp-2"
                  style={{ color: 'var(--mqds-muted-ink)' }}
                >
                  {description}
                </p>
              )}

              {/* Tag pills */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      tone="neutral"
                      className="text-[10px] font-mono"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
