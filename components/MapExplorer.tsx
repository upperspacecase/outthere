"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BoothMap from "./BoothMap";
import BoothForm from "./BoothForm";
import BoothDetail from "./BoothDetail";
import PreviewCard from "./PreviewCard";
import { CompassIcon, BookmarkIcon, PlusIcon, ListIcon, MapIcon } from "./icons";
import type { Booth } from "@/lib/types";
import {
  markerColor,
  badgeLabel,
  directionsUrl,
  CONDITION_LABEL,
  priceLabel,
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
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);

  const [priceTier, setPriceTier] = useState<PriceTier>("any");
  const [distance, setDistance] = useState<Dist>("any");

  const [mobileView, setMobileView] = useState<MobileView>("map");
  const [navTab, setNavTab] = useState<NavTab>("explore");
  const [selected, setSelected] = useState<string | null>(null);
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
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
  }, [booths, priceTier, distance, navTab, saved, userLoc]);

  const detailBooth = detailSlug
    ? booths.find((b) => b.slug === detailSlug) ?? null
    : null;
  const editBooth = editSlug
    ? booths.find((b) => b.slug === editSlug) ?? null
    : null;
  const previewBooth = selected
    ? filtered.find((b) => b.slug === selected) ?? null
    : null;

  function openDetail(slug: string) {
    setSelected(slug);
    setDetailSlug(slug);
  }

  // One compact filter bar (dropdowns), reused on both the list and the map.
  const filterBar = (
    <div className="filter-bar">
      <select
        className="dd"
        aria-label="Filter by price"
        value={priceTier}
        onChange={(e) => setPriceTier(e.target.value as PriceTier)}
      >
        {PRICE_OPTS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="dd"
        aria-label="Filter by distance"
        value={distance}
        onChange={(e) => pickDistance(e.target.value as Dist)}
      >
        {DIST_OPTS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
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

  return (
    <>
      <header className="topbar">
        <h1>
          NYC Photo Booth <span className="accent-word">Map</span>
        </h1>
        <p className="subtitle">The real world is out there.</p>
      </header>

    <div className="app" data-view={mobileView}>
      <aside className="panel">
        <div className="filters">{filterBar}</div>

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
            <button className="link" onClick={() => setShowAdd(true)}>
              Submit a booth
            </button>
          </span>
        </div>
      </aside>

      <div className="map-col">
        <div className="map-topbar">
          {filterBar}
          {viewToggle}
        </div>

        <BoothMap
          booths={filtered}
          selected={selected}
          onSelect={setSelected}
          onAddBooth={() => setShowAdd(true)}
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
        <button onClick={() => setShowAdd(true)}>
          <PlusIcon /> Submit
        </button>
      </nav>

      {detailBooth && (
        <BoothDetail
          booth={detailBooth}
          userLoc={userLoc}
          saved={saved.has(detailBooth.slug)}
          onToggleSave={() => toggleSave(detailBooth.slug)}
          onEdit={() => setEditSlug(detailBooth.slug)}
          onClose={() => setDetailSlug(null)}
        />
      )}

      {showAdd && (
        <BoothForm mode="add" onClose={() => setShowAdd(false)} onSaved={refresh} />
      )}
      {editBooth && (
        <BoothForm
          mode="edit"
          booth={editBooth}
          onClose={() => setEditSlug(null)}
          onSaved={refresh}
        />
      )}
    </div>
    </>
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
  let place = b.address ?? (b.hood ? `${b.hood}, ${b.borough}` : b.borough);
  if (userLoc) place += ` · ${formatMiles(distanceMiles(userLoc, b))}`;
  const initial = b.name.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase();
  return (
    <button className={`card${selected ? " sel" : ""}`} onClick={onSelect}>
      {b.photos?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="thumb thumb-img" src={b.photos[0]} alt={b.name} loading="lazy" />
      ) : (
        <span
          className="thumb"
          style={{
            background: `linear-gradient(135deg, ${color}22, ${color}44)`,
            color,
          }}
        >
          {initial || "📷"}
        </span>
      )}
      <span className="card-body">
        <span className="card-top">
          <span className="card-name">{b.name}</span>
          {b.condition && (
            <span className={`cond cond-${b.condition}`}>
              {CONDITION_LABEL[b.condition]}
            </span>
          )}
        </span>
        <span className="card-addr">{place}</span>
        <span className="type-tag" style={{ background: `${color}1f`, color }}>
          {badgeLabel(b)}
        </span>
        <span className="card-bottom">
          <span className="price-block">
            <span className="price-label">Price</span>
            <span className="price-val">{priceLabel(b) ?? "Not listed"}</span>
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
