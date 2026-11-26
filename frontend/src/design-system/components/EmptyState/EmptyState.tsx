import type { ReactNode } from 'react';

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="mqds-empty-state">
      <div className="mqds-empty-copy">
        <p className="mqds-empty-title"><strong>{title}</strong></p>
        {description && <p className="mqds-empty-description">{description}</p>}
      </div>
      {action && <div className="mqds-empty-action">{action}</div>}
    </div>
  );
}
