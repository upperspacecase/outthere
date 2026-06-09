"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Booth } from "@/lib/types";
import { COLORS, markerColor, type LatLng } from "@/lib/display";

/* Leaflet is loaded dynamically (client only); keep its refs loose. */
/* eslint-disable @typescript-eslint/no-explicit-any */

const DEFAULT_CENTER: [number, number] = [40.71, -73.93];
const DEFAULT_ZOOM = 11;

function pinSvg(color: string, dashed: boolean): string {
  const ring = dashed
    ? `<circle cx="14" cy="13" r="4.5" fill="#fff" stroke="${color}" stroke-width="2" stroke-dasharray="2 2"/>`
    : `<circle cx="14" cy="13" r="4.5" fill="#fff"/>`;
  return `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.27 0 0 6.13 0 13.7 0 23.3 14 38 14 38s14-14.7 14-24.3C28 6.13 21.73 0 14 0z" fill="${color}"/>
    ${ring}
  </svg>`;
}

export default function BoothMap({
  booths,
  selected,
  onSelect,
  onAddBooth,
  userLoc,
  locating,
  locError,
  onLocate,
}: {
  booths: Booth[];
  selected: string | null;
  onSelect: (slug: string) => void;
  onAddBooth: () => void;
  userLoc: LatLng | null;
  locating: boolean;
  locError: string | null;
  onLocate: () => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const LRef = useRef<any>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const userMarkerRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  const [ready, setReady] = useState(false);

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(elRef.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap &copy; CARTO",
        },
      ).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      // Leaflet renders wrong when its container starts hidden (mobile List
      // view) or resizes — refresh on every size change.
      if (typeof ResizeObserver !== "undefined" && elRef.current) {
        const ro = new ResizeObserver(() => map.invalidateSize());
        ro.observe(elRef.current);
        roRef.current = ro;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
      roRef.current?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Redraw markers whenever the filtered set changes.
  useEffect(() => {
    const L = LRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    const markers: Record<string, any> = {};
    booths.forEach((b) => {
      const icon = L.divIcon({
        className: "pin-icon",
        html: pinSvg(markerColor(b), !!b.verify),
        iconSize: [28, 38],
        iconAnchor: [14, 38],
        popupAnchor: [0, -34],
      });
      markers[b.slug] = L.marker([b.lat, b.lng], { icon })
        .addTo(layer)
        .on("click", () => onSelectRef.current(b.slug));
    });
    markersRef.current = markers;
  }, [booths, ready]);

  // Fly to the selected booth.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    // Skip when the map is hidden (mobile List view) — projecting on a
    // zero-size container yields NaN and throws.
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return;
    const marker = markersRef.current[selected];
    if (marker) {
      map.flyTo(marker.getLatLng(), 15, { duration: 0.6 });
    }
  }, [selected]);

  function recenter() {
    mapRef.current?.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.6 });
  }

  // Drop / move the "you are here" dot and fly to it whenever the shared
  // location (from the Near me button or the distance filter) updates.
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map || !userLoc) return;
    const latlng: [number, number] = [userLoc.lat, userLoc.lng];
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(latlng);
    } else {
      const icon = L.divIcon({
        className: "user-loc",
        html: `<div class="user-dot"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      userMarkerRef.current = L.marker(latlng, {
        icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 1000,
      }).addTo(map);
    }
    const size = map.getSize();
    if (size.x > 0 && size.y > 0) map.flyTo(latlng, 14, { duration: 0.8 });
  }, [userLoc, ready]);

  return (
    <div className="map-wrap">
      <div id="map" ref={elRef} />

      <button className="map-submit" onClick={onAddBooth}>
        <span className="cam">📷</span> Submit a booth
      </button>

      <div className="map-badge">
        <span className="map-badge-count">📍 {booths.length} booths</span>
        <span className="map-badge-sub">Community updated</span>
      </div>

      <div className="map-legend">
        <div className="legend-row">
          <span className="legend-dot" style={{ background: COLORS.analog }} />
          Analog film
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: COLORS.digital }} />
          Digital
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: COLORS.dedicated }} />
          Booth shop
        </div>
        <div className="legend-foot">Real booths, mapped by real people.</div>
      </div>

      {locError && <div className="map-toast">{locError}</div>}

      <div className="map-controls">
        <button
          className="map-pill"
          onClick={onLocate}
          disabled={locating}
          aria-label="Find my location"
        >
          <span className="ctrl-icon">◎</span>
          {locating ? "Locating…" : "Near me"}
        </button>
        <button className="map-pill" onClick={recenter}>
          <span className="ctrl-icon">⌖</span> Re-center
        </button>
      </div>
    </div>
  );
}
