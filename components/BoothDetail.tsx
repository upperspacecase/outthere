"use client";

import { useEffect } from "react";
import type { Booth } from "@/lib/types";
import {
  markerColor,
  badgeLabel,
  directionsUrl,
  CONDITION_LABEL,
  priceLabel,
  paymentLabel,
  distanceMiles,
  formatMiles,
  type LatLng,
} from "@/lib/display";
import {
  PinIcon,
  ClockIcon,
  CardIcon,
  BookmarkIcon,
  CompassIcon,
} from "./icons";

export default function BoothDetail({
  booth: b,
  userLoc,
  saved,
  onToggleSave,
  onEdit,
  onClose,
}: {
  booth: Booth;
  userLoc: LatLng | null;
  saved: boolean;
  onToggleSave: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const color = markerColor(b);
  const payment = paymentLabel(b);
  const place = b.address ?? (b.hood ? `${b.hood}, ${b.borough}` : b.borough);
  const initial = b.name.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase();

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail" onClick={(e) => e.stopPropagation()}>
        <div
          className="detail-hero"
          style={
            b.photos?.[0]
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(20,25,35,0) 55%, rgba(20,25,35,0.4)), url(${b.photos[0]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { background: `linear-gradient(150deg, ${color}33, ${color}66)` }
          }
        >
          <button className="detail-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          {!b.photos?.[0] && (
            <div className="hero-frames">
              {[0, 1, 2].map((i) => (
                <span key={i} className="hero-frame" style={{ color }}>
                  {initial || "📷"}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="detail-body">
          <h2 className="detail-name">{b.name}</h2>

          <div className="detail-tags">
            <span className="type-tag" style={{ background: `${color}1f`, color }}>
              {badgeLabel(b)}
            </span>
            {b.sources && <span className="tag-muted">Crowdsourced</span>}
            {b.condition && (
              <span className={`cond cond-${b.condition}`}>
                {CONDITION_LABEL[b.condition]}
              </span>
            )}
          </div>

          <div className="detail-rows">
            <div className="drow">
              <PinIcon className="drow-ico" />
              <div>
                <div className="drow-main">{place}</div>
                <div className="drow-sub">
                  {b.address && b.hood ? `${b.hood} · ${b.borough}` : b.borough}
                  {userLoc && ` · ${formatMiles(distanceMiles(userLoc, b))} away`}
                </div>
              </div>
            </div>
            <div className="drow">
              <ClockIcon className="drow-ico" />
              <div>
                <div className="drow-main">{b.hours ?? "Hours not listed"}</div>
                {!b.hours && (
                  <div className="drow-sub">Know them? Tap Update to add.</div>
                )}
              </div>
            </div>
            <div className="drow">
              <CardIcon className="drow-ico" />
              <div>
                <div className="drow-main">{priceLabel(b) ?? "Price not listed"}</div>
                {payment && <div className="drow-sub">{payment}</div>}
              </div>
            </div>
          </div>

          {b.note && <p className="detail-note">{b.note}</p>}
          {b.sources && <p className="detail-src">Listed by {b.sources}</p>}

          <div className="detail-actions">
            <a
              className="btn-primary"
              href={directionsUrl(b.lat, b.lng)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <CompassIcon /> Directions
            </a>
            <button
              className={`btn-save${saved ? " active" : ""}`}
              onClick={onToggleSave}
            >
              <BookmarkIcon filled={saved} /> {saved ? "Saved" : "Save"}
            </button>
          </div>

          <button className="detail-edit" onClick={onEdit}>
            Update this booth — anyone can edit
          </button>
        </div>
      </div>
    </div>
  );
}
