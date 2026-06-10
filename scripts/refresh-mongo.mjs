// Upsert the published booths from data/booths.json into Mongo (by slug), so
// data changes (e.g. added photos) propagate to an already-seeded collection.
// The app only auto-seeds when the collection is empty, so run this after
// editing data/booths.json:  MONGODB_URI="<uri>" node scripts/refresh-mongo.mjs
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required (pass via env, never argv)");
  process.exit(1);
}
const dbName = process.env.MONGODB_DB || "outthere";
const booths = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "booths.json"), "utf8"),
);

const client = new MongoClient(uri);
await client.connect();
const col = client.db(dbName).collection("booths");
await col.createIndex({ slug: 1 }, { unique: true }).catch(() => {});
let n = 0;
for (const b of booths) {
  await col.updateOne({ slug: b.slug }, { $set: b }, { upsert: true });
  n++;
}
const withPhotos = await col.countDocuments({ photos: { $exists: true } });
console.log(`upserted ${n} booths; ${withPhotos} now have photos`);
await client.close();
