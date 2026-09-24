import { useState } from 'react';
import { BoxIcon } from './icons';

interface ProductThumbnailProps {
  src: string | null;
  alt: string;
  className?: string;
}

/** Product image if one is set and loads; otherwise a plain placeholder icon. Never breaks layout. */
export function ProductThumbnail({ src, alt, className = 'size-9' }: ProductThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 ${className}`}>
        <BoxIcon />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-lg border border-slate-200 object-cover ${className}`}
    />
  );
}
