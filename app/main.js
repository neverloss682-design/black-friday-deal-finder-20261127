// Friday Radar — rendering, search, filters, sorting and deal detail.
// All data comes from data.js (local file, no network). State lives in `state`
// and every control re-renders the grid through renderDeals().

import {
  DEALS,
  COMPARE,
  CHECKED_DAY,
  CHECKED_NOTE,
  SIGNAL_LABELS,
  discountPercent,
  discountDollars,
} from "./data.js";

const grid = document.getElementById("deal-grid");
const emptyState = document.getElementById("empty-state");
const resultCount = document.getElementById("result-count");
const searchInput = document.getElementById("search");
const categoryChips = document.getElementById("category-chips");
const storeFilter = document.getElementById("store-filter");
const discountFilter = document.getElementById("discount-filter");
const sortSelect = document.getElementById("sort-select");
const backdrop = document.getElementById("dialog-backdrop");
const dialogBody = document.getElementById("dialog-body");
const dialogClose = document.getElementById("dialog-close");

const CATEGORIES = [...new Set(DEALS.map((d) => d.category))].sort();
const STORES = [...new Set(DEALS.map((d) => d.store))].sort();

const state = {
  query: "",
  category: "All",
  store: "All",
  minDiscount: 0,
  sort: "discount",
};

export function formatPrice(value) {
  const text = value.toFixed(2);
  return "$" + (text.endsWith(".00") ? text.slice(0, -3) : text);
}

function signalClass(signal) {
  return "sig sig-" + signal;
}

function dealCard(deal) {
  const pct = discountPercent(deal);
  const saved = discountDollars(deal);
  const card = document.createElement("article");
  card.className = "deal-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", deal.name + " — details");
  card.innerHTML =
    '<div class="deal-top">' +
    '<span class="store-badge">' + escapeHtml(deal.store) + "</span>" +
    '<span class="category">' + escapeHtml(deal.category) + "</span>" +
    "</div>" +
    "<h3>" + escapeHtml(deal.name) + "</h3>" +
    '<div class="price-row">' +
    '<span class="sale-price">' + formatPrice(deal.sale) + "</span>" +
    '<span class="usual-price">' + formatPrice(deal.usual) + "</span>" +
    '<span class="off-badge">-' + pct + "%</span>" +
    "</div>" +
    '<p class="save-line">Save ' + formatPrice(saved) + " off the usual price</p>" +
    '<span class="' + signalClass(deal.signal) + '">' + SIGNAL_LABELS[deal.signal] + "</span>" +
    '<p class="evidence">' + escapeHtml(deal.evidence) + "</p>" +
    '<p class="checked-line">Checked ' + CHECKED_DAY + " &middot; Source: " + escapeHtml(deal.source) + "</p>" +
    '<div class="card-actions">' +
    '<a class="view-button" href="' + escapeHtml(deal.link) + '" target="_blank" rel="noopener">View at ' + escapeHtml(deal.store) + " &rarr;</a>" +
    "</div>";
  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    openDealDetail(deal);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDealDetail(deal);
    }
  });
  return card;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyFilters() {
  const query = state.query.trim().toLowerCase();
  let list = DEALS.filter((deal) => {
    if (state.category !== "All" && deal.category !== state.category) return false;
    if (state.store !== "All" && deal.store !== state.store) return false;
    if (discountPercent(deal) < state.minDiscount) return false;
    if (query) {
      const haystack = (deal.name + " " + deal.store + " " + deal.category).toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  list = sortDeals(list, state.sort);
  return list;
}

export function sortDeals(list, sort) {
  const copy = [...list];
  if (sort === "discount") copy.sort((a, b) => discountPercent(b) - discountPercent(a));
  else if (sort === "saving") copy.sort((a, b) => discountDollars(b) - discountDollars(a));
  else if (sort === "price-asc") copy.sort((a, b) => a.sale - b.sale);
  else if (sort === "price-desc") copy.sort((a, b) => b.sale - a.sale);
  else if (sort === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy;
}

function renderDeals() {
  const list = applyFilters();
  grid.replaceChildren(...list.map(dealCard));
  emptyState.hidden = list.length !== 0;
  resultCount.textContent =
    "Showing " + list.length + " of " + DEALS.length + " deals" +
    (state.category !== "All" ? " in " + state.category : "") +
    (state.store !== "All" ? " at " + state.store : "") +
    (state.minDiscount > 0 ? ", " + state.minDiscount + "% off or more" : "") +
    ".";
}

function renderCategoryChips() {
  const chips = ["All", ...CATEGORIES].map((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = category;
    button.setAttribute("aria-pressed", String(state.category === category));
    button.addEventListener("click", () => {
      state.category = category;
      renderCategoryChips();
      renderDeals();
    });
    return button;
  });
  categoryChips.replaceChildren(...chips);
}

function renderStoreFilter() {
  storeFilter.innerHTML = "";
  ["All", ...STORES].forEach((store) => {
    const option = document.createElement("option");
    option.value = store;
    option.textContent = store === "All" ? "All stores" : store;
    storeFilter.appendChild(option);
  });
}

function renderStats() {
  const biggest = Math.max(...DEALS.map(discountPercent));
  const lows = DEALS.filter((d) => d.signal === "new-low").length;
  document.getElementById("stat-deals").textContent = String(DEALS.length);
  document.getElementById("stat-stores").textContent = String(STORES.length);
  document.getElementById("stat-lows").textContent = String(lows);
  document.getElementById("stat-biggest").textContent = "-" + biggest + "%";
  document.getElementById("checked-note").textContent = CHECKED_NOTE;
}

function renderCompare() {
  const host = document.getElementById("compare-list");
  host.replaceChildren(
    ...COMPARE.map((group) => {
      const wrap = document.createElement("div");
      wrap.className = "compare-table-wrap";
      const rows = group.prices
        .map((entry) => {
          const isBest = entry.store === group.best;
          const linkCell = entry.link
            ? '<a href="' + escapeHtml(entry.link) + '" target="_blank" rel="noopener">View &rarr;</a>'
            : "Price reported by " + escapeHtml(entry.source);
          return (
            '<tr class="' + (isBest ? "best" : "") + '">' +
            "<td>" + escapeHtml(entry.store) + (isBest ? '<span class="best-tag">CHEAPEST</span>' : "") + "</td>" +
            '<td class="price">' + formatPrice(entry.price) + "</td>" +
            "<td>" + linkCell + "</td>" +
            "</tr>"
          );
        })
        .join("");
      wrap.innerHTML =
        '<table class="compare-table">' +
        "<caption>" + escapeHtml(group.product) + "</caption>" +
        "<thead><tr><th>Store</th><th>Price</th><th>Link</th></tr></thead>" +
        "<tbody>" + rows + "</tbody>" +
        "</table>" +
        '<p class="compare-note">' + escapeHtml(group.note) + "</p>";
      return wrap;
    }),
  );
}

function compareForDeal(deal) {
  const group = COMPARE.find((g) => g.product === deal.name);
  if (!group) return "";
  const rows = group.prices
    .map((entry) => {
      const isBest = entry.store === group.best;
      const linkCell = entry.link
        ? '<a href="' + escapeHtml(entry.link) + '" target="_blank" rel="noopener">View &rarr;</a>'
        : "Reported by " + escapeHtml(entry.source);
      return (
        '<tr class="' + (isBest ? "best" : "") + '">' +
        "<td>" + escapeHtml(entry.store) + (isBest ? '<span class="best-tag">CHEAPEST</span>' : "") + "</td>" +
        '<td class="price">' + formatPrice(entry.price) + "</td>" +
        "<td>" + linkCell + "</td>" +
        "</tr>"
      );
    })
    .join("");
  return (
    "<h3>Also at other stores</h3>" +
    '<table class="compare-table"><thead><tr><th>Store</th><th>Price</th><th>Link</th></tr></thead>' +
    "<tbody>" + rows + "</tbody></table>" +
    '<p class="compare-note">' + escapeHtml(group.note) + "</p>"
  );
}

export function openDealDetail(deal) {
  const pct = discountPercent(deal);
  const saved = discountDollars(deal);
  dialogBody.innerHTML =
    '<span class="store-badge">' + escapeHtml(deal.store) + "</span> " +
    '<span class="category">' + escapeHtml(deal.category) + "</span>" +
    '<h2 id="dialog-title">' + escapeHtml(deal.name) + "</h2>" +
    '<div class="price-row">' +
    '<span class="sale-price">' + formatPrice(deal.sale) + "</span>" +
    '<span class="usual-price">' + formatPrice(deal.usual) + "</span>" +
    '<span class="off-badge">-' + pct + "%</span>" +
    "</div>" +
    '<p class="save-line">Save ' + formatPrice(saved) + " off the usual price</p>" +
    '<span class="' + signalClass(deal.signal) + '">' + SIGNAL_LABELS[deal.signal] + "</span>" +
    '<p class="evidence">' + escapeHtml(deal.evidence) + "</p>" +
    (deal.note ? '<p class="evidence">' + escapeHtml(deal.note) + "</p>" : "") +
    '<div class="detail-grid">' +
    detailRow("Store", deal.store) +
    detailRow("Checked", CHECKED_DAY) +
    detailRow("Price read at", deal.source) +
    "</div>" +
    '<p class="checked-line">' + escapeHtml(CHECKED_NOTE) + "</p>" +
    compareForDeal(deal) +
    '<div class="card-actions">' +
    '<a class="view-button" href="' + escapeHtml(deal.link) + '" target="_blank" rel="noopener">View at ' + escapeHtml(deal.store) + " &rarr;</a>" +
    "</div>";
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
  dialogClose.focus();
}

function detailRow(label, value) {
  return (
    '<div class="detail-row"><span>' + escapeHtml(label) + "</span><span>" + escapeHtml(value) + "</span></div>"
  );
}

export function closeDealDetail() {
  backdrop.hidden = true;
  document.body.style.overflow = "";
}

dialogClose.addEventListener("click", closeDealDetail);
backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) closeDealDetail();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !backdrop.hidden) closeDealDetail();
});

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  renderDeals();
});
storeFilter.addEventListener("change", () => {
  state.store = storeFilter.value;
  renderDeals();
});
discountFilter.addEventListener("change", () => {
  state.minDiscount = Number(discountFilter.value);
  renderDeals();
});
sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  renderDeals();
});

// Shareable filtered views: ?q=airpods&cat=Audio&store=Amazon&min=40&sort=saving
function readInitialState() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (q) {
    state.query = q;
    searchInput.value = q;
  }
  const cat = params.get("cat");
  if (cat && (cat === "All" || CATEGORIES.includes(cat))) state.category = cat;
  const store = params.get("store");
  if (store && (store === "All" || STORES.includes(store))) {
    state.store = store;
    storeFilter.value = store;
  }
  const min = Number(params.get("min"));
  if ([20, 40, 50].includes(min)) {
    state.minDiscount = min;
    discountFilter.value = String(min);
  }
  const sort = params.get("sort");
  if (["discount", "saving", "price-asc", "price-desc", "name"].includes(sort)) {
    state.sort = sort;
    sortSelect.value = sort;
  }
  const detail = params.get("deal");
  if (detail) {
    const deal = DEALS.find((d) => d.id === detail);
    if (deal) openDealDetail(deal);
  }
}

renderStoreFilter();
readInitialState();
renderCategoryChips();
renderStats();
renderCompare();
renderDeals();
