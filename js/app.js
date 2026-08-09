/* ============================================================
   BANU RITA'S SAVOURIES — CUSTOMER SITE APP
   Renders the menu, powers the cart & WhatsApp ordering.
   ============================================================ */
(function () {
  "use strict";

  var B = window.BRS;
  var biz = B.business;

  /* ------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function fmt(n) {
    return (biz.currency || "R") + Number(n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  function waLink(phone, text) {
    var digits = String(phone || biz.orderWhatsApp).replace(/\D/g, "");
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(text);
  }
  var ESC = document.createElement("div");
  function esc(s) { ESC.textContent = s == null ? "" : String(s); return ESC.innerHTML; }

  var ICONS = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
  };

  function toast(msg) {
    var t = $("#toast");
    if (!t) return;
    t.innerHTML = '<span class="t-ico">&#10003;</span><span>' + esc(msg) + "</span>";
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* ------------------------------------------------------------
     CART STATE (localStorage)
     ------------------------------------------------------------ */
  var cart = {};   // id -> { q: qty, f: fried }
  var LS_CART = "brs_cart_v1";
  var LS_CUST = "brs_cust_v1";

  function entry(id) {
    var v = cart[id];
    if (v == null) return null;
    if (typeof v === "number") return { q: v, f: false };
    return { q: v.q || 0, f: !!v.f };
  }
  function save() { localStorage.setItem(LS_CART, JSON.stringify(cart)); }
  function load() {
    try { cart = JSON.parse(localStorage.getItem(LS_CART)) || {}; } catch (e) { cart = {}; }
  }
  function cartList() {
    return Object.keys(cart).map(function (id) {
      var item = B.itemById(id);
      var e = entry(id);
      return { id: id, item: item, qty: e.q, fried: e.f };
    }).filter(function (r) { return r.item && r.qty > 0; });
  }
  function cartCount() { return cartList().reduce(function (s, r) { return s + r.qty; }, 0); }
  function cartSubtotal() {
    return cartList().reduce(function (s, r) { return s + (r.item.price || 0) * r.qty; }, 0);
  }
  function fryTotal() {
    return cartList().reduce(function (s, r) { return s + (r.fried ? B.fryFee(r.item, r.qty) : 0); }, 0);
  }
  function isDelivery() { var el = $("#c-type-delivery"); return !!el && el.classList.contains("active"); }
  function deliveryTotal() { return isDelivery() ? (B.fees.delivery || 0) : 0; }
  function cartTotal() { return cartSubtotal() + fryTotal() + deliveryTotal(); }

  function setQty(id, qty) {
    if (qty <= 0) { delete cart[id]; }
    else {
      var e = entry(id) || { q: 0, f: false };
      cart[id] = { q: qty, f: e.f };
    }
    save();
    renderCart();
    syncCards();
  }
  function setFried(id, fried) {
    if (!cart[id]) return;
    cart[id] = { q: entry(id).q, f: !!fried };
    save();
    renderCart();
    syncCards();
  }

  /* ------------------------------------------------------------
     RENDER: MENU
     ------------------------------------------------------------ */
  var activeFilter = "all";
  var menuQuery = "";

  function buildFilterBar() {
    var bar = $("#filter-bar");
    var html = '<button class="filter-pill active" data-filter="all"><span class="fp-dot"></span>Everything</button>';
    B.categories.forEach(function (cat) {
      var short = cat.id === "pantry" ? "Pickles & Honeys" : cat.name;
      html += '<button class="filter-pill" data-filter="' + esc(cat.id) + '"><span class="fp-dot"></span>' + esc(short) + "</button>";
    });
    bar.innerHTML = html;
    $all(".filter-pill", bar).forEach(function (pill) {
      pill.addEventListener("click", function () {
        if (menuQuery) { clearSearch(); renderMenu(); }
        setFilter(pill.dataset.filter);
      });
    });
  }

  function setFilter(id) {
    activeFilter = id;
    $all(".filter-pill").forEach(function (p) { p.classList.toggle("active", p.dataset.filter === id); });
    $all(".menu-section").forEach(function (sec) { sec.classList.toggle("show", sec.dataset.cat === id || id === "all"); });
  }

  function groupItems(cat) {
    var groups = {};
    cat.items.forEach(function (it) { (groups[it.group] = groups[it.group] || []).push(it); });
    return groups;
  }

  function cardHTML(item) {
    var priceHTML;
    if (item.price == null) {
      priceHTML = '<span class="price-chip">On request</span>';
    } else {
      priceHTML = '<span class="price-chip">' + fmt(item.price) + ' <small style="opacity:.75">/ ' + esc(item.unit.replace(/^per /, "")) + "</small></span>";
    }
    return (
      '<article class="card' + (item.categoryId === "platters" ? " platter" : "") + '" data-id="' + esc(item.id) + '">' +
        '<div class="card-img">' +
          '<span class="veg-dot ' + (item.veg ? "veg" : "nonveg") + '" title="' + (item.veg ? "Vegetarian" : "Contains meat") + '"></span>' +
          '<img src="' + esc(item._img) + '" alt="' + esc(item.name) + '" loading="lazy">' +
          priceHTML +
        "</div>" +
        '<div class="card-body">' +
          '<span class="card-group">' + esc(item.group) + "</span>" +
          '<h4 class="card-title">' + esc(item.name) + "</h4>" +
          (item.desc ? '<p class="card-desc">' + esc(item.desc) + "</p>" : "") +
          '<div class="card-unit">' + esc(item.unit.charAt(0).toUpperCase() + item.unit.slice(1)) + "</div>" +
          '<div class="card-foot" data-foot></div>' +
        "</div>" +
      "</article>"
    );
  }

  function friedControl(item, fried, small) {
    if (!B.isFryable(item)) return "";
    var fee = B.fryFee(item, 1);
    return '<div class="fried-toggle' + (small ? " sm" : "") + '">' +
      '<button class="f-tog' + (!fried ? " on" : "") + '" data-fried="0" type="button">Frozen</button>' +
      '<button class="f-tog' + (fried ? " on" : "") + '" data-fried="1" type="button">Fried <em>+' + fmt(fee) + '</em></button>' +
    "</div>";
  }

  function renderFoot(item, footEl) {
    var qty = cart[item.id] ? entry(item.id).q : 0;
    var fried = cart[item.id] ? entry(item.id).f : false;
    if (item.price == null) {
      footEl.innerHTML =
        '<a class="btn btn-ghost btn-sm request-btn" href="' + waLink(biz.orderWhatsApp, "Hi Banu Rita, how much is the " + item.name + "?") + '" target="_blank" rel="noopener">' +
          ICONS.wa + " Enquire on WhatsApp" +
        "</a>";
      return;
    }
    if (qty > 0) {
      footEl.innerHTML =
        '<div class="stepper small">' +
          '<button data-action="dec" aria-label="Decrease">' + ICONS.minus + "</button>" +
          '<span class="qty">' + qty + "</span>" +
          '<button data-action="inc" aria-label="Increase">' + ICONS.plus + "</button>" +
        "</div>" +
        friedControl(item, fried) +
        '<button class="add-btn added" data-action="inc" type="button">' + ICONS.bag + " Added</button>";
    } else {
      footEl.innerHTML = '<button class="add-btn" data-action="inc" type="button">' + ICONS.bag + " Add to order</button>";
    }
    $all("button", footEl).forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var act = btn.dataset.action;
        if (act === "inc") setQty(item.id, (entry(item.id) ? entry(item.id).q : 0) + 1);
        if (act === "dec") setQty(item.id, (entry(item.id) ? entry(item.id).q : 0) - 1);
        if (btn.dataset.fried != null) setFried(item.id, btn.dataset.fried === "1");
      });
    });
  }

  function syncCards() {
    $all(".card").forEach(function (card) {
      var footEl = $("[data-foot]", card);
      if (!footEl) return;
      var item = B.itemById(card.dataset.id);
      if (item) renderFoot(item, footEl);
    });
  }

  function renderMenu() {
    var root = $("#menu-root");
    var html = "";
    B.categories.forEach(function (cat) {
      html += '<div class="menu-section" data-cat="' + esc(cat.id) + '">';
      html += '<div class="menu-section-head"><span class="paisley small"></span><h3>' + esc(cat.name) + "</h3><span class='paisley line'></span></div>";
      if (cat.blurb) html += '<p class="section-lead" style="margin-bottom:26px">' + esc(cat.blurb) + "</p>";
      var groups = groupItems(cat);
      Object.keys(groups).forEach(function (g) {
        html += '<div class="group-head">' + esc(g) + "</div>";
        html += '<div class="menu-grid">' + groups[g].map(cardHTML).join("") + "</div>";
      });
      html += "</div>";
    });
    var custom = B.allItems().filter(function (i) { return i._custom; });
    if (custom.length) {
      html += '<div class="menu-section" data-cat="custom">';
      html += '<div class="menu-section-head"><span class="paisley small"></span><h3>Custom items</h3><span class="paisley line"></span></div>';
      html += '<div class="group-head">From Banu\'s kitchen</div>';
      html += '<div class="menu-grid">' + custom.map(cardHTML).join("") + "</div>";
      html += "</div>";
    }
    root.innerHTML = html;
    syncCards();
  }

  /* ------------------------------------------------------------
     SEARCH — filter the whole menu by name / group / category / notes
     ------------------------------------------------------------ */
  function matchesQuery(item, tokens) {
    var hay = [item.name, item.group, item.category, item.desc || "", item.unit].join(" ").toLowerCase();
    return tokens.every(function (t) { return hay.indexOf(t) !== -1; });
  }

  function applySearch(q) {
    q = (q || "").trim();
    if (q === menuQuery) return;
    menuQuery = q;
    var root = $("#menu-root");
    if (!root) return;
    if (!q) { renderMenu(); setFilter(activeFilter); return; }

    var tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    var matched = B.allItems().filter(function (it) { return matchesQuery(it, tokens); });
    var html = "";
    if (matched.length) {
      html += '<div class="search-head"><b>' + matched.length + "</b> " + (matched.length === 1 ? "result for" : "results for") + ' “' + esc(q) + "”</div>";
      var byCat = {};
      matched.forEach(function (it) { (byCat[it.categoryId] = byCat[it.categoryId] || []).push(it); });
      Object.keys(byCat).forEach(function (catId) {
        var cat = B.categoryById(catId);
        var catName = cat ? cat.name : "Custom items";
        html += '<div class="menu-section show" data-cat="' + esc(catId) + '">';
        html += '<div class="menu-section-head"><span class="paisley small"></span><h3>' + esc(catName) + "</h3><span class='paisley line'></span></div>";
        var byGroup = {};
        byCat[catId].forEach(function (it) { (byGroup[it.group] = byGroup[it.group] || []).push(it); });
        Object.keys(byGroup).forEach(function (g) {
          html += '<div class="group-head">' + esc(g) + "</div>";
          html += '<div class="menu-grid">' + byGroup[g].map(cardHTML).join("") + "</div>";
        });
        html += "</div>";
      });
    } else {
      html = '<div class="search-head">No items match “' + esc(q) + '”</div>';
    }
    root.innerHTML = html;
    syncCards();
  }

  function clearSearch() {
    var box = $("#search-input");
    if (box) box.value = "";
    menuQuery = "";
  }

  /* ------------------------------------------------------------
     RENDER: SPECIALS (ads)
     ------------------------------------------------------------ */
  function renderSpecials() {
    var root = $("#specials-root");
    if (!root) return;
    var list = B.specialsList();
    if (!list.length) { root.innerHTML = ""; return; }
    root.innerHTML = list.map(function (ad) {
      return (
        '<button class="special-card" type="button" data-zoom="' + esc(ad.img) + '" aria-label="Enlarge ' + esc(ad.title) + '">' +
          '<img src="' + esc(ad.img) + '" alt="' + esc(ad.title) + '" loading="lazy">' +
          '<div class="special-meta">' +
            "<h3>" + esc(ad.title) + "</h3>" +
            (ad.caption ? "<p>" + esc(ad.caption) + "</p>" : "") +
          "</div>" +
        "</button>"
      );
    }).join("");
    $all(".special-card", root).forEach(function (card) {
      card.addEventListener("click", function () { openLightbox(card.dataset.zoom); });
    });
  }

  function openLightbox(src) {
    var img = $("#lightbox-img");
    if (!img) return;
    img.src = src;
    $("#lightbox").classList.add("on");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    var lb = $("#lightbox");
    if (!lb) return;
    lb.classList.remove("on");
    document.body.style.overflow = "";
  }

  /* ------------------------------------------------------------
     HERO: particles, marquee, counters
     ------------------------------------------------------------ */
  function initParticles() {
    var canvas = $("#hero-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var W, H, dpr = 1, pts = [];
    function resize() {
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      W = canvas.clientWidth; H = canvas.clientHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    for (var i = 0; i < 46; i++) {
      pts.push({
        x: Math.random() * (W || 1200), y: Math.random() * (H || 700),
        r: 0.6 + Math.random() * 1.8, vy: -(0.12 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 0.2, tw: Math.random() * Math.PI * 2
      });
    }
    (function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.y += p.vy; p.x += p.vx; p.tw += 0.03;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        var a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = "rgba(240,236,226," + a + ")";
        ctx.fill();
      }
      requestAnimationFrame(draw);
    })();
  }

  function initMarquee() {
    var track = $("#marquee");
    if (!track) return;
    var names = [];
    B.categories.forEach(function (c) { c.items.forEach(function (it) { if (names.indexOf(it.name) === -1) names.push(it.name); }); });
    var half = names.map(function (n) { return "<span>" + esc(n) + "</span><b>&#10022;</b>"; }).join("");
    track.innerHTML = half + half;
  }

  function initCounters() {
    var items = B.allItems();
    var samFlav = items.filter(function (i) { return i.group === "Samoosas"; }).length;
    var platters = items.filter(function (i) { return i.categoryId === "platters"; }).length;
    var pickles = items.filter(function (i) { return i.group === "Pickles" || i.group === "Chutneys"; }).length;
    setCount("m-items", items.length);
    setCount("m-samflav", samFlav);
    setCount("m-platters", platters);
    setCount("m-pickles", pickles);

    var counted = false;
    function run() {
      if (counted) return;
      var wrap = $("#hero-metrics");
      if (!wrap) return;
      if (wrap.getBoundingClientRect().top > window.innerHeight) return;
      counted = true;
      $all(".hmv[data-count]").forEach(function (el) {
        var target = parseInt(el.dataset.count, 10) || 0;
        var start = null;
        (function step(ts) {
          var t = ts || 0;
          if (start == null) start = t;
          var k = Math.min(1, (t - start) / 1200);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
          else el.textContent = String(target);
        })(0);
      });
    }
    var metricsWrap = $("#hero-metrics");
    if (metricsWrap && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { run(); io.disconnect(); } });
      }, { threshold: 0.2 });
      io.observe(metricsWrap);
    }
    window.addEventListener("scroll", run);
    window.addEventListener("resize", run);
    run();
  }
  function setCount(id, n) { var el = document.getElementById(id); if (el) el.dataset.count = n; }

  /* ------------------------------------------------------------
     RENDER: CART DRAWER
     ------------------------------------------------------------ */
  function customerData() {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    return {
      name: g("c-name"), phone: g("c-phone"), type: $("#c-type-collection").classList.contains("active") ? "Collection" : "Delivery",
      addr: g("c-addr"), when: g("c-when"), notes: g("c-notes")
    };
  }

  function renderCart() {
    var body = $("#cart-body");
    var list = cartList();
    var count = cartCount();

    $all(".cart-count").forEach(function (el) { el.textContent = count; el.classList.toggle("on", count > 0); });
    $("#cart-bar").classList.toggle("show", count > 0);
    document.body.classList.toggle("has-cart-bar", count > 0);

    if (!list.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<span class="paisley"></span>' +
          "<h4>Your basket is empty</h4>" +
          "<p>Add a few savouries or a platter to get started.</p>" +
        "</div>";
      refreshTotals();
      return;
    }

    var html = "";
    list.forEach(function (r) {
      var lineTotal = (r.item.price || 0) * r.qty + (r.fried ? B.fryFee(r.item, r.qty) : 0);
      html +=
        '<div class="cart-item" data-id="' + esc(r.id) + '">' +
          '<img class="ci-img" src="' + esc(r.item._img) + '" alt="">' +
          '<div class="ci-info">' +
            '<div class="ci-name">' + esc(r.item.name) + (r.fried ? ' <span class="ci-fried">Fried</span>' : "") + "</div>" +
            '<div class="ci-unit">' + esc(r.item.unit) + (r.item.price != null ? " &middot; " + fmt(r.item.price) : "") + "</div>" +
            friedControl(r.item, r.fried, true) +
          "</div>" +
          '<div class="stepper small">' +
            '<button data-id="' + esc(r.id) + '" data-act="dec">' + ICONS.minus + "</button>" +
            '<span class="qty">' + r.qty + "</span>" +
            '<button data-id="' + esc(r.id) + '" data-act="inc">' + ICONS.plus + "</button>" +
          "</div>" +
          '<span class="ci-price">' + (r.item.price != null ? fmt(lineTotal) : "&mdash;") + "</span>" +
          '<button class="ci-x" data-id="' + esc(r.id) + '" data-act="rm" aria-label="Remove">' + ICONS.x + "</button>" +
        "</div>";
    });
    html +=
      '<div class="cart-form">' +
        '<div><label class="f-label">Your name</label><input class="f-input" id="c-name" placeholder="Full name" autocomplete="name"></div>' +
        '<div><label class="f-label">Phone</label><input class="f-input" id="c-phone" placeholder="071 000 0000" inputmode="tel" autocomplete="tel"></div>' +
        '<div class="radio-row">' +
          '<button type="button" class="radio-pill active" id="c-type-collection">Collection</button>' +
          '<button type="button" class="radio-pill" id="c-type-delivery">Delivery <em>+' + fmt(B.fees.delivery || 0) + "</em></button>" +
        "</div>" +
        '<div id="addr-wrap"><label class="f-label">Delivery address</label><textarea class="f-textarea" id="c-addr" placeholder="Street, suburb, area"></textarea></div>' +
        '<div><label class="f-label">Collect / deliver when?</label><input class="f-input" id="c-when" placeholder="e.g. Saturday afternoon, before 3pm"></div>' +
        '<div><label class="f-label">Notes (optional)</label><textarea class="f-textarea" id="c-notes" placeholder="Anything else? Allergies?"></textarea></div>' +
        '<div class="cart-totals">' +
          '<div class="ct-row"><span>Subtotal</span><b id="ct-sub">' + fmt(cartSubtotal()) + "</b></div>" +
          '<div class="ct-row" id="ct-fry-row"><span>Frying fee</span><b id="ct-fry">' + fmt(fryTotal()) + "</b></div>" +
          '<div class="ct-row" id="ct-del-row"><span>Delivery</span><b id="ct-del">' + fmt(deliveryTotal()) + "</b></div>" +
          '<div class="ct-row grand"><span>Total</span><b id="ct-total">' + fmt(cartTotal()) + "</b></div>" +
        "</div>" +
      "</div>";

    body.innerHTML = html;

    $all("[data-act]", body).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.id;
        if (btn.dataset.act === "inc") setQty(id, (entry(id) ? entry(id).q : 0) + 1);
        if (btn.dataset.act === "dec") setQty(id, (entry(id) ? entry(id).q : 0) - 1);
        if (btn.dataset.act === "rm") setQty(id, 0);
      });
    });

    $all("[data-fried]", body).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var itemEl = btn.closest(".cart-item");
        if (!itemEl || !itemEl.dataset.id) return;
        setFried(itemEl.dataset.id, btn.dataset.fried === "1");
      });
    });

    $all(".radio-pill").forEach(function (p) {
      p.addEventListener("click", function () {
        $all(".radio-pill").forEach(function (x) { x.classList.remove("active"); });
        p.classList.add("active");
        $("#addr-wrap").classList.toggle("show", p.id === "c-type-delivery");
        refreshTotals();
      });
    });

    /* restore + save customer info */
    try { var saved = JSON.parse(localStorage.getItem(LS_CUST)) || {}; } catch (e) { var saved = {}; }
    ["c-name", "c-phone", "c-addr", "c-when", "c-notes"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && saved[id]) el.value = saved[id];
      if (el) el.addEventListener("input", function () {
        saved[id] = el.value;
        localStorage.setItem(LS_CUST, JSON.stringify(saved));
      });
    });
    if (saved.type === "Delivery") {
      $("#c-type-delivery").classList.add("active");
      $("#c-type-collection").classList.remove("active");
      $("#addr-wrap").classList.add("show");
    }
    refreshTotals();
  }

  function refreshTotals() {
    var sub = $("#ct-sub"), fry = $("#ct-fry"), del = $("#ct-del"), tot = $("#ct-total");
    if (sub) sub.textContent = fmt(cartSubtotal());
    if (fry) { fry.textContent = fmt(fryTotal()); var frow = $("#ct-fry-row"); if (frow) frow.style.display = fryTotal() ? "" : "none"; }
    if (del) { del.textContent = fmt(deliveryTotal()); var drow = $("#ct-del-row"); if (drow) drow.style.display = deliveryTotal() ? "" : "none"; }
    if (tot) tot.textContent = fmt(cartTotal());
    var stat = $("#cart-total"); if (stat) stat.textContent = fmt(cartTotal());
    var bar = $("#cart-bar-total"); if (bar) bar.textContent = fmt(cartTotal());
  }

  /* ------------------------------------------------------------
     WHATSAPP ORDER MESSAGE
     ------------------------------------------------------------ */
  function buildOrderMessage() {
    var c = customerData();
    var lines = [];
    lines.push("*NEW ORDER — " + biz.name.toUpperCase() + "*");
    lines.push("");
    if (c.name) lines.push("*Name:* " + c.name);
    if (c.phone) lines.push("*Phone:* " + c.phone);
    lines.push("*Type:* " + c.type);
    if (c.type === "Delivery" && c.addr) lines.push("*Address:* " + c.addr);
    if (c.when) lines.push("*When:* " + c.when);
    if (c.notes) lines.push("*Notes:* " + c.notes);
    lines.push("");
    lines.push("-----------------------");
    cartList().forEach(function (r) {
      var line = r.qty + "x " + r.item.name + " (" + r.item.unit + ")" + (r.fried ? " — FRIED" : "");
      if (r.item.price != null) {
        var amt = r.item.price * r.qty + (r.fried ? B.fryFee(r.item, r.qty) : 0);
        line += " = " + fmt(amt);
      }
      lines.push(line);
    });
    var fry = fryTotal(), del = deliveryTotal();
    if (fry) lines.push("Frying fee (+" + fmt(B.fees.fry) + "/dozen): " + fmt(fry));
    if (del) lines.push("Delivery fee: " + fmt(del));
    lines.push("-----------------------");
    lines.push("*TOTAL: " + fmt(cartTotal()) + "*");
    lines.push("");
    lines.push("Payment before collection/delivery. Please confirm my order & availability. Thank you!");
    return lines.join("\n");
  }

  /* ------------------------------------------------------------
     DRAWER OPEN / CLOSE
     ------------------------------------------------------------ */
  function openCart() { $("#cart").classList.add("on"); $("#cart-overlay").classList.add("on"); document.body.style.overflow = "hidden"; }
  function closeCart() { $("#cart").classList.remove("on"); $("#cart-overlay").classList.remove("on"); document.body.style.overflow = ""; }

  function initEvents() {
    $("#cart-close").addEventListener("click", closeCart);
    $("#cart-overlay").addEventListener("click", closeCart);
    $("#nav-cart").addEventListener("click", openCart);
    $("#cart-bar").addEventListener("click", openCart);
    $("#nav-order").addEventListener("click", openCart);
    $("#hero-order").addEventListener("click", function () { window.scrollTo({ top: $("#menu").offsetTop - 80, behavior: "smooth" }); });

    var plattersLink = document.querySelector('#nav-links a[href="#platters"]');
    if (plattersLink) plattersLink.addEventListener("click", function () {
      setFilter("platters");
      window.scrollTo({ top: $("#menu").offsetTop - 80, behavior: "smooth" });
    });

    $("#wa-checkout").addEventListener("click", function () {
      if (!cartList().length) return;
      var msg = buildOrderMessage();
      var c = customerData();
      if (!c.name) { toast("Please add your name"); var n = $("#c-name"); if (n) n.focus(); return; }
      if (!c.phone) { toast("Please add a phone number"); var p = $("#c-phone"); if (p) p.focus(); return; }
      window.open(waLink(biz.orderWhatsApp, msg), "_blank");
      toast("Opening WhatsApp with your order");
    });

    $("#pdf-order").addEventListener("click", function () {
      if (!cartList().length) return;
      var c = customerData();
      window.BRSPDF.makeOrderPdf({
        title: "Order Summary",
        customer: c,
        items: cartList(),
        subtotal: cartSubtotal(),
        fryFee: fryTotal(),
        delivery: deliveryTotal(),
        total: cartTotal()
      }, function () { toast("Preparing your PDF…"); }, function (err) {
        toast(err || "Could not create PDF — try WhatsApp instead");
      });
    });

    $("#nav-burger").addEventListener("click", function () { $("#nav-links").classList.toggle("open"); });
    $all("#nav-links a").forEach(function (a) {
      a.addEventListener("click", function () { $("#nav-links").classList.remove("open"); });
    });

    var lb = $("#lightbox");
    if (lb) {
      lb.addEventListener("click", closeLightbox);
      var lbClose = $("#lightbox-close");
      if (lbClose) lbClose.addEventListener("click", function (e) { e.stopPropagation(); closeLightbox(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLightbox(); });
    }

    /* search */
    var searchBox = $("#search-input");
    if (searchBox) {
      searchBox.addEventListener("input", function () { applySearch(searchBox.value); });
      var searchClear = $("#search-clear");
      if (searchClear) {
        searchClear.addEventListener("click", function () {
          clearSearch();
          renderMenu();
          setFilter(activeFilter);
          searchBox.focus();
        });
      }
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) {
        e.preventDefault();
        if (searchBox) searchBox.focus();
      }
    });

    /* scroll nav + active link */
    var sections = ["specials", "menu", "how", "story", "visit"];
    window.addEventListener("scroll", function () {
      $("#nav").classList.toggle("scrolled", window.scrollY > 20);
      var pos = window.scrollY + 140;
      var current = null;
      sections.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.offsetTop <= pos) current = id;
      });
      $all("#nav-links a[data-link]").forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + current);
      });
    });

    /* reveal */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $all(".reveal").forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------
     FOOTER / CONTACT FILL
     ------------------------------------------------------------ */
  function fillContact() {
    $("#vc-address").textContent = biz.address;
    $("#foot-address").textContent = biz.address;
    $("#vc-phone").textContent = biz.phone + " (Banu Rita)";
    $("#vc-phone2").textContent = biz.phone2 + " (Robin Singh)";
    $("#foot-phone").textContent = "Banu Rita: " + biz.phone;
    $("#foot-phone2").textContent = "Robin Singh: " + biz.phone2;
    $("#vc-map").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(biz.mapQuery);
    $("#foot-social").href = biz.socialUrl;
    $("#foot-social-name").textContent = biz.social;
    $("#vc-wa").href = waLink(biz.orderWhatsApp, "Hi Banu Rita! I found your website and I'd like to place an order.");
    $("#wa-float").href = waLink(biz.orderWhatsApp, "Hi Banu Rita! I'd like to place an order.");
    $("#foot-order").href = waLink(biz.orderWhatsApp, "Hi Banu Rita! I'd like to place an order.");
    var hrs = biz.hours.map(function (h) { return "<li><span>" + esc(h.d) + "</span><b>" + esc(h.h) + "</b></li>"; }).join("");
    $("#hours").innerHTML = hrs;
    $("#disclaimers").innerHTML = B.disclaimers.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("");
    $("#year").textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------
     BOOT
     ------------------------------------------------------------ */
  function init() {
    load();
    renderSpecials();
    buildFilterBar();
    renderMenu();
    setFilter(activeFilter);
    renderCart();
    initParticles();
    initMarquee();
    initCounters();
    initEvents();
    fillContact();
    /* live cloud sync — re-render when Banu updates photos / menu / specials */
    if (window.CLOUD && CLOUD.enabled) {
      CLOUD.onChange(function (data) {
        if (typeof B.applyCloud === "function") B.applyCloud(data);
        renderSpecials();
        buildFilterBar();
        if (menuQuery) { applySearch($("#search-input") ? $("#search-input").value : ""); }
        else { renderMenu(); setFilter(activeFilter); }
      });
    }
    /* deep-link to a category (e.g. #platters) */
    var hash = location.hash.replace("#", "");
    if (hash && B.categories.some(function (c) { return c.id === hash; })) setFilter(hash);
    /* strip a stray hash without scrolling */
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
