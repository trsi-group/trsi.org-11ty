import "dotenv/config";

const prodenv = process.env.NODE_ENV === "production";

const metadata = {
  title: "Tristar & Red Sector Demo Group - The Sleeping Gods",
  description: "Tristar & Red Sector - The Sleeping Gods",
  keywords: "demo scene, c64, amiga, intro, music, graphics",
  logo: "https://trsi.org/img/trsi-logo.png",
};

const featureFlags = {
  news: true,
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