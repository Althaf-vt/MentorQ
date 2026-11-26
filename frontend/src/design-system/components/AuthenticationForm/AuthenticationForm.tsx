import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '../Button/Button';

export type AuthRole = 'student' | 'mentor';
export type AuthMode = AuthRole | 'register';
export type AuthenticationFormProps = {
  mode: AuthMode;
  title?: string;
  hint?: string;
  titleId?: string;
  onClose: () => void;
  onSwitch?: (mode: AuthMode) => void;
  onSubmit: (data: FormData, role: AuthRole) => void;
  children?: ReactNode;
};

export function AuthenticationForm({ mode, title, hint, titleId, onClose, onSwitch, onSubmit, children }: AuthenticationFormProps) {
  const [role, setRole] = useState<AuthRole>(mode === 'mentor' ? 'mentor' : 'student');
  const [visible, setVisible] = useState(false);
  const passwordId = useId();
  const hintId = passwordId + '-hint';
  const registering = mode === 'register';
  const roleLabel = role === 'mentor' ? 'Mentor' : 'Student';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (registering) {
      const name = form.elements.namedItem('fullName') as HTMLInputElement;
      const password = form.elements.namedItem('password') as HTMLInputElement;
      const confirmation = form.elements.namedItem('confirmPassword') as HTMLInputElement;
      name.setCustomValidity(name.value.trim() ? '' : 'Enter your name.');
      confirmation.setCustomValidity(confirmation.value === password.value ? '' : 'The passwords don’t match.');
      if (!form.reportValidity()) return;
    }
    onSubmit(new FormData(form), role);
  }

  return (
    <div className="auth-content" data-auth-role={role} data-register={registering}>
      <div className="session-detail-top">
        <span className="auth-role">{registering ? 'Registration' : roleLabel}</span>
        <button className="session-detail-close" type="button" aria-label="Close authentication" onClick={onClose}>&times;</button>
      </div>
      <h2 id={titleId}>{title ?? (registering ? 'Create an account' : roleLabel + ' login')}</h2>
      {children ?? <>
        {hint && <p className="auth-hint">{hint}</p>}
        <form onSubmit={submit} onInput={event => {
          if (event.target instanceof HTMLInputElement) event.target.setCustomValidity('');
        }}>
          {registering && <>
            <label>Full name<input name="fullName" autoComplete="name" maxLength={80} required autoFocus /></label>
            <label>Register as
              <select name="role" value={role} onChange={event => setRole(event.target.value === 'mentor' ? 'mentor' : 'student')}>
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
              </select>
            </label>
          </>}
          <label>Email<input type="email" name="email" autoComplete={registering ? 'email' : 'username'} required autoFocus={!registering} /></label>
          <div className="auth-password">
            <label htmlFor={passwordId}>Password</label>
            <div className="auth-password-field">
              <input id={passwordId} type={visible ? 'text' : 'password'} name="password"
                autoComplete={registering ? 'new-password' : 'current-password'} required
                minLength={registering ? 8 : undefined} aria-describedby={registering ? hintId : undefined}
                onInput={event => {
                  const confirmation = event.currentTarget.form?.elements.namedItem('confirmPassword');
                  if (confirmation instanceof HTMLInputElement) confirmation.setCustomValidity('');
                }} />
              <button type="button" aria-label={visible ? 'Hide password' : 'Show password'}
                title={visible ? 'Hide password' : 'Show password'} aria-controls={passwordId}
                onClick={() => setVisible(show => !show)} />
            </div>
          </div>
          {registering && <>
            <p id={hintId} className="auth-hint auth-password-hint">Use at least eight characters.</p>
            <label>Confirm password
              <input name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" required />
            </label>
          </>}
          <Button className="cta auth-submit" type="submit">{registering ? 'Continue to verification' : 'Log in'}</Button>
        </form>
        {onSwitch && (
          <div className="auth-switch">
            {!registering && <button type="button" onClick={() => onSwitch('register')}>Register</button>}
            {mode !== 'student' && <button type="button" onClick={() => onSwitch('student')}>Student login</button>}
            {mode !== 'mentor' && <button type="button" onClick={() => onSwitch('mentor')}>Mentor login</button>}
          </div>
        )}
      </>}
    </div>
  );
}
