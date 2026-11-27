import { useMemo, useRef, useState } from 'react';
import { Button, darkTheme } from '../../design-system';
import { MENTOR_PRINT_SPECS, getMentorPrints } from './MentorPrints';

export interface GalleryMentor {
  id: string;
  name: string;
  specialty: string;
  paper: string;
  ink: string;
  imageUrl: string;
  isOnline?: boolean;
}

export interface MentorGalleryProps {
  mentors?: GalleryMentor[];
  heading?: string;
  favorites?: string[];
  onToggleFavorite?: (mentor: GalleryMentor) => void;
  onRequestSession?: (mentor: GalleryMentor) => void;
  actionLabel?: string;
}

export function MentorGallery({
  mentors,
  heading = 'Meet the mentors',
  favorites = [],
  onToggleFavorite,
  onRequestSession,
  actionLabel = 'Request a session',
}: MentorGalleryProps) {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<Animation | null>(null);

  const items = useMemo<GalleryMentor[]>(() => {
    if (mentors && mentors.length > 0) return mentors;
    const prints = getMentorPrints();
    return MENTOR_PRINT_SPECS.map((spec, index) => ({
      id: spec.name,
      name: spec.name,
      specialty: spec.specialty,
      paper: spec.paper,
      ink: spec.ink,
      imageUrl: prints[index] || '',
    }));
  }, [mentors]);

  const safeIndex = active < items.length ? active : 0;
  const current = items[safeIndex];

  if (!current) {
    return null;
  }

  const isFavorite =
    favorites.includes(current.id) || favorites.includes(current.name);

  const selectMentor = (index: number, thumbnail: HTMLButtonElement) => {
    if (index === safeIndex) return;
    revealRef.current?.cancel();

    const stage = stageRef.current;
    const targetLayer = stage?.children[index] as HTMLElement | undefined;
    if (
      stage &&
      targetLayer &&
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const bounds = stage.getBoundingClientRect();
      const origin = thumbnail.getBoundingClientRect();
      const top = origin.top - bounds.top;
      const left = origin.left - bounds.left;
      const bottom = bounds.bottom - origin.bottom;
      const right = bounds.right - origin.right;
      revealRef.current = targetLayer.animate(
        [
          {
            clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 4px)`,
            transform: 'scale(1.12)',
          },
          { clipPath: 'inset(0 round 0px)', transform: 'scale(1)' },
        ],
        { duration: 680, easing: 'cubic-bezier(.22, 1, .36, 1)' },
      );
    }

    setActive(index);
  };

  return (
    <section id="mentors">
      <div className="sectionTitle">
        <h2 id="mentors-title" tabIndex={-1}>
          {heading}
        </h2>
        <span>{String(items.length).padStart(2, '0')} mentors</span>
      </div>
      <div
        className="gallery"
        style={{ backgroundColor: current.paper, color: current.ink }}
      >
        <div className="gallery-stage" ref={stageRef} aria-hidden="true">
          {items.map((item, index) => (
            <img
              className="backprint"
              key={`${item.id}-${index}`}
              data-active={safeIndex === index}
              src={item.imageUrl}
              alt=""
            />
          ))}
        </div>
        <div className="bio">
          <div className="gallery-caption" key={current.id} aria-live="off">
            <small>{current.specialty}</small>
            <h3>{current.name}</h3>
          </div>
          <span className="gallery-announcement" role="status">
            {current.name}, {current.specialty}
          </span>
          {onToggleFavorite ? (
            <Button
              type="button"
              className="mentor-favorite"
              data-mqds={darkTheme}
              variant={isFavorite ? 'danger-subtle' : 'secondary'}
              onClick={() => onToggleFavorite(current)}
            >
              {isFavorite ? 'Remove favorite' : 'Add to favorites'}
            </Button>
          ) : null}
          {onRequestSession ? (
            <button
              type="button"
              className="mentor-request"
              onClick={() => onRequestSession(current)}
            >
              {actionLabel} <span aria-hidden="true">{'\u2192'}</span>
            </button>
          ) : null}
        </div>
        <div className="strip" role="group" aria-label="Choose a mentor">
          {items.map((mentor, index) => (
            <button
              type="button"
              key={mentor.id}
              aria-label={`Show ${mentor.name}`}
              aria-pressed={safeIndex === index}
              onClick={(event) => selectMentor(index, event.currentTarget)}
            >
              <img src={mentor.imageUrl} alt="" />
              <b>{String(index + 1).padStart(2, '0')}</b>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MentorGallery;
