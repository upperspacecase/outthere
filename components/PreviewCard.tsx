"use client";

import type { Booth } from "@/lib/types";
import {
  markerColor,
  badgeLabel,
  directionsUrl,
  isOpenNow,
  ratingValue,
  distanceMiles,
  formatMiles,
  type LatLng,
} from "@/lib/display";
import { StarIcon, CompassIcon } from "./icons";

export default function PreviewCard({
  booth: b,
  userLoc,
  onOpen,
  onClose,
}: {
  booth: Booth;
  userLoc: LatLng | null;
  onOpen: () => void;
  onClose: () => void;
}) {
  const color = markerColor(b);
  const open = isOpenNow(b);
  let place = b.address ?? (b.hood ? `${b.hood}, ${b.borough}` : b.borough);
  if (userLoc) place += ` · ${formatMiles(distanceMiles(userLoc, b))}`;
  const initial = b.name.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase();

  return (
    <div className="preview-card">
      <button className="preview-close" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
      <button className="preview-main" onClick={onOpen}>
        <span
          className="thumb"
          style={{
            background: `linear-gradient(135deg, ${color}22, ${color}44)`,
            color,
          }}
        >
          {initial || "📷"}
        </span>
        <span className="preview-body">
          <span className="preview-name">{b.name}</span>
          <span className="preview-addr">{place}</span>
          <span className="preview-meta">
            <span className="type-tag" style={{ background: `${color}1f`, color }}>
              {badgeLabel(b)}
            </span>
            <span className="preview-rating">
              <StarIcon className="prev-star" /> {ratingValue(b).toFixed(1)}
            </span>
            {b.price && <span className="preview-price">{b.price}</span>}
            <span className={`preview-open ${open ? "open" : "closed"}`}>
              {open ? "Open" : "Closed"}
            </span>
          </span>
        </span>
      </button>
      <a
        className="preview-dir"
        href={directionsUrl(b.lat, b.lng)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <CompassIcon /> Directions
      </a>
    </div>
  );
}
