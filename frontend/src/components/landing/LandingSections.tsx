import {
  Badge,
  Button,
  Card,
  TicketAction,
  cardTiltHandlers,
  darkTheme,
  lightTheme,
} from '@/design-system';
import type { AuthModalMode } from '@/components/auth/AuthModal';
import type { ThemeMode } from '@/store/themeStore';
import mentorQLogo from '../../assets/mentorq-logo.svg?inline';

export interface LandingSectionsProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenAuth: (mode: AuthModalMode) => void;
  onReplayIntro: () => void;
}

const HOW_IT_WORKS_STEPS = [
  {
    code: '01',
    title: 'Submit a clear ticket',
    summary:
      'Pick a mentor or topic, outline what you are working through, and choose a 15-to-60 minute session window.',
  },
  {
    code: '02',
    title: 'Watch your spot in real time',
    summary:
      'Track exact queue position and estimated wait time on your ticket stub—no refreshing or guessing when you are up.',
  },
  {
    code: '03',
    title: 'Step into the focus room',
    summary:
      'Join a dedicated 1:1 room with a shared session timer, direct conversation thread, and organized post-session notes.',
  },
] as const;

const PLATFORM_TOOLS = [
  {
    glyph: '1:1',
    title: 'Live Focus Room',
    detail:
      'Distraction-free session desk pairing a shared countdown clock with live conversation.',
    meta: 'Timed sessions',
  },
  {
    glyph: 'Q',
    title: 'Transparent Queue Tracker',
    detail:
      'Real-time queue numbers, approval timestamps, and remaining wait estimates at a glance.',
    meta: 'Live updates',
  },
  {
    glyph: '★',
    title: 'Favorite Mentors Stack',
    detail:
      'Keep trusted mentors in a quick-access deck so follow-up coaching takes one click.',
    meta: 'Personal roster',
  },
  {
    glyph: '≡',
    title: 'Session Notes & Folders',
    detail:
      'Capture takeaways, organize guides into folders, and revisit completed transcripts anytime.',
    meta: 'Session archive',
  },
  {
    glyph: '✓',
    title: 'Verified Cohort Access',
    detail:
      'Fast six-digit email verification protects every cohort across students and mentors.',
    meta: 'Verified access',
  },
  {
    glyph: '◐',
    title: 'Paper & Night Modes',
    detail:
      'Warm cream paper canvas for daytime clarity paired seamlessly with deep indigo night mode.',
    meta: 'Light & Dark',
  },
] as const;

export function LandingSections({
  theme,
  onToggleTheme,
  onOpenAuth,
  onReplayIntro,
}: LandingSectionsProps) {
  return (
    <>
      <section id="why-mentorq" aria-labelledby="why-mentorq-title">
        <div className="sectionTitle">
          <h2 id="why-mentorq-title">Built for calm, high-trust 1:1 sessions</h2>
          <span>Students &amp; Mentors</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="min-w-0" {...cardTiltHandlers}>
            <div className="mqds-tilt-surface h-full">
              <Card
                variant="ticket"
                data-mqds={lightTheme}
                interactive
                className="h-full"
                stub={
                  <div className="h-full flex flex-col justify-between p-5 text-[var(--mqds-ink)]">
                    <div>
                      <Badge tone="info">For learners</Badge>
                      <strong className="block mt-3 text-3xl font-extrabold tracking-tight">
                        01–60m
                      </strong>
                      <span className="block text-sm font-semibold opacity-80">
                        Focused windows
                      </span>
                    </div>
                    <small className="font-mono text-xs pt-3 border-t border-[#201d3540]">
                      LIVE QUEUE CLARITY
                    </small>
                  </div>
                }
                actions={
                  <TicketAction onClick={() => onOpenAuth('register')}>
                    Start as a student →
                  </TicketAction>
                }
              >
                <h3 className="text-2xl font-bold tracking-tight text-[var(--mqds-ink)] mb-2">
                  Skip scattered DMs and silent waitlists.
                </h3>
                <p className="text-[var(--mqds-muted-ink)] leading-relaxed m-0">
                  Frame your question once before joining line. MentorQ keeps you updated from
                  pending review to active room readiness so study time stays uninterrupted.
                </p>
              </Card>
            </div>
          </div>

          <div className="min-w-0" {...cardTiltHandlers}>
            <div className="mqds-tilt-surface h-full">
              <Card
                variant="glass"
                data-mqds={darkTheme}
                interactive
                className="h-full"
                actions={
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onOpenAuth('mentor')}
                  >
                    Open mentor login →
                  </Button>
                }
              >
                <div className="mb-3">
                  <Badge tone="success">For mentors</Badge>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-[#f4f7f2] mb-2">
                  Host structured office hours at your pace.
                </h3>
                <p className="text-[#d5d0e8] leading-relaxed m-0">
                  Set daily capacity, review incoming tickets with clear context upfront,
                  approve queued learners cleanly, and wrap sessions right on schedule.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="how-it-works-title">
        <div className="sectionTitle">
          <h2 id="how-it-works-title">How it works</h2>
          <span>03 steps</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div key={step.code} className="min-w-0" {...cardTiltHandlers}>
              <div className="mqds-tilt-surface h-full">
                <Card
                  variant="paper"
                  data-mqds={lightTheme}
                  interactive
                  className="h-full"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="stamp !w-12 !h-11 !text-lg" aria-hidden="true">
                      {step.code}
                    </span>
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--mqds-muted-ink)]">
                      Step {step.code}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-[var(--mqds-ink)] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[var(--mqds-muted-ink)] text-sm leading-relaxed m-0">
                    {step.summary}
                  </p>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" aria-labelledby="features-title">
        <div className="sectionTitle">
          <h2 id="features-title">Everything inside the desk</h2>
          <span>{String(PLATFORM_TOOLS.length).padStart(2, '0')} tools</span>
        </div>

        <div
          className="overflow-hidden rounded-[9px] border border-[color:var(--mqds-border-subtle)]"
          role="list"
        >
          {PLATFORM_TOOLS.map((tool) => (
            <div key={tool.title} className="row" role="listitem">
              <i aria-hidden="true">{tool.glyph}</i>
              <div className="min-w-0 flex-1">
                <strong className="block text-base font-bold text-[#201d35]">
                  {tool.title}
                </strong>
                <span className="block text-sm text-[#5e526c]">
                  {tool.detail}
                </span>
              </div>
              <time className="font-mono text-xs font-semibold text-[#5e526c] shrink-0">
                {tool.meta}
              </time>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 pt-8 pb-6 border-t border-[color:var(--mqds-border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
          <img
            src={mentorQLogo}
            alt="MentorQ"
            width="44"
            height="29"
            className="shrink-0"
          />
          <div>
            <strong className="block text-base font-bold tracking-tight text-[var(--mqds-text)]">
              MentorQ
            </strong>
            <span className="text-sm text-[var(--mqds-muted)]">
              Live mentorship queues, calm focus rooms, and lasting study notes.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenAuth('student')}
          >
            Log in
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => onOpenAuth('register')}
          >
            Create account
          </Button>
          <button
            type="button"
            className="play-intro !m-0"
            onClick={() => onOpenAuth('forgot-password')}
          >
            Reset password
          </button>
          <button
            type="button"
            className="play-intro !m-0"
            onClick={onReplayIntro}
          >
            Play intro
          </button>
          <button
            type="button"
            className="play-intro !m-0"
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? 'Light canvas' : 'Dark canvas'}
          </button>
        </div>
      </footer>
    </>
  );
}

export default LandingSections;
