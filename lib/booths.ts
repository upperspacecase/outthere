import seed from "@/data/booths.json";
import type { Booth, Borough, BoothType } from "./types";
import { getDb } from "./mongodb";

const COLLECTION = "booths";
const seedBooths = seed as Booth[];

async function collection() {
  const db = await getDb();
  const col = db.collection<Booth>(COLLECTION);
  if ((await col.estimatedDocumentCount()) === 0) {
    // Self-provision: seed the collection from the bundled real data on first run.
    await col.createIndex({ slug: 1 }, { unique: true });
    await col.insertMany(seedBooths, { ordered: false }).catch(() => {});
  }
  return col;
}

export async function getPublishedBooths(): Promise<Booth[]> {
  try {
    const col = await collection();
    return await col
      .find({ status: "published" }, { projection: { _id: 0 } })
      .sort({ borough: 1, name: 1 })
      .toArray();
  } catch (err) {
    // If Mongo is unreachable, still render the map from bundled real data.
    console.error("[booths] using bundled data:", (err as Error).message);
    return seedBooths.filter((b) => b.status === "published");
  }
}

const clean = (s?: string) => {
  const t = s?.trim();
  return t ? t : undefined;
};

export type BoothInput = {
  name: string;
  address: string;
  borough: Borough;
  type: BoothType;
  price?: string;
  hours?: string;
  payment?: string;
  condition?: "working" | "broken";
  note?: string;
  lat: number;
  lng: number;
};

// Anyone can add a booth — it publishes immediately (no moderation).
export async function createBooth(input: BoothInput): Promise<void> {
  const col = await collection();
  const slug =
    `community-${input.name}-${input.address}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `community-${input.lat}-${input.lng}`;
  await col.updateOne(
    { slug },
    {
      $set: {
        slug,
        name: input.name.trim(),
        address: input.address.trim(),
        hood: clean(input.address),
        borough: input.borough,
        lat: input.lat,
        lng: input.lng,
        category: "photo-booth",
        type: input.type,
        price: clean(input.price),
        hours: clean(input.hours),
        payment: clean(input.payment),
        condition: input.condition,
        note: clean(input.note),
        sources: "Community",
        status: "published",
      } satisfies Booth,
    },
    { upsert: true },
  );
}

export type BoothEdit = {
  price?: string;
  hours?: string;
  payment?: string;
  condition?: string;
  note?: string;
};

// Anyone can edit a booth's crowdsourced fields — applies immediately.
export async function updateBooth(slug: string, edit: BoothEdit): Promise<boolean> {
  const col = await collection();
  const set: Record<string, string> = {};
  const unset: Record<string, "" > = {};
  for (const key of ["price", "hours", "payment", "note"] as const) {
    const v = edit[key]?.trim();
    if (v) set[key] = v;
    else unset[key] = "";
  }
  if (edit.condition === "working" || edit.condition === "broken") {
    set.condition = edit.condition;
  } else {
    unset.condition = "";
  }
  const update: Record<string, unknown> = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;
  if (!Object.keys(update).length) return true;
  const res = await col.updateOne({ slug, status: "published" }, update);
  return res.matchedCount > 0;
}
