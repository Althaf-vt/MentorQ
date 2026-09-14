import React from 'react'
import { X, Bell, Check } from 'lucide-react'
import {
  useGetUserNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from '@/store/api/notificationApi'
import type { Notification } from '@/types/operational.types'

interface NotificationDrawerProps {
  onClose: () => void
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ onClose }) => {
  const { data: notifications = [], refetch } = useGetUserNotificationsQuery()
  const [markRead] = useMarkNotificationAsReadMutation()
  const [markAllRead] = useMarkAllNotificationsAsReadMutation()

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap()
      refetch()
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarkOne = async (id: string) => {
    try {
      await markRead(id).unwrap()
      refetch()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-white border-l shadow-2xl flex flex-col font-body">
      <div className="p-4 border-b flex items-center justify-between bg-[#faf9f7]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#5948d3]" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Notifications</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">No new notifications.</div>
        ) : (
          notifications.map((n: Notification) => (
            <div
              key={n._id}
              className={`p-3 rounded-xl border text-xs relative ${
                n.read_status ? 'bg-slate-50 border-slate-200' : 'bg-[#5948d3]/5 border-[#5948d3]/20 font-medium'
              }`}
            >
              <div className="font-bold text-slate-900 mb-0.5">{n.title}</div>
              <div className="pr-4 text-slate-700">{n.message}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {!n.read_status && (
                <button
                  onClick={() => handleMarkOne(n._id)}
                  className="absolute top-2.5 right-2.5 p-0.5 rounded-full bg-white border text-slate-400 hover:text-[#5948d3]"
                  title="Mark read"
                >
                  <Check className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t bg-[#faf9f7]">
          <button
            onClick={handleMarkAll}
            className="w-full py-1.5 rounded-full bg-[#5948d3] hover:bg-[#4d39c7] text-white text-xs font-bold text-center"
          >
            Mark All Read
          </button>
        </div>
      )}
    </div>
  )
}

