import type { HTMLAttributes, ReactNode } from 'react';

export type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: 'paper' | 'glass' | 'ticket';
  stub?: ReactNode;
  actions?: ReactNode;
  interactive?: boolean;
};

export function Card({ variant = 'paper', stub, actions, interactive = false, className, children, ...props }: CardProps) {
  return (
    <article {...props} className={['mqds-card', className].filter(Boolean).join(' ')}
      data-variant={variant} data-interactive={interactive} data-stub={variant === 'ticket' && stub != null}>
      <div className="mqds-card-body">
        {children}
        {actions && <div className="mqds-card-actions">{actions}</div>}
      </div>
      {variant === 'ticket' && stub != null && <aside className="mqds-card-stub">{stub}</aside>}
    </article>
  );
}
