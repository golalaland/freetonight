# Free Tonight?

Real moments. Right now. Members-only landing page + waitlist system + admin dashboard.

Built vanilla (no build step, no framework) to match the rest of the DettyVerse stack: ES6 modules, Firebase v11 modular SDK, Firebase Hosting, Cloud Functions in `europe-west1`.

## Folder structure

```
freetonight/
├── index.html          # Public landing page + waitlist form
├── admin.html           # Password-protected admin dashboard
├── js/
│   ├── firebase-config.js   # Shared Firebase app/Firestore/Auth init
│   └── waitlist.js          # Waitlist submission + client-side dedupe check
├── functions/
│   └── index.js         # Cloud Functions scaffold (welcome email, invite codes, analytics rollup)
├── firestore.rules      # Security rules for waitlist / admins / settings / analytics
├── manifest.json        # PWA manifest
├── robots.txt
├── sitemap.xml
└── README.md
```

## 1. Firebase project setup

This assumes Free Tonight? lives inside the existing `dettyverse` Firebase project, using a **dedicated named Firestore database** to match the multi-database-per-product pattern already used across DettyVerse properties.

1. In the Firebase console, open project `dettyverse`.
2. Firestore Database → **Add database** → id it `freetonight` (matches `FREETONIGHT_DB_ID` in `js/firebase-config.js`).
3. Open **Project settings → General** and copy the web app config values into `js/firebase-config.js` (`apiKey`, `messagingSenderId`, `appId`). `projectId` and `storageBucket` are already filled in.
4. Enable **Authentication → Email/Password** (used for admin sign-in on `admin.html`).

## 2. Create your first admin

Client writes to `admins` are blocked by the security rules on purpose — this collection is only editable from the console or a trusted backend.

1. Authentication → Users → **Add user** → create an account for yourself.
2. Copy that user's UID.
3. Firestore → `freetonight` database → create collection `admins` → document ID = that UID → any placeholder field, e.g. `{ role: "owner" }`.
4. You can now sign in on `admin.html` with that email/password.

## 3. Deploy security rules

```bash
firebase deploy --only firestore:rules --project dettyverse
```

Rules enforce:
- Anyone can **create** a waitlist entry (with basic shape/format validation), but can never read, edit, or delete one.
- Only signed-in users present in `admins` can read/update/delete `waitlist`, or read `settings`/`analytics`.
- `admins` itself is never writable by any client.

## 4. Deploy Cloud Functions (optional, when ready)

`functions/index.js` is a scaffold — the welcome-email, SMS, and Mailchimp calls are marked `TODO` and need a real provider wired in before deploying.

```bash
cd functions
npm install firebase-functions firebase-admin
cd ..
firebase deploy --only functions --project dettyverse
```

## 5. Deploy hosting

```bash
firebase deploy --only hosting --project dettyverse
```

Make sure `firebase.json` points the relevant hosting target at this folder, and that `admin.html` is excluded from search indexing (already handled via `robots.txt` and its own `noindex` meta tag).

## Notes on the waitlist duplicate check

Firestore rules deliberately block client reads of `waitlist`, which means the client-side duplicate check in `js/waitlist.js` will silently no-op in production (it only works if reads are temporarily allowed during local testing). For real duplicate enforcement in production, add a **callable Cloud Function** that checks for an existing email/phone server-side (via the Admin SDK, which bypasses rules) before writing the document — a good next addition to `functions/index.js`.

## Assets not included

Icons referenced in `manifest.json` (`/assets/icons/icon-192.png`, `icon-512.png`) and any social preview image for Open Graph tags aren't generated here — drop in real brand assets before launch.
