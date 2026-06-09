"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Booth } from "@/lib/types";
import { markerColor, badgeLabel, directionsUrl } from "@/lib/display";

/* Leaflet is loaded dynamically (client only); keep its refs loose. */
/* eslint-disable @typescript-eslint/no-explicit-any */

function popupHtml(b: Booth): string {
  const color = markerColor(b);
  return `<div class="pop">
    <h3>${esc(b.name)}</h3>
    <div class="meta">${esc(b.hood ? `${b.hood} · ${b.borough}` : b.borough)}</div>
    <span class="tag" style="background:${color}">${badgeLabel(b)}</span>
    ${b.price ? `<span class="price" style="margin-left:6px">${esc(b.price)}</span>` : ""}
    ${b.note ? `<div class="note">${esc(b.note)}</div>` : ""}
    ${b.sources ? `<div class="src">Listed by: ${esc(b.sources)}</div>` : ""}
    <a class="dir" href="${directionsUrl(b.lat, b.lng)}" target="_blank" rel="noopener">Directions ↗</a>
  </div>`;
}

export default function BoothMap({
  booths,
  selected,
  onSelect,
}: {
  booths: Booth[];
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const LRef = useRef<any>(null);
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
      const map = L.map(elRef.current, { scrollWheelZoom: true }).setView(
        [40.725, -73.975],
        12,
      );
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      }).addTo(map);
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
        className: "",
        html: `<div class="pin ${b.verify ? "verify" : ""}" style="background:${markerColor(
          b,
        )}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
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

  return <div id="map" ref={elRef} />;
}

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
