import type { ReactNode } from 'react';

export type IconName =
  | 'grid'
  | 'route'
  | 'ticket'
  | 'clock'
  | 'pin'
  | 'swap'
  | 'arrow'
  | 'chevron'
  | 'search'
  | 'train'
  | 'spark'
  | 'close'
  | 'check'
  | 'info'
  | 'menu'
  | 'heart'
  | 'external'
  | 'user'
  | 'monorail';

const paths: Record<IconName, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M6 7v7a5 5 0 0 0 5 5h5M18 17V9a4 4 0 0 0-4-4h-2" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a4 4 0 0 0 0 8v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a4 4 0 0 0 0-8Z" />
      <path d="M13 4v3m0 3v4m0 3v3" strokeDasharray="2 3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  swap: <path d="M5 7h14m-4-4 4 4-4 4M19 17H5m4-4-4 4 4 4" />,
  arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="7" />
      <path d="m16 16 5 5" />
    </>
  ),
  train: (
    <>
      <rect x="5" y="2.5" width="14" height="16" rx="4" />
      <path d="M5 11h14M8 22l2-3.5m6 0 2 3.5M8.5 15h.01M15.5 15h.01" />
    </>
  ),
  spark: (
    <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
  ),
  close: <path d="M5 5 19 19M19 5 5 19" />,
  check: <path d="m5 12 4 4L19 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  heart: <path d="M20.8 8.5c0 4.4-8.8 10.3-8.8 10.3S3.2 12.9 3.2 8.5a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z" />,
  external: (
    <>
      <path d="M13 5h6v6m0-6-9 9" />
      <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  /** Train riding on top of a beam. */
  monorail: (
    <>
      <rect x="3.5" y="4" width="17" height="10" rx="4" />
      <path d="M3.5 9.5h17M8 7h.01M12 7h.01M16 7h.01" />
      <path d="M2 18h20M7 14v4m10-4v4M9 21h6" />
    </>
  ),
};

export default function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
