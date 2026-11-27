import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { getMentorPrints } from './MentorPrints';

const ORBIT_RADIUS = { x: 0.92, y: 0.53 };
const ORBIT_IDLE_SPEED = 0.0002;
const ORBIT_FRICTION = 340;

interface OrbitPoint {
  x: number;
  y: number;
}

interface OrbitGesture {
  id: number;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  time: number;
  speed: number;
  point: OrbitPoint;
}

export interface MentorOrbitProps {
  prints?: string[];
  className?: string;
}

function getOrbitPointer(
  event: PointerEvent<HTMLDivElement>,
  gesture: Omit<OrbitGesture, 'point'>,
): OrbitPoint {
  return {
    x: (event.clientX - gesture.centerX) / gesture.radiusX,
    y: (event.clientY - gesture.centerY) / gesture.radiusY,
  };
}

function getOrbitDragDelta(previous: OrbitPoint, next: OrbitPoint): number {
  const reach = Math.min(Math.hypot(previous.x, previous.y), Math.hypot(next.x, next.y));
  const grip = Math.min(1, reach / 0.65);
  const cross = previous.x * next.y - previous.y * next.x;
  const dot = previous.x * next.x + previous.y * next.y;
  const turn = Math.atan2(cross, dot);
  return turn * grip + (next.x - previous.x) * (1 - grip) * 0.75;
}

export function MentorOrbit({ prints, className }: MentorOrbitProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<OrbitGesture | null>(null);
  const reducedMotionRef = useRef(false);
  const motionRef = useRef({
    angle: Math.PI,
    target: Math.PI,
    speed: ORBIT_IDLE_SPEED,
    direction: 1,
  });
  const [paused, setPaused] = useState(false);

  const cards = useMemo(() => {
    const base = prints && prints.length > 0 ? prints : getMentorPrints();
    return [...base, ...base];
  }, [prints]);

  const paint = () => {
    const container = fieldRef.current;
    if (!container) return;
    const children = container.children;
    const total = children.length;
    if (!total) return;

    for (let index = 0; index < total; index++) {
      const card = children[index] as HTMLElement;
      const position = motionRef.current.angle + (index * 2 * Math.PI) / total;
      const horizontal = Math.cos(position);
      const vertical = Math.sin(position);
      const depth = -horizontal * 0.86 + vertical * 0.28;
      card.style.transform = `translate(-50%, -50%) translate(${
        horizontal * ORBIT_RADIUS.x * 100
      }%, ${vertical * ORBIT_RADIUS.y * 100}%) scale(${0.95 + depth * 0.065})`;
      card.style.setProperty('--orbit-depth', String(Math.round(100 + depth * 90)));
    }
  };

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastTime: number | undefined;

    const tick = (now: number) => {
      if (lastTime !== undefined) {
        const elapsed = Math.min(now - lastTime, 48);
        const orbit = motionRef.current;
        if (!dragRef.current) {
          const idle = ORBIT_IDLE_SPEED * orbit.direction;
          const decay = Math.exp(-elapsed / ORBIT_FRICTION);
          const excess = orbit.speed - idle;
          orbit.target += idle * elapsed + excess * ORBIT_FRICTION * (1 - decay);
          orbit.speed = idle + excess * decay;
        }
        orbit.angle += (orbit.target - orbit.angle) * (1 - Math.exp(-elapsed / 32));
        paint();
      }
      lastTime = now;
      frame = window.requestAnimationFrame(tick);
    };

    const restart = () => {
      window.cancelAnimationFrame(frame);
      lastTime = undefined;
      reducedMotionRef.current = media.matches;
      motionRef.current.target = motionRef.current.angle;
      motionRef.current.speed = 0;
      paint();
      if (!paused && !media.matches) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    restart();
    media.addEventListener('change', restart);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener('change', restart);
    };
  }, [paused, cards.length]);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || dragRef.current) return;
    const element = event.currentTarget;
    const bounds = element.getBoundingClientRect();
    const card = element.firstElementChild as HTMLElement | null;
    if (!card) return;

    const radiusX = card.offsetWidth * ORBIT_RADIUS.x;
    const radiusY = card.offsetHeight * ORBIT_RADIUS.y;
    if (!radiusX || !radiusY) return;

    element.setPointerCapture(event.pointerId);
    element.setAttribute('data-dragging', '');
    const orbit = motionRef.current;
    orbit.target = orbit.angle;
    orbit.speed = 0;

    const gestureBase = {
      id: event.pointerId,
      centerX: bounds.left + bounds.width * 0.5,
      centerY: bounds.top + bounds.height * 0.49,
      radiusX,
      radiusY,
      time: event.timeStamp,
      speed: 0,
    };
    dragRef.current = {
      ...gestureBase,
      point: getOrbitPointer(event, gestureBase),
    };
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = dragRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;

    const next = getOrbitPointer(event, gesture);
    const displacement = getOrbitDragDelta(gesture.point, next);
    const elapsed = Math.max(event.timeStamp - gesture.time, 4);
    const instant = Math.max(-0.014, Math.min(0.014, displacement / elapsed));
    const blend = 1 - Math.exp(-elapsed / 38);
    gesture.speed = elapsed > 100 ? 0 : gesture.speed + (instant - gesture.speed) * blend;
    gesture.point = next;
    gesture.time = event.timeStamp;

    const orbit = motionRef.current;
    orbit.target += displacement;
    if (Math.abs(displacement) > 0.002) {
      orbit.direction = Math.sign(displacement);
    }
    if (paused || reducedMotionRef.current) {
      orbit.angle = orbit.target;
      paint();
    }
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = dragRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;

    const orbit = motionRef.current;
    const hold = event.timeStamp - gesture.time;
    orbit.speed =
      event.type === 'pointerup' && hold < 130
        ? gesture.speed * Math.exp(-Math.max(0, hold) / 75)
        : 0;
    if (Math.abs(orbit.speed) > ORBIT_IDLE_SPEED) {
      orbit.direction = Math.sign(orbit.speed);
    }
    dragRef.current = null;
    event.currentTarget.removeAttribute('data-dragging');
  };

  const rotateWithKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const orbit = motionRef.current;
    orbit.direction = event.key === 'ArrowRight' ? 1 : -1;
    orbit.speed = 0;
    orbit.target += (orbit.direction * Math.PI) / 5;
    if (paused || reducedMotionRef.current) {
      orbit.angle = orbit.target;
      paint();
    }
  };

  return (
    <div className={className ? `orbit ${className}` : 'orbit'}>
      <div
        className="orbit-field"
        role="group"
        aria-label="Artwork orbit. Drag or use left and right arrows to rotate."
        tabIndex={0}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={rotateWithKeys}
        ref={fieldRef}
      >
        {cards.map((src, index) => (
          <div className="orbit-card" key={`${index}-${cards.length}`}>
            <img src={src} alt="" draggable={false} />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="motion"
        onClick={() => setPaused((value) => !value)}
        aria-label={paused ? 'Play artwork motion' : 'Pause artwork motion'}
      >
        {paused ? '\u25B7' : '\u2161'}
      </button>
    </div>
  );
}

export default MentorOrbit;
