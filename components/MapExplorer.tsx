"use client";

import { useMemo, useState } from "react";
import BoothMap from "./BoothMap";
import SubmitModal from "./SubmitModal";
import type { Booth, Borough } from "@/lib/types";
import {
  COLORS,
  type EffectiveType,
  effectiveType,
  markerColor,
  badgeLabel,
  directionsUrl,
} from "@/lib/display";

const BOROUGHS: (Borough | "all")[] = ["all", "Manhattan", "Brooklyn", "Queens"];

const TYPE_PILLS: { key: EffectiveType; label: string }[] = [
  { key: "analog", label: "Analog film" },
  { key: "digital", label: "Digital" },
  { key: "dedicated", label: "Booth shop" },
];

type Tab = "crowdsourced" | "updated";

export default function MapExplorer({ booths }: { booths: Booth[] }) {
  const [boro, setBoro] = useState<Borough | "all">("all");
  const [types, setTypes] = useState<Record<EffectiveType, boolean>>({
    analog: true,
    digital: true,
    dedicated: true,
    verify: true,
  });
  const [tab, setTab] = useState<Tab>("crowdsourced");
  const [selected, setSelected] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);

  const filtered = useMemo(() => {
    const list = booths.filter((b) => {
      if (boro !== "all" && b.borough !== boro) return false;
      if (!types[effectiveType(b)]) return false;
      return true;
    });
    if (tab === "updated") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [booths, boro, types, tab]);

  function toggleType(t: EffectiveType) {
    setTypes((prev) => ({ ...prev, [t]: !prev[t] }));
  }

  return (
    <div className="app">
      <aside className="panel">
        <div className="panel-head">
          <h1>
            NYC Photo Booth <span className="accent-word">Map</span>
          </h1>
          <p className="subtitle">
            {booths.length} real, visitable photo booths across Manhattan,
            Brooklyn, and Queens.
          </p>
          <div className="tabs">
            <button
              className={`tab${tab === "crowdsourced" ? " active" : ""}`}
              onClick={() => setTab("crowdsourced")}
            >
              Crowdsourced
            </button>
            <button
              className={`tab${tab === "updated" ? " active" : ""}`}
              onClick={() => setTab("updated")}
            >
              Community updated
            </button>
          </div>
        </div>

        <div className="filters">
          <div className="filter-row">
            <span className="filter-label">Filter by borough</span>
            <div className="pills">
              {BOROUGHS.map((b) => (
                <button
                  key={b}
                  className={`pill${boro === b ? " active" : ""}`}
                  onClick={() => setBoro(b)}
                >
                  {b === "all" ? "All" : b}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <span className="filter-label">Filter by type</span>
            <div className="pills">
              {TYPE_PILLS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`pill type${types[key] ? " on" : " off"}`}
                  onClick={() => toggleType(key)}
                >
                  <span className="dot" style={{ background: COLORS[key] }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div id="list">
          {filtered.length === 0 ? (
            <div className="empty">No booths match these filters.</div>
          ) : (
            filtered.map((b) => <BoothCard key={b.slug} booth={b} selected={selected === b.slug} onSelect={() => setSelected(b.slug)} />)
          )}
        </div>

        <div className="panel-foot">
          <span className="foot-count">{filtered.length} booths mapped</span>
          <span className="foot-cta">
            Have a photo booth to share?{" "}
            <button className="link" onClick={() => setShowSubmit(true)}>
              Submit a booth
            </button>
          </span>
        </div>
      </aside>

      <BoothMap
        booths={filtered}
        selected={selected}
        onSelect={setSelected}
        onAddBooth={() => setShowSubmit(true)}
      />

      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}
    </div>
  );
}

function BoothCard({
  booth: b,
  selected,
  onSelect,
}: {
  booth: Booth;
  selected: boolean;
  onSelect: () => void;
}) {
  const color = markerColor(b);
  const place = b.address ?? (b.hood ? `${b.hood}, ${b.borough}` : b.borough);
  const initial = b.name.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase();
  return (
    <button className={`card${selected ? " sel" : ""}`} onClick={onSelect}>
      <span
        className="thumb"
        style={{
          background: `linear-gradient(135deg, ${color}22, ${color}44)`,
          color,
        }}
      >
        {initial || "📷"}
      </span>
      <span className="card-body">
        <span className="card-top">
          <span className="card-name">{b.name}</span>
          <span className="open-now">
            <span className="open-dot" /> Open now
          </span>
        </span>
        <span className="card-addr">{place}</span>
        <span
          className="type-tag"
          style={{ background: `${color}1f`, color }}
        >
          {badgeLabel(b)}
        </span>
        <span className="card-bottom">
          <span className="price-block">
            <span className="price-label">Price</span>
            <span className="price-val">{b.price ?? "Free"}</span>
          </span>
          <a
            className="directions"
            href={directionsUrl(b.lat, b.lng)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Directions ↗
          </a>
        </span>
      </span>
    </button>
  );
}
