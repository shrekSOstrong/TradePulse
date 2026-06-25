// ============================================================
// TradePulse — app logic
// ITEMS comes from data.js
// ============================================================

const MULT = {
  neon: 3.5,   // ~4 pets combined, discounted for time/risk
  mega: 9,     // ~16 pets combined (4 neons)
  fly: 1.15,
  ride: 1.15
};

const CATEGORIES = ["All", "Pet", "Egg", "Vehicle", "Stroller", "Toy", "Food", "Gift", "Pet Wear"];
const RARITIES = ["Legendary", "Ultra-Rare", "Rare", "Uncommon", "Common"];
const RARITY_COLOR = {
  "Legendary": "var(--rarity-legendary)",
  "Ultra-Rare": "var(--rarity-ultra)",
  "Rare": "var(--rarity-rare)",
  "Uncommon": "var(--rarity-uncommon)",
  "Common": "var(--rarity-common)"
};

let state = {
  category: "All",
  rarity: null,
  query: "",
  addTarget: "left",
  left: [],   // {entryId, itemId, form, fly, ride}
  right: []
};
let entryCounter = 1;
let pendingItemId = null; // item awaiting variant config in popover

// ---------------- helpers ----------------
function fmt(n){
  if (n === 0) return "0";
  if (n < 1) return n.toFixed(2).replace(/0+$/,"").replace(/\.$/,"");
  if (n < 100) return n.toFixed(1).replace(/\.0$/,"");
  return Math.round(n).toLocaleString();
}

function getItem(id){ return ITEMS.find(i => i.id === id); }

function computeValue(item, cfg){
  let v = item.value;
  if (cfg.form === "neon") v *= MULT.neon;
  else if (cfg.form === "mega") v *= MULT.mega;
  if (cfg.fly) v *= MULT.fly;
  if (cfg.ride) v *= MULT.ride;
  return v;
}

function demandStars(d){
  const n = Math.round(d || 1);
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ---------------- filter chips ----------------
function buildChips(){
  const catWrap = document.getElementById("categoryChips");
  catWrap.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const b = document.createElement("button");
    b.className = "chip" + (state.category === cat ? " active" : "");
    b.textContent = cat;
    b.type = "button";
    b.addEventListener("click", () => {
      state.category = cat;
      state.rarity = null;
      buildChips();
      renderGrid();
    });
    catWrap.appendChild(b);
  });

  const rarWrap = document.getElementById("rarityChips");
  rarWrap.innerHTML = "";
  const categoryHasRarity = ITEMS.some(i =>
    (state.category === "All" || i.category === state.category) && i.rarity
  );
  if (categoryHasRarity){
    RARITIES.forEach(r => {
      const b = document.createElement("button");
      b.className = "chip" + (state.rarity === r ? " active" : "");
      b.textContent = r;
      b.type = "button";
      b.addEventListener("click", () => {
        state.rarity = state.rarity === r ? null : r;
        buildChips();
        renderGrid();
      });
      rarWrap.appendChild(b);
    });
    rarWrap.style.display = "flex";
  } else {
    rarWrap.style.display = "none";
  }
}

// ---------------- grid ----------------
function filteredItems(){
  const q = state.query.trim().toLowerCase();
  return ITEMS.filter(i => {
    if (state.category !== "All" && i.category !== state.category) return false;
    if (state.rarity && i.rarity !== state.rarity) return false;
    if (q && !i.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderGrid(){
  const grid = document.getElementById("itemGrid");
  const list = filteredItems();
  document.getElementById("resultCount").textContent = `${list.length} item${list.length===1?"":"s"}`;
  grid.innerHTML = "";

  if (list.length === 0){
    grid.innerHTML = `<p style="color:var(--text-low);font-size:13px;grid-column:1/-1;padding:20px;text-align:center;">No items match that search.</p>`;
    return;
  }

  list.forEach(item => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "item-card";
    const dotColor = item.rarity ? RARITY_COLOR[item.rarity] : "var(--text-low)";
    card.innerHTML = `
      ${!item.obtainable ? '<span class="ic-badge retired">Retired</span>' : ""}
      <div class="ic-top">
        <span class="ic-emoji">${item.emoji}</span>
        <span class="ic-rarity-dot" style="background:${dotColor}"></span>
      </div>
      <span class="ic-name">${item.name}</span>
      <div class="ic-meta">
        <span class="ic-value">${fmt(item.value)}</span>
        <span class="ic-demand">${demandStars(item.demand)}</span>
      </div>
    `;
    card.addEventListener("click", () => onItemClick(item));
    grid.appendChild(card);
  });
}

function onItemClick(item){
  if (item.variant){
    openVariantPopover(item.id);
  } else {
    addEntry(item.id, { form: "normal", fly: false, ride: false });
  }
}

// ---------------- variant popover ----------------
function openVariantPopover(itemId){
  pendingItemId = itemId;
  const item = getItem(itemId);
  document.getElementById("vpItemName").textContent = `${item.emoji} ${item.name}`;
  document.querySelectorAll("#vpForm .seg-btn").forEach(b => b.classList.toggle("active", b.dataset.form === "normal"));
  document.getElementById("vpFly").checked = false;
  document.getElementById("vpRide").checked = false;
  updateVpComputed();
  document.getElementById("variantPopover").hidden = false;
  document.getElementById("vpBackdrop").hidden = false;
}

function closeVariantPopover(){
  document.getElementById("variantPopover").hidden = true;
  document.getElementById("vpBackdrop").hidden = true;
  pendingItemId = null;
}

function currentVpConfig(){
  const formBtn = document.querySelector("#vpForm .seg-btn.active");
  return {
    form: formBtn ? formBtn.dataset.form : "normal",
    fly: document.getElementById("vpFly").checked,
    ride: document.getElementById("vpRide").checked
  };
}

function updateVpComputed(){
  if (pendingItemId == null) return;
  const item = getItem(pendingItemId);
  const cfg = currentVpConfig();
  document.getElementById("vpComputed").textContent = fmt(computeValue(item, cfg));
}

// ---------------- trade entries ----------------
function addEntry(itemId, cfg){
  const entry = { entryId: entryCounter++, itemId, ...cfg };
  state[state.addTarget].push(entry);
  renderSides();
  updateVerdict();
}

function removeEntry(side, entryId){
  state[side] = state[side].filter(e => e.entryId !== entryId);
  renderSides();
  updateVerdict();
}

function renderSides(){
  renderSide("left", "leftList", "leftTotal", "leftDemand");
  renderSide("right", "rightList", "rightTotal", "rightDemand");
}

function renderSide(side, listId, totalId, demandId){
  const ul = document.getElementById(listId);
  const entries = state[side];

  if (entries.length === 0){
    ul.innerHTML = `<li class="empty-hint">No items yet — add something from the browser below.</li>`;
    document.getElementById(totalId).textContent = "0";
    document.getElementById(demandId).textContent = "—";
    return;
  }

  ul.innerHTML = "";
  let total = 0, demandSum = 0;

  entries.forEach(e => {
    const item = getItem(e.itemId);
    const val = computeValue(item, e);
    total += val;
    demandSum += item.demand;

    const li = document.createElement("li");
    li.className = "trade-item";
    const tags = [];
    if (e.form === "neon") tags.push('<span class="ti-tag neon">Neon</span>');
    if (e.form === "mega") tags.push('<span class="ti-tag mega">Mega Neon</span>');
    if (e.fly) tags.push('<span class="ti-tag">Fly</span>');
    if (e.ride) tags.push('<span class="ti-tag">Ride</span>');

    li.innerHTML = `
      <span class="ti-emoji">${item.emoji}</span>
      <span class="ti-info">
        <span class="ti-name">${item.name}</span>
        <span class="ti-tags">${tags.join("")}</span>
      </span>
      <span class="ti-value">${fmt(val)}</span>
      <button class="ti-remove" type="button" aria-label="Remove ${item.name}">×</button>
    `;
    li.querySelector(".ti-remove").addEventListener("click", () => removeEntry(side, e.entryId));
    ul.appendChild(li);
  });

  document.getElementById(totalId).textContent = fmt(total);
  document.getElementById(demandId).textContent = (demandSum / entries.length).toFixed(1) + " / 5";
}

// ---------------- verdict / pulse ----------------
function totalOf(side){
  return state[side].reduce((sum, e) => sum + computeValue(getItem(e.itemId), e), 0);
}

function updateVerdict(){
  const left = totalOf("left");
  const right = totalOf("right");
  const label = document.getElementById("verdictLabel");
  const sub = document.getElementById("verdictSub");
  const root = document.documentElement;

  if (left === 0 && right === 0){
    label.textContent = "Add items to start";
    sub.textContent = "Build both sides of the trade below";
    root.style.setProperty("--pulse-color", "var(--pulse-teal)");
    return;
  }

  // diff > 0 means YOUR side is worth more than theirs, which means
  // YOU are giving away more value than you receive — i.e. you are
  // LOSING the trade. diff < 0 means their side is worth more, so you
  // receive more than you give — you are WINNING. "Fair" now requires
  // the two sides to match exactly, not just be close.
  const diff = left - right;
  const base = Math.max(left, right, 0.0001);
  const pct = Math.abs(diff) / base * 100;

  if (diff === 0){
    label.textContent = "Fair trade";
    sub.textContent = "Both sides are worth exactly the same";
    root.style.setProperty("--pulse-color", "var(--pulse-teal)");
  } else if (diff < 0){
    label.textContent = "You're winning";
    sub.textContent = `Their offer is worth ${pct.toFixed(1)}% more than yours`;
    root.style.setProperty("--pulse-color", "var(--pulse-teal)");
  } else {
    label.textContent = "You're losing";
    sub.textContent = `Your offer is worth ${pct.toFixed(1)}% more than theirs`;
    root.style.setProperty("--pulse-color", "var(--warn-rose)");
  }
}

// ---------------- wiring ----------------
function wireEvents(){
  document.getElementById("searchInput").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderGrid();
  });

  document.querySelectorAll(".seg-btn[data-target]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.addTarget = btn.dataset.target;
      document.querySelectorAll(".seg-btn[data-target]").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-checked", b === btn ? "true" : "false");
      });
    });
  });

  document.querySelectorAll(".clear-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state[btn.dataset.clear] = [];
      renderSides();
      updateVerdict();
    });
  });

  document.querySelectorAll("#vpForm .seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#vpForm .seg-btn").forEach(b => b.classList.toggle("active", b === btn));
      updateVpComputed();
    });
  });
  document.getElementById("vpFly").addEventListener("change", updateVpComputed);
  document.getElementById("vpRide").addEventListener("change", updateVpComputed);
  document.getElementById("vpClose").addEventListener("click", closeVariantPopover);
  document.getElementById("vpBackdrop").addEventListener("click", closeVariantPopover);
  document.getElementById("vpAdd").addEventListener("click", () => {
    if (pendingItemId == null) return;
    addEntry(pendingItemId, currentVpConfig());
    closeVariantPopover();
  });
}

// ---------------- init ----------------
function init(){
  buildChips();
  renderGrid();
  renderSides();
  updateVerdict();
  wireEvents();
}

document.addEventListener("DOMContentLoaded", init);
