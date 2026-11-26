import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const variants = {
  success: { label: 'Success', mark: '\u2713' },
  error: { label: 'Error', mark: '\u00d7' },
  warning: { label: 'Warning', mark: '!' },
  info: { label: 'Info', mark: 'i' },
};

export type ToastTone = keyof typeof variants;

export type ToastMessage = {
  id: string | number;
  tone: ToastTone;
  title: string;
  message?: string;
  /** Auto-dismiss delay in milliseconds. Set to null to keep the toast visible. */
  duration?: number | null;
};

export type ToastProps = {
  notification: ToastMessage | null;
  onDismiss: (id: ToastMessage['id']) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

function ToastTicket({ notification, onDismiss, returnFocusRef }: Omit<ToastProps, 'notification'> & {
  notification: ToastMessage;
}) {
  const { id, tone, title, message, duration = tone === 'warning' ? null : 6500 } = notification;
  const { label, mark } = variants[tone];
  const [exiting, setExiting] = useState(false);
  const dismissed = useRef(false);
  const finishDismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    onDismiss(id);
  }, [id, onDismiss]);

  useEffect(() => {
    if (!exiting) return;
    // A transition can be interrupted when the viewport is hidden or motion settings change.
    const fallback = window.setTimeout(finishDismiss, 350);
    return () => window.clearTimeout(fallback);
  }, [exiting, finishDismiss]);

  return (
    <article className="mqds-toast-ticket" data-tone={tone} data-exiting={exiting || undefined}
      onTransitionEnd={event => {
        if (exiting && event.target === event.currentTarget && ['transform', 'opacity'].includes(event.propertyName)) {
          finishDismiss();
        }
      }}>
      <span className="mqds-toast-stub" aria-hidden="true"><span className="mqds-toast-mark">{mark}</span></span>
      <div className="mqds-toast-copy">
        <span className="mqds-toast-kind">{label}</span>
        <strong>{title}</strong>
        {message && <p>{message}</p>}
      </div>
      <button className="mqds-toast-dismiss" type="button" aria-label="Dismiss toast" disabled={exiting}
        onClick={event => {
          if (document.activeElement === event.currentTarget) returnFocusRef?.current?.focus();
          setExiting(true);
        }}>&times;</button>
      {duration !== null && duration > 0 && !exiting && (
        <span className="mqds-toast-timer" aria-hidden="true" style={{ animationDuration: `${duration}ms` }}
          onAnimationEnd={() => setExiting(true)} />
      )}
    </article>
  );
}

/** Keep mounted so live regions are available before the first notification. */
export function Toast({ notification, onDismiss, returnFocusRef }: ToastProps) {
  const urgent = notification?.tone === 'error';
  const announcement = notification && (
    <span key={notification.id}>{notification.title}{notification.message && `. ${notification.message}`}</span>
  );

  return (
    <>
      <div className="mqds-toast-announcement" role="status" aria-atomic="true">{!urgent && announcement}</div>
      <div className="mqds-toast-announcement" role="alert" aria-atomic="true">{urgent && announcement}</div>
      {notification && <ToastTicket key={notification.id} notification={notification}
        onDismiss={onDismiss} returnFocusRef={returnFocusRef} />}
    </>
  );
}
