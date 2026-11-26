import type { ReactNode } from 'react';

export type FieldContent = { label: ReactNode; hint?: string; error?: string };

export function fieldDescription(id: string, hint?: string, error?: string, external?: string) {
  return [external, hint && id + '-hint', error && id + '-error'].filter(Boolean).join(' ') || undefined;
}

export function Field({ id, label, hint, error, children, announceError }: FieldContent & {
  id: string;
  children: ReactNode;
  announceError?: boolean;
}) {
  return (
    <div className="mqds-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <small id={id + '-hint'}>{hint}</small>}
      {error && <small id={id + '-error'} className="mqds-field-error" role={announceError ? 'alert' : undefined}>{error}</small>}
    </div>
  );
}
