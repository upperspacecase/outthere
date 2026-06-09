import MapExplorer from "@/components/MapExplorer";
import { getPublishedBooths } from "@/lib/booths";

export const dynamic = "force-dynamic";

export default async function Home() {
  const booths = await getPublishedBooths();
  return <MapExplorer booths={booths} />;
}
