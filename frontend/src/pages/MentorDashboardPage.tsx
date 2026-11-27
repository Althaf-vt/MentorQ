import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
import { useAppSelector } from '@/store/hooks'
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  Skeleton,
  Table,
  Textarea,
} from '@/design-system'
import { MentorOrbit } from '@/components/preview/MentorOrbit'
import { RequestTicketCard } from '@/components/tickets/RequestTicketCard'
import { MentorTriageWorkspace } from '@/components/mentor/MentorTriageWorkspace'
import {
  SessionDetailModal,
  type SessionDetailData,
} from '@/components/session/SessionDetailModal'
import type { Ticket } from '@/types/operational.types'

const historyTime = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const HISTORY_PER_PAGE = 5

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

  // Pagination & modal states
  const [historyPage, setHistoryPage] = useState(1)
  const [guidanceModalData, setGuidanceModalData] = useState<{ ticketId: string } | null>(null)
  const [guidanceMessage, setGuidanceMessage] = useState('')
  const [guidanceError, setGuidanceError] = useState('')
  const [selectedHistorySession, setSelectedHistorySession] = useState<SessionDetailData | null>(null)
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

  const user = useAppSelector((state) => state.auth.user)
  const profile = mentorProfileResp?.data
  const isOnline = profile?.is_online ?? false
  const mentorName = user?.fullName || ''

  // Filter tickets
  const activeTicketsRaw = useMemo(
    () => tickets.filter((t) => t.status === 'PENDING' || t.status === 'APPROVED' || t.status === 'ACTIVE'),
    [tickets]
  )
  const historyTicketsRaw = useMemo(
    () => tickets.filter((t) => t.status === 'COMPLETED' || t.status === 'CANCELLED'),
    [tickets]
  )

  // 1. Pending pool: sorted by oldest first
  const sortedPendingPool = useMemo(() => {
    return [...pendingPool].sort((a, b) => {
      const timeA = new Date(a.createdAt || (a as { created_at?: string }).created_at || 0).getTime()
      const timeB = new Date(b.createdAt || (b as { created_at?: string }).created_at || 0).getTime()
      return timeA - timeB
    })
  }, [pendingPool])

  // 2. Active tickets: sorted by oldest first
  const sortedActiveTickets = useMemo(() => {
    return [...activeTicketsRaw].sort((a, b) => {
      const timeA = new Date(a.createdAt || (a as { created_at?: string }).created_at || 0).getTime()
      const timeB = new Date(b.createdAt || (b as { created_at?: string }).created_at || 0).getTime()
      return timeA - timeB
    })
  }, [activeTicketsRaw])

  // 3. History: sorted by newest first
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

  // History pagination
  const historyTotalPages = Math.max(1, Math.ceil(sortedHistoryTickets.length / HISTORY_PER_PAGE))
  const currentHistoryPage = Math.min(historyPage, historyTotalPages)
  const paginatedHistory = sortedHistoryTickets.slice(
    (currentHistoryPage - 1) * HISTORY_PER_PAGE,
    currentHistoryPage * HISTORY_PER_PAGE
  )

  const toggleAvailability = async () => {
    try {
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

  // Active focus session ticket (if one exists)
  const activeFocusTicket = sortedActiveTickets.find((t) => t.status === 'ACTIVE')
  const activeFocusId = activeFocusTicket
    ? (() => {
        const r = activeFocusTicket._id || (activeFocusTicket as { id?: string }).id
        return typeof r === 'string' ? r : r ? String(r) : ''
      })()
    : ''

  // Map history ticket to SessionDetailData
  const mapTicketToSession = (t: Ticket): SessionDetailData => {
    const ticketId = t._id || (t as { id?: string }).id || ''
    const ended =
      t.updatedAt ||
      (t as { updated_at?: string }).updated_at ||
      t.createdAt ||
      (t as { created_at?: string }).created_at

    return {
      id: ticketId,
      title: t.topic,
      mentor: mentorName || 'You (Mentor)',
      endedAt: ended,
      outcome:
        t.status === 'COMPLETED'
          ? 'Mentorship session concluded and problem solved.'
          : undefined,
      guidance: t.guidance_message,
      notes: t.guidance_message
        ? [
            {
              title: t.topic,
              description: t.guidance_message,
              format: 'Guidance Note',
              mentor: mentorName || 'You (Mentor)',
            },
          ]
        : undefined,
      messages: [
        {
          author: 'student',
          text: t.description,
          at: t.createdAt,
        },
        ...(t.guidance_message
          ? [
              {
                author: 'mentor',
                text: t.guidance_message,
                at: ended,
              },
            ]
          : []),
      ],
    }
  }

  const formatHistoryDate = (raw?: string | Date): string => {
    if (!raw) return '—'
    const d = new Date(raw)
    return isNaN(d.getTime()) ? '—' : historyTime.format(d)
  }

  return (
    <main className="preview-main">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero">
        <div>
          <small>Mentor command center</small>
          <h1>
            {mentorName ? (
              <>
                {mentorName.split(' ')[0]}'s<br />
                <span>triage queue.</span>
              </>
            ) : (
              <>
                Mentor<br />
                <span>triage queue.</span>
              </>
            )}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <button
              type="button"
              onClick={toggleAvailability}
              disabled={isUpdatingProfile}
              className="cursor-pointer transition-all"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 24,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'var(--mqds-font-mono)',
                border: '1px solid var(--mqds-border-subtle)',
                background: isOnline
                  ? 'var(--mqds-success-surface, #e8f5e9)'
                  : 'var(--mqds-surface)',
                color: isOnline
                  ? 'var(--mqds-success-text, #1b5e20)'
                  : 'var(--mqds-muted)',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isOnline ? '#2e855e' : 'var(--mqds-muted)',
                  boxShadow: isOnline ? '0 0 8px #2e855e88' : 'none',
                }}
              />
              <span>{isOnline ? 'Online · Available for triage' : 'Offline · Unavailable'}</span>
            </button>
          </div>
        </div>

        {/* Orbit — right side of hero */}
        <MentorOrbit />
      </section>

      {/* ── Active Focus Session Banner ──────────────────────────── */}
      {activeFocusTicket && activeFocusId && (
        <article
          className="ticket live-ready-ticket"
          data-mqds="light"
          tabIndex={0}
          role="region"
          aria-label="Active focus room ticket"
          style={{ marginBottom: 24, cursor: 'pointer' }}
          onClick={() => handleStartFocusSession(activeFocusId)}
        >
          <div className="body">
            <div className="stamp" aria-hidden="true">&lt;/&gt;</div>
            <div>
              <small>Live room / {activeFocusTicket.requested_minutes || 15} min session</small>
              <h2>{activeFocusTicket.topic}</h2>
              <button
                className="cta join-live"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartFocusSession(activeFocusId)
                }}
              >
                Enter room <b aria-hidden="true">→</b>
              </button>
            </div>
          </div>
          <div className="stub">
            <strong>Ready</strong>
            <span>Active session</span>
          </div>
        </article>
      )}

      {/* ── Incoming Doubt Queue (Triage Workspace) ──────────────── */}
      <div className="sectionTitle" style={{ marginTop: 28 }}>
        <h2>Incoming triage pool</h2>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 13,
              fontFamily: 'var(--mqds-font-mono)',
              color: 'var(--mqds-muted)',
            }}
          >
            {sortedPendingPool.length}{' '}
            {sortedPendingPool.length === 1 ? 'ticket waiting' : 'tickets waiting'}
          </span>
          <button
            type="button"
            onClick={() => {
              refetchPool()
              refetchTickets()
            }}
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

      {isLoadingPool ? (
        <Skeleton variant="ticket" label="Loading incoming triage pool…" />
      ) : (
        <MentorTriageWorkspace
          tickets={sortedPendingPool}
          onClaim={handleClaimTicket}
          onDecline={async (id) => {
            await updateTicketStatus({ id, status: 'CANCELLED' })
            refetchPool()
          }}
          isClaiming={isClaiming}
        />
      )}

      {/* ── Assigned Tickets ─────────────────────────────────────── */}
      {sortedActiveTickets.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <div className="sectionTitle">
            <h2>Assigned tickets</h2>
            <span>
              {sortedActiveTickets.length}{' '}
              {sortedActiveTickets.length === 1 ? 'active' : 'active'}
            </span>
          </div>

          <div className="dashboard-ticket-grid">
            {sortedActiveTickets.map((t) => {
              const rawId = t._id || (t as { id?: string }).id
              const ticketId =
                typeof rawId === 'string' ? rawId : rawId ? String(rawId) : ''
              const duration =
                t.requested_minutes ||
                (t as { requestedMinutes?: number }).requestedMinutes ||
                15

              return (
                <div key={ticketId} className="mentor-ticket-grid-item">
                  <RequestTicketCard
                    id={ticketId}
                    topic={t.topic}
                    description={t.description}
                    status={
                      t.status as
                        | 'PENDING'
                        | 'APPROVED'
                        | 'ACTIVE'
                        | 'COMPLETED'
                        | 'CANCELLED'
                    }
                    tags={t.tags}
                    requestedMinutes={duration}
                    createdAt={
                      t.createdAt || (t as { created_at?: string }).created_at
                    }
                    actionLabel="Enter Room"
                    onActionClick={() => handleStartFocusSession(ticketId)}
                  />
                  <div className="mentor-ticket-secondary-action">
                    <Button
                      variant="secondary"
                      style={{ fontSize: 12, minHeight: 0, padding: '6px 12px' }}
                      onClick={() => setGuidanceModalData({ ticketId })}
                    >
                      Resolve with guidance
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Completed Sessions Table ─────────────────────────────── */}
      <section style={{ marginTop: 36 }}>
        <div className="sectionTitle">
          <h2>Completed sessions</h2>
          <span>
            {sortedHistoryTickets.length}{' '}
            {sortedHistoryTickets.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>

        {isLoadingTickets ? (
          <Skeleton variant="table" label="Loading completed sessions…" rows={4} />
        ) : sortedHistoryTickets.length === 0 ? (
          <EmptyState
            title="No completed sessions yet"
            description="Sessions you mentor will be permanently recorded in your history archive."
          />
        ) : (
          <>
            <Table
              caption="Mentor completed session history"
              hideHeaders
              className="dashboard-history-table"
            >
              <thead>
                <tr>
                  <th scope="col">Topic</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((t) => {
                  const rawId = t._id || (t as { id?: string }).id
                  const ticketId =
                    typeof rawId === 'string'
                      ? rawId
                      : rawId
                      ? String(rawId)
                      : ''
                  const dateRaw =
                    t.updatedAt ||
                    (t as { updated_at?: string }).updated_at ||
                    t.createdAt ||
                    (t as { created_at?: string }).created_at
                  const dateIso = (() => {
                    if (!dateRaw) return new Date().toISOString()
                    const d = new Date(dateRaw)
                    return isNaN(d.getTime())
                      ? new Date().toISOString()
                      : d.toISOString()
                  })()

                  return (
                    <tr key={ticketId}>
                      <th scope="row">
                        <button
                          className="mqds-table-row-action"
                          type="button"
                          aria-label={'View session details for ' + t.topic}
                          onClick={() =>
                            setSelectedHistorySession(mapTicketToSession(t))
                          }
                        >
                          <span
                            className="mqds-table-row-stamp"
                            aria-hidden="true"
                          >
                            &rarr;
                          </span>
                          {t.topic}
                        </button>
                      </th>
                      <td data-align="end">
                        <time dateTime={dateIso}>{formatHistoryDate(dateRaw)}</time>
                      </td>
                      <td data-align="end">
                        <Badge
                          tone={
                            t.status === 'COMPLETED' ? 'success' : 'danger'
                          }
                        >
                          {t.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>

            {/* Pagination */}
            {sortedHistoryTickets.length > HISTORY_PER_PAGE && (
              <div
                className="flex items-center justify-between"
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: '1px solid var(--mqds-border-subtle)',
                  fontSize: 12,
                  color: 'var(--mqds-muted)',
                  fontFamily: 'var(--mqds-font-mono)',
                }}
              >
                <span>
                  Page{' '}
                  <strong style={{ color: 'var(--mqds-text)' }}>
                    {currentHistoryPage}
                  </strong>{' '}
                  of{' '}
                  <strong style={{ color: 'var(--mqds-text)' }}>
                    {historyTotalPages}
                  </strong>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={currentHistoryPage === 1}
                    className="!p-1.5 !min-h-0"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setHistoryPage((p) => Math.min(historyTotalPages, p + 1))
                    }
                    disabled={currentHistoryPage === historyTotalPages}
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
      </section>

      {/* ── Guidance Modal ───────────────────────────────────────── */}
      {guidanceModalData && (
        <Modal
          open={Boolean(guidanceModalData)}
          onOpenChange={(open) => {
            if (!open) {
              setGuidanceModalData(null)
              setGuidanceError('')
            }
          }}
          variant="ticket"
          ticketHeader={{
            leading: '✎',
            label: 'MENTOR GUIDANCE NOTES',
          }}
          title="Provide Guidance & Resolve"
          description="Provide written guidance, key takeaways, and next steps to resolve this ticket."
          actions={
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="secondary"
                onClick={() => setGuidanceModalData(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isResolvingGuidance}
                onClick={submitGuidance}
              >
                {isResolvingGuidance ? 'Submitting…' : 'Resolve Ticket'}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <Textarea
              label="Guidance Message"
              value={guidanceMessage}
              onChange={(e) => {
                setGuidanceMessage(e.target.value)
                setGuidanceError('')
              }}
              rows={4}
              maxLength={1000}
              placeholder="Explain the solution, concept references, or next steps..."
              error={guidanceError}
            />
          </div>
        </Modal>
      )}

      {/* ── Session Detail Modal (History details) ────────────────── */}
      <SessionDetailModal
        isOpen={Boolean(selectedHistorySession)}
        session={selectedHistorySession}
        onClose={() => setSelectedHistorySession(null)}
      />
    </main>
  )
}
