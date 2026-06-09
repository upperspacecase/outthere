export type Borough = "Manhattan" | "Brooklyn" | "Queens";

// Base booth types. `verify` (below) overrides styling to the grey "Check first"
// treatment for uncertain / seasonal listings.
export type BoothType = "analog" | "digital" | "dedicated";

// "category" is the forward-looking field: today every place is a photo booth,
// but Out There will add date-routes, museums, etc. as new categories later.
export interface Booth {
  slug: string;
  name: string;
  hood?: string; // neighborhood
  borough: Borough;
  lat: number;
  lng: number;
  category: "photo-booth";
  type: BoothType;
  verify?: boolean; // uncertain / seasonal — render as "Check first"
  price?: string;
  note?: string;
  sources?: string; // provenance, e.g. "Booth Beacon · Marked"
  address?: string; // optional; community submissions provide one
  // Optional real metadata. When absent the UI falls back to deterministic
  // sample values (see lib/display.ts) so the prototype matches the design.
  hours?: string;
  payment?: string;
  rating?: number;
  reviews?: number;
  photos?: string[];
  status: "published" | "pending"; // crowdsourced submissions start "pending"
}
