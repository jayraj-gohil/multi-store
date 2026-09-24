// Minimal inline icon set (no icon-library dependency) used by StatCard and page headers.
import type { SVGProps } from 'react';

function base(props: SVGProps<SVGSVGElement>) {
  return { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24', ...props };
}

export function BoxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} className="size-4">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} className="size-4">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function SlashCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} className="size-4">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 8 8 8" />
    </svg>
  );
}

export function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} className="size-4">
      <path d="M12.5 3H5a2 2 0 0 0-2 2v7.5a2 2 0 0 0 .586 1.414l8.5 8.5a2 2 0 0 0 2.828 0l6.086-6.086a2 2 0 0 0 0-2.828l-8.5-8.5A2 2 0 0 0 12.5 3Z" />
      <circle cx="8" cy="8" r="1.5" />
    </svg>
  );
}

export function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} className="size-4">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}

export function StoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} className="size-4">
      <path d="M3 7 4.5 3h15L21 7" />
      <path d="M3 7h18v3a3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3 3 3 0 0 1-3-3V7Z" />
      <path d="M5 13v8h14v-8" />
    </svg>
  );
}

export function ClipboardListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} className="size-4">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 11h6M9 15h6M9 19h3" />
    </svg>
  );
}

export function RupeeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} className="size-4">
      <path d="M6 4h12M6 8h12M6 4c4 0 6 1.5 6 4s-2 4-6 4h-1l8 8" />
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} className="size-3.5">
      <path d="M4 7h16" />
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <path d="M19 7v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} className="size-4">
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
