import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Radio, Video, Sliders, CheckCircle2, Clock, Zap, Inbox } from 'lucide-react'
import { useGetMyMentorProfileQuery, useUpdateMyMentorProfileMutation } from '@/store/api/mentorApi'
import { useGetMentorTicketsQuery, useUpdateTicketStatusMutation, useGetPendingPoolQuery, useClaimTicketMutation } from '@/store/api/ticketApi'
import { useStartSessionMutation } from '@/store/api/sessionApi'

export const MentorDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: mentorProfileResp, refetch: refetchProfile } = useGetMyMentorProfileQuery()
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateMyMentorProfileMutation()
  const [startSession, { isLoading: isStartingSession }] = useStartSessionMutation()
  const { data: tickets = [], isLoading: isLoadingTickets, refetch: refetchTickets } = useGetMentorTicketsQuery()
  const { data: pendingPool = [], isLoading: isLoadingPool, refetch: refetchPool } = useGetPendingPoolQuery()
  const [claimTicket, { isLoading: isClaiming }] = useClaimTicketMutation()
  const [updateTicketStatus] = useUpdateTicketStatusMutation()

  const isAvailable = mentorProfileResp?.data?.is_available ?? false
  const activeTickets = tickets.filter((t) => t.status === 'PENDING' || t.status === 'APPROVED' || t.status === 'ACTIVE')
  const historyTickets = tickets.filter((t) => t.status === 'COMPLETED' || t.status === 'CANCELLED')

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
            className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              isAvailable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{isAvailable ? 'Available' : 'Offline'}</span>
          </button>
          <Link to="/mentor/configuration" className="p-2 rounded-2xl border border-slate-700 bg-slate-800 text-slate-300">
            <Sliders className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Global Pending Ticket Pool Section */}
      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[#5948d3]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Global Doubt Queue</h2>
              <p className="text-[10px] text-slate-400">Claim unassigned tickets raised by students across the platform.</p>
            </div>
          </div>
          <button onClick={() => refetchPool()} className="text-xs text-[#5948d3] hover:underline font-bold">Refresh Pool</button>
        </div>
        {isLoadingPool ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading pool...</div>
        ) : pendingPool.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No pending student tickets in the global pool right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPool.map((t) => (
              <div key={t._id} className="p-4 rounded-xl border bg-[#f9f8ff] border-[#e9e6ff] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-[#5948d3]/10 text-[#5948d3]">PENDING</span>
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
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleClaimTicket(t._id)}
                    disabled={isClaiming || !isAvailable}
                    className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${
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
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#5948d3]" />
            <h2 className="text-sm font-bold text-slate-900">Your Assigned & Active Focus Sessions</h2>
          </div>
          <button onClick={() => refetchTickets()} className="text-xs text-[#5948d3] hover:underline font-bold">Refresh</button>
        </div>
        {isLoadingTickets ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading...</div>
        ) : activeTickets.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No active tickets assigned right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTickets.map((t) => (
              <div key={t._id} className="p-4 rounded-xl border bg-slate-50 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-[#5948d3]/10 text-[#5948d3]">{t.status}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{t.requested_minutes}m</span>
                </div>
                <h3 className="font-bold text-xs text-slate-900">{t.topic}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
                <div className="pt-2 flex justify-end">
                  <button onClick={() => handleStartFocusSession(t._id)} className="px-3.5 py-1.5 rounded-lg bg-[#5948d3] hover:bg-[#4d39c7] text-white font-bold text-xs flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    <span>Launch Focus Mode</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900">Recent Completed Sessions</h2>
          </div>
          <span className="text-xs text-slate-400 font-bold">{historyTickets.length} Resolved</span>
        </div>
        {historyTickets.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No completed sessions yet.</p>
        ) : (
          historyTickets.slice(0, 5).map((t) => (
            <div key={t._id} className="p-2.5 rounded-lg border bg-slate-50 flex items-center justify-between text-xs text-slate-700">
              <span className="font-semibold">{t.topic}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">{t.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
