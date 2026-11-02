// Prints a fresh VAPID key pair for Web Push. Run: node scripts/push/generate-vapid.mjs
// Paste the values into Vercel environment variables. Never commit them.
import webpush from 'web-push';

const { publicKey, privateKey } = webpush.generateVAPIDKeys();
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`);
console.log('\nVITE_VAPID_PUBLIC_KEY is the same value as VAPID_PUBLIC_KEY (the browser needs it).');
console.log('Keep VAPID_PRIVATE_KEY secret. Changing the pair later forces every learner to re-subscribe.');
