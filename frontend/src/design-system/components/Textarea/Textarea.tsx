import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { Field, fieldDescription, type FieldContent } from '../Field';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldContent;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, className, rows = 3, 'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;

    return (
      <Field id={controlId} label={label} hint={hint} error={error}>
        <textarea {...props} ref={ref} id={controlId} rows={rows}
          className={['mqds-control', 'mqds-textarea', className].filter(Boolean).join(' ')}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={fieldDescription(controlId, hint, error, describedBy)} />
      </Field>
    );
  }
);
Textarea.displayName = 'Textarea';
