import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Input,
  Modal,
  OtpInput,
  lightTheme,
} from '@/design-system';
import {
  useSendOtpMutation,
  useVerifyOtpMutation,
} from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { useToastStore } from '@/store/toastStore';

export interface OtpVerificationModalProps {
  open: boolean;
  email?: string;
  mode?: 'verify' | 'reset';
  expectedRole?: 'STUDENT' | 'MENTOR';
  onClose: () => void;
  onSuccessLoginRedirect?: () => void;
}

function createTimingWindow() {
  const now = Date.now();
  return {
    expiresAt: now + 300_000,
    resendAt: now + 60_000,
  };
}

function getRemainingSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function OtpVerificationModal({
  open,
  email: initialEmail = '',
  mode = 'verify',
  expectedRole,
  onClose,
  onSuccessLoginRedirect,
}: OtpVerificationModalProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const showToast = useToastStore((state) => state.showToast);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);

  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<'email' | 'otp'>(
    initialEmail ? 'otp' : 'email',
  );
  const [timing, setTiming] = useState(createTimingWindow);
  const [now, setNow] = useState(Date.now);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifiedDestination, setVerifiedDestination] = useState<string | null>(
    null,
  );

  const [sendOtp, { isLoading: isSending }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();

  const expiresIn = getRemainingSeconds(timing.expiresAt, now);
  const resendIn = getRemainingSeconds(timing.resendAt, now);

  useEffect(() => {
    if (!open || step !== 'otp' || verified) return;
    otpInputRef.current?.focus();
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [open, step, verified]);

  useEffect(() => {
    if (verified) {
      doneButtonRef.current?.focus();
    }
  }, [verified]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (verifiedDestination) {
        navigate(verifiedDestination);
      }
      onClose();
    }
  };

  const handleSendEmailCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail || isSending) return;
    setError('');
    setNotice('');

    try {
      await sendOtp({ email: targetEmail }).unwrap();
      setEmail(targetEmail);
      setStep('otp');
      setTiming(createTimingWindow());
      setNow(Date.now());
      setCode('');
      setNotice('Verification code sent.');
      showToast('Verification code sent to your email.', 'success');
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message || 'Failed to send verification code.';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  const handleVerifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!open || isVerifying) return;

    if (Date.now() >= timing.expiresAt) {
      setError('This code expired. Request a new one.');
      return;
    }

    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      otpInputRef.current?.focus();
      return;
    }

    setError('');
    setNotice('');

    try {
      const res = await verifyOtp({
        email: email.trim(),
        otp: code,
        expectedRole,
      }).unwrap();

      if (res.access_token && res.user && mode === 'verify') {
        dispatch(setCredentials({ token: res.access_token, user: res.user }));
        const targetPath =
          res.user.role === 'MENTOR'
            ? '/mentor/dashboard'
            : res.user.role === 'ADMIN'
              ? '/admin'
              : '/dashboard';
        setVerifiedDestination(targetPath);
        showToast('Email verified successfully!', 'success');
      } else {
        showToast('Verification complete! Please sign in.', 'success');
      }

      setVerified(true);
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message || 'That code does not match. Try again.';
      setError(msg);
      showToast(msg, 'error');
      otpInputRef.current?.focus();
      otpInputRef.current?.select();
    }
  };

  const handleResend = async () => {
    if (!open || Date.now() < timing.resendAt || isSending) return;
    setError('');
    setNotice('');

    try {
      await sendOtp({ email: email.trim() }).unwrap();
      setTiming(createTimingWindow());
      setNow(Date.now());
      setCode('');
      setNotice('A new verification code has been sent.');
      showToast('A new code has been sent!', 'success');
      otpInputRef.current?.focus();
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message || 'Could not resend OTP.';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDone = () => {
    if (verifiedDestination) {
      onClose();
      navigate(verifiedDestination);
      return;
    }
    onClose();
    onSuccessLoginRedirect?.();
  };

  const modalTitle = verified
    ? mode === 'reset'
      ? 'Identity confirmed'
      : 'Email verified'
    : step === 'email'
      ? 'Request verification'
      : 'Verify your code';

  return (
    <div data-mqds={lightTheme}>
      <Modal
        variant="ticket"
        className="otp-dialog"
        open={open}
        onOpenChange={handleOpenChange}
        onAfterClose={onClose}
        title={modalTitle}
        ticketHeader={{
          label: (
            <Badge tone={verified ? 'success' : 'info'}>
              {verified ? 'Verified' : 'Verification'}
            </Badge>
          ),
        }}
      >
        {verified ? (
          <>
            <p className="otp-success" role="status">
              {verifiedDestination
                ? 'Your MentorQ account is verified and ready.'
                : 'Your verification code was confirmed. You may continue to login.'}
            </p>
            <Button
              type="button"
              className="otp-submit"
              ref={doneButtonRef}
              onClick={handleDone}
            >
              <span>
                {verifiedDestination ? 'Continue to dashboard' : 'Back to login'}
              </span>
              <span aria-hidden="true">{'\u2192'}</span>
            </Button>
          </>
        ) : step === 'email' ? (
          <form className="otp-form" onSubmit={handleSendEmailCode}>
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="you@university.edu"
              error={error || undefined}
              required
              autoFocus
            />
            <Button
              type="submit"
              className="otp-submit"
              disabled={isSending || !email.trim()}
            >
              <span>{isSending ? 'Sending code...' : 'Send code'}</span>
              <span aria-hidden="true">{'\u2192'}</span>
            </Button>
          </form>
        ) : (
          <form className="otp-form" onSubmit={handleVerifySubmit}>
            <p className="otp-example">
              <span>Sent to</span>
              <strong>{email}</strong>
            </p>
            <OtpInput
              label="Verification code"
              hint="Enter the six-digit code sent to your inbox."
              error={error || undefined}
              ref={otpInputRef}
              value={code}
              required
              onValueChange={(next) => {
                setCode(next);
                if (error) setError('');
              }}
            />
            <div className="otp-timing">
              <span>
                {expiresIn ? (
                  <>
                    Expires in{' '}
                    <strong role="timer">{formatClock(expiresIn)}</strong>
                  </>
                ) : (
                  'Code expired'
                )}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0 || isSending}
              >
                {resendIn ? (
                  <>
                    Resend in <span role="timer">{formatClock(resendIn)}</span>
                  </>
                ) : isSending ? (
                  'Sending...'
                ) : (
                  'Resend OTP'
                )}
              </button>
            </div>
            <p className="otp-notice" role="status">
              {notice}
            </p>
            <Button
              type="submit"
              className="otp-submit"
              disabled={code.length !== 6 || !expiresIn || isVerifying}
            >
              <span>{isVerifying ? 'Verifying...' : 'Verify code'}</span>
              <span aria-hidden="true">{'\u2192'}</span>
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default OtpVerificationModal;
