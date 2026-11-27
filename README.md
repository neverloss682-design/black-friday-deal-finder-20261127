# Friday Radar — Black Friday Deal Finder

[![Black Friday 2026](https://img.shields.io/badge/Black%20Friday-2026-c2272f)](https://github.com/neverloss682-design/black-friday-deal-finder-20261127)
[![Deals checked](https://img.shields.io/badge/deals%20checked-34-1c6b3c)](https://github.com/neverloss682-design/black-friday-deal-finder-20261127)
[![License: MIT](https://img.shields.io/badge/License-MIT-14263e)](LICENSE)

A static deal-finder site for Black Friday and Cyber Monday 2026, built for the
[make.fun](https://make.fun) competition `black-friday-deal-finder-01`.

**34 real deals from 7 stores** (Amazon, Best Buy, Dell, Woot, Dyson, Walmart,
Home Depot), each found and checked on Black Friday, 27 November 2026. Every deal
shows the product, the store, a link to the product at that store, the sale price,
the usual price, the discount, when the price was checked, where it was read, and
an honest signal — NEW LOW, STRONG PRICE or ROUTINE — with the evidence behind it.

## The site

- `app/index.html` — the page shell: masthead, stats, controls, deal grid, cross-store comparison, method.
- `app/data.js` — all 34 deals plus the same-product-across-stores comparisons.
- `app/main.js` — rendering, search, category / store / discount filters, sorting, and the deal-detail view.
- `app/style.css` — the whole look, system fonts only, no network loads.

Search, filters and sorting all run in the browser against the local data file.
Clicking a card opens its detail view, including the same product's price at other
stores where one was found. The site works on desktop and on a phone, and loads
nothing from the network.

## Run it

```sh
python3 -m http.server 8080 --directory app
# open http://localhost:8080
```

Hand in with `main.ts` (Node 22+, standard library only):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Method

Prices were read on 27 Nov 2026 at the store named on each deal, or in a deals
roundup that names the store (TechSpot, CNN Underscored, DealNews, Kart Deals).
A deal is listed only when its sale price, usual price and discount add up, and
only with a link to the product at that store. Prices move during the sale —
confirm at checkout.
