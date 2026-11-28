import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetStudentTicketsQuery } from '@/store/api/ticketApi'
import type { Ticket } from '@/types/operational.types'
import {
  Badge,
  Button,
  EmptyState,
  Skeleton,
  Table,
} from '@/design-system'
import {
  SessionDetailModal,
  type SessionDetailData,
} from '@/components/session/SessionDetailModal'

const historyTime = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

type FilterStatus = 'ALL' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'PENDING'

const FILTER_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'PENDING', label: 'In queue' },
]

const ITEMS_PER_PAGE = 8

export const TicketHistoryArchivePage: React.FC = () => {
  const { data: tickets = [], isLoading } = useGetStudentTicketsQuery()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<FilterStatus>('ALL')
  const [page, setPage] = useState(1)
  const [selectedSession, setSelectedSession] = useState<SessionDetailData | null>(null)

  // Filter tickets
  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchQ =
        !q.trim() ||
        t.topic.toLowerCase().includes(q.toLowerCase()) ||
        t.description.toLowerCase().includes(q.toLowerCase())
      const matchS = status === 'ALL' || t.status === status
      return matchQ && matchS
    })
  }, [tickets, q, status])

  // Sort descending by date
  const sorted = useMemo(() => {
    const getTimestamp = (t: Ticket): number => {
      const raw =
        t.createdAt ||
        (t as { created_at?: string }).created_at ||
        (t as { updatedAt?: string }).updatedAt
      return raw ? new Date(raw).getTime() : 0
    }
    return [...filtered].sort((a, b) => getTimestamp(b) - getTimestamp(a))
  }, [filtered])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)

  // Map ticket to SessionDetailData for modal
  const mapTicketToSession = (t: Ticket): SessionDetailData => {
    const ticketId = t._id || (t as { id?: string }).id || ''
    const ended =
      t.updatedAt ||
      (t as { updated_at?: string }).updated_at ||
      t.createdAt ||
      (t as { created_at?: string }).created_at
    const mentorName =
      typeof t.mentor_id === 'object' &&
      t.mentor_id !== null &&
      'fullName' in t.mentor_id
        ? (t.mentor_id as { fullName?: string }).fullName
        : 'Mentor'

    return {
      id: ticketId,
      title: t.topic,
      mentor: mentorName,
      endedAt: ended,
      outcome:
        t.status === 'COMPLETED'
          ? 'Session completed and solution verified with mentor.'
          : undefined,
      guidance: t.guidance_message,
      notes: t.guidance_message
        ? [
            {
              title: t.topic,
              description: t.guidance_message,
              format: 'Guidance Note',
              mentor: mentorName,
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

  const formatSessionDate = (raw?: string | Date): string => {
    if (!raw) return '—'
    const d = new Date(raw)
    return isNaN(d.getTime()) ? '—' : historyTime.format(d)
  }

  const getStatusBadge = (tStatus: string) => {
    switch (tStatus) {
      case 'COMPLETED':
        return <Badge tone="success">Completed</Badge>
      case 'CANCELLED':
        return <Badge tone="danger">Cancelled</Badge>
      case 'REJECTED':
        return <Badge tone="danger">Rejected</Badge>
      case 'ACTIVE':
        return <Badge tone="info">Active</Badge>
      default:
        return <Badge tone="warning">In queue</Badge>
    }
  }

  return (
    <main className="preview-main session-history-page">
      {/* ── Editorial Header ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <h1 className="preview-page-title">Session <span>history</span></h1>
        <Link
          to="/dashboard"
          className="font-mono text-xs font-semibold"
          style={{ color: 'var(--mqds-accent)', textDecoration: 'underline' }}
        >
          &larr; Back to dashboard
        </Link>
      </div>

      {/* ── Search Bar & Filter Pills ───────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          margin: '24px 0 16px',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', width: 'min(100%, 320px)' }}>
          <Search
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 14,
              height: 14,
              color: 'var(--mqds-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search tickets by topic…"
            className="mqds-control"
            style={{
              paddingLeft: 32,
              fontSize: 13,
              fontFamily: 'var(--mqds-font)',
              width: '100%',
            }}
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setStatus(key)
                setPage(1)
              }}
              className="cursor-pointer transition-colors"
              style={{
                padding: '4px 11px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--mqds-font-mono)',
                border:
                  status === key
                    ? 'none'
                    : '1px solid var(--mqds-border-subtle)',
                background:
                  status === key
                    ? 'var(--mqds-primary)'
                    : 'var(--mqds-hover)',
                color: status === key ? '#fff' : 'var(--mqds-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section Title ───────────────────────────────────────── */}
      <div className="sectionTitle">
        <h2>History</h2>
        <span>
          {String(filtered.length).padStart(2, '0')}{' '}
          {filtered.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      {/* ── Table & Pagination ──────────────────────────────────── */}
      {isLoading ? (
        <Skeleton variant="table" label="Loading session archive…" rows={5} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No Past Sessions Found"
          description={
            q || status !== 'ALL'
              ? 'No tickets match your search or filter criteria.'
              : 'You have not completed any mentorship sessions yet.'
          }
          action={
            (q || status !== 'ALL') ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQ('')
                  setStatus('ALL')
                  setPage(1)
                }}
              >
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table
            caption="Ticket history"
            hideHeaders
            className="dashboard-history-table"
          >
            <thead>
              <tr>
                <th scope="col">Topic</th>
                <th scope="col">Completed on</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((t) => {
                const ticketId = t._id || (t as { id?: string }).id || ''
                const dateRaw =
                  t.updatedAt ||
                  (t as { updated_at?: string }).updated_at ||
                  t.createdAt ||
                  (t as { created_at?: string }).created_at
                const dateIso = (() => {
                  if (!dateRaw) return new Date().toISOString()
                  const d = new Date(dateRaw)
                  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
                })()

                return (
                  <tr key={ticketId}>
                    <th scope="row">
                      <button
                        className="mqds-table-row-action"
                        type="button"
                        aria-label={'View session details for ' + t.topic}
                        onClick={() => setSelectedSession(mapTicketToSession(t))}
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
                      <time dateTime={dateIso}>{formatSessionDate(dateRaw)}</time>
                    </td>
                    <td data-align="end">{getStatusBadge(t.status)}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>

          {/* Pagination */}
          {sorted.length > ITEMS_PER_PAGE && (
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
                Showing{' '}
                <strong style={{ color: 'var(--mqds-text)' }}>
                  {startIdx}–{endIdx}
                </strong>{' '}
                of{' '}
                <strong style={{ color: 'var(--mqds-text)' }}>
                  {sorted.length}
                </strong>
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

      {/* ── Session Detail Modal ─────────────────────────────────── */}
      <SessionDetailModal
        isOpen={Boolean(selectedSession)}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </main>
  )
}
