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

export type BoothSubmission = {
  name: string;
  address: string;
  borough: Borough;
  type: BoothType;
  price?: string;
  note?: string;
  lat: number;
  lng: number;
};

export async function createSubmission(input: BoothSubmission): Promise<void> {
  const col = await collection();
  const slug = `submitted-${input.name}-${input.address}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  await col.updateOne(
    { slug },
    {
      $setOnInsert: {
        slug,
        name: input.name.trim(),
        address: input.address.trim(),
        hood: input.address.trim(),
        borough: input.borough,
        lat: input.lat,
        lng: input.lng,
        category: "photo-booth",
        type: input.type,
        price: input.price?.trim() || undefined,
        note: input.note?.trim() || undefined,
        sources: "Community submission",
        status: "pending",
      } satisfies Booth,
    },
    { upsert: true },
  );
}
