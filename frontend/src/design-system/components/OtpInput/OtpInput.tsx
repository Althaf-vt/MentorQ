import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { Field, fieldDescription, type FieldContent } from '../Field';

const codeLength = 6;
const slots = Array.from({ length: codeLength }, (_, index) => index);
const digitsOnly = (text: string) => text.replace(/[^0-9]/g, '');

export type OtpInputProps = Omit<InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'inputMode' | 'autoComplete' | 'pattern' | 'minLength' | 'maxLength'> &
  FieldContent & {
    value: string;
    onValueChange: (value: string) => void;
  };

export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(
  ({ label, hint, error, id, value, onValueChange, className, onClick, onFocus, onPaste, onSelect,
    'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const code = digitsOnly(value).slice(0, codeLength);
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    function syncSelection(input: HTMLInputElement) {
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? start;
      setSelection({ start, end });
    }

    function updateCode(input: HTMLInputElement, next: string, caret: number) {
      if (input.value !== next) input.value = next;
      if (input.selectionStart !== caret || input.selectionEnd !== caret) input.setSelectionRange(caret, caret);
      syncSelection(input);
      if (next !== value) onValueChange(next);
    }

    return (
      <Field id={controlId} label={label} hint={hint} error={error} announceError>
        <div className="mqds-otp" dir="ltr">
          <input {...props} ref={ref} id={controlId} value={code} type="text"
            className={['mqds-otp-input', className].filter(Boolean).join(' ')}
            inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" spellCheck={false}
            aria-invalid={error ? true : props['aria-invalid']}
            aria-describedby={fieldDescription(controlId, hint, error, describedBy)}
            onChange={event => {
              const input = event.currentTarget;
              const raw = input.value;
              const next = digitsOnly(raw).slice(0, codeLength);
              const caret = digitsOnly(raw.slice(0, input.selectionStart ?? raw.length)).length;
              updateCode(input, next, Math.min(caret, next.length));
            }}
            onPaste={event => {
              onPaste?.(event);
              if (event.defaultPrevented || props.readOnly) return;
              const pasted = digitsOnly(event.clipboardData.getData('text'));
              // A complete code replaces the current code, even if it is already filled.
              if (pasted.length < codeLength) return;
              event.preventDefault();
              updateCode(event.currentTarget, pasted.slice(0, codeLength), codeLength);
            }}
            onFocus={event => { syncSelection(event.currentTarget); onFocus?.(event); }}
            onSelect={event => { syncSelection(event.currentTarget); onSelect?.(event); }}
            onClick={event => {
              onClick?.(event);
              const input = event.currentTarget;
              if (event.defaultPrevented || event.detail !== 1 || input.selectionStart !== input.selectionEnd) return;
              const { left, width } = input.getBoundingClientRect();
              if (!width) return;
              const caret = Math.min(code.length, Math.max(0, Math.floor((event.clientX - left) / width * codeLength)));
              input.setSelectionRange(caret, caret);
              syncSelection(input);
            }} />
          <div className="mqds-otp-slots" aria-hidden="true">
            {slots.map(index => (
              <span key={index}
                data-active={selection.start === selection.end && index === Math.min(selection.start, code.length, codeLength - 1)}
                data-selected={index >= selection.start && index < selection.end}>
                {code[index] ?? ''}
              </span>
            ))}
          </div>
        </div>
      </Field>
    );
  }
);
OtpInput.displayName = 'OtpInput';
