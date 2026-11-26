import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  label: ReactNode;
  description?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, className, 'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    return (
      <label className={['mqds-checkbox', className].filter(Boolean).join(' ')} htmlFor={controlId}>
        <input {...props} ref={ref} id={controlId} type="checkbox"
          aria-describedby={[describedBy, description && controlId + '-description'].filter(Boolean).join(' ') || undefined} />
        <span>{label}{description && <small id={controlId + '-description'}>{description}</small>}</span>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
