import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetStudentTicketsQuery } from '@/store/api/ticketApi'
import { useAppSelector } from '@/store/hooks'
import { TicketCreationModal } from '@/components/tickets/TicketCreationModal'
import { RequestTicketCard } from '@/components/tickets/RequestTicketCard'
import { MentorOrbit } from '@/components/preview/MentorOrbit'
import { socketService } from '@/services/socket.service'
import { playNotificationSound } from '@/utils/audioUtils'
import {
  Button,
  EmptyState,
  Modal,
  Skeleton,
} from '@/design-system'

type FilterStatus = 'PENDING' | 'ALL' | 'COMPLETED' | 'CANCELLED'

const FILTER_LABELS: { key: FilterStatus; label: string }[] = [
  { key: 'PENDING', label: 'Active' },
  { key: 'ALL', label: 'All' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
]

const ITEMS_PER_PAGE = 6

export const StudentDashboardPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('PENDING')
  const navigate = useNavigate()
  const [inviteModalData, setInviteModalData] = useState<{ ticketId: string; sessionId: string } | null>(null)

  // Auto-refreshing poll every 20 seconds
  const { data: tickets = [], isLoading, refetch } = useGetStudentTicketsQuery(undefined, {
    pollingInterval: 20000,
  })

  const pendingTicketsCount = tickets.filter(
    (t) => t.status === 'PENDING' || t.status === 'APPROVED' || t.status === 'ACTIVE'
  ).length
  const completedTicketsCount = tickets.filter((t) => t.status === 'COMPLETED').length
  const cancelledTicketsCount = tickets.filter((t) => t.status === 'CANCELLED').length

  // Smart Filtering: auto-switch from PENDING → ALL when queue empties
  useEffect(() => {
    if (!isLoading && tickets.length > 0 && statusFilter === 'PENDING' && pendingTicketsCount === 0) {
      setStatusFilter('ALL')
    }
  }, [isLoading, tickets.length, statusFilter, pendingTicketsCount])

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    socketService.connect()
    if (user?.id) {
      socketService.emit('joinUser', user.id)
    }

    const handleMentorClaimedTicket = () => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('A mentor has claimed your request!')
      }
      playNotificationSound()
      refetch()
    }

    const handleFocusModeStarted = (data: { ticketId: string; sessionId: string }) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Your mentor has started the Focus Session.')
      }
      playNotificationSound()
      setInviteModalData({ ticketId: data.ticketId, sessionId: data.sessionId })
    }

    socketService.on('mentor_claimed_ticket', handleMentorClaimedTicket)
    socketService.on('focus_mode_started', handleFocusModeStarted)

    return () => {
      socketService.off('mentor_claimed_ticket', handleMentorClaimedTicket)
      socketService.off('focus_mode_started', handleFocusModeStarted)
    }
  }, [user?.id, refetch])

  const handleJoinSession = () => {
    if (inviteModalData) {
      navigate(`/focus/${inviteModalData.ticketId}`)
      setInviteModalData(null)
    }
  }

  const handleRefuseSession = () => {
    if (inviteModalData) {
      socketService.emit('student_refused_session', {
        ticketId: inviteModalData.ticketId,
        sessionId: inviteModalData.sessionId,
      })
      setInviteModalData(null)
    }
  }

  // Filter + sort
  const filteredTickets = useMemo(() => {
    if (statusFilter === 'ALL') return tickets
    if (statusFilter === 'PENDING') {
      return tickets.filter((t) => t.status === 'PENDING' || t.status === 'APPROVED' || t.status === 'ACTIVE')
    }
    return tickets.filter((t) => t.status === statusFilter)
  }, [tickets, statusFilter])

  const sortedTickets = useMemo(() => {
    const getTimestamp = (t: typeof tickets[0]): number => {
      const raw = t.createdAt || (t as { created_at?: string }).created_at || (t as { updatedAt?: string }).updatedAt
      return raw ? new Date(raw).getTime() : 0
    }
    return [...filteredTickets].sort((a, b) => getTimestamp(b) - getTimestamp(a))
  }, [filteredTickets])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedTickets = sortedTickets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, sortedTickets.length)

  const handleFilterChange = (filter: FilterStatus) => {
    setStatusFilter(filter)
    setPage(1)
  }

  // Per-filter counts for filter pills
  const filterCount: Record<FilterStatus, number> = {
    PENDING: pendingTicketsCount,
    ALL: tickets.length,
    COMPLETED: completedTicketsCount,
    CANCELLED: cancelledTicketsCount,
  }

  // Active ACTIVE/APPROVED ticket for the live-ready banner
  const liveReadyTicket = tickets.find((t) => t.status === 'ACTIVE' || t.status === 'APPROVED')
  const liveReadyId = liveReadyTicket
    ? (() => { const r = liveReadyTicket._id || (liveReadyTicket as { id?: string }).id; return typeof r === 'string' ? r : r ? String(r) : '' })()
    : ''

  return (
    <main className="preview-main">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero student-dashboard-hero">
        <div>
          <h1>
            {user?.fullName
              ? `${user.fullName.split(' ')[0]}'s `
              : 'Your '}
            <span>requests.</span>
          </h1>
          <button
            type="button"
            className="cta hero-request"
            onClick={() => setModalOpen(true)}
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              fontFamily: 'var(--mqds-font)',
              cursor: 'pointer',
            }}
          >
            New request <b aria-hidden="true">→</b>
          </button>
        </div>

        {/* Orbit — right side of hero */}
        <MentorOrbit />
      </section>

      {/* ── Live-ready session banner (ACTIVE ticket) ─────────────── */}
      {liveReadyTicket && liveReadyId && (
        <article
          className="ticket live-ready-ticket"
          data-mqds="light"
          tabIndex={0}
          role="region"
          aria-label="Active ready session ticket"
          style={{ cursor: 'pointer', marginBottom: 20 }}
          onClick={() => navigate(`/focus/${liveReadyId}`)}
        >
          <div className="body">
            <div className="stamp" aria-hidden="true">&lt;/&gt;</div>
            <div>
              <small>
                {liveReadyTicket.mentor_id ? 'Mentor assigned' : '1:1 Session'} /{' '}
                {liveReadyTicket.requested_minutes || 15} min session
              </small>
              <h2>{liveReadyTicket.topic}</h2>
              <button
                className="cta join-live"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/focus/${liveReadyId}`)
                }}
              >
                Join session <b aria-hidden="true">→</b>
              </button>
            </div>
          </div>
          <div className="stub">
            <strong>Ready</strong>
            <span>Mentor is ready</span>
          </div>
        </article>
      )}

      {/* ── Section title + filter pills ─────────────────────────── */}
      <div className="sectionTitle">
        <h2>
          {sortedTickets.length > 0
            ? `${sortedTickets.length} ${statusFilter === 'PENDING' ? 'active' : statusFilter.toLowerCase()} request${sortedTickets.length !== 1 ? 's' : ''}`
            : 'Your requests'
          }
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
            {FILTER_LABELS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleFilterChange(key)}
                className="cursor-pointer transition-colors"
                style={{
                  padding: '4px 11px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--mqds-font-mono)',
                  border: statusFilter === key ? 'none' : '1px solid var(--mqds-border-subtle)',
                  background: statusFilter === key ? 'var(--mqds-primary)' : 'var(--mqds-hover)',
                  color: statusFilter === key ? '#fff' : 'var(--mqds-muted)',
                }}
              >
                {label} <span style={{ opacity: 0.7 }}>{filterCount[key]}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => refetch()}
              className="cursor-pointer"
              style={{
                padding: '4px 11px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--mqds-font-mono)',
                border: '1px solid var(--mqds-border-subtle)',
                background: 'transparent',
                color: 'var(--mqds-accent)',
              }}
            >
              ↻ Refresh
            </button>
          </div>
      </div>

      {/* ── Requests list ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="dashboard-ticket-grid">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="ticket" label="Loading requests…" />
          ))}
        </div>
      ) : sortedTickets.length === 0 ? (
        <div style={{ marginTop: 32 }}>
          <EmptyState
            title={`No ${statusFilter === 'PENDING' ? 'active' : statusFilter.toLowerCase()} requests`}
            description={
              statusFilter === 'PENDING'
                ? 'Submit a question to enter the live queue and connect with a mentor.'
                : `You have no ${statusFilter.toLowerCase()} requests yet.`
            }
            action={
              statusFilter === 'PENDING' ? (
                <Button variant="primary" onClick={() => setModalOpen(true)}>
                  New request →
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => handleFilterChange('ALL')}>
                  View all requests
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="dashboard-ticket-grid">
            {paginatedTickets.map((t) => {
              const rawId = t._id || (t as { id?: string }).id
              const ticketId = typeof rawId === 'string' ? rawId : (rawId ? String(rawId) : '')
              const duration = t.requested_minutes || (t as { requestedMinutes?: number }).requestedMinutes || 15
              const queuedIdx = sortedTickets
                .filter((item) => item.status === 'PENDING')
                .findIndex((item) => (item._id || (item as { id?: string }).id) === ticketId)
              const position = queuedIdx !== -1 ? queuedIdx + 1 : undefined

              return (
                <RequestTicketCard
                  key={ticketId}
                  id={ticketId}
                  topic={t.topic}
                  description={t.description}
                  status={t.status as 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'}
                  tags={t.tags}
                  requestedMinutes={duration}
                  createdAt={t.createdAt || (t as { created_at?: string }).created_at}
                  queuePosition={position}
                />
              )
            })}
          </div>

          {/* Pagination */}
          {sortedTickets.length > ITEMS_PER_PAGE && (
            <div
              className="flex items-center justify-between"
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--mqds-border-subtle)',
                fontSize: 12,
                color: 'var(--mqds-muted)',
                fontFamily: 'var(--mqds-font-mono)',
              }}
            >
              <span>
                Showing <strong style={{ color: 'var(--mqds-text)' }}>{startIdx}–{endIdx}</strong> of{' '}
                <strong style={{ color: 'var(--mqds-text)' }}>{sortedTickets.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="!p-1.5 !min-h-0"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span style={{ padding: '0 8px', fontWeight: 700 }}>
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="!p-1.5 !min-h-0"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── History link ─────────────────────────────────────────── */}
      {tickets.length > 0 && (
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Link
            to="/history"
            className="font-mono text-xs font-semibold"
            style={{ color: 'var(--mqds-accent)', textDecoration: 'underline' }}
          >
            View full session archive →
          </Link>
        </div>
      )}

      {/* ── Ticket Creation Modal ─────────────────────────────────── */}
      {modalOpen && (
        <TicketCreationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false)
            refetch()
          }}
        />
      )}

      {/* ── Live Mentor Invite Modal ──────────────────────────────── */}
      <Modal
        open={Boolean(inviteModalData)}
        onOpenChange={(open) => {
          if (!open) handleRefuseSession()
        }}
        variant="ticket"
        ticketHeader={{
          leading: 'LIVE',
          label: 'MENTORSHIP SESSION READY',
        }}
        title="Focus Session Live"
        description="Your mentor has started the focus room and is ready to work through your problem."
        actions={
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="secondary" onClick={handleRefuseSession}>
              Decline
            </Button>
            <Button variant="primary" onClick={handleJoinSession} className="flex items-center justify-center gap-1">
              <span>Join Session</span>
              <span aria-hidden="true">&rarr;</span>
            </Button>
          </div>
        }
      />
    </main>
  )
}
