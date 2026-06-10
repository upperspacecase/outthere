// Canonical seed for Out There: NYC Photo Booth Map.
// Data curated by Tay — merged & de-duped from Booth Beacon, Classic Photo Booth,
// Soho Grand, Marked & Photobooth.net. Coordinates are provided, not invented.
// Run: node scripts/build-data.mjs  ->  writes data/booths.json
import fs from "node:fs";
import path from "node:path";

// type = analog | digital | dedicated ; verify=true overrides marker styling (uncertain/seasonal)
const BOOTHS = [
 {n:"AUTOPHOTO",hood:"Lower East Side",boro:"Manhattan",lat:40.71951,lng:-73.98978,type:"dedicated",price:"$8–12/strip",note:"One venue housing ~7 distinct restored machines (incl. a rare color-chemistry & a Polaroid booth) — directories list each machine separately, but it's all 121 Orchard St. Free entry; pay per strip.",src:"Marked · Booth Beacon · Photobooth.net"},
 {n:"Old Friend Photobooth",hood:"Lower East Side",boro:"Manhattan",lat:40.7205176,lng:-73.990004,type:"analog",price:"$8.90/4",note:"Restored street booth, classic B&W strips. Starts ~3s after you pay — be ready. Lines get long.",src:"Marked · Booth Beacon"},
 {n:"SomethingSoft",hood:"Lower East Side",boro:"Manhattan",lat:40.7185047,lng:-73.9904101,type:"dedicated",price:"$6/strip",note:"Storefront on Allen St with one outdoor + three indoor booths. Cheaper than most; can turn strips into keychains.",src:"Booth Beacon"},
 {n:"Retrography",hood:"Lower East Side",boro:"Manhattan",lat:40.7151666,lng:-73.9901329,type:"dedicated",price:"$12/2 strips",note:"Spacious booth next to Scarr's Pizza — photo + video, gives you time to pose.",src:"Marked"},
 {n:"The Flower Shop",hood:"Lower East Side",boro:"Manhattan",lat:40.7181476,lng:-73.9922533,type:"analog",price:"—",note:"70s-inspired bar/bistro; booth tucked in the basement by the pool table.",src:"Marked"},
 {n:"The Ripple Room",hood:"Bowery",boro:"Manhattan",lat:40.7204451,lng:-73.9935856,type:"analog",price:"—",note:"Roomy two-floor bar, pool table on each level.",src:"Classic · Booth Beacon"},
 {n:"The Magician",hood:"Lower East Side",boro:"Manhattan",lat:40.7198461,lng:-73.9873253,type:"analog",price:"Free",note:"Dive bar with a free photo machine and a famous $6 happy hour.",src:"Booth Beacon"},
 {n:"Parkside Lounge",hood:"Lower East Side",boro:"Manhattan",lat:40.721024,lng:-73.983235,type:"analog",price:"—",note:"Live-music & comedy bar with a back room and pool table.",src:"Booth Beacon"},
 {n:"Niagara",hood:"East Village",boro:"Manhattan",lat:40.7259134,lng:-73.9834614,type:"digital",price:"—",note:"Alphabet City mainstay with the Joe Strummer mural. Booth is digital (borders galore).",src:"Soho Grand · Booth Beacon"},
 {n:"7B / Vazac's Horseshoe",hood:"East Village",boro:"Manhattan",lat:40.7250535,lng:-73.9814144,type:"analog",price:"—",note:"Classic Avenue B corner dive bar.",src:"Booth Beacon"},
 {n:"Otto's Shrunken Head",hood:"East Village",boro:"Manhattan",lat:40.7294629,lng:-73.9786985,type:"analog",price:"—",note:"Punk/rockabilly tiki bar with live bands and a back room.",src:"Booth Beacon"},
 {n:"HiFi Bar",hood:"East Village",boro:"Manhattan",lat:40.7284028,lng:-73.9823142,type:"analog",price:"$5 token",note:"Old-school (not digital) booth — grab a token from the bartender. Starts almost immediately.",src:"Booth Beacon"},
 {n:"The Smith — East Village",hood:"East Village",boro:"Manhattan",lat:40.7310104,lng:-73.9885813,type:"analog",price:"$5",note:"Booth in the basement by the bar.",src:"Booth Beacon"},
 {n:"Bubby's",hood:"Tribeca",boro:"Manhattan",lat:40.719819,lng:-74.0083829,type:"analog",price:"$7/4",note:"Vintage booth downstairs at the beloved pancake diner.",src:"Classic · Booth Beacon"},
 {n:"The Roxy Hotel",hood:"Tribeca",boro:"Manhattan",lat:40.719404,lng:-74.004902,type:"analog",price:"$12/3",note:"True vintage machine — deep sepia, grainy 70s-look strips. Worth the develop wait.",src:"Soho Grand · Booth Beacon"},
 {n:"Soho Diner (Soho Grand)",hood:"SoHo",boro:"Manhattan",lat:40.7219844,lng:-74.0043287,type:"analog",price:"—",note:"Newer B&W booth at the diner attached to the Soho Grand Hotel.",src:"Soho Grand · Booth Beacon"},
 {n:"The Folly",hood:"Greenwich Village",boro:"Manhattan",lat:40.7272629,lng:-74.0000069,type:"analog",price:"—",note:"Nautical-themed gastropub with a moody back room.",src:"Classic · Booth Beacon"},
 {n:"The Vintage Twin",hood:"SoHo",boro:"Manhattan",lat:40.7252053,lng:-73.9973104,type:"dedicated",verify:true,price:"—",note:"Vintage clothing store. Recent reviews say the booth may have been removed — call ahead.",src:"Classic · Booth Beacon"},
 {n:"Reformation SoHo",hood:"SoHo",boro:"Manhattan",lat:40.7229121,lng:-74.0007705,type:"dedicated",verify:true,price:"—",note:"Clothing store; booth presence varies by location — confirm before a special trip.",src:"Booth Beacon"},
 {n:"El Vez",hood:"Battery Park City",boro:"Manhattan",lat:40.7146485,lng:-74.0154318,type:"analog",price:"—",note:"Mexican restaurant/bar near Brookfield Place.",src:"Classic · Booth Beacon"},
 {n:"Ace Hotel",hood:"NoMad",boro:"Manhattan",lat:40.7457029,lng:-73.9883598,type:"analog",price:"$7.50",note:"Dark lobby booth with a signature patterned curtain — your own little world.",src:"Soho Grand · Booth Beacon"},
 {n:"The Smith — NoMad",hood:"NoMad",boro:"Manhattan",lat:40.7442419,lng:-73.9886085,type:"analog",price:"$5",note:"Booth downstairs near the bathrooms.",src:"Booth Beacon"},
 {n:"The Smith — Midtown East",hood:"Midtown East",boro:"Manhattan",lat:40.755202,lng:-73.967987,type:"analog",price:"—",note:"Brasserie booth, 2nd Ave.",src:"Booth Beacon"},
 {n:"The Smith — Lincoln Center",hood:"Upper West Side",boro:"Manhattan",lat:40.771502,lng:-73.9818907,type:"analog",price:"—",note:"Across from Lincoln Center — handy pre/post-theater.",src:"Booth Beacon"},
 {n:"Magic Hour Rooftop",hood:"Midtown (Moxy Times Sq)",boro:"Manhattan",lat:40.7524923,lng:-73.9893157,type:"analog",price:"—",note:"Rooftop bar with a cowboy-themed photo area at the Moxy Times Square.",src:"Booth Beacon"},
 {n:"Vlada Bar",hood:"Hell's Kitchen",boro:"Manhattan",lat:40.7636295,lng:-73.9868805,type:"analog",price:"—",note:"Two-floor Hell's Kitchen bar known for house-infused vodkas.",src:"Booth Beacon"},
 {n:"Rough Trade (30 Rock)",hood:"Midtown",boro:"Manhattan",lat:40.7592929,lng:-73.9795873,type:"analog",price:"$5",note:"Booth inside the record store on the Rockefeller Center concourse.",src:"Booth Beacon"},
 {n:"The Lodge at Bryant Park",hood:"Midtown",boro:"Manhattan",lat:40.7536,lng:-73.9832,type:"analog",verify:true,price:"$10",note:"Seasonal — part of Bryant Park's Winter Village. Typically only open in the colder months.",src:"Booth Beacon"},
 {n:"German Consulate",hood:"Midtown East",boro:"Manhattan",lat:40.7532179,lng:-73.9669837,type:"digital",price:"—",note:"Digital booth inside the consulate (mainly for official photos / weekday hours).",src:"Classic"},
 {n:"Whitney Museum of American Art",hood:"Meatpacking",boro:"Manhattan",lat:40.7395877,lng:-74.0088629,type:"analog",price:"$10",note:"B&W film booth inside the museum.",src:"Booth Beacon"},
 {n:"Union Pool",hood:"Williamsburg",boro:"Brooklyn",lat:40.7149712,lng:-73.9514538,type:"analog",price:"$5",note:"Popular B&W booth; quick develop. El Diablo taco truck in the backyard.",src:"Classic · Soho Grand · Booth Beacon"},
 {n:"Bushwick Country Club",hood:"Williamsburg",boro:"Brooklyn",lat:40.7110994,lng:-73.9477951,type:"analog",price:"—",note:"Dive bar with mini-golf out back, slushie machines and a booth.",src:"Classic"},
 {n:"Brooklyn Film Camera (Camera Store)",hood:"East Williamsburg",boro:"Brooklyn",lat:40.712425,lng:-73.939662,type:"dedicated",price:"—",note:"Film camera shop with a photo/Polaroid station; develops film too.",src:"Classic"},
 {n:"Twins Lounge",hood:"Greenpoint",boro:"Brooklyn",lat:40.7263177,lng:-73.9519866,type:"analog",price:"—",note:"Greenpoint dive — cash only, ATM inside.",src:"Classic"},
 {n:"Birdy's",hood:"Bushwick",boro:"Brooklyn",lat:40.6975567,lng:-73.9315018,type:"analog",price:"$5–7",note:"Dive bar; analog booth in the back room, rarely a wait. Foosball + pinball.",src:"Classic · Soho Grand · Booth Beacon"},
 {n:"Coyote Club",hood:"Bushwick",boro:"Brooklyn",lat:40.6886051,lng:-73.9418374,type:"analog",price:"—",note:"Quirky neighborhood dive, pinball, cash only.",src:"Classic"},
 {n:"Marco's",hood:"Bushwick",boro:"Brooklyn",lat:40.6947296,lng:-73.9309421,type:"analog",price:"—",note:"Easy-going bar with a patio.",src:"Classic"},
 {n:"Old Stanley's",hood:"Bushwick",boro:"Brooklyn",lat:40.7010028,lng:-73.9140111,type:"analog",price:"—",note:"Spacious wood-bar spot with a yard. Cash only.",src:"Classic"},
 {n:"Bootleg",hood:"Bushwick",boro:"Brooklyn",lat:40.6987447,lng:-73.9172199,type:"analog",price:"—",note:"True Bushwick dive with pool and a back patio.",src:"Classic"},
 {n:"Carousel",hood:"Bushwick",boro:"Brooklyn",lat:40.7058463,lng:-73.9221354,type:"analog",price:"—",note:"70s cocktail bar with a disco ball and a real film booth.",src:"Classic"},
 {n:"Carmelo's",hood:"Bushwick",boro:"Brooklyn",lat:40.7027604,lng:-73.9205215,type:"analog",price:"—",note:"Large two-floor dive with pool upstairs.",src:"Classic"},
 {n:"TV Eye",hood:"Ridgewood",boro:"Queens",lat:40.6978544,lng:-73.9052185,type:"analog",price:"—",note:"Live-music bar/venue, short walk from the L.",src:"Classic"},
 {n:"Hank's Bar",hood:"Bushwick",boro:"Brooklyn",lat:40.698632,lng:-73.9341222,type:"analog",price:"—",note:"Newer Bushwick bar — leather couches, food truck outside, dog-friendly. Photobooth inside.",src:"Photobooth.net"},
 {n:"Lou's Athletic Club",hood:"Bushwick",boro:"Brooklyn",lat:40.7002117,lng:-73.9210791,type:"analog",price:"—",note:"Neighborhood Bushwick bar with pool, darts and a big back projector. Cash only, ATM inside.",src:"Photobooth.net"},
 {n:"The Re:Shop",hood:"SoHo",boro:"Manhattan",lat:40.7204083,lng:-74.0016043,type:"dedicated",verify:true,price:"—",note:"Vintage clothing chain with a booth. Two NYC stores (SoHo + Chelsea) — confirm which has the machine before making the trip.",src:"Photobooth.net"}
];

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Attach a self-hosted photo when one exists in public/booths/<slug>.<ext>.
// These are real, verified venue/booth photos (sourced from photobooth.net and
// official venue sites); booths without one fall back to the colored initial.
const photosDir = path.join(process.cwd(), "public", "booths");
const photoFiles = fs.existsSync(photosDir) ? fs.readdirSync(photosDir) : [];
function photoFor(slug) {
  const f = photoFiles.find((n) => n.replace(/\.[^.]+$/, "") === slug);
  return f ? [`/booths/${f}`] : undefined;
}

const booths = BOOTHS.map((b) => ({
  slug: slugify(b.n),
  name: b.n,
  hood: b.hood,
  borough: b.boro,
  lat: b.lat,
  lng: b.lng,
  category: "photo-booth",
  type: b.type,
  verify: Boolean(b.verify),
  price: b.price && b.price !== "—" ? b.price : undefined,
  note: b.note || undefined,
  sources: b.src || undefined,
  photos: photoFor(slugify(b.n)),
  status: "published",
}));

const slugs = new Set(booths.map((b) => b.slug));
if (slugs.size !== booths.length) throw new Error("Duplicate slug detected");

const out = path.join(process.cwd(), "data", "booths.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(booths, null, 2) + "\n");
console.log(`Wrote ${booths.length} booths to ${out}`);
