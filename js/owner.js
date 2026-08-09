/* ============================================================
   BANU RITA'S SAVOURIES — OWNER HUB
   Invoices & quotes (PDF → WhatsApp), stock tracker, backup.
   ============================================================ */
(function () {
  "use strict";
  var B = window.BRS;
  var biz = B.business;
  var ALL = B.allItems();

  var LS_DOCS = "brs_docs_v1";
  var LS_COUNTERS = "brs_counters_v1";
  var LS_SETTINGS = "brs_owner_settings_v1";
  var SESS = "brs_owner_session";

  var DOCS = [];
  var currentTab = "dashboard";
  var builder = null; // { type, rows, delivery }
  var miImg = null, spImg = null; // pending uploads (data URLs)

  /* ------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------ */
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function fmt(n) { return (biz.currency || "R") + Number(n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function toast(msg) {
    var t = $("#toast"); if (!t) return;
    t.innerHTML = '<span class="t-ico">&#10003;</span><span>' + esc(msg) + "</span>";
    t.classList.add("show");
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }
  function confirmBox(msg) { return window.confirm(msg); }

  function store(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function load(key, def) { try { return JSON.parse(localStorage.getItem(key)) || def; } catch (e) { return def; } }

  /* ------------------------------------------------------------
     SETTINGS OVERRIDES
     ------------------------------------------------------------ */
  function applySettings() {
    var s = load(LS_SETTINGS, {});
    ["name", "phone", "phone2", "orderWhatsApp", "address", "social"].forEach(function (k) {
      if (s[k]) biz[k] = s[k];
    });
    if (s.socialUrl) biz.socialUrl = s.socialUrl;
    if (s.vatPercent != null) biz.vatPercent = Number(s.vatPercent);
    if (s.ownerPasscode) biz.ownerPasscode = s.ownerPasscode;
    if (s.invoicePrefix) biz.invoicePrefix = s.invoicePrefix;
    if (s.quotePrefix) biz.quotePrefix = s.quotePrefix;
  }

  /* ------------------------------------------------------------
     AUTH
     ------------------------------------------------------------ */
  function isUnlocked() { try { return sessionStorage.getItem(SESS) === "1"; } catch (e) { return false; } }
  function unlock() {
    var pass = $("#gate-pass").value.trim();
    if (pass === String(biz.ownerPasscode)) {
      sessionStorage.setItem(SESS, "1");
      $("#gate").style.display = "none";
      $("#hub").style.display = "block";
      document.title = "Owner Hub — Banu Rita's Savouries";
      boot();
    } else {
      $("#gate-err").textContent = "That passcode isn't right. Try again.";
    }
  }
  function lock() { sessionStorage.removeItem(SESS); location.reload(); }

  /* ------------------------------------------------------------
     TABS
     ------------------------------------------------------------ */
  function switchTab(tab) {
    currentTab = tab;
    $all("#hub-tabs button").forEach(function (b) { b.classList.toggle("active", b.dataset.tab === tab); });
    $all(".hub-tab").forEach(function (s) { s.classList.toggle("show", s.id === "tab-" + tab); });
    if (tab === "dashboard") renderDashboard();
    if (tab === "documents") renderDocList();
    if (tab === "stock") renderStock();
    if (tab === "menu") renderMenuMgr();
    if (tab === "settings") renderSettings();
  }

  /* ------------------------------------------------------------
     DOCUMENTS — storage & numbering
     ------------------------------------------------------------ */
  function loadDocs() { DOCS = load(LS_DOCS, []); }
  function saveDocs() { store(LS_DOCS, DOCS); }
  function counters() { return load(LS_COUNTERS, { invoice: 0, quote: 0 }); }

  function nextNumber(type) {
    var c = counters();
    return type === "quote" ? biz.quotePrefix + "-" + pad(c.quote + 1) : biz.invoicePrefix + "-" + pad(c.invoice + 1);
  }
  function commitNumber(type) {
    var c = counters();
    if (type === "quote") c.quote += 1; else c.invoice += 1;
    store(LS_COUNTERS, c);
  }
  function pad(n) { return String(n).padStart(4, "0"); }
  function today() { var d = new Date(); return d.toISOString().slice(0, 10); }
  function dateLabel(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
  }

  function docTotal(items, discount, vatPct) {
    var sub = items.reduce(function (s, it) { return s + (Number(it.price) || 0) * (Number(it.qty) || 1); }, 0);
    var disc = Number(discount) || 0;
    var vat = (sub - disc) * (Number(vatPct) || 0) / 100;
    return { subtotal: sub, vatAmount: vat, total: sub - disc + vat };
  }

  /* ------------------------------------------------------------
     DASHBOARD
     ------------------------------------------------------------ */
  function renderDashboard() {
    var unpaid = DOCS.filter(function (d) { return d.type === "invoice" && d.status !== "paid"; });
    var unpaidTotal = unpaid.reduce(function (s, d) { return s + (d.total || 0); }, 0);
    var now = new Date();
    var weekAgo = new Date(now.getTime() - 7 * 864e5);
    var weekDocs = DOCS.filter(function (d) { return new Date(d.createdAt) >= weekAgo; });
    var low = window.BRSSTOCK.low().length;

    $("#dash-stats").innerHTML =
      stat("unpaid", unpaid.length, "unpaid invoices", unpaid.length ? "warn" : "good") +
      stat("due", fmt(unpaidTotal), "outstanding", "gold") +
      stat("low", low, "items running low", low ? "warn" : "good") +
      stat("week", weekDocs.length, "docs this week", "gold");

    var recent = DOCS.slice().sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, 6);
    $("#dash-recent").innerHTML = recent.length
      ? '<div class="hub-table-wrap"><table class="hub-table">' + docRows(recent, true) + "</table></div>"
      : '<p style="color:var(--muted)">No documents yet — create your first invoice or quote.</p>';
  }
  function stat(id, num, label, tone) {
    return '<div class="stat ' + (tone || "") + '"><div class="stat-num">' + esc(String(num)) + '</div><div class="stat-lab">' + esc(label) + "</div></div>";
  }

  function docRows(list, short) {
    var head = "<thead><tr><th>No.</th><th>Type</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th>" + (short ? "" : "<th>Actions</th>") + "</tr></thead>";
    var body = list.map(function (d) {
      return "<tr>" +
        "<td><b>" + esc(d.number) + "</b></td>" +
        "<td><span class='badge " + (d.type === "quote" ? "quote" : (d.status === "paid" ? "paid" : "unpaid")) + "'>" + (d.type === "quote" ? "Quote" : "Invoice") + "</span></td>" +
        "<td>" + esc(d.customer && d.customer.name || "—") + "</td>" +
        "<td>" + esc(dateLabel(d.date)) + "</td>" +
        '<td class="num">' + fmt(d.total) + "</td>" +
        "<td>" + statusBadge(d) + "</td>" +
        (short ? "" : "<td><div class='row-actions'>" +
          '<button class="icon-btn" data-doc="' + esc(d.id) + '" data-act="pdf" title="Download PDF"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg></button>' +
          '<button class="icon-btn" data-doc="' + esc(d.id) + '" data-act="send" title="Send via WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></button>' +
          '<button class="icon-btn" data-doc="' + esc(d.id) + '" data-act="paid" title="Toggle paid"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></button>' +
          '<button class="icon-btn danger" data-doc="' + esc(d.id) + '" data-act="del" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>' +
          "</div></td>") +
        "</tr>";
    }).join("");
    return head + "<tbody>" + body + "</tbody>";
  }

  function statusBadge(d) {
    if (d.type === "quote") return '<span class="badge quote">Quote</span>';
    return d.status === "paid"
      ? '<span class="badge paid">Paid</span>'
      : '<span class="badge unpaid">Unpaid</span>';
  }

  function renderDocList() {
    var q = ($("#doc-search") && $("#doc-search").value || "").toLowerCase();
    var list = DOCS.slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
    if (q) list = list.filter(function (d) {
      return (d.number + " " + (d.customer && d.customer.name || "")).toLowerCase().indexOf(q) !== -1;
    });
    $("#doc-table").innerHTML = list.length ? docRows(list, false)
      : '<tbody><tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">No documents yet.</td></tr></tbody>';
    bindDocActions();
  }

  function bindDocActions() {
    $all("[data-doc][data-act]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var doc = DOCS.filter(function (d) { return d.id === btn.dataset.doc; })[0];
        if (!doc) return;
        var act = btn.dataset.act;
        if (act === "pdf") downloadDoc(doc);
        if (act === "send") shareDoc(doc);
        if (act === "paid") { doc.status = doc.status === "paid" ? "unpaid" : "paid"; saveDocs(); renderDocList(); renderDashboard(); toast(doc.status === "paid" ? "Marked as paid" : "Marked as unpaid"); }
        if (act === "del" && confirmBox("Delete " + doc.number + "? This can't be undone.")) {
          DOCS = DOCS.filter(function (d) { return d.id !== doc.id; });
          saveDocs(); renderDocList(); renderDashboard(); toast("Document deleted");
        }
      });
    });
  }

  function toPdfDoc(doc) {
    return window.BRSPDF.makeInvoicePdf({
      docType: doc.type,
      number: doc.number,
      date: dateLabel(doc.date),
      customer: doc.customer || {},
      items: doc.items.map(function (it) { return { name: it.name, unit: it.unit, price: it.price, qty: it.qty }; }),
      fryFee: doc.fryFee,
      delivery: doc.delivery,
      discount: doc.discount,
      vatPercent: doc.vatPercent,
      notes: (doc.notes || "").split("\n").filter(Boolean),
      status: doc.status
    });
  }

  function downloadDoc(doc) {
    var r = toPdfDoc(doc);
    if (!r) return;
    r.doc.save(doc.number + ".pdf");
    toast(doc.number + " downloaded");
  }

  function shareDoc(doc) {
    var r = toPdfDoc(doc);
    if (!r) return;
    var blob = r.doc.output("blob");
    var file = new File([blob], doc.number + ".pdf", { type: "application/pdf" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: doc.number, text: "Invoice from " + biz.name }).then(function () {
        toast("Shared — pick WhatsApp to send it");
      }).catch(function (e) { if (e && e.name !== "AbortError") toast("Couldn't share"); });
    } else {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = doc.number + ".pdf";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
      toast("PDF downloaded — attach & send it on WhatsApp");
    }
  }

  /* ------------------------------------------------------------
     DOC BUILDER
     ------------------------------------------------------------ */
  function openBuilder(type) {
    builder = { type: type, rows: [{ name: "", qty: 1, price: "" }], delivery: false };
    $("#doc-list-panel").style.display = "none";
    var b = $("#doc-builder");
    b.style.display = "block";
    b.innerHTML = "";
    b.scrollIntoView({ behavior: "smooth", block: "start" });
    renderBuilder();
  }
  function closeBuilder() {
    builder = null;
    $("#doc-builder").style.display = "none";
    $("#doc-builder").innerHTML = "";
    $("#doc-list-panel").style.display = "block";
    renderDocList();
  }

  function itemOptions() {
    var html = "";
    B.categories.forEach(function (cat) {
      html += '<optgroup label="' + esc(cat.name) + '">';
      cat.items.forEach(function (it) {
        html += '<option value="' + esc(it.id) + '" data-price="' + (it.price == null ? "" : it.price) + '" data-unit="' + esc(it.unit) + '">' + esc(it.name) + (it.price != null ? " — " + fmt(it.price) : "") + "</option>";
      });
      html += "</optgroup>";
    });
    return html;
  }

  function renderBuilder() {
    var t = builder.type === "quote" ? "Quote" : "Invoice";
    var b = $("#doc-builder");
    var totals = builderTotals();
    b.innerHTML =
      '<div class="hub-panel" style="margin-top:0">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
          "<div><span class='kicker'>New " + t.toLowerCase() + "</span><h3 style='font-size:24px'>" + t + "</h3></div>" +
          '<button class="btn btn-ghost btn-sm" id="builder-close" type="button">Cancel</button>' +
        "</div>" +
        '<p class="hp-sub">Fill in the customer, add line items, then save or send as a PDF.</p>' +
        '<div class="doc-builder" style="grid-template-columns:1fr 1fr;gap:12px">' +
          '<div><label class="f-label">Number</label><input class="f-input" id="b-number" value="' + esc(nextNumber(builder.type)) + '"></div>' +
          '<div><label class="f-label">Date</label><input class="f-input" id="b-date" type="date" value="' + today() + '"></div>' +
          '<div><label class="f-label">Customer name</label><input class="f-input" id="b-custname" placeholder="e.g. Aunty Farida"></div>' +
          '<div><label class="f-label">Customer phone</label><input class="f-input" id="b-custphone" placeholder="071 000 0000"></div>' +
          '<div style="grid-column:1/-1"><label class="f-label">Customer address (optional)</label><input class="f-input" id="b-custaddr" placeholder="Street, suburb"></div>' +
        "</div>" +
        '<div style="margin-top:20px">' +
          '<label class="f-label">Line items</label>' +
          '<div id="b-lines"></div>' +
          '<button class="btn btn-ghost btn-sm" id="b-addline" type="button" style="margin-top:10px">+ Add line</button>' +
        "</div>" +
        '<div class="doc-totals">' +
          '<div class="dt-row"><span>Subtotal</span><b id="b-sub">' + fmt(totals.subtotal) + "</b></div>" +
          '<div class="dt-row"><span>Frying fee</span><b id="b-fry">' + fmt(totals.fry) + "</b></div>" +
          '<div class="dt-row"><span>Delivery (+' + fmt(B.fees.delivery || 0) + ")</span><input type=\"checkbox\" id=\"b-delivery\" " + (builder.delivery ? "checked" : "") + " style=\"width:18px;height:18px;accent-color:var(--marigold-deep)\"></div>" +
          '<div class="dt-row"><span>Discount (R)</span><input class="f-input" id="b-discount" type="number" min="0" value="0" style="width:110px;padding:6px 10px"></div>' +
          '<div class="dt-row"><span>VAT %</span><input class="f-input" id="b-vat" type="number" min="0" step="0.1" value="' + (biz.vatPercent || 0) + '" style="width:110px;padding:6px 10px"></div>' +
          '<div class="dt-row"><span>VAT amount</span><b id="b-vatamt">' + fmt(totals.vatAmount) + "</b></div>" +
          '<div class="dt-row grand"><span>Total</span><b id="b-total">' + fmt(totals.total) + "</b></div>" +
        "</div>" +
        '<div><label class="f-label">Notes / terms</label><textarea class="f-textarea" id="b-notes" placeholder="Payment terms, delivery notes…"></textarea></div>' +
        '<div style="margin-top:10px;display:flex;align-items:center;gap:10px">' +
          '<input type="checkbox" id="b-deduct" style="width:18px;height:18px;accent-color:var(--leaf)">' +
          '<label for="b-deduct" class="f-label" style="margin:0">Deduct quantities from stock when I save</label>' +
        "</div>" +
        '<div class="doc-actions" style="margin-top:20px">' +
          '<button class="btn btn-gold" id="b-save" type="button">Save ' + t.toLowerCase() + "</button>" +
          '<button class="btn btn-dark" id="b-pdf" type="button">Download PDF</button>' +
          '<button class="btn btn-wa" id="b-share" type="button">Send via WhatsApp</button>' +
        "</div>" +
      "</div>";

    renderLines();

    $("#builder-close").addEventListener("click", closeBuilder);
    $("#b-addline").addEventListener("click", function () { builder.rows.push({ name: "", qty: 1, price: "" }); renderLines(); });
    $("#b-save").addEventListener("click", saveBuilder);
    $("#b-pdf").addEventListener("click", function () { var r = builderToPdf(); if (r) { r.doc.save($("#b-number").value + ".pdf"); toast("PDF downloaded"); } });
    $("#b-share").addEventListener("click", function () {
      var r = builderToPdf(); if (!r) return;
      var blob = r.doc.output("blob");
      var file = new File([blob], $("#b-number").value + ".pdf", { type: "application/pdf" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: $("#b-number").value }).catch(function (e) { if (e && e.name !== "AbortError") toast("Couldn't share"); });
      } else {
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = $("#b-number").value + ".pdf";
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
        toast("PDF downloaded — send it on WhatsApp");
      }
    });
    ["b-discount", "b-vat"].forEach(function (id) { $("#" + id).addEventListener("input", renderBuilderTotals); });
    $("#b-delivery").addEventListener("change", function () { builder.delivery = this.checked; renderBuilderTotals(); });
  }

  function renderLines() {
    var box = $("#b-lines");
    if (!box) return;
    var html = "";
    builder.rows.forEach(function (row, i) {
      html +=
        '<div class="line-form" data-i="' + i + '">' +
          '<select class="f-input" data-f="item" data-i="' + i + '">' +
            '<option value="">— choose an item or custom —</option>' + itemOptions() +
          "</select>" +
          '<input class="f-input" type="number" min="1" value="' + row.qty + '" data-f="qty" data-i="' + i + '">' +
          '<input class="f-input" type="number" min="0" step="0.01" placeholder="R" value="' + (row.price == null ? "" : row.price) + '" data-f="price" data-i="' + i + '">' +
          '<label class="f-fried" title="Tick if fried — the frying fee is added automatically"><input type="checkbox" data-f="fried" data-i="' + i + '" ' + (row.fried ? "checked" : "") + '> Fried</label>' +
          '<button class="icon-btn danger" data-f="rm" data-i="' + i + '" title="Remove line"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
        "</div>";
    });
    box.innerHTML = html;
    /* restore selected item (fixes the "selection resets" bug) */
    box.querySelectorAll('[data-f="item"]').forEach(function (sel) {
      var i = +sel.dataset.i;
      if (builder.rows[i] && builder.rows[i].itemId) sel.value = builder.rows[i].itemId;
    });
    $all("[data-f]", box).forEach(function (el) {
      el.addEventListener("change", function () {
        var i = +el.dataset.i;
        var row = builder.rows[i];
        if (!row) return;
        var f = el.dataset.f;
        if (f === "item") {
          if (el.value) {
            var opt = el.options[el.selectedIndex];
            row.name = el.options[el.selectedIndex].text.split(" — ")[0];
            row.itemId = el.value;
            row.price = opt.dataset.price || "";
            row.unit = opt.dataset.unit || "";
          } else {
            row.name = ""; row.itemId = null; row.price = ""; row.unit = "";
          }
        }
        if (f === "qty") row.qty = Math.max(1, parseInt(el.value, 10) || 1);
        if (f === "price") row.price = el.value;
        if (f === "fried") row.fried = el.checked;
        renderBuilderTotals();
      });
      if (el.dataset.f === "rm") el.addEventListener("click", function () {
        builder.rows.splice(+el.dataset.i, 1);
        if (!builder.rows.length) builder.rows.push({ name: "", qty: 1, price: "" });
        renderLines();
      });
    });
    renderBuilderTotals();
  }

  function builderRows() {
    return builder.rows.map(function (r, i) {
      var name = r.name || "Item " + (i + 1);
      var price = r.price === "" || r.price == null ? 0 : Number(r.price) || 0;
      return { itemId: r.itemId || null, name: name, unit: r.unit || "item", price: price, qty: r.qty || 1, fried: !!r.fried };
    }).filter(function (r) { return (r.name && r.price) || r.itemId; });
  }
  function builderTotals() {
    var rows = builderRows();
    var sub = rows.reduce(function (s, r) { return s + r.price * r.qty; }, 0);
    var fry = rows.reduce(function (s, r) {
      if (!r.fried || !r.itemId) return s;
      var item = B.itemById(r.itemId);
      return s + (item ? B.fryFee(item, r.qty) : 0);
    }, 0);
    var delivery = builder.delivery ? (B.fees.delivery || 0) : 0;
    var disc = Number($("#b-discount") ? $("#b-discount").value : 0) || 0;
    var vatPct = Number($("#b-vat") ? $("#b-vat").value : biz.vatPercent) || 0;
    var vat = (sub + fry + delivery - disc) * vatPct / 100;
    return { subtotal: sub, fry: fry, delivery: delivery, discount: disc, vatPercent: vatPct, vatAmount: vat, total: sub + fry + delivery - disc + vat };
  }
  function renderBuilderTotals() {
    var t = builderTotals();
    var sub = $("#b-sub"), fry = $("#b-fry"), va = $("#b-vatamt"), tot = $("#b-total");
    if (sub) sub.textContent = fmt(t.subtotal);
    if (fry) fry.textContent = fmt(t.fry);
    if (va) va.textContent = fmt(t.vatAmount);
    if (tot) tot.textContent = fmt(t.total);
  }

  function builderToPdf() {
    var t = builderTotals();
    var r = window.BRSPDF.makeInvoicePdf({
      docType: builder.type,
      number: $("#b-number").value,
      date: dateLabel($("#b-date").value || today()),
      customer: { name: $("#b-custname").value, phone: $("#b-custphone").value, addr: $("#b-custaddr").value },
      items: builderRows(),
      fryFee: t.fry,
      delivery: t.delivery,
      discount: t.discount,
      vatPercent: t.vatPercent,
      notes: $("#b-notes").value.split("\n").filter(Boolean)
    });
    return r;
  }

  function saveBuilder() {
    var custName = $("#b-custname").value.trim();
    if (!custName) { toast("Add a customer name"); $("#b-custname").focus(); return; }
    var rows = builderRows();
    if (!rows.length) { toast("Add at least one line item"); return; }
    var t = builderTotals();
    var doc = {
      id: "d_" + Date.now(),
      type: builder.type,
      number: $("#b-number").value.trim() || nextNumber(builder.type),
      date: $("#b-date").value || today(),
      customer: { name: custName, phone: $("#b-custphone").value.trim(), addr: $("#b-custaddr").value.trim() },
      items: rows,
      fryFee: t.fry,
      delivery: t.delivery,
      discount: t.discount,
      vatPercent: t.vatPercent,
      subtotal: t.subtotal, vatAmount: t.vatAmount, total: t.total,
      notes: $("#b-notes").value.trim(),
      status: builder.type === "quote" ? "quote" : "unpaid",
      createdAt: Date.now()
    };
    DOCS.push(doc);
    saveDocs();
    commitNumber(builder.type);
    if (builder.type === "invoice" && $("#b-deduct").checked) {
      window.BRSSTOCK.deduct(rows.filter(function (r) { return r.itemId; }));
      toast("Stock updated");
    }
    toast(doc.number + " saved");
    closeBuilder();
    renderDashboard();
  }

  /* ------------------------------------------------------------
     STOCK
     ------------------------------------------------------------ */
  function renderStock() {
    var all = window.BRSSTOCK.all();
    var low = window.BRSSTOCK.low();
    var tracked = all.filter(function (t) { return t.stock && t.stock.qty != null; });
    var unset = all.filter(function (t) { return !t.stock || t.stock.qty == null; });

    $("#stock-stats").innerHTML =
      stat("s-low", low.length, "running low", low.length ? "warn" : "good") +
      stat("s-tracked", tracked.length, "items tracked", "gold") +
      stat("s-unset", unset.length, "not tracked yet", unset.length ? "warn" : "good") +
      stat("s-total", all.length, "total items", "");

    var byCat = {};
    all.forEach(function (t) { (byCat[t.category] = byCat[t.category] || []).push(t); });

    var html = "<thead><tr><th>Item</th><th>Category</th><th>Unit</th><th>On hand</th><th>Min</th><th>Status</th></tr></thead><tbody>";
    Object.keys(byCat).forEach(function (cat) {
      html += '<tr><td colspan="6" style="background:var(--bg2);font-weight:800;letter-spacing:1px;text-transform:uppercase;font-size:11px;color:var(--muted)">' + esc(cat) + "</td></tr>";
      byCat[cat].forEach(function (t) {
        var s = t.stock || {};
        var status;
        if (s.qty == null) status = '<span class="badge na">Not set</span>';
        else if (s.min != null && s.qty <= s.min) status = '<span class="badge low">Low — ' + s.qty + " left</span>";
        else status = '<span class="badge ok">In stock</span>';
        html +=
          "<tr>" +
            "<td><b>" + esc(t.name) + "</b></td>" +
            '<td style="color:var(--muted)">' + esc(t.group) + "</td>" +
            '<td style="color:var(--muted)">' + esc(t.unit) + "</td>" +
            '<td><div class="stock-cell">' +
              '<button class="icon-btn" data-stock="' + esc(t.id) + '" data-act="dec">−</button>' +
              '<input type="number" min="0" value="' + (s.qty == null ? "" : s.qty) + '" data-stock="' + esc(t.id) + '" data-act="set" style="width:60px;text-align:center;font-weight:800">' +
              '<button class="icon-btn" data-stock="' + esc(t.id) + '" data-act="inc">+</button>' +
            "</div></td>" +
            '<td><input type="number" min="0" value="' + (s.min == null ? "" : s.min) + '" data-stock="' + esc(t.id) + '" data-act="min" style="width:60px;padding:6px;border:1.5px solid var(--border);border-radius:9px;font-weight:800"></td>' +
            "<td>" + status + "</td>" +
          "</tr>";
      });
    });
    html += "</tbody>";
    $("#stock-table").innerHTML = html;

    $all("[data-stock]").forEach(function (el) {
      el.addEventListener("click", function () {
        var id = el.dataset.stock;
        if (el.dataset.act === "inc") window.BRSSTOCK.adjust(id, 1);
        if (el.dataset.act === "dec") window.BRSSTOCK.adjust(id, -1);
        renderStock();
      });
      if (el.tagName === "INPUT") {
        var last = el.value;
        el.addEventListener("change", function () {
          var id = el.dataset.stock;
          var v = el.value === "" ? null : Math.max(0, parseInt(el.value, 10) || 0);
          var cur = window.BRSSTOCK.get(id) || {};
          if (el.dataset.act === "min") window.BRSSTOCK.set(id, cur.qty, v);
          else window.BRSSTOCK.set(id, v, cur.min);
          renderStock();
        });
      }
    });
  }

  function printStockSheet() {
    var all = window.BRSSTOCK.all();
    var byCat = {};
    all.forEach(function (t) { (byCat[t.category] = byCat[t.category] || []).push(t); });
    var html = "<h2 style='margin-bottom:6px'>" + esc(biz.name) + " — Stock sheet</h2>" +
      "<p style='margin-bottom:16px;color:#555'>Printed " + new Date().toLocaleString() + "</p>";
    Object.keys(byCat).forEach(function (cat) {
      html += "<h3 style='margin:16px 0 6px'>" + esc(cat) + "</h3><table><thead><tr><th>Item</th><th>Unit</th><th>On hand</th><th>Min</th><th>Status</th></tr></thead><tbody>";
      byCat[cat].forEach(function (t) {
        var s = t.stock || {};
        var st = s.qty == null ? "—" : (s.min != null && s.qty <= s.min ? "LOW" : "OK");
        html += "<tr><td>" + esc(t.name) + "</td><td>" + esc(t.unit) + "</td><td>" + (s.qty == null ? "—" : s.qty) + "</td><td>" + (s.min == null ? "—" : s.min) + "</td><td>" + st + "</td></tr>";
      });
      html += "</tbody></table>";
    });
    $("#print-area").innerHTML = html;
    window.print();
  }

  /* ------------------------------------------------------------
     MENU & PHOTOS
     ------------------------------------------------------------ */
  function renderMenuMgr() {
    renderPhotoGrid();
    renderSpecialsList();
  }

  function renderPhotoGrid() {
    var grid = $("#photo-grid");
    if (!grid) return;
    var items = B.allItems();
    grid.innerHTML = items.map(function (it) {
      return (
        '<label class="photo-item">' +
          '<input type="file" accept="image/*" class="photo-file" data-id="' + esc(it.id) + '" style="display:none">' +
          '<img src="' + esc(it._img) + '" alt="">' +
          "<span>" + esc(it.name) + "</span>" +
        "</label>"
      );
    }).join("");

    $all(".photo-file", grid).forEach(function (input) {
      input.addEventListener("change", function () {
        var id = input.dataset.id;
        var file = input.files && input.files[0];
        if (!file) return;
        fileToDataURL(file, function (dataUrl) {
          B.uploads[id] = dataUrl;
          B.saveUploads(B.uploads);
          toast("Photo updated");
          renderPhotoGrid();
        });
      });
    });
  }

  function renderSpecialsList() {
    var box = $("#specials-list");
    if (!box) return;
    var posted = B.loadJSON("brs_specials_v1", []);
    if (!posted.length) { box.innerHTML = '<p style="color:var(--muted);font-size:13px">No specials posted yet.</p>'; return; }
    box.innerHTML = posted.map(function (sp, i) {
      return (
        '<div class="special-item">' +
          '<img src="' + esc(sp.img) + '" alt="">' +
          '<div class="sp-info"><b>' + esc(sp.title) + "</b><span>" + esc(sp.caption || "") + "</span></div>" +
          '<button class="icon-btn danger" data-sp="' + i + '" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
        "</div>"
      );
    }).join("");
    $all("[data-sp]", box).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var list = B.loadJSON("brs_specials_v1", []);
        list.splice(+btn.dataset.sp, 1);
        B.saveSpecialsPosted(list);
        toast("Special removed");
        renderSpecialsList();
      });
    });
  }

  function fileToDataURL(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1000, w = img.width, h = img.height;
        if (w > max || h > max) {
          var k = Math.min(max / w, max / h);
          var c = document.createElement("canvas");
          c.width = Math.round(w * k); c.height = Math.round(h * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          cb(c.toDataURL("image/jpeg", 0.85));
        } else { cb(img.src); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ------------------------------------------------------------
     SETTINGS
     ------------------------------------------------------------ */
  function renderSettings() {
    $("#set-name").value = biz.name;
    $("#set-phone").value = biz.phone;
    $("#set-phone2").value = biz.phone2;
    $("#set-wa").value = biz.orderWhatsApp;
    $("#set-address").value = biz.address;
    $("#set-social").value = biz.social;
    $("#set-vat").value = biz.vatPercent || 0;
    $("#set-pass").value = "";
  }

  function saveSettings() {
    var s = load(LS_SETTINGS, {});
    s.name = $("#set-name").value.trim();
    s.phone = $("#set-phone").value.trim();
    s.phone2 = $("#set-phone2").value.trim();
    s.orderWhatsApp = $("#set-wa").value.trim().replace(/\D/g, "");
    s.address = $("#set-address").value.trim();
    s.social = $("#set-social").value.trim();
    s.vatPercent = Number($("#set-vat").value) || 0;
    if ($("#set-pass").value.trim()) s.ownerPasscode = $("#set-pass").value.trim();
    store(LS_SETTINGS, s);
    applySettings();
    toast("Settings saved");
  }

  function fullBackup() {
    var data = {
      exportedAt: new Date().toISOString(),
      settings: load(LS_SETTINGS, {}),
      docs: DOCS,
      counters: counters(),
      stock: JSON.parse(localStorage.getItem("brs_stock_v1") || "{}"),
      custom: JSON.parse(localStorage.getItem("brs_custom_items_v1") || "{}"),
      customMenu: B.customMenu,
      uploads: B.uploads,
      specials: B.loadJSON("brs_specials_v1", [])
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "banu-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
    toast("Backup downloaded — keep it safe!");
  }

  function restoreBackup(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var d = JSON.parse(reader.result);
        if (d.settings) store(LS_SETTINGS, d.settings);
        if (d.docs) { DOCS = d.docs; saveDocs(); }
        if (d.counters) store(LS_COUNTERS, d.counters);
        if (d.stock) localStorage.setItem("brs_stock_v1", JSON.stringify(d.stock));
        if (d.custom) localStorage.setItem("brs_custom_items_v1", JSON.stringify(d.custom));
        if (d.customMenu) B.saveCustomMenu(d.customMenu);
        if (d.uploads) B.saveUploads(d.uploads);
        if (d.specials) B.saveSpecialsPosted(d.specials);
        applySettings();
        renderDashboard(); renderDocList(); renderStock(); renderMenuMgr(); renderSettings();
        toast("Backup restored");
      } catch (e) { toast("That file isn't a valid backup"); }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    if (!confirmBox("Erase ALL data on this device? Download a backup first!")) return;
    ["brs_docs_v1", "brs_counters_v1", "brs_owner_settings_v1", "brs_stock_v1", "brs_custom_items_v1", "brs_custom_menu_v1", "brs_uploads_v1", "brs_specials_v1"].forEach(function (k) { localStorage.removeItem(k); });
    location.reload();
  }

  /* ------------------------------------------------------------
     BOOT
     ------------------------------------------------------------ */
  function bindStatic() {
    $("#gate-form").addEventListener("submit", function (e) { e.preventDefault(); unlock(); });
    $("#logout-btn").addEventListener("click", lock);

    $all("#hub-tabs button").forEach(function (b) { b.addEventListener("click", function () { switchTab(b.dataset.tab); }); });

    $("#doc-new-invoice").addEventListener("click", function () { openBuilder("invoice"); });
    $("#doc-new-quote").addEventListener("click", function () { openBuilder("quote"); });
    $("#dash-new-invoice").addEventListener("click", function () { switchTab("documents"); openBuilder("invoice"); });
    $("#dash-new-quote").addEventListener("click", function () { switchTab("documents"); openBuilder("quote"); });

    $("#doc-search").addEventListener("input", renderDocList);

    $("#stock-print").addEventListener("click", printStockSheet);
    $("#stock-backup").addEventListener("click", window.BRSSTOCK.downloadBackup);
    $("#stock-restore").addEventListener("click", function () { $("#stock-restore-file").click(); });
    $("#stock-restore-file").addEventListener("change", function () {
      if (this.files[0]) {
        var r = new FileReader();
        r.onload = function () {
          try { window.BRSSTOCK.importJSON(r.result); renderStock(); toast("Stock restored"); }
          catch (e) { toast("Invalid stock file"); }
        };
        r.readAsText(this.files[0]);
      }
      this.value = "";
    });
    $("#cust-add").addEventListener("click", function () {
      var name = $("#cust-name").value.trim();
      if (!name) { toast("Enter an item name"); return; }
      var unit = $("#cust-unit").value.trim() || "item";
      var qty = $("#cust-qty").value === "" ? null : Math.max(0, parseInt($("#cust-qty").value, 10) || 0);
      var min = $("#cust-min").value === "" ? null : Math.max(0, parseInt($("#cust-min").value, 10) || 0);
      window.BRSSTOCK.setCustomItem("cust_" + Date.now(), name, unit, qty, min);
      $("#cust-name").value = ""; $("#cust-unit").value = ""; $("#cust-qty").value = ""; $("#cust-min").value = "";
      renderStock();
      toast("Custom item added");
    });

    $("#set-save").addEventListener("click", saveSettings);

    /* --- Menu & Photos tab --- */
    $("#mi-img-btn").addEventListener("click", function () { $("#mi-img-file").click(); });
    $("#mi-img-file").addEventListener("change", function () {
      var f = this.files && this.files[0]; if (!f) return;
      fileToDataURL(f, function (d) { var p = $("#mi-img-preview"); if (p) { p.src = d; p.classList.add("has"); } miImg = d; });
    });
    $("#sp-img-btn").addEventListener("click", function () { $("#sp-img-file").click(); });
    $("#sp-img-file").addEventListener("change", function () {
      var f = this.files && this.files[0]; if (!f) return;
      fileToDataURL(f, function (d) { var p = $("#sp-img-preview"); if (p) { p.src = d; p.classList.add("has"); } spImg = d; });
    });

    $("#mi-add").addEventListener("click", function () {
      var name = $("#mi-name").value.trim();
      if (!name) { toast("Enter an item name"); $("#mi-name").focus(); return; }
      var price = $("#mi-price").value;
      if (price === "") { toast("Enter a price"); $("#mi-price").focus(); return; }
      var custom = {
        id: "cust_" + Date.now(),
        name: name,
        catId: $("#mi-cat").value,
        group: $("#mi-group").value.trim() || "Custom items",
        price: Number(price),
        unit: $("#mi-unit").value.trim() || "item",
        veg: $("#mi-veg").checked,
        desc: "",
        img: miImg || "assets/images/hero.jpg"
      };
      B.customMenu.push(custom);
      B.saveCustomMenu(B.customMenu);
      ["mi-name", "mi-price", "mi-unit", "mi-group"].forEach(function (id) { var el = $("#" + id); if (el) el.value = ""; });
      $("#mi-veg").checked = true;
      miImg = null;
      var p = $("#mi-img-preview"); if (p) { p.src = ""; p.classList.remove("has"); }
      $("#mi-img-file").value = "";
      renderPhotoGrid();
      toast(name + " added to the menu");
    });

    $("#sp-add").addEventListener("click", function () {
      var title = $("#sp-title").value.trim();
      var img = spImg;
      if (!title || !img) { toast("Add a title and a photo"); return; }
      var list = B.loadJSON("brs_specials_v1", []);
      list.push({ id: "sp_" + Date.now(), title: title, caption: $("#sp-caption").value.trim(), img: img });
      B.saveSpecialsPosted(list);
      $("#sp-title").value = ""; $("#sp-caption").value = "";
      spImg = null;
      var p = $("#sp-img-preview"); if (p) { p.src = ""; p.classList.remove("has"); }
      $("#sp-img-file").value = "";
      renderSpecialsList();
      toast("Special posted");
    });

    $("#set-export").addEventListener("click", fullBackup);
    $("#set-import").addEventListener("click", function () { $("#set-import-file").click(); });
    $("#set-import-file").addEventListener("change", function () { if (this.files[0]) restoreBackup(this.files[0]); this.value = ""; });
    $("#set-reset").addEventListener("click", resetAll);
  }

  function boot() {
    loadDocs();
    bindStatic();
    switchTab("dashboard");
  }

  applySettings();
  document.addEventListener("DOMContentLoaded", function () {
    if (isUnlocked()) {
      $("#gate").style.display = "none";
      $("#hub").style.display = "block";
      boot();
    } else {
      bindStatic();
      $("#gate-pass").focus();
    }
  });
})();
