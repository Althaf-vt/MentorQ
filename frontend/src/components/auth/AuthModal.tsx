import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AuthenticationForm,
  Button,
  lightTheme,
  type AuthMode,
  type AuthRole,
} from '@/design-system';
import {
  closeModal,
  closeModalOnEscape,
} from '@/design-system/lib/dialog-motion';
import {
  useLoginMutation,
  useRegisterMutation,
  useSendOtpMutation,
} from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { useToastStore } from '@/store/toastStore';

export type AuthModalMode = AuthMode | 'forgot-password';

export interface AuthModalOtpPayload {
  email: string;
  mode: 'verify' | 'reset';
  expectedRole?: 'STUDENT' | 'MENTOR';
}

export interface AuthModalProps {
  open: boolean;
  mode: AuthModalMode;
  onModeChange: (mode: AuthModalMode) => void;
  onClose: () => void;
  onRequireOtp: (payload: AuthModalOtpPayload) => void;
}

export function AuthModal({
  open,
  mode,
  onModeChange,
  onClose,
  onRequireOtp,
}: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const passwordId = useId();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const showToast = useToastStore((state) => state.showToast);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();

  const isBusy = isLoggingIn || isRegistering || isSendingOtp;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      closeModal(dialog);
    }
  }, [open]);

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  const handleRequestClose = () => {
    closeModal(dialogRef.current);
  };

  const handleSwitchMode = (nextMode: AuthModalMode) => {
    setErrorMessage(null);
    setPasswordVisible(false);
    onModeChange(nextMode);
  };

  const getDefaultHint = (): string => {
    if (isBusy) return 'Submitting your details...';
    if (errorMessage) return errorMessage;
    if (mode === 'register') {
      return 'Include uppercase, lowercase, a number, and a special character.';
    }
    if (mode === 'mentor') {
      return 'Sign in with your mentor account to review incoming requests.';
    }
    if (mode === 'forgot-password') {
      return 'Enter your account email and we will send a 6-digit verification code.';
    }
    return 'Sign in to view your queue, mentors, and live sessions.';
  };

  const submitLogin = async (
    email: string,
    password: string,
    expectedRole: 'STUDENT' | 'MENTOR',
  ) => {
    if (dialogRef.current?.dataset.closing || isBusy) return;
    setErrorMessage(null);

    try {
      const res = await login({ email, password, expectedRole }).unwrap();
      if (res.user.role !== 'ADMIN' && res.user.role !== expectedRole) {
        const msg = `Please use the ${
          res.user.role === 'MENTOR' ? 'Mentor' : 'Student'
        } login portal.`;
        setErrorMessage(msg);
        showToast(msg, 'error');
        return;
      }

      dispatch(setCredentials({ token: res.access_token, user: res.user }));
      showToast('Logged in successfully!', 'success');
      const targetPath =
        res.user.role === 'MENTOR'
          ? '/mentor/dashboard'
          : res.user.role === 'ADMIN'
            ? '/admin'
            : '/dashboard';

      closeModal(dialogRef.current, () => {
        onClose();
        navigate(targetPath);
      });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message || 'Invalid email or password.';
      setErrorMessage(msg);
      showToast(msg, 'error');

      if (msg.includes('Please verify your email')) {
        closeModal(dialogRef.current, () => {
          onClose();
          onRequireOtp({ email, mode: 'verify', expectedRole });
        });
      }
    }
  };

  const handleLoginFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const expectedRole = mode === 'mentor' ? 'MENTOR' : 'STUDENT';
    await submitLogin(loginEmail.trim(), loginPassword, expectedRole);
  };

  const handleRegisterSubmit = async (data: FormData, formRole: AuthRole) => {
    if (dialogRef.current?.dataset.closing || isBusy) return;
    setErrorMessage(null);

    const role = formRole === 'mentor' ? 'MENTOR' : 'STUDENT';
    const fullName = String(data.get('fullName') || '').trim();
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');

    const hasComplexity =
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!hasComplexity) {
      const msg =
        'Password must include uppercase, lowercase, number, and special character.';
      setErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    try {
      await registerUser({
        fullName,
        email,
        password,
        role,
      }).unwrap();
      showToast(
        'Account created! Please verify your email with the OTP sent.',
        'success',
      );
      closeModal(dialogRef.current, () => {
        onClose();
        onRequireOtp({ email, mode: 'verify', expectedRole: role });
      });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message || 'Registration failed.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  const handleForgotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dialogRef.current?.dataset.closing || isBusy) return;
    setErrorMessage(null);

    const email = resetEmail.trim();
    if (!email) {
      setErrorMessage('Enter your email address.');
      return;
    }

    try {
      await sendOtp({ email }).unwrap();
      showToast('Verification code sent to your email.', 'success');
      closeModal(dialogRef.current, () => {
        onClose();
        onRequireOtp({ email, mode: 'reset' });
      });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message || 'Failed to send verification code.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  const handleGoogleLogin = () => {
    const expectedRole = mode === 'mentor' ? 'MENTOR' : 'STUDENT';
    const apiBase =
      (import.meta.env.VITE_API_BASE_URL as string) ||
      'http://localhost:3133/api/v1';
    window.location.href = `${apiBase}/auth/google?state=${expectedRole}`;
  };

  return (
    <dialog
      className="auth-dialog"
      data-mqds={lightTheme}
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={handleClose}
      onCancel={closeModalOnEscape}
    >
      {mode === 'forgot-password' ? (
        <AuthenticationForm
          mode="student"
          titleId={titleId}
          title="Reset password"
          onClose={handleRequestClose}
          onSubmit={() => {}}
        >
          <p className="auth-hint" role={errorMessage ? 'alert' : undefined}>
            {getDefaultHint()}
          </p>
          <form onSubmit={handleForgotSubmit}>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@university.edu"
                required
                autoFocus
              />
            </label>
            <Button
              className="cta auth-submit"
              type="submit"
              disabled={isSendingOtp}
            >
              {isSendingOtp ? 'Sending code...' : 'Send verification code'}
            </Button>
          </form>
          <div className="auth-switch">
            <button type="button" onClick={() => handleSwitchMode('student')}>
              Student login
            </button>
            <button type="button" onClick={() => handleSwitchMode('mentor')}>
              Mentor login
            </button>
            <button type="button" onClick={() => handleSwitchMode('register')}>
              Register
            </button>
          </div>
        </AuthenticationForm>
      ) : mode === 'register' ? (
        <AuthenticationForm
          key="register"
          mode="register"
          titleId={titleId}
          hint={getDefaultHint()}
          onClose={handleRequestClose}
          onSwitch={(next) => handleSwitchMode(next)}
          onSubmit={handleRegisterSubmit}
        />
      ) : (
        <AuthenticationForm
          key={mode}
          mode={mode}
          titleId={titleId}
          onClose={handleRequestClose}
          onSubmit={() => {}}
        >
          <p className="auth-hint" role={errorMessage ? 'alert' : undefined}>
            {getDefaultHint()}
          </p>
          <form onSubmit={handleLoginFormSubmit}>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoComplete="username"
                required
                autoFocus
              />
            </label>
            <div className="auth-password">
              <label htmlFor={passwordId}>Password</label>
              <div className="auth-password-field">
                <input
                  id={passwordId}
                  type={passwordVisible ? 'text' : 'password'}
                  name="password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  title={passwordVisible ? 'Hide password' : 'Show password'}
                  aria-controls={passwordId}
                  onClick={() => setPasswordVisible((show) => !show)}
                />
              </div>
            </div>
            <Button
              className="cta auth-submit"
              type="submit"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Logging in...' : 'Log in'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isBusy}
            >
              Sign in with Google
            </Button>
          </form>
          <div className="auth-switch">
            <button type="button" onClick={() => handleSwitchMode('register')}>
              Register
            </button>
            <button
              type="button"
              onClick={() =>
                handleSwitchMode(mode === 'student' ? 'mentor' : 'student')
              }
            >
              {mode === 'student' ? 'Mentor login' : 'Student login'}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('forgot-password')}
            >
              Forgot password?
            </button>
          </div>
        </AuthenticationForm>
      )}
    </dialog>
  );
}

export default AuthModal;
