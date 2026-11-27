import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Filter, Sparkles, Clock, CheckCircle2, BookOpen } from 'lucide-react'
import { useGetStudentTicketsQuery } from '@/store/api/ticketApi'
import { useAppSelector } from '@/store/hooks'
import { TicketCreationModal } from '@/components/tickets/TicketCreationModal'
import { socketService } from '@/services/socket.service'
import { playNotificationSound } from '@/utils/audioUtils'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Loader,
  Modal,
  TicketAction,
  cardTiltHandlers,
} from '@/design-system'

type FilterStatus = 'PENDING' | 'ALL' | 'COMPLETED' | 'CANCELLED'

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

  // Smart Filtering: If 'PENDING' filter is active and pending tickets count is 0, auto switch to 'ALL'
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

  // Filter student tickets according to active filter
  const filteredTickets = useMemo(() => {
    if (statusFilter === 'ALL') return tickets
    if (statusFilter === 'PENDING') {
      return tickets.filter((t) => t.status === 'PENDING' || t.status === 'APPROVED' || t.status === 'ACTIVE')
    }
    return tickets.filter((t) => t.status === statusFilter)
  }, [tickets, statusFilter])

  // Sort student tickets Newest First
  const sortedTickets = useMemo(() => {
    const getTimestamp = (t: typeof tickets[0]): number => {
      const raw = t.createdAt || (t as { created_at?: string }).created_at || (t as { updatedAt?: string }).updatedAt
      return raw ? new Date(raw).getTime() : 0
    }
    return [...filteredTickets].sort((a, b) => getTimestamp(b) - getTimestamp(a))
  }, [filteredTickets])

  const ITEMS_PER_PAGE = 5
  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedTickets = sortedTickets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, sortedTickets.length)

  const handleFilterChange = (filter: FilterStatus) => {
    setStatusFilter(filter)
    setPage(1)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-body">
      {/* Hero Welcome Banner */}
      <Card
        variant="paper"
        className="p-8 sm:p-10 relative overflow-hidden border border-[var(--mqds-paper-border)] shadow-md"
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--mqds-hover)] border border-[var(--mqds-border-subtle)] text-xs font-mono font-semibold text-[var(--mqds-primary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--mqds-primary)] animate-pulse" />
              <span>Live Mentorship Queue Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--mqds-text)] font-headline tracking-tight">
              Welcome back, {user?.fullName || 'Scholar'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--mqds-muted)] leading-relaxed">
              Get immediate 1-on-1 assistance with code issues, architecture, and debugging from expert mentors.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="primary"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Request Mentorship</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="paper" className="p-5 border border-[var(--mqds-paper-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--mqds-muted)]">
              Active Requests
            </span>
            <Clock className="w-4 h-4 text-[var(--mqds-primary)]" />
          </div>
          <div className="text-2xl font-black text-[var(--mqds-text)] font-headline mt-2">
            {pendingTicketsCount}
          </div>
          <p className="text-[11px] text-[var(--mqds-muted)] mt-1 font-mono">
            {pendingTicketsCount > 0 ? 'In live queue' : 'No pending tickets'}
          </p>
        </Card>

        <Card variant="paper" className="p-5 border border-[var(--mqds-paper-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--mqds-muted)]">
              Completed Sessions
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[var(--mqds-text)] font-headline mt-2">
            {completedTicketsCount}
          </div>
          <p className="text-[11px] text-[var(--mqds-muted)] mt-1 font-mono">
            Resolved mentorships
          </p>
        </Card>

        <Card variant="paper" className="p-5 border border-[var(--mqds-paper-border)] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--mqds-muted)]">
                Session History
              </span>
              <BookOpen className="w-4 h-4 text-[var(--mqds-primary)]" />
            </div>
            <div className="text-2xl font-black text-[var(--mqds-text)] font-headline mt-2">
              {tickets.length}
            </div>
          </div>
          <Link
            to="/history"
            className="text-xs text-[var(--mqds-primary)] hover:underline font-semibold flex items-center gap-1 mt-2 pt-2 border-t border-[var(--mqds-border-subtle)]"
          >
            <span>View archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>

      {/* Recent Requests Section */}
      <Card variant="paper" className="p-6 sm:p-8 border border-[var(--mqds-paper-border)] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--mqds-border-subtle)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--mqds-text)] font-headline">
              Recent Requests &amp; Queue Status
            </h2>
            <p className="text-xs text-[var(--mqds-muted)] mt-0.5">
              Chronological ticket activity ordered with newest requests first.
            </p>
          </div>
          <Button
            variant="text"
            onClick={() => refetch()}
            className="!p-0 !min-h-0 text-xs text-[var(--mqds-primary)] font-semibold self-start sm:self-auto"
          >
            Refresh queue
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--mqds-muted)] mr-2 font-mono text-xs">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <button
            type="button"
            onClick={() => handleFilterChange('PENDING')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'PENDING'
                ? 'bg-[var(--mqds-primary)] text-white shadow-xs'
                : 'bg-[var(--mqds-surface)] border border-[var(--mqds-border-subtle)] text-[var(--mqds-muted)] hover:bg-[var(--mqds-hover)] hover:text-[var(--mqds-text)]'
            }`}
          >
            <span>Pending</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                statusFilter === 'PENDING' ? 'bg-white/20 text-white' : 'bg-[var(--mqds-border-subtle)] text-[var(--mqds-text)]'
              }`}
            >
              {pendingTicketsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-[var(--mqds-primary)] text-white shadow-xs'
                : 'bg-[var(--mqds-surface)] border border-[var(--mqds-border-subtle)] text-[var(--mqds-muted)] hover:bg-[var(--mqds-hover)] hover:text-[var(--mqds-text)]'
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-[var(--mqds-border-subtle)] text-[var(--mqds-text)]'
              }`}
            >
              {tickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('COMPLETED')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'COMPLETED'
                ? 'bg-[var(--mqds-primary)] text-white shadow-xs'
                : 'bg-[var(--mqds-surface)] border border-[var(--mqds-border-subtle)] text-[var(--mqds-muted)] hover:bg-[var(--mqds-hover)] hover:text-[var(--mqds-text)]'
            }`}
          >
            <span>Completed</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                statusFilter === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-[var(--mqds-border-subtle)] text-[var(--mqds-text)]'
              }`}
            >
              {completedTicketsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('CANCELLED')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'CANCELLED'
                ? 'bg-[var(--mqds-primary)] text-white shadow-xs'
                : 'bg-[var(--mqds-surface)] border border-[var(--mqds-border-subtle)] text-[var(--mqds-muted)] hover:bg-[var(--mqds-hover)] hover:text-[var(--mqds-text)]'
            }`}
          >
            <span>Cancelled</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                statusFilter === 'CANCELLED' ? 'bg-white/20 text-white' : 'bg-[var(--mqds-border-subtle)] text-[var(--mqds-text)]'
              }`}
            >
              {cancelledTicketsCount}
            </span>
          </button>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader />
            <p className="text-xs font-mono text-[var(--mqds-muted)]">Loading requests...</p>
          </div>
        ) : sortedTickets.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title={`No ${statusFilter.toLowerCase()} requests found`}
              description="Submit a question to enter the live queue and connect with a mentor."
              action={
                <Button variant="primary" onClick={() => setModalOpen(true)}>
                  Request Mentorship
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedTickets.map((t) => {
              const rawId = t._id || (t as { id?: string }).id
              const ticketId = typeof rawId === 'string' ? rawId : (rawId ? String(rawId) : '')
              const rawDate = t.createdAt || (t as { created_at?: string }).created_at
              const dateStr = rawDate
                ? new Date(rawDate).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''
              const duration = t.requested_minutes || (t as { requestedMinutes?: number }).requestedMinutes || 15

              return (
                <Card
                  key={ticketId}
                  variant="ticket"
                  interactive
                  {...cardTiltHandlers}
                  className="shadow-xs"
                  stub={
                    <div className="flex flex-col items-center justify-between h-full text-center py-2 px-1">
                      <Badge
                        tone={
                          t.status === 'COMPLETED'
                            ? 'success'
                            : t.status === 'ACTIVE'
                            ? 'info'
                            : t.status === 'CANCELLED'
                            ? 'danger'
                            : 'warning'
                        }
                        className="font-mono uppercase text-[10px]"
                      >
                        {t.status}
                      </Badge>
                      <div className="font-mono text-xs text-[var(--mqds-muted)] my-2">
                        {duration}m
                      </div>
                      <TicketAction onClick={() => navigate(`/queue/${ticketId}`)}>
                        Track
                      </TicketAction>
                    </div>
                  }
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--mqds-primary)]">
                        #{ticketId ? ticketId.slice(-6).toUpperCase() : '------'}
                      </span>
                      {dateStr && (
                        <span className="text-[11px] font-mono text-[var(--mqds-muted)]">
                          • {dateStr}
                        </span>
                      )}
                    </div>
                    <h3 className="font-headline font-bold text-base text-[var(--mqds-text)] leading-snug">
                      {t.topic}
                    </h3>
                    <p className="font-body text-xs text-[var(--mqds-muted)] line-clamp-2">
                      {t.description}
                    </p>
                    {t.tags && t.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {t.tags.map((tag) => (
                          <Badge key={tag} tone="neutral" className="text-[10px] font-mono">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}

            {/* Pagination Controls */}
            {sortedTickets.length > ITEMS_PER_PAGE && (
              <div className="pt-4 border-t border-[var(--mqds-border-subtle)] flex items-center justify-between text-xs text-[var(--mqds-muted)]">
                <span>
                  Showing <strong className="text-[var(--mqds-text)]">{startIdx}-{endIdx}</strong> of{' '}
                  <strong className="text-[var(--mqds-text)]">{sortedTickets.length}</strong> requests
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="!p-1.5 !min-h-0 text-xs"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="px-2 text-xs font-mono font-semibold text-[var(--mqds-text)]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="!p-1.5 !min-h-0 text-xs"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Ticket Creation Modal */}
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

      {/* Mentor Session Live Invitation Dialog */}
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
    </div>
  )
}
