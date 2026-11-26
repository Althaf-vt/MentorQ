import { useState } from 'react';

export type AvatarProps = { name: string; src?: string; size?: 'sm' | 'md' | 'lg' };

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const initials = name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0] ?? '').join('').toUpperCase();
  return (
    <span className="mqds-avatar" role="img" aria-label={name} data-size={size}>
      {src && failedSrc !== src
        ? <img src={src} alt="" onError={() => setFailedSrc(src)} />
        : <span aria-hidden="true">{initials || '?'}</span>}
    </span>
  );
}
