import { useEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { NotificationBell } from '../../design-system';
import mentorQLogo from '../../assets/mentorq-logo.svg?inline';

export interface DockDestination {
  id: string;
  label: string;
  href: string;
  iconPath: string;
}

export interface NavigationDockProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  destinations: readonly DockDestination[];
  active: string;
  onNavigate?: (id: string, href: string) => void;
  unreadCount: number;
  notificationsOpen: boolean;
  onNotifications: () => void;
  onProfile: () => void;
  initials: string;
  profileLabel?: string;
  homeHref?: string;
  homeId?: string;
  hidden?: boolean;
}

const RESTING_SIZE = 40;
const MAGNIFIED_SIZE = 80;
const INFLUENCE_RADIUS = 150;
const SPRING = { mass: 0.1, stiffness: 150, damping: 12 };

// Analytical damped spring solver matching ui-preview/navigation-dock.jsx across refresh rates.
const DISCRIMINANT = Math.sqrt(SPRING.damping ** 2 - 4 * SPRING.mass * SPRING.stiffness);
const SLOW_RATE = (-SPRING.damping + DISCRIMINANT) / (2 * SPRING.mass);
const FAST_RATE = (-SPRING.damping - DISCRIMINANT) / (2 * SPRING.mass);

function useDockMagnification(
  dockRef: React.RefObject<HTMLDivElement | null>,
  itemKey: string,
) {
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;

    const motionEnabled = window.matchMedia(
      '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
    );
    const items = Array.from(
      dock.querySelectorAll<HTMLElement>('[data-dock-item]'),
      (element) => ({
        element,
        size: RESTING_SIZE,
        velocity: 0,
      }),
    );

    let pointerX = Infinity;
    let frame = 0;
    let previousTime = 0;

    const animate = (time: number) => {
      const elapsed = Math.max(0, time - previousTime) / 1000;
      previousTime = time;
      const slowDecay = Math.exp(SLOW_RATE * elapsed);
      const fastDecay = Math.exp(FAST_RATE * elapsed);

      const targets = items.map(({ element }) => {
        const { left, width } = element.getBoundingClientRect();
        const distance = Math.abs(pointerX - (left + width / 2));
        const proximity = Math.max(0, 1 - distance / INFLUENCE_RADIUS);
        return RESTING_SIZE + (MAGNIFIED_SIZE - RESTING_SIZE) * proximity;
      });

      let moving = false;
      items.forEach((item, index) => {
        const target = targets[index];
        const offset = item.size - target;
        const slowWeight =
          (item.velocity - FAST_RATE * offset) / (SLOW_RATE - FAST_RATE);
        const slow = slowWeight * slowDecay;
        const fast = (offset - slowWeight) * fastDecay;
        item.velocity = SLOW_RATE * slow + FAST_RATE * fast;
        const settled =
          Math.abs(slow + fast) < 0.05 && Math.abs(item.velocity) < 0.5;
        item.size = settled ? target : target + slow + fast;
        if (settled) item.velocity = 0;
        moving ||= !settled;
        item.element.style.setProperty('--dock-size', `${item.size}px`);
        item.element.style.setProperty(
          '--dock-glyph-scale',
          String(item.size / RESTING_SIZE),
        );
      });

      frame = moving ? window.requestAnimationFrame(animate) : 0;
    };

    const updatePointer = (x: number) => {
      pointerX = x;
      if (frame) return;
      previousTime = performance.now();
      frame = window.requestAnimationFrame(animate);
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && motionEnabled.matches) {
        updatePointer(event.clientX);
      }
    };

    const handleLeave = () => {
      if (Number.isFinite(pointerX)) updatePointer(Infinity);
    };

    const reset = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      pointerX = Infinity;
      for (const item of items) {
        item.size = RESTING_SIZE;
        item.velocity = 0;
        item.element.style.removeProperty('--dock-size');
        item.element.style.removeProperty('--dock-glyph-scale');
      }
    };

    dock.addEventListener('pointermove', handleMove);
    dock.addEventListener('pointerleave', handleLeave);
    dock.addEventListener('pointercancel', handleLeave);
    motionEnabled.addEventListener('change', reset);

    return () => {
      reset();
      dock.removeEventListener('pointermove', handleMove);
      dock.removeEventListener('pointerleave', handleLeave);
      dock.removeEventListener('pointercancel', handleLeave);
      motionEnabled.removeEventListener('change', reset);
    };
  }, [dockRef, itemKey]);
}

export function NavigationDock({
  theme,
  onToggleTheme,
  destinations,
  active,
  onNavigate,
  unreadCount,
  notificationsOpen,
  onNotifications,
  onProfile,
  initials,
  profileLabel = 'Profile',
  homeHref = '/dashboard',
  homeId = 'dashboard',
  hidden = false,
}: NavigationDockProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLAnchorElement>(null);
  const itemKey = destinations.map((d) => d.id).join('|');
  useDockMagnification(dockRef, itemKey);

  useEffect(() => {
    const updateWordmark = () => {
      wordmarkRef.current?.toggleAttribute('data-scrolled', window.scrollY > 24);
    };
    updateWordmark();
    window.addEventListener('scroll', updateWordmark, { passive: true });
    return () => window.removeEventListener('scroll', updateWordmark);
  }, []);

  const activeIndex = destinations.findIndex((item) => item.id === active);

  return (
    <header className="preview-header" hidden={hidden}>
      <Link
        className="wordmark"
        ref={wordmarkRef}
        to={homeHref}
        aria-label="MentorQ dashboard"
        onClick={() => onNavigate?.(homeId, homeHref)}
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

      <div ref={dockRef} className="navigation-dock" data-dock-theme={theme}>
        <nav
          className="site-nav"
          aria-label="Workspace sections"
          style={
            {
              '--active-tab': Math.max(0, activeIndex),
              '--nav-count': Math.max(1, destinations.length),
            } as CSSProperties
          }
        >
          {destinations.map(({ id, label, href, iconPath }) => (
            <Link
              key={id}
              to={href}
              data-dock-item
              aria-label={label}
              aria-current={active === id ? 'location' : undefined}
              onClick={() => onNavigate?.(id, href)}
            >
              <span className="dock-icon" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.65"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={iconPath} />
                </svg>
              </span>
              <span className="dock-destination-label" aria-hidden="true">
                {label}
              </span>
              <span className="dock-tooltip" aria-hidden="true">
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="header-actions" role="group" aria-label="Account controls">
          <div className="dock-account-item" data-dock-item>
            <button
              type="button"
              className="dock-theme-btn"
              onClick={onToggleTheme}
              aria-label={
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
              }
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
            <span className="dock-tooltip" aria-hidden="true">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </div>

          <div className="dock-account-item" data-dock-item>
            <NotificationBell
              count={unreadCount}
              expanded={notificationsOpen}
              onClick={onNotifications}
            />
            <span className="dock-tooltip" aria-hidden="true">
              Notifications
            </span>
          </div>

          <div className="dock-account-item" data-dock-item>
            <button
              className="account"
              type="button"
              aria-label={profileLabel}
              aria-haspopup="dialog"
              onClick={onProfile}
            >
              {initials}
            </button>
            <span className="dock-tooltip" aria-hidden="true">
              Profile
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default NavigationDock;
