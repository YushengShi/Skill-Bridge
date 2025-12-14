/**
 * Quick script to check if Google OAuth credentials are configured
 * Run: node check-oauth.js (from backend directory)
 *      OR: node backend/check-oauth.js (from root directory)
 */

import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the backend directory (where this script is located)
config({ path: join(__dirname, ".env") });

console.log("🔍 Checking Google OAuth Configuration...\n");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

console.log("Environment Variables:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`GOOGLE_CLIENT_ID:     ${clientId ? "✅ Set" : "❌ Missing"}`);
if (clientId) {
  console.log(`  Value: ${clientId.substring(0, 30)}...`);
}
console.log(`GOOGLE_CLIENT_SECRET: ${clientSecret ? "✅ Set" : "❌ Missing"}`);
if (clientSecret) {
  console.log(`  Value: ${clientSecret.substring(0, 10)}... (hidden)`);
}
console.log(`FRONTEND_URL:         ${frontendUrl}`);
console.log(`BACKEND_URL:          ${backendUrl}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

if (!clientId || !clientSecret) {
  console.log("❌ ERROR: Google OAuth credentials are missing!\n");
  console.log("To fix:");
  console.log("1. Create/update backend/.env file");
  console.log("2. Add:");
  console.log("   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com");
  console.log("   GOOGLE_CLIENT_SECRET=your-client-secret");
  console.log("   BACKEND_URL=http://localhost:3000");
  console.log("3. Restart your backend server\n");
  process.exit(1);
}

console.log("✅ All credentials are configured!");
console.log(`\nCallback URL should be: ${backendUrl}/api/auth/google/callback`);
console.log("\nMake sure this URL is added in Google Cloud Console:");
console.log("1. Go to https://console.cloud.google.com/");
console.log("2. APIs & Services → Credentials");
console.log("3. Edit your OAuth 2.0 Client ID");
console.log(`4. Add to 'Authorized redirect URIs': ${backendUrl}/api/auth/google/callback\n`);
