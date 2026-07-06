// waitlist.js
// Handles waitlist submissions to Firestore for Free Tonight?

import {
  collection, query, where, getDocs, addDoc, serverTimestamp, limit
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getFirestoreDb } from "./firebase-config.js";

const COLLECTION = "waitlist";

function detectDevice() {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  return "Other";
}

function collectMetadata() {
  return {
    device: detectDevice(),
    browser: detectBrowser(),
    platform: navigator.platform || "unknown",
    referrer: document.referrer || "direct",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    screenSize: `${screen.width}x${screen.height}`,
    // Real client IP capture requires a server-side call (e.g. a Cloud Function or
    // edge middleware) since browsers cannot read their own public IP directly.
    // This is left as a placeholder for that Cloud Function to fill in.
    ip: null
  };
}

/**
 * Checks Firestore for an existing waitlist entry with the same email or phone.
 * Note: with locked-down security rules (clients can create but not read), true
 * duplicate prevention should ultimately be enforced server-side (Cloud Function
 * trigger or a callable function) rather than relying on this client-side check.
 * This client check is a best-effort UX layer for when read access is permitted
 * during development/testing.
 */
async function findDuplicate(email, phone) {
  const db = getFirestoreDb();
  const ref = collection(db, COLLECTION);

  try {
    const emailQ = query(ref, where("email", "==", email.toLowerCase()), limit(1));
    const emailSnap = await getDocs(emailQ);
    if (!emailSnap.empty) return { duplicate: true, field: "email" };

    const phoneQ = query(ref, where("phone", "==", phone), limit(1));
    const phoneSnap = await getDocs(phoneQ);
    if (!phoneSnap.empty) return { duplicate: true, field: "phone" };

    return { duplicate: false };
  } catch (err) {
    // If rules block reads (expected in production), skip client-side dedupe
    // and rely on the server-side enforcement described above.
    console.warn("Duplicate check skipped (likely blocked by security rules):", err.message);
    return { duplicate: false };
  }
}

export async function submitToWaitlist({ name, email, phone, country }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();

  const dup = await findDuplicate(normalizedEmail, normalizedPhone);
  if (dup.duplicate) return dup;

  const db = getFirestoreDb();
  const ref = collection(db, COLLECTION);

  await addDoc(ref, {
    name: name.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    country,
    createdAt: serverTimestamp(),
    status: "waiting",
    ...collectMetadata()
  });

  return { duplicate: false };
}
