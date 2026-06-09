"use client";

import { useEffect } from "react";
import type { Booth } from "@/lib/types";
import {
  markerColor,
  badgeLabel,
  directionsUrl,
  isOpenNow,
  hoursLabel,
  ratingValue,
  reviewCount,
  queueLabel,
  paymentLabel,
} from "@/lib/display";
import {
  PinIcon,
  ClockIcon,
  CardIcon,
  StarIcon,
  CheckIcon,
  BookmarkIcon,
  CompassIcon,
} from "./icons";

export default function BoothDetail({
  booth: b,
  saved,
  onToggleSave,
  onClose,
}: {
  booth: Booth;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const color = markerColor(b);
  const open = isOpenNow(b);
  const place = b.address ?? (b.hood ? `${b.hood}, ${b.borough}` : b.borough);
  const initial = b.name.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase();

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail" onClick={(e) => e.stopPropagation()}>
        <div
          className="detail-hero"
          style={{ background: `linear-gradient(150deg, ${color}33, ${color}66)` }}
        >
          <button className="detail-back" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <div className="hero-frames">
            {[0, 1, 2].map((i) => (
              <span key={i} className="hero-frame" style={{ color }}>
                {initial || "📷"}
              </span>
            ))}
          </div>
        </div>

        <div className="detail-body">
          <h2 className="detail-name">{b.name}</h2>

          <div className="detail-tags">
            <span className="type-tag" style={{ background: `${color}1f`, color }}>
              {badgeLabel(b)}
            </span>
            {b.sources && <span className="tag-muted">Crowdsourced</span>}
            <span className={`tag-status ${open ? "is-open" : "is-closed"}`}>
              {open ? "Open now" : "Closed"}
            </span>
          </div>

          <div className="detail-rows">
            <div className="drow">
              <PinIcon className="drow-ico" />
              <div>
                <div className="drow-main">{place}</div>
                {b.address && b.hood && (
                  <div className="drow-sub">
                    {b.hood} · {b.borough}
                  </div>
                )}
              </div>
            </div>
            <div className="drow">
              <ClockIcon className="drow-ico" />
              <div>
                <div className="drow-main">{hoursLabel(b)}</div>
                <div className={`drow-sub ${open ? "open" : "closed"}`}>
                  {open ? "Open now" : "Closed now"}
                </div>
              </div>
            </div>
            <div className="drow">
              <CardIcon className="drow-ico" />
              <div>
                <div className="drow-main">{b.price ?? "Free"}</div>
                <div className="drow-sub">{paymentLabel(b)}</div>
              </div>
            </div>
            <div className="drow">
              <StarIcon className="drow-ico star" />
              <div>
                <div className="drow-main">
                  {ratingValue(b).toFixed(1)}{" "}
                  <span className="drow-sub-inline">
                    · {reviewCount(b)} reviews
                  </span>
                </div>
                <div className="drow-sub">{queueLabel(b)}</div>
              </div>
            </div>
          </div>

          {b.note && <p className="detail-note">{b.note}</p>}
          {b.sources && (
            <p className="detail-src">Listed by {b.sources}</p>
          )}

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

          <div className="detail-verified">
            <CheckIcon /> Verified recently
          </div>
        </div>
      </div>
    </div>
  );
}
