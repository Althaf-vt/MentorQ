import { useEffect, useRef, type CSSProperties } from 'react';
import mentorQLogo from '../../assets/mentorq-logo.svg?inline';

export interface BrandIntroProps {
  onFinish: () => void;
}

const INTRO_LETTERS = Array.from('MentorQ');

export function BrandIntro({ onFinish }: BrandIntroProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    const element = dialogRef.current;
    if (element && !element.open) {
      element.showModal();
    }

    const complete = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish();
    };

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fallbackTimer = window.setTimeout(complete, reducedMotion ? 1800 : 5500);

    return () => {
      window.clearTimeout(fallbackTimer);
      if (element?.open) {
        element.close();
      }
    };
  }, [onFinish]);

  const handleFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  return (
    <dialog
      className="brand-intro"
      ref={dialogRef}
      aria-labelledby="intro-title"
      onCancel={(event) => {
        event.preventDefault();
        handleFinish();
      }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          handleFinish();
        }
      }}
    >
      <div className="intro-glow" aria-hidden="true" />
      <div className="intro-bands" aria-hidden="true" />
      <div className="intro-composition">
        <div className="intro-glass" aria-hidden="true">
          <div
            className="intro-mark"
            style={{ '--mq-mask': `url("${mentorQLogo}")` } as CSSProperties}
          >
            <img src={mentorQLogo} alt="" width="330" height="217" />
            <div className="intro-color-sweep" />
          </div>
        </div>
        <div className="intro-title-window">
          <h2 id="intro-title" aria-label="MentorQ">
            {INTRO_LETTERS.map((letter, index) => (
              <span
                key={`${letter}-${index}`}
                aria-hidden="true"
                style={{ '--letter': index } as CSSProperties}
              >
                {letter}
              </span>
            ))}
          </h2>
        </div>
      </div>
      <button className="intro-skip" type="button" onClick={handleFinish}>
        Skip intro
      </button>
    </dialog>
  );
}

export default BrandIntro;
