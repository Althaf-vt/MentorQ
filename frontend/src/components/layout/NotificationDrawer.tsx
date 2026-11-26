import React from 'react'
import {
  NotificationsDrawer,
  type NotificationItem,
} from '@/design-system'
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
  const { data: notifications = [] } = useGetUserNotificationsQuery()
  const [markRead] = useMarkNotificationAsReadMutation()
  const [markAllRead] = useMarkAllNotificationsAsReadMutation()

  const items: NotificationItem[] = notifications.map((n: Notification) => ({
    id: n._id || (n as unknown as { id?: string }).id || '',
    title: n.title,
    description: n.message,
    at: new Date(n.createdAt).getTime(),
    read: n.isRead,
  }))

  return (
    <NotificationsDrawer
      items={items}
      onClose={onClose}
      onRead={(id) => markRead(id)}
      onReadAll={() => markAllRead()}
    />
  )
}


