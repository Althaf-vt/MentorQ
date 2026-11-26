import React, { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGetStudentTicketsQuery } from '@/store/api/ticketApi'
import { Search, Clock, ChevronLeft, ChevronRight, Filter, BookOpen } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  DocumentFolder,
  EmptyState,
  Loader,
  Table,
} from '@/design-system'

export const TicketHistoryArchivePage: React.FC = () => {
  const navigate = useNavigate()
  const { data: tickets = [], isLoading } = useGetStudentTicketsQuery()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [folderOpen, setFolderOpen] = useState(false)
  const size = 5

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchQ =
        t.topic.toLowerCase().includes(q.toLowerCase()) ||
        t.description.toLowerCase().includes(q.toLowerCase())
      const matchS = status === 'ALL' || t.status === status
      return matchQ && matchS
    })
  }, [tickets, q, status])

  const total = Math.max(1, Math.ceil(filtered.length / size))
  const list = filtered.slice((page - 1) * size, page * size)

  // Extract past notes/guidance for DocumentFolder
  const archivedNotes = useMemo(() => {
    return tickets
      .filter((t) => Boolean(t.guidance_message || t.status === 'COMPLETED'))
      .slice(0, 10)
      .map((t) => ({
        id: t._id,
        title: t.topic,
      }))
  }, [tickets])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-body">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-[var(--mqds-text)] tracking-tight">
            Session History Archive
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mqds-muted)] mt-1">
            Review your past mentorship sessions, ticket records, and mentor guidance notes.
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="secondary" className="!px-3.5 !py-2 !min-h-0 text-xs">
            &larr; Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Interactive Document Folder for Past Guidance Notes */}
      {archivedNotes.length > 0 && (
        <Card variant="paper" className="p-6 border border-[var(--mqds-paper-border)] shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[var(--mqds-primary)]" />
            <h2 className="text-sm font-bold font-headline text-[var(--mqds-text)]">
              Archived Guidance Folders
            </h2>
          </div>
          <DocumentFolder
            label="Mentor Guidance"
            items={archivedNotes}
            tone="lilac"
            open={folderOpen}
            onToggle={() => setFolderOpen(!folderOpen)}
            onItemClick={(item) => navigate(`/queue/${item.id}`)}
          />
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card variant="paper" className="p-4 border border-[var(--mqds-paper-border)] flex flex-col sm:flex-row gap-3 justify-between items-center shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--mqds-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search tickets by topic or keyword..."
            className="mqds-control pl-8 text-xs !min-h-[36px]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[var(--mqds-muted)]" />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="mqds-control text-xs !min-h-[36px] bg-[var(--mqds-surface)] px-3"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </Card>

      {/* Sessions Table */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader />
            <p className="text-xs font-mono text-[var(--mqds-muted)]">Loading archive...</p>
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            title="No Past Sessions Found"
            description={q || status !== 'ALL' ? 'No tickets match your filter criteria.' : 'You have not completed any mentorship sessions yet.'}
          />
        ) : (
          <div className="space-y-4">
            <Table caption="Mentorship Session Archive Records">
              <thead>
                <tr>
                  <th scope="col">Topic</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Status</th>
                  <th scope="col">Date</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t._id}>
                    <td className="font-semibold text-[var(--mqds-text)] max-w-xs truncate">
                      {t.topic}
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--mqds-muted)]">
                        <Clock className="w-3.5 h-3.5 text-[var(--mqds-primary)]" />
                        <span>{t.requested_minutes || 15}m</span>
                      </span>
                    </td>
                    <td>
                      <Badge
                        tone={
                          t.status === 'COMPLETED'
                            ? 'success'
                            : t.status === 'CANCELLED' || t.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        className="font-mono text-[10px] uppercase"
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="text-[var(--mqds-muted)] font-mono text-xs">
                      {new Date(t.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/queue/${t._id}`}
                        className="text-xs font-semibold text-[var(--mqds-primary)] hover:underline"
                      >
                        Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination Controls */}
            <div className="p-3 rounded-xl bg-[var(--mqds-surface)] border border-[var(--mqds-border-subtle)] flex items-center justify-between text-xs text-[var(--mqds-muted)] font-mono">
              <span>
                Page <strong className="text-[var(--mqds-text)]">{page}</strong> of{' '}
                <strong className="text-[var(--mqds-text)]">{total}</strong>
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="!p-1.5 !min-h-0 text-xs"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(total, p + 1))}
                  disabled={page === total}
                  className="!p-1.5 !min-h-0 text-xs"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
