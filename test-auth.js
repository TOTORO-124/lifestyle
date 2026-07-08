import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
signInAnonymously(auth).then(() => {
    console.log("Auth success");
    process.exit(0);
}).catch(err => {
    console.error("Auth error:", err);
    process.exit(1);
});
