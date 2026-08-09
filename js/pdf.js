/* ============================================================
   BANU RITA'S SAVOURIES — PDF BUILDER (jsPDF)
   Order summaries (customer) + invoices & quotes (Owner Hub).
   ============================================================ */
(function () {
  "use strict";
  var B = window.BRS;
  var biz = B.business;

  var MARIGOLD = [16, 17, 20];      // near-black
  var WHITE = [255, 255, 255];
  var LIGHT = [205, 209, 215];      // cool light gray for header subtext
  var RED = [176, 46, 36];
  var INK = [28, 28, 31];
  var MUTED = [120, 124, 130];      // neutral gray

  function docOrErr(onError) {
    if (window.jspdf && window.jspdf.jsPDF) return new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    if (onError) onError("PDF library not loaded — check your connection and try again.");
    return null;
  }

  function fmtMoney(n) { return (biz.currency || "R") + Number(n || 0).toFixed(2); }
  function esc(s) { return String(s == null ? "" : s); }

  function roundRect(doc, x, y, w, h, r) {
    doc.roundedRect(x, y, w, h, r, r);
  }

  /* ---------- shared header / footer ---------- */
  function drawHeader(doc, meta) {
    var W = 210, M = 16;

    /* brand band */
    doc.setFillColor(MARIGOLD[0], MARIGOLD[1], MARIGOLD[2]);
    doc.rect(0, 0, W, 30, "F");
    doc.setFillColor(RED[0], RED[1], RED[2]);
    doc.rect(0, 30, W, 2.4, "F");

    /* brand mark — solid red disc with white "B" */
    doc.setFillColor(RED[0], RED[1], RED[2]);
    doc.circle(14, 15, 7.6, "F");
    doc.setDrawColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setLineWidth(0.6);
    doc.circle(14, 15, 6.7, "S");
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("B", 14, 17.1, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(biz.name, 27, 14.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    doc.text(biz.addressShort, 27, 20);
    doc.text(biz.phone + "  |  " + biz.phone2, 27, 25);

    /* doc type + number, right side */
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(meta.title, W - M, 14.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    doc.text("No. " + meta.number, W - M, 20, { align: "right" });
    doc.text("Date: " + meta.date, W - M, 25, { align: "right" });
  }

  function drawFooter(doc) {
    var W = 210, H = 297;
    doc.setDrawColor(RED[0], RED[1], RED[2]);
    doc.setLineWidth(0.4);
    doc.line(16, H - 22, W - 16, H - 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(biz.name + " — " + biz.address, W / 2, H - 15, { align: "center" });
    doc.text(biz.phone + " | " + biz.phone2 + " | " + biz.social, W / 2, H - 10, { align: "center" });
  }

  function drawBillTo(doc, y, customer) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(RED[0], RED[1], RED[2]);
    doc.text("BILL TO", 16, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    var lines = [];
    if (customer.name) lines.push(customer.name);
    if (customer.phone) lines.push(customer.phone);
    if (customer.addr) lines.push(customer.addr);
    lines.push(customer.notes || "");
    var line = lines.filter(Boolean).join("\n") || "—";
    doc.text(line, 16, y + 5);
    return y + 5 + line.split("\n").length * 4.6 + 4;
  }

  function drawItems(doc, y, items, opts) {
    opts = opts || {};
    var W = 210, M = 16;
    var colQty = M, colItem = M + 16, colUnitR = M + 118, colPriceR = M + 150, colAmtR = W - M;
    var nameW = colUnitR - colItem - 6;

    /* header row */
    doc.setFillColor(MARIGOLD[0], MARIGOLD[1], MARIGOLD[2]);
    roundRect(doc, M, y, W - M * 2, 9, 2.5);
    doc.fill();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.text("QTY", colQty, y + 6);
    doc.text("ITEM", colItem, y + 6);
    doc.text("UNIT", colUnitR, y + 6, { align: "right" });
    doc.text("PRICE", colPriceR, y + 6, { align: "right" });
    doc.text("AMOUNT", colAmtR, y + 6, { align: "right" });

    y += 11;
    doc.setFont("helvetica", "normal");
    items.forEach(function (it, idx) {
      var name = it.name || it.desc || "Item";
      var desc = it.unit || "";
      var price = it.price;
      var qty = it.qty || 1;
      var amount = price != null ? price * qty : null;

      var nameLines = doc.splitTextToSize(name, nameW);
      var rowH = Math.max(7.5, nameLines.length * 4.6 + 2.6);

      if (idx % 2 === 1) {
        doc.setFillColor(243, 243, 243);
        roundRect(doc, M, y - 3.4, W - M * 2, rowH, 1.5);
        doc.fill();
      }

      doc.setFontSize(8.5);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(String(qty), colQty, y + 1);
      doc.text(nameLines, colItem, y + 1);
      doc.text(desc, colUnitR, y + 1, { align: "right" });
      doc.text(price != null ? fmtMoney(price) : "—", colPriceR, y + 1, { align: "right" });
      doc.text(amount != null ? fmtMoney(amount) : "—", colAmtR, y + 1, { align: "right" });
      y += rowH + 1.6;
    });
    return y + 2;
  }

  function drawTotals(doc, y, total, opts) {
    opts = opts || {};
    var W = 210;
    var x = 112, col = 82;

    function row(label, value, bold) {
      if (bold) { doc.setFont("helvetica", "bold"); doc.setFontSize(11); } else { doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); }
      doc.setTextColor(bold ? RED[0] : MUTED[0], bold ? RED[1] : MUTED[1], bold ? RED[2] : MUTED[2]);
      doc.text(label, x, y, { align: "right" });
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(value, x + col, y, { align: "right" });
      y += bold ? 9 : 6.5;
      return y;
    }

    if (opts.subtotal != null) y = row("Subtotal", fmtMoney(opts.subtotal));
    if (opts.fryFee) y = row("Frying fee", fmtMoney(opts.fryFee));
    if (opts.delivery) y = row("Delivery", fmtMoney(opts.delivery));
    if (opts.discount) y = row("Discount", "− " + fmtMoney(opts.discount));
    if (opts.vatPercent) y = row("VAT (" + opts.vatPercent + "%)", fmtMoney(opts.vatAmount));
    doc.setDrawColor(RED[0], RED[1], RED[2]);
    doc.setLineWidth(0.4);
    doc.line(x, y - 2, x + col, y - 2);
    y = row("TOTAL " + (opts.title || "").toUpperCase(), fmtMoney(total), true);
    return y;
  }

  function drawNotes(doc, y, notes) {
    notes = (notes || []).filter(Boolean);
    if (!notes.length) return y;
    y += 4;
    var h = 13 + notes.length * 4.4;
    doc.setFillColor(243, 243, 243);
    roundRect(doc, 16, y, 178, h, 3);
    doc.fill();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(RED[0], RED[1], RED[2]);
    doc.text("NOTES / TERMS", 22, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    var i = 1;
    notes.forEach(function (n) {
      doc.text("\u2022 " + n, 22, y + 6 + i * 4.4, { maxWidth: 165 });
      i++;
    });
    return y + h + 6;
  }

  /* ------------------------------------------------------------
     PUBLIC: order summary (customer)
     ------------------------------------------------------------ */
  function makeOrderPdf(opts, onStart, onError) {
    var doc = docOrErr(onError);
    if (!doc) return;
    if (onStart) onStart();

    var customer = opts.customer || {};
    var items = opts.items || [];
    var subtotal = items.reduce(function (s, r) { return s + (r.item.price || 0) * r.qty; }, 0);
    var fryFee = Number(opts.fryFee) || 0;
    var delivery = Number(opts.delivery) || 0;
    var total = subtotal + fryFee + delivery;

    var d = new Date();
    var date = d.toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });

    drawHeader(doc, { title: "ORDER SUMMARY", number: "ORD-" + d.getTime().toString().slice(-6), date: date });

    var y = 48;
    y = drawBillTo(doc, y, customer);
    y += 2;
    y = drawItems(doc, y, items.map(function (r) {
      return { name: r.item.name + (r.fried ? " (Fried)" : ""), unit: r.item.unit, price: r.item.price, qty: r.qty };
    }));
    y = drawTotals(doc, y, total, { subtotal: subtotal, fryFee: fryFee, delivery: delivery, title: "Order" });
    drawNotes(doc, y, [
      biz.notes,
      "Please confirm availability and collection/delivery time via WhatsApp."
    ]);
    drawFooter(doc);

    if (opts.blobOnly) {
      var blob = doc.output("blob");
      if (opts.onBlob) opts.onBlob(blob, date);
      return doc;
    }
    if (opts.filename) doc.save(opts.filename);
    return doc;
  }

  /* ------------------------------------------------------------
     PUBLIC: invoice / quote (Owner Hub)
     ------------------------------------------------------------ */
  function makeInvoicePdf(opts, onError) {
    var doc = docOrErr(onError);
    if (!doc) return;
    var isQuote = opts.docType === "quote";

    var items = opts.items || [];
    var subtotal = items.reduce(function (s, it) { return s + (it.price || 0) * (it.qty || 1); }, 0);
    var fryFee = Number(opts.fryFee) || 0;
    var delivery = Number(opts.delivery) || 0;
    var discount = Number(opts.discount) || 0;
    var vatPct = Number(opts.vatPercent != null ? opts.vatPercent : biz.vatPercent) || 0;
    var vatAmount = (subtotal + fryFee + delivery - discount) * vatPct / 100;
    var total = subtotal + fryFee + delivery - discount + vatAmount;

    drawHeader(doc, {
      title: isQuote ? "QUOTATION" : "TAX INVOICE",
      number: opts.number,
      date: opts.date || new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })
    });

    var y = 48;
    y = drawBillTo(doc, y, opts.customer || {});
    y += 2;
    y = drawItems(doc, y, items);
    y = drawTotals(doc, y, total, {
      subtotal: subtotal,
      fryFee: fryFee,
      delivery: delivery,
      discount: discount,
      vatPercent: vatPct,
      vatAmount: vatAmount,
      title: isQuote ? "Quoted" : "Due"
    });
    var notes = opts.notes || [];
    notes = notes.concat([
      biz.notes,
      isQuote ? "Quotation valid for 7 days. Prices may change without notice." : "Thank you for your business!"
    ]);
    drawNotes(doc, y, notes);
    drawFooter(doc);

    return { doc: doc, total: total, subtotal: subtotal, vatAmount: vatAmount, discount: discount, fryFee: fryFee, delivery: delivery };
  }

  window.BRSPDF = { makeOrderPdf: makeOrderPdf, makeInvoicePdf: makeInvoicePdf, fmtMoney: fmtMoney };
})();
