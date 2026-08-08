/* ============================================================
   BANU RITA'S SAVOURIES — STOCK TRACKER
   Local-first stock, low-stock alerts, backup export/import.
   ------------------------------------------------------------
   Data lives in this browser on this device (no server).
   Use "Backup" to download a file so nothing is ever lost,
   and keep that file somewhere safe (e.g. email it to yourself).
   ============================================================ */
(function () {
  "use strict";
  var B = window.BRS;

  var LS_KEY = "brs_stock_v1";       // { id: { qty, min } }
  var LS_CUSTOM = "brs_custom_items_v1"; // custom stock items not on the menu

  /* ---------- load / save ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
  function loadCustom() {
    try { return JSON.parse(localStorage.getItem(LS_CUSTOM)) || {}; } catch (e) { return {}; }
  }
  function saveCustom(data) { localStorage.setItem(LS_CUSTOM, JSON.stringify(data)); }

  function getStock(id) { var d = load(); return d[id] || null; }
  function setStock(id, qty, min) {
    var d = load();
    if (qty == null && min == null) delete d[id];
    else d[id] = { qty: qty == null ? null : Math.max(0, Math.round(qty)), min: min == null ? null : Math.max(0, Math.round(min)) };
    save(d);
  }
  function adjust(id, delta) {
    var cur = getStock(id);
    var qty = cur && cur.qty != null ? cur.qty : 0;
    setStock(id, qty + delta, cur && cur.min != null ? cur.min : null);
  }

  /* ---------- merged view: menu items + custom items ---------- */
  function allTracked() {
    var out = [];
    B.categories.forEach(function (cat) {
      cat.items.forEach(function (it) {
        out.push({
          id: it.id, name: it.name, group: it.group, category: cat.name, veg: it.veg,
          unit: it.unit, price: it.price, isMenu: true, stock: getStock(it.id)
        });
      });
    });
    var custom = loadCustom();
    Object.keys(custom).forEach(function (id) {
      out.push({
        id: id, name: custom[id].name, group: "Custom items", category: "Custom", veg: true,
        unit: custom[id].unit || "", price: null, isMenu: false, stock: custom[id].stock
      });
    });
    return out;
  }

  function setCustomItem(id, name, unit, qty, min) {
    var d = loadCustom();
    if (!name) delete d[id];
    else d[id] = { name: name, unit: unit, stock: { qty: qty, min: min } };
    saveCustom(d);
  }

  function lowStockList() {
    return allTracked().filter(function (t) {
      var s = t.stock;
      return s && s.qty != null && s.min != null && s.qty <= s.min;
    });
  }

  /* ---------- snapshot backup ---------- */
  function exportJSON() {
    return JSON.stringify({ exportedAt: new Date().toISOString(), stock: load(), custom: loadCustom() }, null, 2);
  }
  function importJSON(text) {
    var data = JSON.parse(text);
    if (data && data.stock) save(data.stock);
    if (data && data.custom) saveCustom(data.custom);
    return true;
  }
  function downloadBackup() {
    var blob = new Blob([exportJSON()], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "banu-stock-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
  }

  /* ---------- invoice auto-deduct ---------- */
  function deduct(items) {
    (items || []).forEach(function (it) {
      if (!it.itemId) return;
      var cur = getStock(it.itemId);
      if (cur && cur.qty != null) {
        setStock(it.itemId, cur.qty - (it.qty || 1), cur.min);
      }
    });
  }

  function resetAll() {
    save({});
    saveCustom({});
  }

  window.BRSSTOCK = {
    get: getStock, set: setStock, adjust: adjust, all: allTracked,
    low: lowStockList, setCustom: setCustomItem,
    exportJSON: exportJSON, importJSON: importJSON, downloadBackup: downloadBackup,
    deduct: deduct, resetAll: resetAll
  };
})();
