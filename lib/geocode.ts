// OpenStreetMap Nominatim geocoder — no API key. Respect the 1 req/sec policy
// and send a descriptive User-Agent per their usage terms.
export async function geocode(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    query,
  )}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "OutThere/1.0 (https://outthere.club)" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
