import React, { useState } from 'react'
import { useGetUsersQuery, useUpdateUserStatusMutation } from '@/store/api/adminApi'
import { ShieldAlert, CheckCircle2, Ban } from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Skeleton,
  Table,
} from '@/design-system'

export const AdminUsersPage: React.FC = () => {
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

  const getStatusTone = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'SUSPENDED': return 'warning'
      case 'BANNED': return 'danger'
      default: return 'neutral'
    }
  }

  const getRoleTone = (role: string): 'info' | 'neutral' | 'danger' => {
    switch (role) {
      case 'MENTOR': return 'info'
      case 'STUDENT': return 'neutral'
      case 'ADMIN': return 'danger'
      default: return 'neutral'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight text-[var(--mqds-text)]">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mqds-muted)] mt-1 font-mono">
            Audit and administer all platform student and mentor accounts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="mqds-control text-xs !min-h-[38px] bg-[var(--mqds-surface)] text-[var(--mqds-text)] px-3 border border-[var(--mqds-border-subtle)] rounded-xl"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="MENTOR">Mentors</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      <Card
        className="p-6 border border-[var(--mqds-border-subtle)] shadow-xs relative overflow-hidden !bg-[var(--mqds-surface)] !text-[var(--mqds-text)]"
        style={{ background: 'var(--mqds-surface)', color: 'var(--mqds-text)' }}
      >
        {isLoading ? (
          <Skeleton variant="table" label="Loading platform users…" rows={6} />
        ) : (
          <div className="space-y-4">
            {isFetching && (
              <div className="text-[10px] font-mono text-[var(--mqds-accent)] text-right animate-pulse">
                Updating users…
              </div>
            )}
            <Table caption="Registered Platform Accounts">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Joined</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((user) => (
                  <tr key={user.id}>
                    <th scope="row" style={{ fontWeight: 'normal', textAlign: 'left' }}>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={user.full_name}
                          size="sm"
                        />
                        <div>
                          <p className="font-semibold text-xs text-[var(--mqds-text)]">{user.full_name}</p>
                          <p className="text-[11px] font-mono text-[var(--mqds-muted)]">{user.email}</p>
                        </div>
                      </div>
                    </th>
                    <td>
                      <Badge tone={getRoleTone(user.role)} className="font-mono text-[10px] uppercase">
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={getStatusTone(user.status)} className="font-mono text-[10px] uppercase">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="text-xs font-mono text-[var(--mqds-muted)]">
                      {new Date(user.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {user.role !== 'ADMIN' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {user.status !== 'ACTIVE' && (
                            <Button
                              variant="secondary"
                              onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                              disabled={isUpdating}
                              title="Reactivate User"
                              className="!p-1.5 !min-h-0 text-emerald-500 hover:text-emerald-400"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          {user.status !== 'SUSPENDED' && (
                            <Button
                              variant="secondary"
                              onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                              disabled={isUpdating}
                              title="Suspend User"
                              className="!p-1.5 !min-h-0 text-amber-500 hover:text-amber-400"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </Button>
                          )}
                          {user.status !== 'BANNED' && (
                            <Button
                              variant="danger-subtle"
                              onClick={() => handleStatusChange(user.id, 'BANNED')}
                              disabled={isUpdating}
                              title="Ban User"
                              className="!p-1.5 !min-h-0"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!data?.data.length && !isLoading && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs font-mono text-[var(--mqds-muted)]">
                      No users found matching the current criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {/* Pagination */}
            {data && data.meta.totalPages > 1 && (
              <div className="pt-4 border-t border-[var(--mqds-border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--mqds-muted)]">
                <span>
                  Page <strong className="text-[var(--mqds-text)]">{data.meta.page}</strong> of{' '}
                  <strong className="text-[var(--mqds-text)]">{data.meta.totalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="!px-3 !py-1.5 !min-h-0 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={page === data.meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="!px-3 !py-1.5 !min-h-0 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
