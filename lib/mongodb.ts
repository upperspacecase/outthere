import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "outthere";

// Cache the client across hot reloads in dev and across lambda invocations in prod.
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (clientPromise) return clientPromise;

  const globalForMongo = globalThis as typeof globalThis & {
    _outThereMongo?: Promise<MongoClient>;
  };

  clientPromise =
    globalForMongo._outThereMongo ??
    new MongoClient(uri, { ignoreUndefined: true }).connect();
  if (process.env.NODE_ENV !== "production") {
    globalForMongo._outThereMongo = clientPromise;
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}
