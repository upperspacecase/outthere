import { NextResponse } from "next/server";
import { getPublishedBooths, createSubmission } from "@/lib/booths";
import { geocode } from "@/lib/geocode";
import type { Borough, BoothType } from "@/lib/types";

const BOROUGHS: Borough[] = ["Manhattan", "Brooklyn", "Queens"];
const TYPES: BoothType[] = ["analog", "digital", "dedicated"];

export async function GET() {
  const booths = await getPublishedBooths();
  return NextResponse.json({ booths });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const address = String(body.address ?? "").trim();
  const borough = body.borough as Borough;
  const type = body.type as BoothType;
  const price = body.price ? String(body.price).trim() : undefined;
  const note = body.note ? String(body.note).trim() : undefined;

  if (!name || !address || !BOROUGHS.includes(borough) || !TYPES.includes(type)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const coords = await geocode(`${address}, ${borough}, New York, NY`);
  if (!coords) {
    return NextResponse.json(
      { error: "Could not find that address" },
      { status: 422 },
    );
  }

  await createSubmission({ name, address, borough, type, price, note, ...coords });
  return NextResponse.json({ ok: true }, { status: 201 });
}
