import { NextResponse } from "next/server";
import { getPublishedBooths, createBooth, updateBooth } from "@/lib/booths";
import { geocode } from "@/lib/geocode";
import type { Borough, BoothType } from "@/lib/types";

const BOROUGHS: Borough[] = ["Manhattan", "Brooklyn", "Queens"];
const TYPES: BoothType[] = ["analog", "digital", "dedicated"];

const str = (v: unknown) => (v == null ? undefined : String(v).trim() || undefined);

export async function GET() {
  const booths = await getPublishedBooths();
  return NextResponse.json({ booths });
}

// Add a booth — publishes immediately.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const name = str(body.name);
  const address = str(body.address);
  const borough = body.borough as Borough;
  const type = body.type as BoothType;

  if (!name || !address || !BOROUGHS.includes(borough) || !TYPES.includes(type)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const coords = await geocode(`${address}, ${borough}, New York, NY`);
  if (!coords) {
    return NextResponse.json({ error: "Could not find that address" }, { status: 422 });
  }

  const condition =
    body.condition === "working" || body.condition === "broken"
      ? body.condition
      : undefined;

  await createBooth({
    name,
    address,
    borough,
    type,
    price: str(body.price),
    hours: str(body.hours),
    payment: str(body.payment),
    condition,
    note: str(body.note),
    ...coords,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Edit a booth's crowdsourced fields — applies immediately.
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = str(body?.slug);
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const ok = await updateBooth(slug, {
    price: str(body.price),
    hours: str(body.hours),
    payment: str(body.payment),
    condition: str(body.condition),
    note: str(body.note),
  });
  if (!ok) return NextResponse.json({ error: "Booth not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
