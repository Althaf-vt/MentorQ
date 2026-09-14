import React, { useState } from 'react'
import { useGetStudentTicketsQuery } from '@/store/api/ticketApi'
import { Search, Clock, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'

export const TicketHistoryArchivePage: React.FC = () => {
  const { data: tickets = [], isLoading } = useGetStudentTicketsQuery()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const size = 5

  const filtered = tickets.filter(t => {
    const matchQ = t.topic.toLowerCase().includes(q.toLowerCase()) || t.description.toLowerCase().includes(q.toLowerCase())
    const matchS = status === 'ALL' || t.status === status
    return matchQ && matchS
  })

  const total = Math.ceil(filtered.length / size) || 1
  const list = filtered.slice((page - 1) * size, page * size)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Session History Archive</h1>
        <p className="text-xs text-slate-500">Review your past mentorship requests and notes</p>
      </div>

      <div className="bg-white p-3 rounded-xl border flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs" />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="px-2.5 py-1.5 rounded-lg border text-xs bg-white text-slate-700">
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No sessions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-[#faf9f7] font-semibold text-slate-500 uppercase text-[10px]">
                  <th className="px-4 py-2">Topic</th>
                  <th className="px-4 py-2">Duration</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {list.map(t => (
                  <tr key={t._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate">{t.topic}</td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{t.requested_minutes}m</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : t.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right"><Link to={`/queue/${t._id}`} className="text-[#5948d3] hover:underline font-bold">Details</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-2 bg-[#faf9f7] border-t flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {total}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded bg-white border disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total} className="p-1 rounded bg-white border disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
