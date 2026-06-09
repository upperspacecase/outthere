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
} from "@/lib/display";

const BOROUGHS: (Borough | "all")[] = ["all", "Manhattan", "Brooklyn", "Queens"];

const TYPE_PILLS: { key: EffectiveType; label: string }[] = [
  { key: "analog", label: "Analog" },
  { key: "dedicated", label: "Booth shop" },
  { key: "digital", label: "Digital" },
  { key: "verify", label: "Check first" },
];

export default function MapExplorer({ booths }: { booths: Booth[] }) {
  const [boro, setBoro] = useState<Borough | "all">("all");
  const [types, setTypes] = useState<Record<EffectiveType, boolean>>({
    analog: true,
    digital: true,
    dedicated: true,
    verify: true,
  });
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return booths.filter((b) => {
      if (boro !== "all" && b.borough !== boro) return false;
      if (!types[effectiveType(b)]) return false;
      if (needle) {
        const hay = `${b.name} ${b.hood ?? ""} ${b.borough}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [booths, boro, types, q]);

  function toggleType(t: EffectiveType) {
    setTypes((prev) => ({ ...prev, [t]: !prev[t] }));
  }

  return (
    <>
      <header>
        <div className="perf" />
        <div className="head-inner">
          <div>
            <p className="eyebrow">Out There · Maps for real-life moments</p>
            <h1>
              NYC Photo&nbsp;Booth <span className="strip">Map</span>
            </h1>
            <div className="sub">
              Fixed analog &amp; vintage booths you can actually visit — a
              crowdsourced guide merged &amp; de-duped from Booth Beacon, Classic
              Photo Booth, Soho Grand, Marked &amp; Photobooth.net. Tap a pin or
              card for details.
            </div>
          </div>
          <div className="count-badge">
            <b>{filtered.length}</b>
            <span>booths mapped</span>
          </div>
        </div>
        <div className="perf" />
      </header>

      <div className="controls">
        <div className="grp">
          <span className="grp-label">Borough</span>
          {BOROUGHS.map((b) => (
            <button
              key={b}
              className={`pill boro${boro === b ? " active" : ""}`}
              onClick={() => setBoro(b)}
            >
              {b === "all" ? "All" : b}
            </button>
          ))}
        </div>

        <div className="grp">
          <span className="grp-label">Type</span>
          {TYPE_PILLS.map(({ key, label }) => (
            <button
              key={key}
              className={`pill type${types[key] ? " active" : ""}`}
              data-on={types[key] ? "true" : "false"}
              onClick={() => toggleType(key)}
            >
              <span className="dot" style={{ background: COLORS[key] }} />
              {label}
            </button>
          ))}
        </div>

        <div className="grp search">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or neighborhood…"
          />
        </div>

        <button className="add-btn" onClick={() => setShowSubmit(true)}>
          ＋ Add a booth
        </button>
      </div>

      <div className="stage">
        <div id="list">
          {filtered.length === 0 ? (
            <div className="empty">No booths match these filters.</div>
          ) : (
            filtered.map((b) => (
              <button
                key={b.slug}
                className={`card${selected === b.slug ? " sel" : ""}`}
                onClick={() => setSelected(b.slug)}
              >
                <h3>{b.name}</h3>
                <div className="meta">
                  <span className="tag" style={{ background: markerColor(b) }}>
                    {badgeLabel(b)}
                  </span>
                  <span>
                    {b.hood ? `${b.hood} · ${b.borough}` : b.borough}
                  </span>
                  {b.price && <span className="price">{b.price}</span>}
                </div>
                {b.note && <div className="note">{b.note}</div>}
              </button>
            ))
          )}
        </div>
        <BoothMap booths={filtered} selected={selected} onSelect={setSelected} />
      </div>

      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}
    </>
  );
}
