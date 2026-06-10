/* Minimal inline line icons (1.6px stroke, 20px grid). */
type P = { className?: string };
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PinIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
export function NearMeIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M21 3 3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
    </svg>
  );
}
export function ClockIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
export function CardIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
export function StarIcon(p: P) {
  return (
    <svg {...base} {...p} fill="currentColor" stroke="none">
      <path d="M12 3.5l2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 17.9l-5.25 2.76 1-5.86L3.5 9.66l5.9-.86L12 3.5Z" />
    </svg>
  );
}
export function CheckIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}
export function BookmarkIcon({ filled, ...p }: P & { filled?: boolean }) {
  return (
    <svg {...base} {...p} fill={filled ? "currentColor" : "none"}>
      <path d="M6 4h12v16l-6-4-6 4V4Z" />
    </svg>
  );
}
export function CompassIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}
export function SearchIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
export function ListIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}
export function MapIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}
export function PlusIcon(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
