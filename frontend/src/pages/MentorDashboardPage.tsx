import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Radio,
  Video,
  Sliders,
  CheckCircle2,
  Clock,
  Zap,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useGetMyMentorProfileQuery, useUpdateMyMentorProfileMutation } from '@/store/api/mentorApi'
import {
  useGetMentorTicketsQuery,
  useUpdateTicketStatusMutation,
  useGetPendingPoolQuery,
  useClaimTicketMutation,
} from '@/store/api/ticketApi'
import { useStartSessionMutation } from '@/store/api/sessionApi'

export const MentorDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: mentorProfileResp, refetch: refetchProfile } = useGetMyMentorProfileQuery()
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateMyMentorProfileMutation()
  const [startSession] = useStartSessionMutation()
  const { data: tickets = [], isLoading: isLoadingTickets, refetch: refetchTickets } = useGetMentorTicketsQuery()
  const { data: pendingPool = [], isLoading: isLoadingPool, refetch: refetchPool } = useGetPendingPoolQuery()
  const [claimTicket, { isLoading: isClaiming }] = useClaimTicketMutation()
  const [updateTicketStatus] = useUpdateTicketStatusMutation()

  // Pagination states
  const [poolPage, setPoolPage] = useState(1)
  const [activePage, setActivePage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)

  const isAvailable = mentorProfileResp?.data?.is_available ?? false

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
      const timeA = new Date(a.createdAt || (a as any).created_at || 0).getTime()
      const timeB = new Date(b.createdAt || (b as any).created_at || 0).getTime()
      return timeA - timeB
    })
  }, [pendingPool])

  // 2. Assigned / Active Focus Sessions: Sorted by Oldest First
  const sortedActiveTickets = useMemo(() => {
    return [...activeTicketsRaw].sort((a, b) => {
      const timeA = new Date(a.createdAt || (a as any).created_at || 0).getTime()
      const timeB = new Date(b.createdAt || (b as any).created_at || 0).getTime()
      return timeA - timeB
    })
  }, [activeTicketsRaw])

  // 3. Recent Completed Sessions: Sorted by Newest First
  const sortedHistoryTickets = useMemo(() => {
    return [...historyTicketsRaw].sort((a, b) => {
      const timeA = new Date(a.createdAt || (a as any).created_at || (a as any).updatedAt || 0).getTime()
      const timeB = new Date(b.createdAt || (b as any).created_at || (b as any).updatedAt || 0).getTime()
      return timeB - timeA
    })
  }, [historyTicketsRaw])

  // Pagination parameters
  const POOL_PER_PAGE = 4
  const poolTotalPages = Math.max(1, Math.ceil(sortedPendingPool.length / POOL_PER_PAGE))
  const currentPoolPage = Math.min(poolPage, poolTotalPages)
  const paginatedPool = sortedPendingPool.slice((currentPoolPage - 1) * POOL_PER_PAGE, currentPoolPage * POOL_PER_PAGE)

  const ACTIVE_PER_PAGE = 4
  const activeTotalPages = Math.max(1, Math.ceil(sortedActiveTickets.length / ACTIVE_PER_PAGE))
  const currentActivePage = Math.min(activePage, activeTotalPages)
  const paginatedActive = sortedActiveTickets.slice((currentActivePage - 1) * ACTIVE_PER_PAGE, currentActivePage * ACTIVE_PER_PAGE)

  const HISTORY_PER_PAGE = 5
  const historyTotalPages = Math.max(1, Math.ceil(sortedHistoryTickets.length / HISTORY_PER_PAGE))
  const currentHistoryPage = Math.min(historyPage, historyTotalPages)
  const paginatedHistory = sortedHistoryTickets.slice((currentHistoryPage - 1) * HISTORY_PER_PAGE, currentHistoryPage * HISTORY_PER_PAGE)

  const toggleAvailability = async () => {
    try {
      await updateProfile({ is_available: !isAvailable }).unwrap()
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
      navigate(`/focus/${ticketId}`)
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-body">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-xs font-bold text-[#8172fe] uppercase tracking-wider">Command Center</span>
          <h1 className="text-2xl font-black font-headline">Mentor Dashboard</h1>
          <p className="text-xs text-slate-400">Manage queue tickets, launch live focus sessions, and configure availability.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAvailability}
            disabled={isUpdatingProfile}
            className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              isAvailable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{isAvailable ? 'Available' : 'Offline'}</span>
          </button>
          <Link to="/mentor/configuration" className="p-2 rounded-2xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
            <Sliders className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 1. Global Pending Ticket Pool Section (FIFO Oldest First) */}
      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[#5948d3]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Global Doubt Queue</h2>
              <p className="text-[10px] text-slate-400">FIFO Queue (Oldest first) • Claim unassigned platform tickets.</p>
            </div>
          </div>
          <button onClick={() => refetchPool()} className="text-xs text-[#5948d3] hover:underline font-bold cursor-pointer">
            Refresh Pool
          </button>
        </div>

        {isLoadingPool ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading pool...</div>
        ) : sortedPendingPool.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No pending student tickets in the global pool right now.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedPool.map((t) => {
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
                    className="p-4 rounded-xl border bg-[#f9f8ff] border-[#e9e6ff] flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-[#5948d3]/10 text-[#5948d3]">
                          PENDING
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.requested_minutes || 15}m
                        </span>
                      </div>
                      <h3 className="font-bold text-xs text-slate-900">{t.topic}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
                      {t.tags && t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {t.tags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="pt-2 flex items-center justify-between border-t border-[#ece8ff]">
                      <span className="text-[10px] text-slate-400">{dateStr}</span>
                      <button
                        onClick={() => handleClaimTicket(t._id)}
                        disabled={isClaiming || !isAvailable}
                        className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isAvailable
                            ? 'bg-[#5948d3] hover:bg-[#4d39c7] text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                        title={!isAvailable ? 'Please mark yourself as Available to claim tickets' : 'Claim this ticket'}
                      >
                        <span>Claim Ticket</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls for Global Doubt Queue */}
            {sortedPendingPool.length > POOL_PER_PAGE && (
              <div className="pt-3 border-t flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing{' '}
                  <strong className="text-slate-800">
                    {(currentPoolPage - 1) * POOL_PER_PAGE + 1}-
                    {Math.min(currentPoolPage * POOL_PER_PAGE, sortedPendingPool.length)}
                  </strong>{' '}
                  of <strong className="text-slate-800">{sortedPendingPool.length}</strong> pool tickets
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPoolPage((p) => Math.max(1, p - 1))}
                    disabled={currentPoolPage === 1}
                    className="p-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                    aria-label="Previous pool page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Page {currentPoolPage} of {poolTotalPages}
                  </span>
                  <button
                    onClick={() => setPoolPage((p) => Math.min(poolTotalPages, p + 1))}
                    disabled={currentPoolPage === poolTotalPages}
                    className="p-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                    aria-label="Next pool page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Your Assigned & Active Focus Sessions (Oldest First) */}
      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#5948d3]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Your Assigned & Active Focus Sessions</h2>
              <p className="text-[10px] text-slate-400">Chronological queue (Oldest first) • Focus mode live collaboration.</p>
            </div>
          </div>
          <button onClick={() => refetchTickets()} className="text-xs text-[#5948d3] hover:underline font-bold cursor-pointer">
            Refresh
          </button>
        </div>

        {isLoadingTickets ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading...</div>
        ) : sortedActiveTickets.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No active tickets assigned right now.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedActive.map((t) => {
                const dateStr = t.createdAt || (t as any).created_at
                  ? new Date(t.createdAt || (t as any).created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''
                return (
                  <div key={t._id} className="p-4 rounded-xl border bg-slate-50 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-[#5948d3]/10 text-[#5948d3]">
                          {t.status}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.requested_minutes}m
                        </span>
                      </div>
                      <h3 className="font-bold text-xs text-slate-900">{t.topic}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
                    </div>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                      <span className="text-[10px] text-slate-400">{dateStr}</span>
                      <button
                        onClick={() => handleStartFocusSession(t._id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#5948d3] hover:bg-[#4d39c7] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Focus Mode</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls for Active Sessions */}
            {sortedActiveTickets.length > ACTIVE_PER_PAGE && (
              <div className="pt-3 border-t flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing{' '}
                  <strong className="text-slate-800">
                    {(currentActivePage - 1) * ACTIVE_PER_PAGE + 1}-
                    {Math.min(currentActivePage * ACTIVE_PER_PAGE, sortedActiveTickets.length)}
                  </strong>{' '}
                  of <strong className="text-slate-800">{sortedActiveTickets.length}</strong> active tickets
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                    disabled={currentActivePage === 1}
                    className="p-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                    aria-label="Previous active page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Page {currentActivePage} of {activeTotalPages}
                  </span>
                  <button
                    onClick={() => setActivePage((p) => Math.min(activeTotalPages, p + 1))}
                    disabled={currentActivePage === activeTotalPages}
                    className="p-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                    aria-label="Next active page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Recent Completed Sessions (Newest First) */}
      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Completed Sessions</h2>
              <p className="text-[10px] text-slate-400">Order by newest resolution first.</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-bold">{sortedHistoryTickets.length} Resolved</span>
        </div>

        {sortedHistoryTickets.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No completed sessions yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {paginatedHistory.map((t) => {
                const dateStr = t.createdAt || (t as any).created_at || (t as any).updatedAt
                  ? new Date(t.createdAt || (t as any).created_at || (t as any).updatedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''
                return (
                  <div
                    key={t._id}
                    className="p-3 rounded-lg border bg-slate-50 flex items-center justify-between text-xs text-slate-700 hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{t.topic}</span>
                      {dateStr && <span className="text-[10px] text-slate-400 ml-2">Resolved on {dateStr}</span>}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      {t.status}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls for Completed Sessions */}
            {sortedHistoryTickets.length > HISTORY_PER_PAGE && (
              <div className="pt-2 border-t flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing{' '}
                  <strong className="text-slate-800">
                    {(currentHistoryPage - 1) * HISTORY_PER_PAGE + 1}-
                    {Math.min(currentHistoryPage * HISTORY_PER_PAGE, sortedHistoryTickets.length)}
                  </strong>{' '}
                  of <strong className="text-slate-800">{sortedHistoryTickets.length}</strong> resolved sessions
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={currentHistoryPage === 1}
                    className="p-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                    aria-label="Previous history page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Page {currentHistoryPage} of {historyTotalPages}
                  </span>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    disabled={currentHistoryPage === historyTotalPages}
                    className="p-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                    aria-label="Next history page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
