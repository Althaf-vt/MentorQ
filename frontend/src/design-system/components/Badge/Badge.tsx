import type { HTMLAttributes } from 'react';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return <span {...props} className={['mqds-badge', className].filter(Boolean).join(' ')} data-tone={tone} />;
}
