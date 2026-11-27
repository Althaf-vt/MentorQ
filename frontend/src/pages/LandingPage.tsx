import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/design-system';
import {
  AuthModal,
  type AuthModalMode,
  type AuthModalOtpPayload,
} from '@/components/auth/AuthModal';
import { OtpVerificationModal } from '@/components/auth/OtpVerificationModal';
import { MentorOrbit } from '@/components/preview/MentorOrbit';
import {
  MentorGallery,
  type GalleryMentor,
} from '@/components/preview/MentorGallery';
import { LandingSections } from '@/components/landing/LandingSections';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { useThemeStore } from '@/store/themeStore';
import { useToastStore } from '@/store/toastStore';
import mentorQLogo from '../assets/mentorq-logo.svg?inline';

export interface LandingPageProps {
  initialModal?: AuthModalMode | 'verify-otp';
  onReplayIntro?: () => void;
}

export function LandingPage({ initialModal, onReplayIntro }: LandingPageProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const showToast = useToastStore((state) => state.showToast);

  const wordmarkRef = useRef<HTMLAnchorElement>(null);

  const [authOpen, setAuthOpen] = useState(
    Boolean(initialModal && initialModal !== 'verify-otp'),
  );
  const [authMode, setAuthMode] = useState<AuthModalMode>(
    initialModal && initialModal !== 'verify-otp' ? initialModal : 'student',
  );
  const [otpState, setOtpState] = useState<{
    open: boolean;
    key: number;
    email: string;
    mode: 'verify' | 'reset';
    expectedRole?: 'STUDENT' | 'MENTOR';
  }>({
    open: initialModal === 'verify-otp',
    key: 1,
    email: '',
    mode: 'verify',
  });

  useEffect(() => {
    const updateWordmark = () => {
      wordmarkRef.current?.toggleAttribute('data-scrolled', window.scrollY > 24);
    };
    updateWordmark();
    window.addEventListener('scroll', updateWordmark, { passive: true });
    return () => window.removeEventListener('scroll', updateWordmark);
  }, []);

  // Support Google OAuth callback redirect (?token=...&user=...) back into modal-first entry
  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    if (!token || !userParam) return;

    try {
      const parsedUser = JSON.parse(decodeURIComponent(userParam));
      dispatch(setCredentials({ token, user: parsedUser }));
      showToast('Logged in with Google successfully!', 'success');
      const destination =
        parsedUser.role === 'MENTOR'
          ? '/mentor/dashboard'
          : parsedUser.role === 'ADMIN'
            ? '/admin'
            : '/dashboard';
      navigate(destination, { replace: true });
    } catch {
      showToast('Unable to complete Google sign-in.', 'error');
    }
  }, [searchParams, dispatch, navigate, showToast]);

  const openAuthModal = (mode: AuthModalMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthOpen(false);
  };

  const handleRequireOtp = (payload: AuthModalOtpPayload) => {
    setOtpState((prev) => ({
      open: true,
      key: prev.key + 1,
      email: payload.email,
      mode: payload.mode,
      expectedRole: payload.expectedRole,
    }));
  };

  const handleCloseOtp = () => {
    setOtpState((prev) => ({ ...prev, open: false }));
  };

  const handleRequestFromGallery = (mentor: GalleryMentor) => {
    showToast(
      `Sign in or create an account to request a session with ${mentor.name}.`,
      'info',
    );
    openAuthModal('register');
  };

  return (
    <>
      <header className="preview-header landing-header">
        <Link
          className="wordmark"
          ref={wordmarkRef}
          to="/"
          aria-label="MentorQ home"
          style={{ '--wordmark-mask': `url("${mentorQLogo}")` } as CSSProperties}
        >
          <img
            className="brand-mark"
            src={mentorQLogo}
            alt="MentorQ"
            width="58"
            height="38"
          />
        </Link>

        <div className="header-actions" role="group" aria-label="Account actions">
          <button
            type="button"
            className="dock-theme-btn"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
              </svg>
            )}
          </button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => openAuthModal('student')}
          >
            Log in
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => openAuthModal('register')}
          >
            Register
          </Button>
        </div>
      </header>

      <main className="preview-main">
        <section className="hero" aria-labelledby="landing-hero-title">
          <div>
            <small>1:1 mentorship cohorts</small>
            <h1 id="landing-hero-title">
              Live mentorship<span>.</span>
            </h1>
            <p className="text-[var(--mqds-muted)] text-base sm:text-lg leading-relaxed max-w-[44ch] mb-6">
              Join an organized queue, step into timed focus sessions with an active
              mentor, and keep structured study notes for every call.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="cta hero-request"
                onClick={() => openAuthModal('register')}
              >
                Request a session <b aria-hidden="true">{'\u2192'}</b>
              </button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => openAuthModal('student')}
              >
                Student or Mentor login
              </Button>
            </div>
            {onReplayIntro ? (
              <button
                type="button"
                className="play-intro"
                onClick={onReplayIntro}
              >
                Play intro
              </button>
            ) : null}
          </div>

          <MentorOrbit />
        </section>

        <LandingSections
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAuth={openAuthModal}
          onReplayIntro={() => onReplayIntro?.()}
        />

        <MentorGallery
          heading="Meet the mentors"
          actionLabel="Request a session"
          onRequestSession={handleRequestFromGallery}
        />
      </main>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={handleCloseAuth}
        onRequireOtp={handleRequireOtp}
      />

      <OtpVerificationModal
        key={otpState.key}
        open={otpState.open}
        email={otpState.email}
        mode={otpState.mode}
        expectedRole={otpState.expectedRole}
        onClose={handleCloseOtp}
        onSuccessLoginRedirect={() => openAuthModal('student')}
      />
    </>
  );
}

export default LandingPage;
