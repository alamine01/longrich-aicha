import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Configuration Firebase (À remplacer par vos clés réelles)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialisation sécurisée (évite les crashs Vercel lors du build si les variables manquent temporairement)
let app: FirebaseApp | undefined;
let db: Firestore = undefined as unknown as Firestore;
let auth: Auth = undefined as unknown as Auth;

if (typeof window !== "undefined" && !getApps().length) {
  // Client-side initialization
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else if (getApps().length > 0) {
  // Already initialized
  app = getApp();
  db = getFirestore(app);
  auth = getAuth(app);
} else if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  // Server-side initialization (if variables are present)
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  console.warn("⚠️ Firebase configs are missing. App may not work correctly.");
}

export { app, db, auth };
