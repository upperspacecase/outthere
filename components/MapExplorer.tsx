"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BoothMap from "./BoothMap";
import SubmitModal from "./SubmitModal";
import BoothDetail from "./BoothDetail";
import PreviewCard from "./PreviewCard";
import { ListIcon, MapIcon, SearchIcon, CompassIcon, BookmarkIcon, PlusIcon } from "./icons";
import type { Booth, Borough } from "@/lib/types";
import {
  COLORS,
  type EffectiveType,
  effectiveType,
  markerColor,
  badgeLabel,
  directionsUrl,
  isOpenNow,
} from "@/lib/display";

const BOROUGHS: (Borough | "all")[] = ["all", "Manhattan", "Brooklyn", "Queens"];

const TYPE_PILLS: { key: EffectiveType; label: string }[] = [
  { key: "analog", label: "Analog film" },
  { key: "digital", label: "Digital" },
  { key: "dedicated", label: "Booth shop" },
];

type Tab = "crowdsourced" | "updated";
type MobileView = "list" | "map";
type NavTab = "explore" | "saved";

const SAVED_KEY = "outthere:saved";

export default function MapExplorer({ booths }: { booths: Booth[] }) {
  const [boro, setBoro] = useState<Borough | "all">("all");
  const [types, setTypes] = useState<Record<EffectiveType, boolean>>({
    analog: true,
    digital: true,
    dedicated: true,
    verify: true,
  });
  const [tab, setTab] = useState<Tab>("crowdsourced");
  const [q, setQ] = useState("");
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [navTab, setNavTab] = useState<NavTab>("explore");
  const [selected, setSelected] = useState<string | null>(null);
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  // Hydrate saved booths from localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate client-only storage after mount
      if (raw) setSaved(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSave = useCallback((slug: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = booths.filter((b) => {
      if (navTab === "saved" && !saved.has(b.slug)) return false;
      if (boro !== "all" && b.borough !== boro) return false;
      if (!types[effectiveType(b)]) return false;
      if (needle) {
        const hay = `${b.name} ${b.hood ?? ""} ${b.borough}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    if (tab === "updated") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [booths, boro, types, q, tab, navTab, saved]);

  const detailBooth = detailSlug
    ? booths.find((b) => b.slug === detailSlug) ?? null
    : null;
  const previewBooth = selected
    ? filtered.find((b) => b.slug === selected) ?? null
    : null;

  function openDetail(slug: string) {
    setSelected(slug);
    setDetailSlug(slug);
  }

  function toggleType(t: EffectiveType) {
    setTypes((prev) => ({ ...prev, [t]: !prev[t] }));
  }

  const typePills = (
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
  );

  const viewToggle = (
    <div className="view-toggle" role="tablist">
      <button
        className={mobileView === "list" ? "active" : ""}
        onClick={() => setMobileView("list")}
      >
        <ListIcon /> List
      </button>
      <button
        className={mobileView === "map" ? "active" : ""}
        onClick={() => setMobileView("map")}
      >
        <MapIcon /> Map
      </button>
    </div>
  );

  const searchField = (placeholder: string) => (
    <div className="search-bar">
      <SearchIcon className="search-ico" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
      />
      {q && (
        <button className="search-clear" onClick={() => setQ("")} aria-label="Clear">
          ×
        </button>
      )}
    </div>
  );

  return (
    <div className="app" data-view={mobileView}>
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

        <div className="panel-search">{searchField("Search booths or neighborhoods…")}</div>

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
            {typePills}
          </div>
        </div>

        {viewToggle}

        <div id="list">
          {navTab === "saved" && filtered.length === 0 ? (
            <div className="empty">
              No saved booths yet. Tap <b>Save</b> on a booth to keep it here.
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">No booths match these filters.</div>
          ) : (
            filtered.map((b) => (
              <BoothCard
                key={b.slug}
                booth={b}
                selected={selected === b.slug}
                onSelect={() => openDetail(b.slug)}
              />
            ))
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

      <div className="map-col">
        <div className="map-topbar">
          {searchField("Search this area")}
          <div className="map-type-pills">{typePills}</div>
          {viewToggle}
        </div>

        <BoothMap
          booths={filtered}
          selected={selected}
          onSelect={setSelected}
          onAddBooth={() => setShowSubmit(true)}
        />

        {previewBooth && (
          <PreviewCard
            booth={previewBooth}
            onOpen={() => openDetail(previewBooth.slug)}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      <nav className="bottom-nav">
        <button
          className={navTab === "explore" ? "active" : ""}
          onClick={() => setNavTab("explore")}
        >
          <CompassIcon /> Explore
        </button>
        <button
          className={navTab === "saved" ? "active" : ""}
          onClick={() => {
            setNavTab("saved");
            setMobileView("list");
          }}
        >
          <BookmarkIcon filled={navTab === "saved"} /> Saved
          {saved.size > 0 && <span className="nav-badge">{saved.size}</span>}
        </button>
        <button onClick={() => setShowSubmit(true)}>
          <PlusIcon /> Submit
        </button>
      </nav>

      {detailBooth && (
        <BoothDetail
          booth={detailBooth}
          saved={saved.has(detailBooth.slug)}
          onToggleSave={() => toggleSave(detailBooth.slug)}
          onClose={() => setDetailSlug(null)}
        />
      )}

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
  const open = isOpenNow(b);
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
          <span className={`open-now${open ? "" : " closed"}`}>
            <span className="open-dot" /> {open ? "Open now" : "Closed"}
          </span>
        </span>
        <span className="card-addr">{place}</span>
        <span className="type-tag" style={{ background: `${color}1f`, color }}>
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
