import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Inbox, Filter } from 'lucide-react'
import { useGetStudentTicketsQuery } from '@/store/api/ticketApi'
import { useAppSelector } from '@/store/hooks'
import { TicketCreationModal } from '@/components/tickets/TicketCreationModal'
import { socketService } from '@/services/socket.service'
import { playNotificationSound } from '@/utils/audioUtils'

type FilterStatus = 'PENDING' | 'ALL' | 'COMPLETED' | 'CANCELLED'

export const StudentDashboardPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('PENDING')
  const navigate = useNavigate()
  const [inviteModalData, setInviteModalData] = useState<{ticketId: string; sessionId: string} | null>(null)

  // Auto-refreshing poll every 20 seconds (stealth)
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

    const handleFocusModeStarted = (data: any) => {
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
        sessionId: inviteModalData.sessionId 
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
    return [...filteredTickets].sort((a, b) => {
      const timeA = new Date(a.createdAt || (a as any).created_at || (a as any).updatedAt || 0).getTime()
      const timeB = new Date(b.createdAt || (b as any).created_at || (b as any).updatedAt || 0).getTime()
      return timeB - timeA
    })
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-body">
      <div className="bg-gradient-to-r from-[#5948d3]/10 via-[#8172fe]/5 to-transparent p-6 rounded-3xl border border-[#5948d3]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-headline">Welcome back, {user?.fullName || 'Scholar'}</h1>
          <p className="text-xs text-slate-500">Get instant 1-on-1 assistance with code issues, algorithms, and design.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[#5948d3] hover:bg-[#4d39c7] text-white font-bold text-xs shadow cursor-pointer transition-colors"
        >
          Request Mentorship
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <span className="text-xs text-slate-500 block font-medium">Active Requests</span>
          <span className="text-xl font-black text-slate-900">{pendingTicketsCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <span className="text-xs text-slate-500 block font-medium">Completed Sessions</span>
          <span className="text-xl font-black text-slate-900">{completedTicketsCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-500 block font-medium">History</span>
            <span className="text-xl font-black text-slate-900">{tickets.length}</span>
          </div>
          <Link to="/history" className="text-xs text-[#5948d3] hover:underline font-bold flex items-center gap-1">
            Archive <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Requests & Queue Status</h2>
            <p className="text-[10px] text-slate-400">Chronological activity ordered by newest request first.</p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button onClick={() => refetch()} className="text-xs text-[#5948d3] hover:underline font-semibold cursor-pointer">
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Pending default, All, Completed, Cancelled) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1 text-slate-400 mr-1 text-[11px]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <button
            type="button"
            onClick={() => handleFilterChange('PENDING')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'PENDING'
                ? 'bg-[#5948d3] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>Pending</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${statusFilter === 'PENDING' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {pendingTicketsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-[#5948d3] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>All</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {tickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('COMPLETED')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'COMPLETED'
                ? 'bg-[#5948d3] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>Completed</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${statusFilter === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {completedTicketsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('CANCELLED')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'CANCELLED'
                ? 'bg-[#5948d3] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>Cancelled</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${statusFilter === 'CANCELLED' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {cancelledTicketsCount}
            </span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading requests...</div>
        ) : sortedTickets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Inbox className="w-6 h-6 text-slate-300" />
            <span>No {statusFilter.toLowerCase()} requests found.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {paginatedTickets.map((t) => {
                const dateStr = t.createdAt || (t as any).created_at
                  ? new Date(t.createdAt || (t as any).created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''
                return (
                  <div
                    key={t._id}
                    className="p-3 rounded-xl border bg-[#faf9f7] flex items-center justify-between gap-3 text-xs text-slate-700 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'ACTIVE'
                              ? 'bg-[#5948d3]/15 text-[#5948d3]'
                              : t.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                        <span className="font-bold text-slate-900">{t.topic}</span>
                        {dateStr && <span className="text-[10px] text-slate-400">• {dateStr}</span>}
                      </div>
                      <p className="text-slate-500 text-[11px] truncate max-w-md">{t.description}</p>
                    </div>
                    <Link
                      to={`/queue/${t._id}`}
                      className="px-3.5 py-1 bg-white border rounded-full text-xs font-bold text-[#5948d3] hover:bg-[#5948d3] hover:text-white transition-colors shrink-0"
                    >
                      Track
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {sortedTickets.length > ITEMS_PER_PAGE && (
              <div className="pt-3 border-t flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing <strong className="text-slate-800">{startIdx}-{endIdx}</strong> of{' '}
                  <strong className="text-slate-800">{sortedTickets.length}</strong> requests
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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

      {inviteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5 text-center relative animate-in zoom-in-95 fade-in duration-200">
            <h2 className="text-xl font-black text-slate-900 font-headline">Session Started</h2>
            <p className="text-sm text-slate-600 font-medium">
              Focus mode is started by your mentor. They are waiting for you.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleJoinSession}
                className="w-full py-3 rounded-xl bg-[#5948d3] hover:bg-[#4d39c7] text-white font-bold text-sm shadow-md transition-colors"
              >
                Join Now
              </button>
              <button
                onClick={handleRefuseSession}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
              >
                Cancel / Refuse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
