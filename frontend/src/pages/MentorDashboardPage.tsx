import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Radio,
  Video,
  Sliders,
  CheckCircle2,
  Zap,
  Inbox,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { useGetMyMentorProfileQuery, useUpdateMyMentorProfileMutation } from '@/store/api/mentorApi'
import {
  useGetMentorTicketsQuery,
  useUpdateTicketStatusMutation,
  useGetPendingPoolQuery,
  useClaimTicketMutation,
  useResolveTicketWithGuidanceMutation,
} from '@/store/api/ticketApi'
import { useStartSessionMutation } from '@/store/api/sessionApi'
import { socketService } from '@/services/socket.service'
import { playNotificationSound } from '@/utils/audioUtils'
import { useToastStore } from '@/store/toastStore'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Loader,
  Modal,
  Textarea,
  cardTiltHandlers,
} from '@/design-system'

export const MentorDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: mentorProfileResp, refetch: refetchProfile } = useGetMyMentorProfileQuery(undefined, {
    pollingInterval: 30000,
  })
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateMyMentorProfileMutation()
  const [startSession] = useStartSessionMutation()
  const { data: tickets = [], isLoading: isLoadingTickets, refetch: refetchTickets } = useGetMentorTicketsQuery(undefined, {
    pollingInterval: 15000,
  })
  const { data: pendingPool = [], isLoading: isLoadingPool, refetch: refetchPool } = useGetPendingPoolQuery(undefined, {
    pollingInterval: 15000,
  })
  const [claimTicket, { isLoading: isClaiming }] = useClaimTicketMutation()
  const [updateTicketStatus] = useUpdateTicketStatusMutation()
  const [resolveWithGuidance, { isLoading: isResolvingGuidance }] = useResolveTicketWithGuidanceMutation()

  // Pagination states
  const [poolPage, setPoolPage] = useState(1)
  const [activePage, setActivePage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)

  // Guidance modal state
  const [guidanceModalData, setGuidanceModalData] = useState<{ ticketId: string } | null>(null)
  const [guidanceMessage, setGuidanceMessage] = useState('')
  const [guidanceError, setGuidanceError] = useState('')
  const showToast = useToastStore((state) => state.showToast)

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    socketService.connect()

    const handleStudentRequestedMentorship = () => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New mentorship request available.')
      }
      playNotificationSound()
      refetchPool()
    }

    socketService.on('student_requested_mentorship', handleStudentRequestedMentorship)

    return () => {
      socketService.off('student_requested_mentorship', handleStudentRequestedMentorship)
    }
  }, [refetchPool])

  const isOnline = mentorProfileResp?.data?.is_online ?? false

  // Filter tickets by category
  const activeTicketsRaw = useMemo(
    () => tickets.filter((t) => t.status === 'PENDING' || t.status === 'APPROVED' || t.status === 'ACTIVE'),
    [tickets]
  )
  const historyTicketsRaw = useMemo(
    () => tickets.filter((t) => t.status === 'COMPLETED' || t.status === 'CANCELLED'),
    [tickets]
  )

  // 1. Global Doubt Queue: Sorted by Oldest First (FIFO queue)
  const sortedPendingPool = useMemo(() => {
    return [...pendingPool].sort((a, b) => {
      const timeA = new Date(a.createdAt || (a as { created_at?: string }).created_at || 0).getTime()
      const timeB = new Date(b.createdAt || (b as { created_at?: string }).created_at || 0).getTime()
      return timeA - timeB
    })
  }, [pendingPool])

  // 2. Assigned / Active Focus Sessions: Sorted by Oldest First
  const sortedActiveTickets = useMemo(() => {
    return [...activeTicketsRaw].sort((a, b) => {
      const timeA = new Date(a.createdAt || (a as { created_at?: string }).created_at || 0).getTime()
      const timeB = new Date(b.createdAt || (b as { created_at?: string }).created_at || 0).getTime()
      return timeA - timeB
    })
  }, [activeTicketsRaw])

  // 3. Recent Completed Sessions: Sorted by Newest First
  const sortedHistoryTickets = useMemo(() => {
    return [...historyTicketsRaw].sort((a, b) => {
      const timeA = new Date(
        a.createdAt || (a as { created_at?: string }).created_at || (a as { updatedAt?: string }).updatedAt || 0
      ).getTime()
      const timeB = new Date(
        b.createdAt || (b as { created_at?: string }).created_at || (b as { updatedAt?: string }).updatedAt || 0
      ).getTime()
      return timeB - timeA
    })
  }, [historyTicketsRaw])

  // Pagination parameters
  const POOL_PER_PAGE = 4
  const poolTotalPages = Math.max(1, Math.ceil(sortedPendingPool.length / POOL_PER_PAGE))
  const currentPoolPage = Math.min(poolPage, poolTotalPages)
  const paginatedPool = sortedPendingPool.slice(
    (currentPoolPage - 1) * POOL_PER_PAGE,
    currentPoolPage * POOL_PER_PAGE
  )

  const ACTIVE_PER_PAGE = 4
  const activeTotalPages = Math.max(1, Math.ceil(sortedActiveTickets.length / ACTIVE_PER_PAGE))
  const currentActivePage = Math.min(activePage, activeTotalPages)
  const paginatedActive = sortedActiveTickets.slice(
    (currentActivePage - 1) * ACTIVE_PER_PAGE,
    currentActivePage * ACTIVE_PER_PAGE
  )

  const HISTORY_PER_PAGE = 5
  const historyTotalPages = Math.max(1, Math.ceil(sortedHistoryTickets.length / HISTORY_PER_PAGE))
  const currentHistoryPage = Math.min(historyPage, historyTotalPages)
  const paginatedHistory = sortedHistoryTickets.slice(
    (currentHistoryPage - 1) * HISTORY_PER_PAGE,
    currentHistoryPage * HISTORY_PER_PAGE
  )

  const toggleAvailability = async () => {
    try {
      const profile = mentorProfileResp?.data
      if (!profile) return

      const parsedMinutes = parseInt(String(profile.daily_available_minutes || 60), 10)

      await updateProfile({
        isOnline: !isOnline,
        dailyAvailability: parsedMinutes,
        operatingHours: {
          startTime: profile.operating_hours?.start || '09:00',
          endTime: profile.operating_hours?.end || '17:00',
          timezone: profile.operating_hours?.timezone || 'Asia/Kolkata',
        },
        expertiseTags: profile.expertise_tags || [],
      }).unwrap()
      refetchProfile()
    } catch (err) {
      console.error(err)
    }
  }

  const handleStartFocusSession = async (ticketId: string) => {
    try {
      await startSession(ticketId).unwrap()
    } catch (err) {
      console.warn('Start session warning, attempting status update fallback:', err)
      try {
        await updateTicketStatus({ id: ticketId, status: 'ACTIVE' }).unwrap()
      } catch (e) {
        console.error(e)
      }
    } finally {
      navigate(`/mentor/focus/${ticketId}`)
    }
  }

  const handleClaimTicket = async (ticketId: string) => {
    try {
      await claimTicket(ticketId).unwrap()
      refetchTickets()
      refetchPool()
    } catch (err) {
      console.error(err)
    }
  }

  const submitGuidance = async () => {
    if (!guidanceModalData || !guidanceMessage.trim()) return
    const msg = guidanceMessage.trim()
    if (msg.length < 10) {
      setGuidanceError('Guidance message must be at least 10 characters long')
      return
    }
    if (msg.length > 1000) {
      setGuidanceError('Guidance message cannot exceed 1000 characters')
      return
    }
    if (!/^(?=.*[a-zA-Z0-9])[a-zA-Z0-9\s\S]+$/.test(msg)) {
      setGuidanceError('Guidance message must contain meaningful alphanumeric text')
      return
    }

    setGuidanceError('')

    try {
      await resolveWithGuidance({ id: guidanceModalData.ticketId, message: msg }).unwrap()
      showToast('Ticket resolved with guidance', 'success')
      setGuidanceModalData(null)
      setGuidanceMessage('')
      refetchTickets()
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      showToast(error?.data?.message || 'Failed to resolve ticket', 'error')
      console.error(err)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-body">
      {/* Top Command Banner */}
      <Card
        variant="paper"
        className="p-8 sm:p-10 relative overflow-hidden border border-[var(--mqds-paper-border)] shadow-md"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--mqds-hover)] border border-[var(--mqds-border-subtle)] text-xs font-mono font-semibold text-[var(--mqds-primary)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mentor Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--mqds-text)] font-headline tracking-tight">
              Mentor Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[var(--mqds-muted)] leading-relaxed max-w-xl">
              Claim queue tickets, launch live focus rooms, or provide written guidance to unblock scholars.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleAvailability}
              disabled={isUpdatingProfile}
              className={`px-4 py-2 rounded-full border text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-xs ${
                isOnline
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                  : 'bg-[var(--mqds-warning-surface)] border-[var(--mqds-danger-border)] text-[var(--mqds-danger)]'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isOnline ? 'animate-pulse text-emerald-600' : ''}`} />
              <span>{isOnline ? 'Online • Available' : 'Offline • Busy'}</span>
            </button>
            <Link to="/mentor/configuration">
              <Button variant="secondary" className="!p-2.5 !min-h-0" aria-label="Mentor Configuration">
                <Sliders className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="paper" className="p-5 border border-[var(--mqds-paper-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--mqds-muted)]">
              Global Pool
            </span>
            <Inbox className="w-4 h-4 text-[var(--mqds-primary)]" />
          </div>
          <div className="text-2xl font-black text-[var(--mqds-text)] font-headline mt-2">
            {pendingPool.length}
          </div>
          <p className="text-[11px] text-[var(--mqds-muted)] mt-1 font-mono">
            Unclaimed doubt tickets
          </p>
        </Card>

        <Card variant="paper" className="p-5 border border-[var(--mqds-paper-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--mqds-muted)]">
              Assigned Active
            </span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[var(--mqds-text)] font-headline mt-2">
            {activeTicketsRaw.length}
          </div>
          <p className="text-[11px] text-[var(--mqds-muted)] mt-1 font-mono">
            Awaiting session or guidance
          </p>
        </Card>

        <Card variant="paper" className="p-5 border border-[var(--mqds-paper-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--mqds-muted)]">
              Resolved Sessions
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[var(--mqds-text)] font-headline mt-2">
            {historyTicketsRaw.length}
          </div>
          <p className="text-[11px] text-[var(--mqds-muted)] mt-1 font-mono">
            Completed mentorship interactions
          </p>
        </Card>
      </div>

      {/* 1. Global Pending Ticket Pool Section (FIFO Oldest First) */}
      <Card variant="paper" className="p-6 sm:p-8 border border-[var(--mqds-paper-border)] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--mqds-border-subtle)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--mqds-hover)] text-[var(--mqds-primary)] flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--mqds-text)] font-headline">
                Global Doubt Queue
              </h2>
              <p className="text-xs text-[var(--mqds-muted)] font-mono">
                FIFO Queue (Oldest first) • Claim unassigned platform tickets.
              </p>
            </div>
          </div>
          <Button
            variant="text"
            onClick={() => refetchPool()}
            className="!p-0 !min-h-0 text-xs text-[var(--mqds-primary)] font-semibold self-start sm:self-auto"
          >
            Refresh Pool
          </Button>
        </div>

        {isLoadingPool ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <Loader />
            <p className="text-xs font-mono text-[var(--mqds-muted)]">Loading ticket pool...</p>
          </div>
        ) : sortedPendingPool.length === 0 ? (
          <div className="py-6">
            <EmptyState
              title="Global Pool Empty"
              description="No unassigned student tickets in the queue right now. You will be notified when new requests arrive."
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedPool.map((t) => {
                const rawDate = t.createdAt || (t as { created_at?: string }).created_at
                const dateStr = rawDate
                  ? new Date(rawDate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''

                return (
                  <Card
                    key={t._id}
                    variant="ticket"
                    interactive
                    {...cardTiltHandlers}
                    className="shadow-xs"
                    stub={
                      <div className="flex flex-col items-center justify-between h-full text-center py-2 px-1">
                        <Badge tone="warning" className="font-mono uppercase text-[10px]">
                          Pending
                        </Badge>
                        <div className="font-mono text-xs text-[var(--mqds-muted)] my-2">
                          {t.requested_minutes || 15}m
                        </div>
                        <Button
                          variant="primary"
                          onClick={() => handleClaimTicket(t._id)}
                          disabled={isClaiming || !isOnline}
                          className="!px-3 !py-1.5 !min-h-0 text-xs w-full"
                          title={!isOnline ? 'Mark yourself as Available to claim tickets' : 'Claim this ticket'}
                        >
                          {isClaiming ? 'Claiming...' : 'Claim'}
                        </Button>
                      </div>
                    }
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--mqds-primary)]">
                          #{t._id.slice(-6).toUpperCase()}
                        </span>
                        {dateStr && (
                          <span className="text-[11px] font-mono text-[var(--mqds-muted)]">
                            • {dateStr}
                          </span>
                        )}
                      </div>
                      <h3 className="font-headline font-bold text-sm text-[var(--mqds-text)] leading-snug">
                        {t.topic}
                      </h3>
                      <p className="font-body text-xs text-[var(--mqds-muted)] line-clamp-2">
                        {t.description}
                      </p>
                      {t.tags && t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
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
            </div>

            {/* Pagination Controls for Pool */}
            {sortedPendingPool.length > POOL_PER_PAGE && (
              <div className="pt-4 border-t border-[var(--mqds-border-subtle)] flex items-center justify-between text-xs text-[var(--mqds-muted)]">
                <span>
                  Showing{' '}
                  <strong className="text-[var(--mqds-text)]">
                    {(currentPoolPage - 1) * POOL_PER_PAGE + 1}-
                    {Math.min(currentPoolPage * POOL_PER_PAGE, sortedPendingPool.length)}
                  </strong>{' '}
                  of <strong className="text-[var(--mqds-text)]">{sortedPendingPool.length}</strong> pool tickets
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPoolPage((p) => Math.max(1, p - 1))}
                    disabled={currentPoolPage === 1}
                    className="!p-1.5 !min-h-0 text-xs"
                    aria-label="Previous pool page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="px-2 text-xs font-mono font-semibold text-[var(--mqds-text)]">
                    Page {currentPoolPage} of {poolTotalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPoolPage((p) => Math.min(poolTotalPages, p + 1))}
                    disabled={currentPoolPage === poolTotalPages}
                    className="!p-1.5 !min-h-0 text-xs"
                    aria-label="Next pool page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 2. Your Assigned & Active Focus Sessions (Oldest First) */}
      <Card variant="paper" className="p-6 sm:p-8 border border-[var(--mqds-paper-border)] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--mqds-border-subtle)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--mqds-hover)] text-[var(--mqds-primary)] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--mqds-text)] font-headline">
                Your Assigned Active Sessions
              </h2>
              <p className="text-xs text-[var(--mqds-muted)] font-mono">
                Chronological queue (Oldest first) • Focus mode live collaboration.
              </p>
            </div>
          </div>
          <Button
            variant="text"
            onClick={() => refetchTickets()}
            className="!p-0 !min-h-0 text-xs text-[var(--mqds-primary)] font-semibold self-start sm:self-auto"
          >
            Refresh Tickets
          </Button>
        </div>

        {isLoadingTickets ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <Loader />
            <p className="text-xs font-mono text-[var(--mqds-muted)]">Loading active tickets...</p>
          </div>
        ) : sortedActiveTickets.length === 0 ? (
          <div className="py-6">
            <EmptyState
              title="No Active Assignments"
              description="Claim tickets from the Global Doubt Queue above to begin working with students."
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedActive.map((t) => {
                const rawDate = t.createdAt || (t as { created_at?: string }).created_at
                const dateStr = rawDate
                  ? new Date(rawDate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''

                return (
                  <Card
                    key={t._id}
                    variant="ticket"
                    interactive
                    {...cardTiltHandlers}
                    className="shadow-xs"
                    stub={
                      <div className="flex flex-col items-center justify-between h-full text-center py-2 px-1">
                        <Badge
                          tone={t.status === 'ACTIVE' ? 'info' : 'warning'}
                          className="font-mono uppercase text-[10px]"
                        >
                          {t.status}
                        </Badge>
                        <div className="font-mono text-xs text-[var(--mqds-muted)] my-2">
                          {t.requested_minutes || 15}m
                        </div>
                        <div className="space-y-1.5 w-full">
                          <Button
                            variant="secondary"
                            onClick={() => setGuidanceModalData({ ticketId: t._id })}
                            className="!px-2 !py-1 !min-h-0 text-[10px] w-full flex items-center justify-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Guide</span>
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleStartFocusSession(t._id)}
                            className="!px-2 !py-1 !min-h-0 text-[10px] w-full flex items-center justify-center gap-1"
                          >
                            <Video className="w-3 h-3" />
                            <span>Focus</span>
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--mqds-primary)]">
                          #{t._id.slice(-6).toUpperCase()}
                        </span>
                        {dateStr && (
                          <span className="text-[11px] font-mono text-[var(--mqds-muted)]">
                            • {dateStr}
                          </span>
                        )}
                      </div>
                      <h3 className="font-headline font-bold text-sm text-[var(--mqds-text)] leading-snug">
                        {t.topic}
                      </h3>
                      <p className="font-body text-xs text-[var(--mqds-muted)] line-clamp-2">
                        {t.description}
                      </p>
                      {t.tags && t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
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
            </div>

            {/* Pagination Controls for Active */}
            {sortedActiveTickets.length > ACTIVE_PER_PAGE && (
              <div className="pt-4 border-t border-[var(--mqds-border-subtle)] flex items-center justify-between text-xs text-[var(--mqds-muted)]">
                <span>
                  Showing{' '}
                  <strong className="text-[var(--mqds-text)]">
                    {(currentActivePage - 1) * ACTIVE_PER_PAGE + 1}-
                    {Math.min(currentActivePage * ACTIVE_PER_PAGE, sortedActiveTickets.length)}
                  </strong>{' '}
                  of <strong className="text-[var(--mqds-text)]">{sortedActiveTickets.length}</strong> active tickets
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                    disabled={currentActivePage === 1}
                    className="!p-1.5 !min-h-0 text-xs"
                    aria-label="Previous active page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="px-2 text-xs font-mono font-semibold text-[var(--mqds-text)]">
                    Page {currentActivePage} of {activeTotalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setActivePage((p) => Math.min(activeTotalPages, p + 1))}
                    disabled={currentActivePage === activeTotalPages}
                    className="!p-1.5 !min-h-0 text-xs"
                    aria-label="Next active page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 3. Recent Completed Sessions (Newest First) */}
      <Card variant="paper" className="p-6 sm:p-8 border border-[var(--mqds-paper-border)] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--mqds-border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--mqds-hover)] text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--mqds-text)] font-headline">
                Recent Resolved Sessions
              </h2>
              <p className="text-xs text-[var(--mqds-muted)] font-mono">
                Order by newest resolution first.
              </p>
            </div>
          </div>
          <Badge tone="success" className="font-mono text-xs">
            {sortedHistoryTickets.length} Resolved
          </Badge>
        </div>

        {sortedHistoryTickets.length === 0 ? (
          <p className="text-xs font-mono text-[var(--mqds-muted)] py-4 text-center">
            No completed sessions recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {paginatedHistory.map((t) => {
                const rawDate =
                  t.createdAt || (t as { created_at?: string }).created_at || (t as { updatedAt?: string }).updatedAt
                const dateStr = rawDate
                  ? new Date(rawDate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''

                return (
                  <div
                    key={t._id}
                    className="p-3.5 rounded-xl border border-[var(--mqds-border-subtle)] bg-[var(--mqds-surface)] flex items-center justify-between text-xs text-[var(--mqds-text)] hover:border-[var(--mqds-primary)]/40 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--mqds-text)]">{t.topic}</span>
                      {dateStr && (
                        <p className="text-[11px] font-mono text-[var(--mqds-muted)]">
                          Resolved on {dateStr}
                        </p>
                      )}
                    </div>
                    <Badge tone="success" className="font-mono text-[10px] uppercase">
                      {t.status}
                    </Badge>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls for Completed */}
            {sortedHistoryTickets.length > HISTORY_PER_PAGE && (
              <div className="pt-3 border-t border-[var(--mqds-border-subtle)] flex items-center justify-between text-xs text-[var(--mqds-muted)]">
                <span>
                  Showing{' '}
                  <strong className="text-[var(--mqds-text)]">
                    {(currentHistoryPage - 1) * HISTORY_PER_PAGE + 1}-
                    {Math.min(currentHistoryPage * HISTORY_PER_PAGE, sortedHistoryTickets.length)}
                  </strong>{' '}
                  of <strong className="text-[var(--mqds-text)]">{sortedHistoryTickets.length}</strong> resolved sessions
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={currentHistoryPage === 1}
                    className="!p-1.5 !min-h-0 text-xs"
                    aria-label="Previous history page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="px-2 text-xs font-mono font-semibold text-[var(--mqds-text)]">
                    Page {currentHistoryPage} of {historyTotalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    disabled={currentHistoryPage === historyTotalPages}
                    className="!p-1.5 !min-h-0 text-xs"
                    aria-label="Next history page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Guidance Resolution Modal */}
      <Modal
        open={Boolean(guidanceModalData)}
        onOpenChange={(open) => {
          if (!open) {
            setGuidanceModalData(null)
            setGuidanceMessage('')
            setGuidanceError('')
          }
        }}
        variant="ticket"
        ticketHeader={{
          leading: 'NOTE',
          label: 'MENTOR GUIDANCE RESOLUTION',
        }}
        title="Provide Guidance &amp; Resolve"
        description="Provide resources, links, or architectural advice to resolve this student's doubt directly without launching Focus Mode."
        actions={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => {
                setGuidanceModalData(null)
                setGuidanceMessage('')
                setGuidanceError('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isResolvingGuidance || !guidanceMessage.trim()}
              onClick={submitGuidance}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isResolvingGuidance ? 'Resolving...' : 'Submit & Resolve'}</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          <Textarea
            label="Guidance Message"
            value={guidanceMessage}
            onChange={(e) => {
              setGuidanceMessage(e.target.value)
              if (guidanceError) setGuidanceError('')
            }}
            rows={5}
            placeholder="e.g. Check out this documentation link, ensure useEffect has proper dependencies, or consider using useMemo..."
            error={guidanceError || undefined}
          />
        </div>
      </Modal>
    </div>
  )
}
