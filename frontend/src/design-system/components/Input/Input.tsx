import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Field, fieldDescription, type FieldContent } from '../Field';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldContent;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, className, 'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    return (
      <Field id={controlId} label={label} hint={hint} error={error}>
        <input {...props} ref={ref} id={controlId}
          className={['mqds-control', className].filter(Boolean).join(' ')}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={fieldDescription(controlId, hint, error, describedBy)} />
      </Field>
    );
  }
);
Input.displayName = 'Input';
