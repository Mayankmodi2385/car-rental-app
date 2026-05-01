// Run this ONCE locally to generate your VAPID keys:
// cd server && node generate-vapid-keys.js
// Then copy the output into your .env files

const webpush = require("web-push");
const keys = webpush.generateVAPIDKeys();

console.log("\n✅ VAPID Keys Generated!\n");
console.log("Add these to server/.env:");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("\nAdd this to client/.env (Vercel environment variable):");
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log("\n⚠️  IMPORTANT: The public key must be the SAME in both .env files!\n");