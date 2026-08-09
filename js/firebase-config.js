/* ============================================================
   FIREBASE SETUP — REQUIRED once, ~10 minutes.
   ------------------------------------------------------------
   This makes Owner Hub edits (photos, menu items, specials)
   sync to EVERY device — customers see updates instantly,
   not just the device that made them.

   HOW TO SET IT UP (do this once on your PC):

   1. Go to  https://console.firebase.google.com
      Sign in with any Google account. Click "Create a project"
      (name it anything, e.g. "banu-ritas"). No need to enable
      Google Analytics. Wait for it to finish.

   2. Add a WEB APP to the project:
      On the project home, click the "</>" (Web) icon.
      Give it a name (e.g. "Banu Rita's site") and click
      "Register app". You will be shown a block of code that
      looks like this:

        const firebaseConfig = {
          apiKey: "AIza...",
          authDomain: "banu-ritas.firebaseapp.com",
          databaseURL: "https://banu-ritas-default-rtdb.firebaseio.com",
          projectId: "banu-ritas",
          storageBucket: "banu-ritas.appspot.com",
          messagingSenderId: "1234567890",
          appId: "1:1234567890:web:abc123"
        };

   3. Turn on the Realtime Database:
      Console → Build → Realtime Database → "Create database".
      Choose a location near you, then start in TEST MODE.
      Copy the `databaseURL` line into the config below.

   4. Turn on Storage:
      Console → Build → Storage → "Get started" → TEST MODE.
      Copy the `storageBucket` line into the config below.

   5. Paste your values below, then run the 3 lines:
        git add .
        git commit -m "Enable cloud sync"
        git push origin main
      Wait ~1 minute, then open the live site.

   NOTE: These keys are safe to commit — they are public by
   design. Security comes from the Firebase rules (test mode
   is fine for now; tighten later if you want).
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyB3gp0CXLDqKUbxq1nml-_29I73rbcOGkk",
  authDomain: "banu-ritas.firebaseapp.com",
  databaseURL: "https://banu-ritas-default-rtdb.firebaseio.com",
  projectId: "banu-ritas",
  storageBucket: "banu-ritas.firebasestorage.app",
  messagingSenderId: "218270106074",
  appId: "1:218270106074:web:b31abee2cbbb513ed140e3"
};
