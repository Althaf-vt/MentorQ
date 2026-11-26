import type { PointerEvent } from 'react';

const rotationFactor = 8;

function updateTilt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const card = event.currentTarget;
  const { left, top, width, height } = card.getBoundingClientRect();
  if (!width || !height) return;

  const horizontal = Math.max(-1, Math.min(1, (event.clientX - left) / width * 2 - 1));
  const vertical = Math.max(-1, Math.min(1, (event.clientY - top) / height * 2 - 1));
  card.style.setProperty('--mqds-tilt-x', vertical * rotationFactor + 'deg');
  card.style.setProperty('--mqds-tilt-y', -horizontal * rotationFactor + 'deg');
}

function resetTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty('--mqds-tilt-x');
  event.currentTarget.style.removeProperty('--mqds-tilt-y');
}

export const cardTiltHandlers = {
  onPointerMove: updateTilt,
  onPointerLeave: resetTilt,
  onPointerCancel: resetTilt,
};
