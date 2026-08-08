# Banu Rita's Savouries

A modern, mobile-first website for Banu Rita's Savouries — a home-based Indian
savoury business in Newcastle, South Africa. Customers can browse the full menu,
build an order, and send it straight to WhatsApp. The private **Owner Hub**
replaces the paper invoice book and board: it generates branded invoice/quote
PDFs, sends them via WhatsApp, and tracks stock with no server required.

Live: https://sudobreakstuff.github.io/banu-ritas-savouries/

## Pages

| Page       | Route       | Purpose                                                                 |
|------------|-------------|-------------------------------------------------------------------------|
| Shop       | `index.html` | Menu, filters, cart, WhatsApp checkout, printable order summary          |
| Owner Hub  | `owner.html` | Passcode gate, invoices/quotes → PDF + WhatsApp, stock tracker, backups  |

## Tech stack

- Vanilla HTML/CSS/JS — no build step, no dependencies to install
- [jsPDF](https://github.com/parallax/jsPDF) v2.5 from CDN for PDF generation
- Web Share API for sending PDFs to WhatsApp
- Hosted free on GitHub Pages

## Editing the menu and prices

Everything the site shows (and the Owner Hub uses) is driven by one file:

```
js/products.js
```

Open it and edit `BRS.business` (name, phones, address, order WhatsApp number,
VAT %, prefixes) and `BRS.categories` (items, prices, images, units). Add or
rename an item and it appears everywhere automatically.

> Prices shown for sweetmeats (burfee, jumbo, ladoo, coconut ice) are
> placeholders until confirmed. Update them in `js/products.js`.

## Owner Hub usage

1. Open `owner.html` and enter the passcode (set via
   `BRS.business.ownerPasscode` in `js/products.js`).
2. **Dashboard** — monthly counters and low-stock warnings.
3. **Documents** — build an invoice or quotation, save it (auto-numbered
   `INV-0001` / `QTE-0001`), preview, download as PDF, or share to WhatsApp.
   Saving an invoice automatically deducts stock.
4. **Stock** — per-item count, +/- adjust, low-stock threshold. Exported/
   imported as JSON.
5. **Settings** — override VAT %, invoice prefixes, and notes (saved in the
   browser).

### Data location & backups

Because the site is static, all data lives in the browser (localStorage):

- Cart: `brs_cart_v1`, `brs_cust_v1`
- Documents: `brs_docs_v1`
- Stock: `brs_stock_v1`, custom items `brs_custom_items_v1`
- Settings: `brs_owner_settings_v1`

Use **Settings → Backup** to download a JSON snapshot of everything, and
**Restore** to load it on another device. Back up regularly — clearing browser
data deletes everything.

### Security note

The passcode and business data are delivered to the browser and checked
client-side, which is inherent to a no-server site. It keeps the hub private
from casual visitors but is **not** a substitute for real authentication. If
real security is ever needed, move the hub behind a proper backend.

## Deployment

Static site, deployable anywhere. Current host is GitHub Pages:

```bash
git add -A
git commit -m "message"
git push origin main        # Pages auto-deploys from the main branch
```

Or preview locally:

```bash
python3 -m http.server 8080
```

## Assets

Product photos are free-to-use stock from Pixabay, optimised into
`assets/images/`. Swap in real photos of Banu Rita's products by overwriting
the same filenames (keep aspect ratios close to square for cards).
