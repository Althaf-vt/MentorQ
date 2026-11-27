export interface MentorPrintSpec {
  name: string;
  specialty: string;
  paper: string;
  ink: string;
}

export const MENTOR_PRINT_SPECS: readonly MentorPrintSpec[] = [
  { name: 'Mira Nair', specialty: 'React & UI', paper: '#c3b8ff', ink: '#302580' },
  { name: 'Ishan Roy', specialty: 'System design', paper: '#ff9a74', ink: '#802d34' },
  { name: 'Leena Das', specialty: 'Databases', paper: '#b9dfa6', ink: '#154e45' },
  { name: 'Dev Shah', specialty: 'Backend APIs', paper: '#a6d8f1', ink: '#203c86' },
  { name: 'Noor Ali', specialty: 'TypeScript', paper: '#f4cf70', ink: '#64344e' },
];

const cachedPrints = new Map<string, string>();

export function generateMentorPrint(paper: string, ink: string, index: number): string {
  const key = `${index}:${paper}:${ink}`;
  const cached = cachedPrints.get(key);
  if (cached) return cached;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 620;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 720, 620);
  ctx.translate(360, 310);
  ctx.rotate(-0.42 + index * 0.3);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.8;

  for (let ring = 0; ring < 138; ring++) {
    const u = (ring / 138) * Math.PI * 2;
    ctx.beginPath();
    for (let step = 0; step <= 100; step++) {
      const v = (step / 100) * Math.PI * 2;
      const tube = 63 + 24 * Math.sin((2 + (index % 3)) * u + v);
      const radius = 151 + tube * Math.cos(v);
      const x = radius * Math.cos(u);
      const y =
        radius * Math.sin(u) * 0.7 +
        tube * Math.sin(v) +
        56 * Math.sin(((index % 2) + 2) * u);
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const dataUrl = canvas.toDataURL();
  cachedPrints.set(key, dataUrl);
  return dataUrl;
}

/** Return the 5 canonical ui-preview toroidal mentor prints (memoized after first call). */
export function getMentorPrints(): string[] {
  return MENTOR_PRINT_SPECS.map((spec, index) =>
    generateMentorPrint(spec.paper, spec.ink, index),
  );
}

/** Pick deterministic print palette + data URL for any mentor identifier. */
export function getMentorPrintTheme(seed: string | number) {
  let hash = 0;
  const text = String(seed);
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  const index = hash % MENTOR_PRINT_SPECS.length;
  const spec = MENTOR_PRINT_SPECS[index];
  return {
    ...spec,
    index,
    printUrl: generateMentorPrint(spec.paper, spec.ink, index),
  };
}
