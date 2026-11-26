import type { ButtonHTMLAttributes } from 'react';

export type TicketActionProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function TicketAction({ type = 'button', className, children, ...props }: TicketActionProps) {
  return (
    <button {...props} type={type} className={['mqds-ticket-action', className].filter(Boolean).join(' ')}>
      <span>{children}</span><span className="mqds-ticket-arrow" aria-hidden="true">&rarr;</span>
    </button>
  );
}
