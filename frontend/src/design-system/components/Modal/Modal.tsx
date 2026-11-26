import { useEffect, useId, useRef, type ReactNode } from 'react';

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAfterClose?: () => void;
  title: string;
  description?: ReactNode;
  variant?: 'ivory' | 'lilac' | 'navy' | 'pine' | 'danger' | 'plum' | 'ticket';
  className?: string;
  ticketHeader?: { leading?: ReactNode; label?: ReactNode };
  children?: ReactNode;
  actions?: ReactNode;
  dismissOnBackdrop?: boolean;
};

export function Modal({ open, onOpenChange, onAfterClose, title, description, variant = 'ivory',
  className, ticketHeader, children, actions, dismissOnBackdrop = variant !== 'danger' }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open) {
      if (!element.open) element.showModal();
      return;
    }
    if (!element.open) return;

    const style = getComputedStyle(element);
    const duration = Number.parseFloat(style.getPropertyValue('--mqds-modal-exit'));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !duration || !element.animate) {
      element.close();
      return;
    }

    element.dataset.closing = 'true';
    const exit = element.animate(
      [{ opacity: style.opacity, transform: style.transform }, { opacity: 0, transform: 'translateY(7px) scale(.96)' }],
      { duration, easing: style.getPropertyValue('--mqds-ease-in').trim(), fill: 'forwards' }
    );
    exit.onfinish = () => {
      element.close();
      exit.cancel();
      delete element.dataset.closing;
    };

    return () => {
      exit.onfinish = null;
      exit.cancel();
      delete element.dataset.closing;
    };
  }, [open]);

  const closeButton = (
    <button className="mqds-modal-close" type="button" aria-label="Close dialog"
      onClick={() => onOpenChange(false)}>&times;</button>
  );

  return (
    <dialog className={['mqds-modal', className].filter(Boolean).join(' ')} data-variant={variant === 'pine' ? 'navy' : variant} ref={dialog}
      aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
      onClose={event => {
        if (event.currentTarget.open) return;
        if (open) onOpenChange(false);
        onAfterClose?.();
      }}
      onCancel={event => { event.preventDefault(); onOpenChange(false); }}
      onClick={event => {
        if (!dismissOnBackdrop || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right
          || event.clientY < bounds.top || event.clientY > bounds.bottom) onOpenChange(false);
      }}>
      {variant === 'ticket' && (
        <div className="mqds-modal-header mqds-modal-ticket-heading">
          {ticketHeader?.leading && <span className="mqds-modal-ticket-mark">{ticketHeader.leading}</span>}
          <div className="mqds-modal-ticket-title">
            {ticketHeader?.label && <div className="mqds-modal-ticket-label">{ticketHeader.label}</div>}
            <h2 id={titleId}>{title}</h2>
            {description && <p className="mqds-modal-description" id={descriptionId}>{description}</p>}
          </div>
          {closeButton}
        </div>
      )}
      <div className="mqds-modal-content">
        {variant !== 'ticket' && (
          <>
            <div className="mqds-modal-header">
              <h2 id={titleId}>{title}</h2>
              {closeButton}
            </div>
            {description && <p className="mqds-modal-description" id={descriptionId}>{description}</p>}
          </>
        )}
        {children}
        {actions && <div className="mqds-modal-actions">{actions}</div>}
      </div>
    </dialog>
  );
}
