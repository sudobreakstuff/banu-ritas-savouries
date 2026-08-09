/* ============================================================
   BANU RITA'S SAVOURIES — CLOUD SYNC (Firebase)
   ------------------------------------------------------------
   Bridges the Owner Hub's edits (photos, custom menu items,
   specials) to a single shared Firebase Realtime Database +
   Storage, so every customer device sees the same content.

   Falls back to device-local storage when Firebase is not
   configured (see firebase-config.js).
   ============================================================ */
(function () {
  "use strict";

  var CLOUD = {
    enabled: false,
    status: "off",            // off | connecting | live | error
    error: null,
    _handlers: [],
    onChange: function (cb) { if (typeof cb === "function") this._handlers.push(cb); return cb; },
    _emit: function (data) { this._handlers.slice().forEach(function (h) { try { h(data); } catch (e) {} }); }
  };
  window.CLOUD = CLOUD;

  var cfg = window.FIREBASE_CONFIG || null;

  function configured(c) {
    if (!c) return false;
    return ["apiKey", "authDomain", "databaseURL", "projectId"].every(function (k) {
      var v = String(c[k] || "");
      return v && v.indexOf("PASTE-YOUR") === -1;
    });
  }

  if (!configured(cfg) || !window.firebase) return;

  try {
    window.firebase.initializeApp(cfg);
    var db = window.firebase.database();
    var ref = db.ref("site/data");

    CLOUD.enabled = true;
    CLOUD.status = "connecting";

    ref.on("value", function (snap) {
      CLOUD.status = "live";
      var v = snap.val();
      if (v && typeof v === "object") {
        CLOUD._emit({
          uploads: v.uploads || {},
          customMenu: Array.isArray(v.customMenu) ? v.customMenu : [],
          specials: Array.isArray(v.specials) ? v.specials : []
        });
      } else {
        /* Node is empty — this is the first-ever connect.
           Seed the cloud with whatever is already on this device. */
        CLOUD._emit({ uploads: {}, customMenu: [], specials: [] });
        if (window.BRS && typeof window.BRS.pushLocalToCloud === "function") {
          try { window.BRS.pushLocalToCloud(); } catch (e) {}
        }
      }
    }, function (err) {
      CLOUD.status = "error";
      CLOUD.error = err && err.message ? err.message : "connect failed";
    });

    /* Write one or more top-level slices: {uploads, customMenu, specials} */
    CLOUD.push = function (updates) {
      try {
        ref.update(updates || {}).then(function () {
          CLOUD.status = "live";
        }, function (err) {
          CLOUD.status = "error";
          CLOUD.error = err && err.message ? err.message : "write failed";
        });
      } catch (e) { CLOUD.status = "error"; CLOUD.error = e.message; }
    };

    /* Images are stored in the database itself (free tier — no Blaze
       upgrade needed). "Uploading" just passes the data-URL through;
       it gets saved to the shared DB by saveUploads/saveCustomMenu/
       saveSpecialsPosted. */
    CLOUD.upload = function (dataUrl) { return Promise.resolve(dataUrl); };

    /* Wipe the shared content (photos, custom items, specials) */
    CLOUD.resetContent = function () {
      ref.set({ uploads: {}, customMenu: [], specials: [] });
    };
  } catch (e) {
    CLOUD.enabled = false;
    CLOUD.status = "error";
    CLOUD.error = e && e.message ? e.message : "init failed";
  }
})();
