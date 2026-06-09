"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BoothMap from "./BoothMap";
import SubmitModal from "./SubmitModal";
import BoothDetail from "./BoothDetail";
import PreviewCard from "./PreviewCard";
import { CompassIcon, BookmarkIcon, PlusIcon, ListIcon, MapIcon } from "./icons";
import type { Booth } from "@/lib/types";
import {
  markerColor,
  badgeLabel,
  directionsUrl,
  isOpenNow,
  matchesPriceTier,
  type PriceTier,
  type LatLng,
  distanceMiles,
  formatMiles,
} from "@/lib/display";

const PRICE_OPTS: { key: PriceTier; label: string }[] = [
  { key: "any", label: "Any price" },
  { key: "low", label: "Under $8" },
  { key: "mid", label: "$8–12" },
  { key: "high", label: "Over $12" },
];

type Dist = "any" | "1" | "3" | "5";
const DIST_OPTS: { key: Dist; label: string }[] = [
  { key: "any", label: "Any distance" },
  { key: "1", label: "≤ 1 mi" },
  { key: "3", label: "≤ 3 mi" },
  { key: "5", label: "≤ 5 mi" },
];
const DIST_LIMITS: Record<Exclude<Dist, "any">, number> = { "1": 1, "3": 3, "5": 5 };

type MobileView = "list" | "map";
type NavTab = "explore" | "saved";

const SAVED_KEY = "outthere:saved";

export default function MapExplorer({ booths }: { booths: Booth[] }) {
  const [priceTier, setPriceTier] = useState<PriceTier>("any");
  const [openOnly, setOpenOnly] = useState(false);
  const [distance, setDistance] = useState<Dist>("any");

  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [navTab, setNavTab] = useState<NavTab>("explore");
  const [selected, setSelected] = useState<string | null>(null);
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  // Shared geolocation (the Near me button and the distance filter both use it).
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate client-only storage after mount
      if (raw) setSaved(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!locError) return;
    const t = setTimeout(() => setLocError(null), 4000);
    return () => clearTimeout(t);
  }, [locError]);

  const requestLocation = useCallback(() => {
    setLocError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("Location isn't available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLocating(false);
        setDistance("any"); // can't filter by distance without a fix
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied."
            : "Couldn't get your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
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

  function pickDistance(key: Dist) {
    setDistance(key);
    if (key !== "any" && !userLoc) requestLocation();
  }

  const filtered = useMemo(() => {
    const list = booths.filter((b) => {
      if (navTab === "saved" && !saved.has(b.slug)) return false;
      if (openOnly && !isOpenNow(b)) return false;
      if (!matchesPriceTier(b, priceTier)) return false;
      if (distance !== "any" && userLoc) {
        if (distanceMiles(userLoc, b) > DIST_LIMITS[distance]) return false;
      }
      return true;
    });
    if (distance !== "any" && userLoc) {
      return [...list].sort(
        (a, b) => distanceMiles(userLoc, a) - distanceMiles(userLoc, b),
      );
    }
    return list;
  }, [booths, openOnly, priceTier, distance, navTab, saved, userLoc]);

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

  const pricePills = PRICE_OPTS.map((o) => (
    <button
      key={o.key}
      className={`pill${priceTier === o.key ? " active" : ""}`}
      onClick={() => setPriceTier(o.key)}
    >
      {o.label}
    </button>
  ));
  const distPills = DIST_OPTS.map((o) => (
    <button
      key={o.key}
      className={`pill${distance === o.key ? " active" : ""}`}
      onClick={() => pickDistance(o.key)}
    >
      {o.label}
    </button>
  ));
  const openPill = (
    <button
      className={`pill open-toggle${openOnly ? " on" : ""}`}
      onClick={() => setOpenOnly((v) => !v)}
    >
      <span className="open-dot-sm" /> Open now
    </button>
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
        </div>

        <div className="filters">
          <div className="filter-row">
            <span className="filter-label">Price</span>
            <div className="pills">{pricePills}</div>
          </div>
          <div className="filter-row">
            <span className="filter-label">Availability</span>
            <div className="pills">{openPill}</div>
          </div>
          <div className="filter-row">
            <span className="filter-label">Distance</span>
            <div className="pills">{distPills}</div>
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
                userLoc={userLoc}
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
          <div className="map-filter-bar">
            {openPill}
            {pricePills}
            {distPills}
          </div>
          {viewToggle}
        </div>

        <BoothMap
          booths={filtered}
          selected={selected}
          onSelect={setSelected}
          onAddBooth={() => setShowSubmit(true)}
          userLoc={userLoc}
          locating={locating}
          locError={locError}
          onLocate={requestLocation}
        />

        {previewBooth && (
          <PreviewCard
            booth={previewBooth}
            userLoc={userLoc}
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
          userLoc={userLoc}
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
  userLoc,
  selected,
  onSelect,
}: {
  booth: Booth;
  userLoc: LatLng | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const color = markerColor(b);
  const open = isOpenNow(b);
  let place = b.address ?? (b.hood ? `${b.hood}, ${b.borough}` : b.borough);
  if (userLoc) place += ` · ${formatMiles(distanceMiles(userLoc, b))}`;
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
