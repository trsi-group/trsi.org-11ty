import "dotenv/config"; // Loads .env file
 
const isDevelopment = process.env.NODE_ENV === "development";
console.log(`landscape env: ${process.env.NODE_ENV}`);

export default {
  title: "TRSI",
  description: "Tristar & Red Sector - The Sleeping Gods",
  keywords: "demo scene, c64, amiga, intro, music, graphics",
  domain: isDevelopment ? "http://localhost:8080" : "https://trsi.netlify.app",
  environment: process.env.NODE_ENV || "development", // Detects production or development
};