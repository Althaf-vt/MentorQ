import { useState } from 'react'
import { useGetUsersQuery, useUpdateUserStatusMutation } from '@/store/api/adminApi'
import { Loader2, ShieldAlert, CheckCircle2, Ban } from 'lucide-react'
import clsx from 'clsx'

export function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<string>('')
  
  const { data, isLoading, isFetching } = useGetUsersQuery({ page, limit: 10, role: roleFilter || undefined })
  const [updateStatus, { isLoading: isUpdating }] = useUpdateUserStatusMutation()

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED') => {
    try {
      await updateStatus({ id: userId, status: newStatus }).unwrap()
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'SUSPENDED': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'BANNED': return 'bg-red-500/10 text-red-400 border-red-500/20'
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MENTOR': return 'bg-purple-500/10 text-purple-400'
      case 'STUDENT': return 'bg-blue-500/10 text-blue-400'
      case 'ADMIN': return 'bg-red-500/10 text-red-400'
      default: return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">User Management</h1>
          <p className="text-zinc-400 mt-2">Monitor and manage all platform accounts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="MENTOR">Mentors</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-zinc-400">
            <thead className="text-xs text-zinc-300 uppercase bg-zinc-800/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.full_name}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx('px-2.5 py-1 text-xs font-medium rounded-full', getRoleColor(user.role))}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx('px-2.5 py-1 text-xs font-medium rounded-full border', getStatusColor(user.status))}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role !== 'ADMIN' && (
                      <div className="flex items-center justify-end gap-2">
                        {user.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                            disabled={isUpdating}
                            title="Reactivate User"
                            className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        {user.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                            disabled={isUpdating}
                            title="Suspend User"
                            className="p-2 text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <ShieldAlert className="w-5 h-5" />
                          </button>
                        )}
                        {user.status !== 'BANNED' && (
                          <button
                            onClick={() => handleStatusChange(user.id, 'BANNED')}
                            disabled={isUpdating}
                            title="Ban User"
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!data?.data.length && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No users found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Showing page <span className="font-medium text-white">{data.meta.page}</span> of{' '}
              <span className="font-medium text-white">{data.meta.totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === data.meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
