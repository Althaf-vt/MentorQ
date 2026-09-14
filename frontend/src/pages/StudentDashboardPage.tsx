import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useGetStudentTicketsQuery } from '@/store/api/ticketApi'
import { useAppSelector } from '@/store/hooks'
import { TicketCreationModal } from '@/components/tickets/TicketCreationModal'

export const StudentDashboardPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user)
  const [modalOpen, setModalOpen] = useState(false)
  const { data: tickets = [], isLoading, refetch } = useGetStudentTicketsQuery()

  const pendingTickets = tickets.filter((t) => t.status === 'PENDING' || t.status === 'APPROVED' || t.status === 'ACTIVE')
  const completedTickets = tickets.filter((t) => t.status === 'COMPLETED')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-body">
      <div className="bg-gradient-to-r from-[#5948d3]/10 via-[#8172fe]/5 to-transparent p-6 rounded-3xl border border-[#5948d3]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-headline">Welcome back, {user?.fullName || 'Scholar'}</h1>
          <p className="text-xs text-slate-500">Get instant 1-on-1 assistance with code issues, algorithms, and design.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="px-5 py-2.5 rounded-full bg-[#5948d3] hover:bg-[#4d39c7] text-white font-bold text-xs shadow">Request Mentorship</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <span className="text-xs text-slate-500 block font-medium">Active Requests</span>
          <span className="text-xl font-black text-slate-900">{pendingTickets.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <span className="text-xs text-slate-500 block font-medium">Completed Sessions</span>
          <span className="text-xl font-black text-slate-900">{completedTickets.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-500 block font-medium">History</span>
            <span className="text-xl font-black text-slate-900">{tickets.length}</span>
          </div>
          <Link to="/history" className="text-xs text-[#5948d3] hover:underline font-bold flex items-center gap-1">Archive <ArrowRight className="w-3 h-3" /></Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-sm font-bold text-slate-900">Recent Requests & Queue Status</h2>
          <button onClick={() => refetch()} className="text-xs text-[#5948d3] hover:underline">Refresh</button>
        </div>
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">No requests found. Create one above!</div>
        ) : (
          <div className="space-y-2">
            {tickets.slice(0, 5).map((t) => (
              <div key={t._id} className="p-3 rounded-xl border bg-[#faf9f7] flex items-center justify-between gap-3 text-xs text-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{t.status}</span>
                    <span className="font-bold text-slate-900">{t.topic}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 truncate max-w-sm">{t.description}</p>
                </div>
                <Link to={`/queue/${t._id}`} className="px-3 py-1 bg-white border rounded-full text-xs font-bold text-[#5948d3] hover:bg-[#5948d3] hover:text-white transition-colors">Track</Link>
              </div>
            ))}
          </div>
        )}
      </div>
      {modalOpen && <TicketCreationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); refetch() }} />}
    </div>
  )
}
