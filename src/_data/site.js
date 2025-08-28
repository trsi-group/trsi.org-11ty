import "dotenv/config";

const prodenv = process.env.NODE_ENV === "production";

const metadata = {
  title: "Tristar & Red Sector Demo Group - The Sleeping Gods",
  description: "Tristar & Red Sector (TRSI) is a demogroup formed in 1990 from the union of the Commodore 64 warez group Red Sector and Tristar. Known for their intros and demos on C64, Amiga, PC, and consoles, TRSI has left a lasting legacy in demo scene art, code, and music.",
  keywords: "TRSI, Tristar and Red Sector, Demoscene, Amiga demo group, C64, Amiga, Intro, Music, Tracker, Pixel Graphics",
  image: "/img/trsi-logo.png",
  seoimage: "/img/trsi-logo-1200.png",
};

const theme = 'joe'; // or 'first'

const domain = prodenv ? "https://trsi.org" : "http://localhost:8080";

export default {
  metadata,
  domain,
  theme,
  prodenv,
};