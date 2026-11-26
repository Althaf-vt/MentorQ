import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes } from 'react';
import { closeModal, closeModalOnEscape } from '../../lib/dialog-motion';
import { Button } from '../Button/Button';
import { EmptyState } from '../EmptyState/EmptyState';

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  at: number;
  read: boolean;
  tone?: 'default' | 'highlight';
  actionLabel?: string;
};

export type NotificationBellProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> & {
  count: number;
  expanded: boolean;
};

export type NotificationsDrawerProps<Item extends NotificationItem = NotificationItem> = {
  items: readonly Item[];
  onClose: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onAction?: (item: Item) => void;
};

const timeLabel = new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function NotificationBell({ count, expanded, className, ...props }: NotificationBellProps) {
  return (
    <button {...props} className={['mqds-notification-bell', className].filter(Boolean).join(' ')} type="button"
      aria-label={count === 0 ? 'Notifications' : 'Notifications, ' + count + ' unread'}
      aria-haspopup="dialog" aria-expanded={expanded}>
      <span className="mqds-bell-shape" aria-hidden="true" />
      {count > 0 && <span className="mqds-bell-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
    </button>
  );
}

export function NotificationsDrawer<Item extends NotificationItem>({
  items, onClose, onRead, onReadAll, onAction,
}: NotificationsDrawerProps<Item>) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const allFilter = useRef<HTMLButtonElement>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const count = items.filter(item => !item.read).length;
  const visible = unreadOnly ? items.filter(item => !item.read) : items;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog className="mqds-notifications-drawer" ref={dialog} aria-labelledby={titleId}
      onClose={event => { if (!event.currentTarget.open) onClose(); }} onCancel={closeModalOnEscape}
      onClick={event => {
        if (event.currentTarget !== event.target) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right
          || event.clientY < box.top || event.clientY > box.bottom) closeModal(dialog.current);
      }}>
      <div className="mqds-notifications-heading">
        <div>
          <h2 id={titleId}>Notifications</h2>
          <p role="status">{count ? count + ' unread' : "You're all caught up"}</p>
        </div>
        <button className="mqds-notification-close" type="button" aria-label="Close notifications"
          onClick={() => closeModal(dialog.current)}>&times;</button>
      </div>
      <div className="mqds-notifications-content">
        <div className="mqds-notification-tools">
          <div className="mqds-notification-filters" role="group" aria-label="Filter notifications">
            <button ref={allFilter} type="button" aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>All</button>
            <button type="button" aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>Unread</button>
          </div>
          <button className="mqds-notification-read-all" type="button" disabled={!count} onClick={() => {
            allFilter.current?.focus();
            onReadAll();
          }}>Mark all as read</button>
        </div>
        {visible.length ? (
          <ul className="mqds-notification-list">
            {visible.map(item => (
              <li key={item.id} className="mqds-notification-item" data-unread={!item.read} data-tone={item.tone}>
                <div className="mqds-notification-item-title">
                  <h3>{item.title}</h3>
                  {!item.read && <span className="mqds-notification-unread">Unread</span>}
                </div>
                <p>{item.description}</p>
                <time dateTime={new Date(item.at).toISOString()}>{timeLabel.format(item.at)}</time>
                <div className="mqds-notification-item-actions">
                  {item.actionLabel && onAction && (
                    <button className="mqds-notification-open" type="button" onClick={() => {
                      if (!dialog.current?.open || dialog.current.dataset.closing) return;
                      onRead(item.id);
                      closeModal(dialog.current, () => onAction(item));
                    }}>{item.actionLabel} <span aria-hidden="true">{'\u2192'}</span></button>
                  )}
                  {!item.read && <button className="mqds-notification-mark-read" type="button"
                    aria-label={'Mark ' + item.title + ' as read'} onClick={() => {
                      allFilter.current?.focus();
                      onRead(item.id);
                    }}>Mark as read</button>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            description={unreadOnly ? undefined : 'Updates about your requests and sessions will appear here.'}
            action={unreadOnly && items.length > 0 && (
              <Button variant="secondary" onClick={() => {
                allFilter.current?.focus();
                setUnreadOnly(false);
              }}>View all notifications</Button>
            )} />
        )}
      </div>
    </dialog>
  );
}
