import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { Field, fieldDescription, type FieldContent } from '../Field';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldContent;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, id, children, className, 'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    return (
      <Field id={controlId} label={label} hint={hint} error={error}>
        <select {...props} ref={ref} id={controlId}
          className={['mqds-control', !props.multiple && (props.size ?? 1) <= 1 && 'mqds-select', className].filter(Boolean).join(' ')}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={fieldDescription(controlId, hint, error, describedBy)}>
          {children}
        </select>
      </Field>
    );
  }
);
Select.displayName = 'Select';
