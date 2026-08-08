/* ============================================================
   BANU RITA'S SAVOURIES — MENU & BUSINESS DATA
   ------------------------------------------------------------
   This is the ONLY file you need to edit to change:
   • prices            • menu items      • phone numbers
   • address / hours   • business name   • VAT %
   • the Owner Hub passcode
   Save the file, push to GitHub, and the live site updates.
   ============================================================ */

window.BRS = window.BRS || {};

/* ------------------------------------------------------------
   BUSINESS INFORMATION
   ------------------------------------------------------------ */
BRS.business = {
  name: "Banu Rita's Savouries",
  tagline: "Homemade Indian savouries, sweetmeats & more — made the old-fashioned way",
  established: "Family owned & proudly Newcastle",
  address: "52 D Jenkyn Street, Paradise, Newcastle, 2940",
  addressShort: "Newcastle, KwaZulu-Natal",
  mapQuery: "52 D Jenkyn Street, Paradise, Newcastle, 2940",

  /* Phone numbers shown on the site */
  phone: "084 773 9558",
  phone2: "082 469 3217",
  /* WhatsApp international format (country code + number, no +) */
  whatsappPhone: "27847739558",
  whatsappPhone2: "27824693217",

  /* Number that RECEIVES customer orders */
  orderWhatsApp: "27847739558",

  social: "@BanuRitasSavouries",
  socialUrl: "https://www.instagram.com/BanuRitasSavouries",

  /* Collection / opening hours shown to customers */
  hours: [
    { d: "Monday – Friday", h: "08:00 – 18:00" },
    { d: "Saturday", h: "08:00 – 16:00" },
    { d: "Sunday", h: "By arrangement" }
  ],

  /* Owner Hub */
  ownerPasscode: "banu2026",      // CHANGE THIS — client-side gate only
  vatPercent: 0,                  // VAT charged on invoices (0 if not registered)
  invoicePrefix: "INV",           // e.g. INV-0001
  quotePrefix: "QTE",             // e.g. QTE-0001
  currency: "R",

  notes: "Payment to be made prior to collection or delivery."
};

/* ------------------------------------------------------------
   NOTES & DISCLAIMERS shown in the footer of the customer site
   ------------------------------------------------------------ */
BRS.disclaimers = [
  "All savoury prices are per dozen for frozen items.",
  "Frying adds R10 per dozen, with a minimum order of 2 dozen.",
  "Additional charges do not apply to Vedas and Bhajias.",
  "Payment is made prior to collection or delivery.",
  "Strictly no half-dozens are sold.",
  "All pickles & chutneys are 250ml bottles, available seasonally, with a shelf life of approx. 3 months."
];

/* ------------------------------------------------------------
   MENU
   ------------------------------------------------------------
   Each category has an id, a short name, a longer description,
   and a list of items. Edit an item's `price` (or set null for
   "Price on request"). `unit` describes how the item is sold.
   ------------------------------------------------------------ */

BRS.categories = [

  /* ============ SAVOURIES ============ */
  {
    id: "savouries",
    name: "Savouries",
    blurb: "Hand-rolled, golden and fried to perfection. Sold frozen — we fry fresh on order.",
    img: "samosa.jpg",
    items: [
      { id: "sam-mutton", name: "Mutton Samoosas", group: "Samoosas", price: 60, unit: "per dozen", veg: false, img: "samosa.jpg" },
      { id: "sam-chicken", name: "Chicken Samoosas", group: "Samoosas", price: 55, unit: "per dozen", veg: false, img: "samosa.jpg" },
      { id: "sam-tinfish", name: "Tinfish Samoosas", group: "Samoosas", price: 45, unit: "per dozen", veg: false, img: "samosa.jpg" },
      { id: "sam-sweetcorn", name: "Sweetcorn & Cheese Samoosas", group: "Samoosas", price: 55, unit: "per dozen", veg: true, img: "samosa.jpg" },
      { id: "sam-soyamin", name: "Soya Mince Samoosas", group: "Samoosas", price: 45, unit: "per dozen", veg: true, img: "samosa.jpg" },
      { id: "sam-potato", name: "Potato Samoosas", group: "Samoosas", price: 40, unit: "per dozen", veg: true, img: "samosa.jpg" },
      { id: "sam-jalapeno", name: "Jalapeno & Cheese Samoosas", group: "Samoosas", price: 55, unit: "per dozen", veg: true, img: "samosa.jpg" },
      { id: "sam-moong", name: "Moongdhall Samoosas", group: "Samoosas", price: 35, unit: "per dozen", veg: true, img: "samosa.jpg" },

      { id: "pie-mutton", name: "Mutton Pies", group: "Pies & Rolls", price: 60, unit: "per dozen", veg: false, img: "meat-pie.jpg" },
      { id: "pie-chicken", name: "Chicken Pies", group: "Pies & Rolls", price: 55, unit: "per dozen", veg: false, img: "meat-pie.jpg" },
      { id: "pie-tinfish", name: "Tinfish Pies", group: "Pies & Rolls", price: 45, unit: "per dozen", veg: false, img: "meat-pie.jpg" },
      { id: "pie-mutsausage", name: "Mutton Sausage Rolls", group: "Pies & Rolls", price: 60, unit: "per dozen", veg: false, img: "sausage-rolls.jpg" },
      { id: "pie-chksausage", name: "Chicken Sausage Rolls", group: "Pies & Rolls", price: 55, unit: "per dozen", veg: false, img: "sausage-rolls.jpg" },
      { id: "pie-mutspiral", name: "Mutton Spirals", group: "Pies & Rolls", price: 60, unit: "per dozen", veg: false, img: "sausage-rolls.jpg" },
      { id: "pie-chkspiral", name: "Chicken Spirals", group: "Pies & Rolls", price: 55, unit: "per dozen", veg: false, img: "sausage-rolls.jpg" },
      { id: "pie-sweetcorn", name: "Sweetcorn & Cheese Pies", group: "Pies & Rolls", price: 55, unit: "per dozen", veg: true, img: "meat-pie.jpg" },
      { id: "pie-mushroom", name: "Mushroom & Cheese Pies", group: "Pies & Rolls", price: 50, unit: "per dozen", veg: true, img: "meat-pie.jpg" },
      { id: "pie-soyasausage", name: "Soya Sausage Rolls", group: "Pies & Rolls", price: 50, unit: "per dozen", veg: true, img: "sausage-rolls.jpg" },

      { id: "sr-mutton", name: "Mutton Spring Rolls", group: "Spring Rolls", price: 60, unit: "per dozen", veg: false, img: "spring-rolls.jpg" },
      { id: "sr-chicken", name: "Chicken Spring Rolls", group: "Spring Rolls", price: 55, unit: "per dozen", veg: false, img: "spring-rolls.jpg" },
      { id: "sr-hawaiian", name: "Hawaiian Spring Rolls", group: "Spring Rolls", price: 45, unit: "per dozen", veg: true, img: "spring-rolls.jpg" },
      { id: "sr-patharolls", name: "Patha Rolls", group: "Spring Rolls", price: 35, unit: "per dozen", veg: true, img: "spring-rolls.jpg" },

      { id: "hm-jalapeno", name: "Jalapeno & Cheese Half Moons", group: "Half Moons", price: 55, unit: "per dozen", veg: true, img: "half-moons.jpg" },
      { id: "hm-moong", name: "Moongdhall Half Moons", group: "Half Moons", price: 35, unit: "per dozen", veg: true, img: "half-moons.jpg" },

      { id: "patha", name: "Patha", group: "Patha & More", price: 40, unit: "per dozen", veg: true, img: "patha.jpg" },
      { id: "spinach-feta", name: "Spinach & Feta", group: "Patha & More", price: 60, unit: "per dozen", veg: true, img: "meat-pie.jpg" },
      { id: "round-pies", name: "Half Dozen Round Pies", group: "Patha & More", price: 90, unit: "half dozen (10cm)", veg: true, desc: "All flavours above, 10cm round pies.", img: "meat-pie.jpg" },

      { id: "vedas", name: "Vedas (Fried)", group: "Fried Favourites", price: 50, unit: "per dozen", veg: true, img: "samosa.jpg" },
      { id: "bhajias", name: "Bhajias (Fried)", group: "Fried Favourites", price: 40, unit: "per dozen", veg: true, img: "samosa.jpg" },
      { id: "puri-patha", name: "Puri Patha (Fried)", group: "Fried Favourites", price: 45, unit: "per dozen", veg: true, img: "patha.jpg" }
    ]
  },

  /* ============ PLATTERS ============ */
  {
    id: "platters",
    name: "Platters",
    blurb: "Feeding a crowd? Every platter comes with our special dip.",
    img: "hero.jpg",
    items: [
      { id: "pl-mutsam", name: "Mutton Samoosas Platter", group: "Meaty Platters", price: 380, unit: "per platter", veg: false, img: "hero.jpg", desc: "5 dozen of our famous mutton samoosas, with our special dip." },
      { id: "pl-chkpie", name: "Chicken Pies Platter", group: "Meaty Platters", price: 350, unit: "per platter", veg: false, img: "meat-pie.jpg", desc: "5 dozen of our chicken pies, with our special dip." },
      { id: "pl-chksr", name: "Chicken Spring Rolls Platter", group: "Meaty Platters", price: 350, unit: "per platter", veg: false, img: "spring-rolls.jpg", desc: "5 dozen of our chicken spring rolls, with our special dip." },
      { id: "pl-meatymix", name: "Customisable Meaty Mixed", group: "Meaty Platters", price: 400, unit: "per platter", veg: false, img: "hero.jpg", desc: "Any 5 dozen of our meaty items, with our special dip." },
      { id: "pl-mixed-sr", name: "Mixed Spring Roll Platter", group: "Meaty Platters", price: 400, unit: "per platter", veg: false, img: "spring-rolls.jpg", desc: "2 dozen mutton, 2 dozen chicken & 2 dozen veg spring rolls, with our special dip." },
      { id: "pl-mixed-sausage", name: "Mixed Sausage Roll Platter", group: "Meaty Platters", price: 400, unit: "per platter", veg: false, img: "sausage-rolls.jpg", desc: "2 dozen mutton, 2 dozen chicken & 1 dozen soya sausage rolls, with our special dip." },
      { id: "pl-drumsticks", name: "Chicken Drumsticks", group: "Meaty Platters", price: 550, unit: "per platter", veg: false, img: "drumsticks.jpg", desc: "5 dozen chicken drumsticks, with our special dip." },

      { id: "pl-triple", name: "Triple Threat", group: "Special Platters", price: 379, unit: "per platter", veg: false, img: "hero.jpg", desc: "2 dozen chicken nuggets, 2 dozen chicken strips & 2 dozen mutton kebabs." },
      { id: "pl-peckish", name: "Peckish Party Platter", group: "Special Platters", price: 350, unit: "per platter", veg: false, img: "hero.jpg", desc: "1 dozen chicken pops, 1 dozen chicken strips, 1 dozen chicken nuggets, 1 dozen chicken kebabs & 1 dozen chicken samoosas." },
      { id: "pl-pie-fest", name: "Pie Lovers Feast", group: "Special Platters", price: 350, unit: "per platter", veg: false, img: "meat-pie.jpg", desc: "1 dozen mutton, 1 dozen chicken, 1 dozen tinfish, 1 dozen jalapeno & cheese and 1 dozen sweetcorn & cheese pies." },
      { id: "pl-muttonmania", name: "Mutton Mania", group: "Special Platters", price: 400, unit: "per platter", veg: false, img: "hero.jpg", desc: "1 dozen mutton pies, 1 dozen mutton samoosas, 1 dozen mutton spring rolls, 1 dozen mutton sausage pie rolls & 1 dozen mutton spirals." },
      { id: "pl-sandwich", name: "The Sandwich Spread", group: "Special Platters", price: 280, unit: "per platter", veg: false, img: "hero.jpg", desc: "2 dozen cheese & tomato, 2 dozen boiled egg and 1 dozen tuna sandwiches." },

      { id: "pl-veg5", name: "Any 5 Dozen Veg Items", group: "Veg Deals", price: 350, unit: "per platter", veg: true, img: "samosa.jpg", desc: "Any 5 dozen of our veg items, with our special dip." },
      { id: "pl-mix2", name: "Mix & Match", group: "Veg Deals", price: 250, unit: "per platter", veg: true, img: "samosa.jpg", desc: "Any mix of 2 choices — 5 dozen, with our special dip." },
      { id: "pl-puripatha", name: "Freshly Made Puri Patha", group: "Veg Deals", price: 100, unit: "2 dozen", veg: true, img: "patha.jpg", desc: "2 dozen freshly made puri patha." },
      { id: "pl-soyasausage", name: "Soya Sausage Pie Rolls", group: "Veg Deals", price: 300, unit: "per platter", veg: true, img: "sausage-rolls.jpg", desc: "5 dozen soya sausage pie rolls." },
      { id: "pl-soyamin", name: "Soya Mince Samoosas", group: "Veg Deals", price: 309, unit: "per platter", veg: true, img: "samosa.jpg", desc: "5 dozen soya mince samoosas." }
    ]
  },

  /* ============ SWEETMEATS ============ */
  {
    id: "sweetmeats",
    name: "Sweetmeats",
    blurb: "Traditional homemade sweets. Freshly made for orders and festive seasons.",
    img: "burfee.jpg",
    items: [
      { id: "sw-burfee", name: "Burfee", group: "Sweetmeats", price: null, unit: "price on request", veg: true, img: "burfee.jpg", desc: "Traditional milk-based burfee." },
      { id: "sw-jumbo", name: "Jumbo", group: "Sweetmeats", price: null, unit: "price on request", veg: true, img: "jumbo.jpg", desc: "Big, indulgent homemade treats." },
      { id: "sw-ladoo", name: "Ladoo", group: "Sweetmeats", price: null, unit: "price on request", veg: true, img: "ladoo.jpg", desc: "Golden, sweet, melt-in-the-mouth ladoo." },
      { id: "sw-coconut", name: "Coconut Ice", group: "Sweetmeats", price: null, unit: "price on request", veg: true, img: "coconut-ice.jpg", desc: "Soft, creamy coconut ice." }
    ]
  },

  /* ============ CHUTNEYS, PICKLES, HONEYS & GHEE ============ */
  {
    id: "pantry",
    name: "Chutneys, Pickles, Honeys & Ghee",
    blurb: "House-made from family recipes. Pickles are made seasonally for the freshest produce.",
    img: "pickles.jpg",
    items: [
      { id: "pk-lime", name: "Lime Pickle", group: "Pickles", price: 40, unit: "per 250ml bottle", veg: true, img: "pickles.jpg" },
      { id: "pk-mixedveg", name: "Mixed Veg Pickle (Oil)", group: "Pickles", price: 40, unit: "per 250ml bottle", veg: true, img: "pickles.jpg" },
      { id: "pk-sweet-sour", name: "Sweet & Sour Lemon Pickle", group: "Pickles", price: 40, unit: "per 250ml bottle", veg: true, img: "pickles.jpg" },
      { id: "pk-lemon", name: "Traditional Lemon Pickle", group: "Pickles", price: 40, unit: "per 250ml bottle", veg: true, img: "pickles.jpg" },
      { id: "pk-chillies", name: "Ground Chillies", group: "Pickles", price: 40, unit: "per 250ml bottle", veg: true, img: "pickles.jpg" },
      { id: "pk-mangocarrot", name: "Mango, Carrot & Chillies", group: "Pickles", price: 40, unit: "per 250ml bottle", veg: true, img: "pickles.jpg" },
      { id: "pk-quamkrot", name: "Quamkrot Pickle", group: "Pickles", price: 40, unit: "per 250ml bottle", veg: true, img: "pickles.jpg" },
      { id: "pk-vinegar", name: "Vinegar Carrots, Chillies & Onions", group: "Pickles", price: 40, unit: "per 250ml bottle", veg: true, img: "pickles.jpg" },
      { id: "pk-mango", name: "Mango Pickle", group: "Pickles", price: 40, unit: "per 250ml bottle", veg: true, img: "pickles.jpg" },
      { id: "pk-borfigs", name: "Bor & Figs Pickle", group: "Pickles", price: 40, unit: "per 250ml bottle", veg: true, img: "pickles.jpg" },

      { id: "ch-mint", name: "Mint Chutney", group: "Chutneys", price: 40, unit: "per 250ml bottle", veg: true, img: "chutney.jpg" },
      { id: "ch-nuts", name: "Nuts Chutney", group: "Chutneys", price: 40, unit: "per 250ml bottle", veg: true, img: "chutney.jpg" },

      { id: "hn-raw", name: "Raw Honey", group: "Honeys", price: 100, unit: "500g jar", veg: true, img: "honey.jpg" },
      { id: "hn-nat500", name: "Natural Honey", group: "Honeys", price: 90, unit: "500g jar", veg: true, img: "honey.jpg" },
      { id: "hn-nat375", name: "Natural Honey", group: "Honeys", price: 70, unit: "375g jar", veg: true, img: "honey.jpg" },
      { id: "hn-nat50", name: "Natural Honey", group: "Honeys", price: 10, unit: "50g jar", veg: true, img: "honey.jpg" },
      { id: "hn-nat25", name: "Natural Honey", group: "Honeys", price: 7, unit: "25g jar", veg: true, img: "honey.jpg" },

      { id: "gh-butter", name: "Pure Butter Ghee", group: "Ghee", price: 170, unit: "per jar", veg: true, img: "ghee.jpg" }
    ]
  }
];

/* Flattened helpers so the app code stays clean */
BRS.allItems = function () {
  var out = [];
  BRS.categories.forEach(function (cat) {
    cat.items.forEach(function (item) {
      item.categoryId = cat.id;
      item.category = cat.name;
      item._img = "assets/images/" + (item.img || cat.img || "hero.jpg");
      out.push(item);
    });
  });
  return out;
};

BRS.itemById = function (id) {
  return BRS.allItems().find(function (i) { return i.id === id; }) || null;
};
