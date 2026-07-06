// firebase-config.js
// Shared Firebase app initialization for Free Tonight?
// Uses Firebase v11 modular SDK, loaded via CDN (no build step, matches DettyVerse stack conventions).
//
// IMPORTANT: replace the values below with the real config for this Firebase project.
// If Free Tonight? lives inside the existing `dettyverse` Firebase project, keep projectId
// as-is and only swap the databaseId in getFirestoreDb() below to a dedicated named database
// (e.g. "freetonight") to match the multi-database-per-product pattern used elsewhere.

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "REPLACE_WITH_API_KEY",
  authDomain: "dettyverse.firebaseapp.com",
  projectId: "dettyverse",
  storageBucket: "dettyverse.appspot.com",
  messagingSenderId: "REPLACE_WITH_SENDER_ID",
  appId: "REPLACE_WITH_APP_ID"
};

// Named Firestore database for this product, per the DettyVerse multi-db architecture.
// Create this database in the Firebase console: Firestore > + Add database > id "freetonight".
const FREETONIGHT_DB_ID = "freetonight";

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirestoreDb() {
  const app = getFirebaseApp();
  return getFirestore(app, FREETONIGHT_DB_ID);
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return getAuth(app);
}
