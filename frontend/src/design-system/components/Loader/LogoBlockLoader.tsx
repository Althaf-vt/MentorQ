import { useEffect, useRef, type RefObject } from 'react';
import logo from '../../../assets/mentorq-logo.svg?inline';

const columns = 15;
const rows = 10;
const cell = 20;
const logoWidth = columns * cell;
const logoHeight = rows * cell;
const boardWidth = logoWidth + 2 * cell;
const boardHeight = logoHeight + 4 * cell;
const logoLeft = cell;
const logoTop = 3 * cell;
const drop = 540;
const stagger = 85;
const settle = 180;
const hold = 1200;

const shapes = [
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0]],
];

function groupLogoCells(occupied: Set<number>) {
  const remaining = new Set(occupied);
  const pieces: [number, number][][] = [];
  // Assemble from the bottom so the lower pieces are in place first.
  for (let y = rows - 1; y >= 0; y--) {
    for (let x = 0; x < columns; x++) {
      if (!remaining.has(y * columns + x)) continue;
      const shape = shapes.find(candidate => candidate.every(([dx, dy]) =>
        x + dx < columns && y >= dy && remaining.has((y - dy) * columns + x + dx)));
      const piece = (shape ?? [[0, 0]]).map(([dx, dy]): [number, number] => [x + dx, y - dy]);
      for (const [col, row] of piece) remaining.delete(row * columns + col);
      pieces.push(piece);
    }
  }
  return pieces;
}

function readLogo(image: HTMLImageElement) {
  const texture = document.createElement('canvas');
  texture.width = logoWidth * 2;
  texture.height = logoHeight * 2;
  const ctx = texture.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const aspect = 990 / 650;
  const width = Math.min(texture.width, texture.height * aspect);
  const height = width / aspect;
  ctx.drawImage(image, (texture.width - width) / 2, (texture.height - height) / 2, width, height);
  const { data } = ctx.getImageData(0, 0, texture.width, texture.height);
  const occupied = new Set<number>();
  for (let y = 0; y < texture.height; y++) {
    for (let x = 0; x < texture.width; x++) {
      if (data[(y * texture.width + x) * 4 + 3] > 0) {
        occupied.add(Math.floor(y / (2 * cell)) * columns + Math.floor(x / (2 * cell)));
      }
    }
  }
  return { texture, pieces: groupLogoCells(occupied) };
}

function useBlockAnimation(canvasRef: RefObject<HTMLCanvasElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const canvasContext = canvas?.getContext('2d');
    if (!canvas || !canvasContext) return;
    const ctx = canvasContext;

    const style = getComputedStyle(canvas);
    const palette = ['--mqds-lilac', '--mqds-primary', '--mqds-ivory', '--mqds-peach', '--mqds-accent']
      .map(token => style.getPropertyValue(token).trim());
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const image = new Image();
    let frame = 0;
    let animation: ReturnType<typeof readLogo> = null;

    ctx.setTransform(2, 0, 0, 2, 0, 0);

    function start() {
      cancelAnimationFrame(frame);
      ctx.clearRect(0, 0, boardWidth, boardHeight);
      if (motion.matches || !animation) return;
      const { texture, pieces } = animation;
      const build = (pieces.length - 1) * stagger + drop + settle;
      let started: number | undefined;

      function paint(now: number) {
        started ??= now;
        const elapsed = (now - started) % (build + hold);
        ctx.clearRect(0, 0, boardWidth, boardHeight);

        if (elapsed >= build) {
          ctx.drawImage(texture, logoLeft, logoTop, logoWidth, logoHeight);
        } else {
          pieces.forEach((piece, index) => {
            const age = elapsed - index * stagger;
            if (age < 0) return;
            const progress = Math.min(1, age / drop);
            const blend = Math.max(0, Math.min(1, (age - drop) / settle));
            const lowestRow = Math.max(...piece.map(([, row]) => row));
            const lift = (logoTop + (lowestRow + 1) * cell) * (1 - progress ** 2);
            ctx.fillStyle = palette[index % palette.length];
            for (const [col, row] of piece) {
              const x = logoLeft + col * cell;
              const y = logoTop + row * cell;
              if (blend < 1) {
                ctx.globalAlpha = 1 - blend;
                ctx.fillRect(x + 1, y - lift + 1, cell - 2, cell - 2);
              }
              if (blend > 0) {
                ctx.globalAlpha = blend;
                ctx.drawImage(texture, col * cell * 2, row * cell * 2, cell * 2, cell * 2, x, y, cell, cell);
              }
            }
            ctx.globalAlpha = 1;
          });
        }
        frame = requestAnimationFrame(paint);
      }

      frame = requestAnimationFrame(paint);
    }

    image.onload = () => {
      try {
        animation = readLogo(image);
      } catch {
        // Keep the static logo when canvas pixel access is unavailable.
        return;
      }
      if (!animation?.pieces.length) return;
      canvas.dataset.ready = 'true';
      start();
    };
    image.src = logo;
    motion.addEventListener('change', start);
    return () => {
      image.onload = null;
      cancelAnimationFrame(frame);
      motion.removeEventListener('change', start);
    };
  }, [canvasRef, active]);
}

export type LogoBlockLoaderProps = {
  label?: string;
  active?: boolean;
};

export function LogoBlockLoader({ label = 'Loading MentorQ', active = true }: LogoBlockLoaderProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useBlockAnimation(canvas, active);

  return (
    <div className="mqds-logo-block-loader" role="status">
      <div className="mqds-logo-block-board" aria-hidden="true">
        <canvas ref={canvas} width={boardWidth * 2} height={boardHeight * 2} />
        <img src={logo} alt="" width="990" height="650" />
      </div>
      <span>{label}</span>
    </div>
  );
}
