import "dotenv/config";

const prodenv = process.env.NODE_ENV === "production";

const metadata = {
  title: "TRSI - The Sleeping Gods",
  description: "Tristar & Red Sector - The Sleeping Gods",
  keywords: "demo scene, c64, amiga, intro, music, graphics",
};

const featureFlags = {
  news: false,
  graphics: true,
  music: false,
};

const theme = 'joe'; // or 'first'

const domain = prodenv ? "https://trsi.org" : "http://localhost:8080";

export default {
  metadata,
  featureFlags,
  domain,
  theme,
  prodenv,
};