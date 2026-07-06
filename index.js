// Cloud Functions for Free Tonight? — deploy target: europe-west1 (per DettyVerse convention)
//
// These are scaffolds, not wired up to real providers yet. Fill in the marked
// sections (email provider, SMS provider, Mailchimp, invite-code generator)
// before deploying. Deploy with:
//   firebase deploy --only functions --project dettyverse

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const REGION = "europe-west1";
const DB_ID = "freetonight";

function db() {
  return getFirestore(undefined, DB_ID);
}

/**
 * Fires whenever a new waitlist document is created.
 * Intended to: send a welcome email, optionally sync to Mailchimp,
 * and write a lightweight rollup into `analytics/daily`.
 */
export const onWaitlistCreated = onDocumentCreated(
  { document: "waitlist/{docId}", region: REGION, database: DB_ID },
  async (event) => {
    const entry = event.data?.data();
    if (!entry) return;

    // TODO: send welcome email via provider of choice (e.g. Resend, SendGrid, Postmark)
    // await sendWelcomeEmail(entry.email, entry.name);

    // TODO: sync to Mailchimp
    // await syncToMailchimp(entry);

    // Roll up a daily analytics counter (server-side, bypasses security rules)
    const dayKey = new Date().toISOString().slice(0, 10);
    const ref = db().collection("analytics").doc(dayKey);
    await ref.set(
      { signups: FieldValue.increment(1), date: dayKey },
      { merge: true }
    );
  }
);

/**
 * Callable function an admin client can invoke to approve a waitlist entry
 * and generate an invite code, without granting the client direct write access
 * to sensitive fields.
 */
export const approveAndInvite = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const adminDoc = await db().collection("admins").doc(request.auth.uid).get();
  if (!adminDoc.exists) {
    throw new HttpsError("permission-denied", "Not an admin.");
  }

  const { entryId } = request.data;
  if (!entryId) {
    throw new HttpsError("invalid-argument", "entryId is required.");
  }

  const inviteCode = generateInviteCode();

  await db().collection("waitlist").doc(entryId).update({
    status: "invited",
    inviteCode,
    invitedAt: FieldValue.serverTimestamp(),
  });

  // TODO: send the invite email/SMS with `inviteCode`
  // await sendInviteMessage(entryId, inviteCode);

  return { inviteCode };
});

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
