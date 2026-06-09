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
