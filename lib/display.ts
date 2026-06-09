import type { Booth, BoothType } from "./types";

// Map / pin palette — pink (analog), blue (digital), green (booth shop).
export const COLORS = {
  analog: "#f0506e", // analog film — rose/red
  digital: "#3d7eed", // digital — blue
  dedicated: "#2fb37e", // booth shop — green
  verify: "#98a0a8", // uncertain grey
} as const;

export const TYPE_LABEL: Record<BoothType, string> = {
  analog: "Analog film",
  digital: "Digital",
  dedicated: "Booth shop",
};

// What a booth filters/renders as: verified-uncertain booths collapse to "verify".
export type EffectiveType = BoothType | "verify";

export function effectiveType(b: Pick<Booth, "type" | "verify">): EffectiveType {
  return b.verify ? "verify" : b.type;
}

export function markerColor(b: Pick<Booth, "type" | "verify">): string {
  return COLORS[effectiveType(b)];
}

export function badgeLabel(b: Pick<Booth, "type" | "verify">): string {
  return b.verify ? "Check first" : TYPE_LABEL[b.type];
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/* ---------------------------------------------------------------------------
 * Prototype sample metadata.
 *
 * The design calls for hours, open/closed state, ratings, reviews and queue
 * times, but the seed dataset has none of these (there is no real source for
 * them in this environment). These helpers derive stable, deterministic values
 * from each booth's slug so the UI matches the design. They are PLACEHOLDERS —
 * when a real field exists on the booth it is preferred. Swap these for a real
 * data source before launch.
 * ------------------------------------------------------------------------- */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fmtHour(h: number): string {
  const ap = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:00 ${ap}`;
}

type Slugged = Pick<Booth, "slug">;

// ~80% of booths read as open — deterministic, so SSR and client agree.
export function isOpenNow(b: Slugged): boolean {
  return hashStr(b.slug + "open") % 5 !== 0;
}

export function hoursLabel(b: Pick<Booth, "slug" | "hours">): string {
  if (b.hours) return b.hours;
  const h = hashStr(b.slug + "hrs");
  if (h % 4 === 0) return "Open 24 hours";
  const open = 8 + (h % 3); // 8–10
  const close = 21 + (h % 3); // 9–11 PM
  return `Daily · ${fmtHour(open)} – ${fmtHour(close)}`;
}

export function ratingValue(b: Pick<Booth, "slug" | "rating">): number {
  if (typeof b.rating === "number") return b.rating;
  return (42 + (hashStr(b.slug + "rat") % 8)) / 10; // 4.2–4.9
}

export function reviewCount(b: Pick<Booth, "slug" | "reviews">): number {
  if (typeof b.reviews === "number") return b.reviews;
  return 24 + (hashStr(b.slug + "rev") % 260);
}

export function queueLabel(b: Slugged): string {
  return ["No wait", "~5 min wait", "~10 min wait", "~15 min wait"][
    hashStr(b.slug + "q") % 4
  ];
}

export function paymentLabel(b: Pick<Booth, "slug" | "payment">): string {
  if (b.payment) return b.payment;
  return ["Card & cash", "Card only", "Cash only"][hashStr(b.slug + "pay") % 3];
}
