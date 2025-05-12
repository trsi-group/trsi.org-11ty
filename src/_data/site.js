import "dotenv/config";

const isDevelopment = process.env.NODE_ENV === "development";

const metadata = {
  title: "TRSI - The Sleeping Gods",
  description: "Tristar & Red Sector - The Sleeping Gods",
  keywords: "demo scene, c64, amiga, intro, music, graphics",
};

const featureFlags = {
  news: false,
  graphics: true,
  music: true,
};

const theme = 'joe'; // or 'first'

const domain = isDevelopment ? "http://localhost:8080" : "https://trsi.netlify.app";

const environment = process.env.NODE_ENV || "development";

export default {
  metadata,
  featureFlags,
  domain,
  theme,
  environment,
};