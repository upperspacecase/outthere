"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Booth } from "@/lib/types";
import { COLORS, markerColor, badgeLabel, directionsUrl } from "@/lib/display";

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

function popupHtml(b: Booth): string {
  const color = markerColor(b);
  return `<div class="pop">
    <h3>${esc(b.name)}</h3>
    <div class="meta">${esc(b.hood ? `${b.hood} · ${b.borough}` : b.borough)}</div>
    <span class="type-tag" style="background:${color}1f;color:${color}">${badgeLabel(b)}</span>
    ${b.price ? `<span class="pop-price">${esc(b.price)}</span>` : ""}
    ${b.note ? `<div class="note">${esc(b.note)}</div>` : ""}
    ${b.sources ? `<div class="src">Listed by ${esc(b.sources)}</div>` : ""}
    <a class="dir" href="${directionsUrl(b.lat, b.lng)}" target="_blank" rel="noopener">Directions ↗</a>
  </div>`;
}

export default function BoothMap({
  booths,
  selected,
  onSelect,
  onAddBooth,
}: {
  booths: Booth[];
  selected: string | null;
  onSelect: (slug: string) => void;
  onAddBooth: () => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const LRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

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
      setReady(true);
    })();
    return () => {
      cancelled = true;
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
        .bindPopup(popupHtml(b))
        .on("click", () => onSelectRef.current(b.slug));
    });
    markersRef.current = markers;
  }, [booths, ready]);

  // Fly to and open the selected booth.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    const marker = markersRef.current[selected];
    if (marker) {
      map.flyTo(marker.getLatLng(), 15, { duration: 0.6 });
      marker.openPopup();
    }
  }, [selected]);

  function recenter() {
    mapRef.current?.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.6 });
  }

  function locate() {
    setLocError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("Location isn't available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const L = LRef.current;
        const map = mapRef.current;
        if (!L || !map) return;
        const latlng: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
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
        map.flyTo(latlng, 14, { duration: 0.8 });
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied."
            : "Couldn't get your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  // Auto-dismiss the location error toast.
  useEffect(() => {
    if (!locError) return;
    const t = setTimeout(() => setLocError(null), 4000);
    return () => clearTimeout(t);
  }, [locError]);

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
          onClick={locate}
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

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
