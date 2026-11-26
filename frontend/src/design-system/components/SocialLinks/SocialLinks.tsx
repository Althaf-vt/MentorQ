import { useRef, type HTMLAttributes, type PointerEvent } from 'react';

export const socialPlatforms = [
  { id: 'linkedin', name: 'LinkedIn', mark: 'in' },
  { id: 'github', name: 'GitHub', mark: 'GH' },
  { id: 'gitlab', name: 'GitLab', mark: 'GL' },
  { id: 'leetcode', name: 'LeetCode', mark: 'LC' },
  { id: 'x', name: 'X', mark: 'X' },
] as const;

type SocialPlatform = (typeof socialPlatforms)[number];
export type SocialLinksProps = HTMLAttributes<HTMLDivElement> & {
  links: Readonly<Partial<Record<SocialPlatform['id'], string>>>;
  variant?: 'grid' | 'mq';
};

const fullTile = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
const edges = {
  left: 'polygon(0 0, 0 0, -32% 100%, 0 100%)',
  right: 'polygon(132% 0, 100% 0, 100% 100%, 100% 100%)',
  top: 'polygon(0 0, 100% 0, 100% -32%, 0 0)',
  bottom: 'polygon(0 132%, 100% 100%, 100% 100%, 0 100%)'
};

function secureHref(href?: string) {
  if (!href) return undefined;
  try {
    const url = new URL(href);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch {
    // Invalid addresses render as missing links.
  }
  return undefined;
}

function nearestEdge(event: PointerEvent<HTMLAnchorElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  const distances: [keyof typeof edges, number][] = [
    ['left', Math.abs(event.clientX - box.left)],
    ['right', Math.abs(box.right - event.clientX)],
    ['top', Math.abs(event.clientY - box.top)],
    ['bottom', Math.abs(box.bottom - event.clientY)]
  ];
  return distances.reduce((nearest, edge) => edge[1] < nearest[1] ? edge : nearest)[0];
}

type TileProps = { platform: SocialPlatform; href?: string };

function PlatformTile({ platform, href }: TileProps) {
  const overlay = useRef<HTMLSpanElement>(null);
  const animation = useRef<Animation | null>(null);
  const hover = useRef(false);
  const keyboardFocus = useRef(false);

  function wipe(visible: boolean, side: keyof typeof edges) {
    const tile = overlay.current;
    if (!tile) return;
    const running = animation.current?.playState === 'running';
    const from = running ? getComputedStyle(tile).clipPath : visible ? edges[side] : fullTile;
    const to = visible ? fullTile : edges[side];
    animation.current?.cancel();
    tile.style.clipPath = to;
    if (typeof tile.animate === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animation.current = tile.animate([{ clipPath: from }, { clipPath: to }], {
        duration: visible ? 360 : 280,
        easing: visible ? 'cubic-bezier(.2,.8,.2,1)' : 'cubic-bezier(.55,0,.8,.45)'
      });
    }
  }

  const content = (direction: string) => (
    <span className="mqds-social-tile-content">
      <strong className="mqds-social-mark" aria-hidden="true">{platform.mark}</strong>
      <span>{platform.name}</span><span className="mqds-social-arrow">{direction}</span>
    </span>
  );

  if (!href) return <div className="mqds-social-tile mqds-social-tile-missing">{content('')}<small>No link added</small></div>;

  return (
    <a className="mqds-social-tile" data-platform={platform.id} href={href} target="_blank" rel="noopener noreferrer"
      aria-label={platform.name + ' (opens in a new tab)'}
      onPointerEnter={event => {
        if (event.pointerType !== 'mouse') return;
        hover.current = true;
        if (!keyboardFocus.current) wipe(true, nearestEdge(event));
      }}
      onPointerLeave={event => {
        if (event.pointerType !== 'mouse') return;
        hover.current = false;
        if (!keyboardFocus.current) wipe(false, nearestEdge(event));
      }}
      onFocus={event => {
        keyboardFocus.current = event.currentTarget.matches(':focus-visible');
        if (keyboardFocus.current && !hover.current) wipe(true, 'left');
      }}
      onBlur={() => {
        if (keyboardFocus.current && !hover.current) wipe(false, 'right');
        keyboardFocus.current = false;
      }}>
      <span aria-hidden="true">{content('\u2192')}</span>
      <span className="mqds-social-wipe" ref={overlay} aria-hidden="true">{content('\u2192')}</span>
    </a>
  );
}

function SocialLinkCard({ platform, href }: TileProps) {
  const content = (
    <>
      <strong className="mqds-social-mq-mark" aria-hidden="true">{platform.mark}</strong>
      <span className="mqds-social-mq-label">{platform.name}</span>
      {href
        ? <span className="mqds-social-mq-arrow" aria-hidden="true">→</span>
        : <small>No link added</small>}
    </>
  );

  return href ? (
    <a className="mqds-social-mq-card" data-platform={platform.id} href={href} target="_blank" rel="noopener noreferrer"
      aria-label={platform.name + ' (opens in a new tab)'}>
      {content}
    </a>
  ) : <div className="mqds-social-mq-card mqds-social-mq-card-empty" data-platform={platform.id}>{content}</div>;
}

function SocialLinksGridV2({ links, className, ...props }: Omit<SocialLinksProps, 'variant'>) {
  return (
    <div {...props} className={['mqds-social-mq-grid', className].filter(Boolean).join(' ')}>
      <div className="mqds-social-mq-letter mqds-social-mq-m">
        {socialPlatforms.filter(({ id }) => id === 'linkedin' || id === 'gitlab' || id === 'leetcode').map(platform => (
          <SocialLinkCard key={platform.id} platform={platform} href={secureHref(links[platform.id])} />
        ))}
      </div>
      <div className="mqds-social-mq-letter mqds-social-mq-q">
        {socialPlatforms.filter(({ id }) => id === 'github' || id === 'x').map(platform => (
          <SocialLinkCard key={platform.id} platform={platform} href={secureHref(links[platform.id])} />
        ))}
      </div>
    </div>
  );
}

export function SocialLinks({ links, variant = 'grid', className, ...props }: SocialLinksProps) {
  if (variant === 'mq') return <SocialLinksGridV2 {...props} links={links} className={className} />;

  return (
    <div {...props} className={['mqds-social-grid', className].filter(Boolean).join(' ')}>
      {socialPlatforms.map(platform => (
        <PlatformTile key={platform.id} platform={platform} href={secureHref(links[platform.id])} />
      ))}
    </div>
  );
}
