# TradePulse 📟

A free, open-source **Adopt Me! trade value calculator** — built like the
community tools (Elvebredd, AdoptMeValues, etc.), but as a single static
site you fully own and can deploy yourself on GitHub Pages.

Compare two trade offers side-by-side, toggle **Neon / Mega Neon / Fly /
Ride** on any pet, and watch the live "pulse" verdict tell you who's winning.

## What's included

- **247 items** out of the box: Legendary, Ultra-Rare, Rare, Uncommon and
  Common pets (covering every major egg & event: Pet Egg, Farm Egg, Aussie
  Egg, Safari Egg, Jungle Egg, Fossil Egg, Ocean Egg, Royal Egg, Monkey
  Fancy Egg, Cyber Egg, Galaxy Egg, Lunar New Year, Christmas, Halloween,
  Diamond/Test Egg, and more), plus **Eggs, Vehicles, Strollers, Toys/
  Wands, Food, Gnomes**, and other tradable items (potions, hats, wings,
  houses, stickers).
- A **Neon / Mega Neon / Fly / Ride** value engine — every pet's value is
  calculated live from its base value, so you don't need a separate entry
  for every potion combination.
- Search + category + rarity filters.
- A live "pulse" verdict bar that shows whether your offer or their offer
  is ahead, and by how much.

### About the values

Adopt Me trade values are **community consensus, not official prices**,
and they shift daily as new pets release and old eggs retire. The numbers
in `data.js` are a reasonable starting point for relative comparisons, not
a guaranteed live market feed. Before a big trade, sanity-check against a
current value list (e.g. search "Adopt Me value list") and adjust `data.js`
if something looks off — see below.

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g. `tradepulse`).
2. Add these four files to the repo root:
   - `index.html`
   - `style.css`
   - `script.js`
   - `data.js`
3. Commit and push:
   ```bash
   git init
   git add .
   git commit -m "Initial TradePulse build"
   git branch -M main
   git remote add origin https://github.com/<your-username>/tradepulse.git
   git push -u origin main
   ```
4. In your repo on GitHub: **Settings → Pages → Source → Deploy from a
   branch → `main` / `(root)` → Save**.
5. Wait a minute, then visit `https://<your-username>.github.io/tradepulse/`.

No build step, no dependencies — it's plain HTML/CSS/JS.

## Editing or adding items

Everything lives in `data.js` as one big array called `ITEMS`. Each entry
looks like this:

```js
{
  "id": 1,
  "name": "Shadow Dragon",
  "category": "Pet",        // Pet | Egg | Vehicle | Stroller | Toy | Food | Gnome | Other
  "rarity": "Legendary",    // Legendary | Ultra-Rare | Rare | Uncommon | Common | null
  "value": 1800,            // base value (Normal, no potions)
  "demand": 5,              // 1-5, shown as stars
  "emoji": "🐉",
  "egg": "Halloween 2019",
  "variant": true,          // true = show Neon/Mega/Fly/Ride toggle (pets only)
  "obtainable": false,      // false = shows a "Retired" badge
  "notes": "No longer obtainable"
}
```

To **add a new pet**: copy an existing object, give it a new unique `id`,
and fill in the fields. To **update a value**: just change the `value`
number. To **add a brand-new category** (e.g. a new shop section): add
items with a new `category` string and add that string to the
`CATEGORIES` array near the top of `script.js`.

The Neon / Mega Neon / Fly / Ride multipliers themselves live at the top
of `script.js` in the `MULT` object, if you want to tune how much each
upgrade adds:

```js
const MULT = { neon: 3.5, mega: 9, fly: 1.15, ride: 1.15 };
```

## Disclaimer

TradePulse is an independent, fan-made project and is **not affiliated
with, endorsed by, or sponsored by** Adopt Me!, Uplift Games, or Roblox
Corporation. All pet and item names are used for descriptive/reference
purposes only.
