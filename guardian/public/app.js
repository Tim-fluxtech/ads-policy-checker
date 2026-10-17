import { check, SEV, TEXT_FIELDS, FIELD_LABEL } from "./engine.js";
import { lineFixes, fullRewrites, score, detectOffer, isCopyIssue } from "./rewrite.js";
import { POLICIES, NICHES, STATUS, COUNTRIES, VERIFIED_ON, ALCOHOL_BANNED, GAMBLING_BANNED, CBD_COUNTRIES, RX_COUNTRIES } from "./policies.js";
import { ic } from "./icons.js";
import { creative } from "./creatives.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const LEVEL = { high: "High risk", medium: "Medium risk", low: "Low risk" };
const SEV_IC = { block: "circle-alert", warn: "triangle-alert", tip: "info" };
const NICHE_IC = { spark: "sparkles", scale: "scale", pill: "pill", sparkle: "sparkles", drop: "droplet", heart: "heart-pulse", cross: "stethoscope", coin: "bitcoin", chart: "chart-line", card: "credit-card", rocket: "rocket", chat: "message-circle-heart", dice: "dices", glass: "wine", leaf: "leaf", mind: "brain", ban: "ban" };
const TONE_BG = { warn: "var(--warn-soft)", auth: "var(--auth-soft)", block: "var(--fail-soft)", ok: "var(--pass-soft)" };
const TONE_FG = { warn: "var(--warn)", auth: "var(--auth)", block: "var(--fail)", ok: "var(--pass)" };
const TONE_CHIP = { warn: "chip-warn", auth: "chip-auth", block: "chip-fail", ok: "chip-pass" };
const COPY_FIELDS = ["primary", "headline", "description"];

// Report layout: every check is listed, passed or not, like a compliance report.
const GROUPS = [
  { title: "Meta platform compliance", icon: "shield-check", checks: [
    { title: "Personal attributes", ids: [/^attr-/, "pii"], pass: "No assumptions about the reader's health, money, age or identity." },
    { title: "Health and body claims", ids: ["inferiority", "weight-claim", "fat-melt", "wearable", "cure-incurable", "cure-other", "whitening", "before-after", "eating", "pleasure-claims", "sexual-health"], pass: "No cure, body-shaming or unrealistic result claims." },
    { title: "Restricted and prohibited products", ids: ["crypto", "investing", "invest-dm", "gambling", "dating", "alcohol", "tobacco", "thc", "cbd", "rx", "rx-banned", "weapons", "fin-prohibited", "adult-products", "sexual-dating", "fake-docs", "auth"], pass: "Nothing that needs Meta's permission or is banned." },
    { title: "Sexual content and profanity", ids: ["sexy", "sexual-wording", "profanity"], pass: "Clean, non-suggestive language." },
    { title: "Spam and engagement bait", ids: ["engagement-bait", "fake-ui", "obfuscation", "shortener"], pass: "No engagement bait, fake buttons or disguised words." },
  ] },
  { title: "Claims and consumer protection", icon: "scale", checks: [
    { title: "Misleading claims", ids: ["clickbait", "guarantee", "income-claim", "income-soft", "superlative"], pass: "Claims read as realistic and provable." },
    { title: "Endorsements", ids: ["endorsement"], pass: "No celebrity or media endorsements you may not have." },
    { title: "Offer transparency", ids: ["free", "urgency", /^lp-mismatch/], pass: "Offers and deadlines look clear." },
  ] },
  { title: "Targeting and destination", icon: "target", checks: [
    { title: "Age targeting", ids: ["age", "sac-age"], pass: "The age range fits the category." },
    { title: "Locations", ids: ["alcohol-country", "gambling-country", "cbd-country", "rx-country"], pass: "Allowed in every selected country." },
    { title: "Special Ad Categories", ids: ["credit", "employment", "housing", "siep", "sac-mismatch"], pass: "No Special Ad Category needed, or it's declared." },
    { title: "Landing page", ids: ["no-url", "bad-url", "http", "brand-domain", /^lp-(?!mismatch)/], pass: "The URL looks valid and secure." },
    { title: "Creative and delivery", ids: ["len-primary", "len-headline", "len-desc", "caps", "punct", "emoji", /^img-/], pass: "Lengths and formatting suit Facebook placements." },
  ] },
];
const matches = (f, c) => c.ids.some((x) => (x instanceof RegExp ? x.test(f.id) : x === f.id));

const state = {
  countries: [], images: [], landing: null, landingFor: "", ran: false, scanning: false,
  server: false, ai: false, seed: 0, angle: 0, rwTab: "lines", aiItems: null, aiBusy: false, aiError: "", aiTone: "",
  drawer: null, pb: null, open: new Set(), last: null, sample: null, pl: "feed", diff: false, undo: [], prevLevel: null, pop: null,
};
const els = {
  brand: $("#brand"), primary: $("#primary"), headline: $("#headline"), description: $("#description"), cta: $("#cta"), url: $("#url"),
  niche: $("#niche"), minAge: $("#minAge"), sac: $("#sac"), authorised: $("#authorised"),
};
const brief = { product: "", offer: "", features: "" };

// ---------- examples ----------
const SAMPLES = {
  weight: { label: "Weight loss", brand: "Lumo Slim", countries: ["United Kingdom", "Ireland"], minAge: 16, cta: "Shop now", url: "http://bit.ly/lumo30",
    primary: "Are you overweight? Doctors hate this one trick. Our 100% natural fat burner is GUARANTEED to melt belly fat while you sleep. Lose 30 lbs in 30 days! Only 3 bottles left!!! 🔥 Get 20% off your first order.",
    headline: "LOSE 30 LBS IN 30 DAYS", description: "As seen on Shark Tank" },
  crypto: { label: "Crypto bot", brand: "Orbit Trade", countries: ["United States", "Portugal"], minAge: 18, cta: "Download", url: "https://orbit-trade.app",
    primary: "Earn 12% daily returns with our Bitcoin trading bot. Elon Musk is already using it. DM me on Telegram to get started. Get rich before it's too late.",
    headline: "Guaranteed profits, every day", description: "Join 50,000 traders" },
  skincare: { label: "Skincare", brand: "Kindred Skin", countries: ["United Kingdom"], minAge: 18, cta: "Shop now", url: "https://kindred-skin.co",
    primary: "Struggling with acne? Our serum clears your acne in 7 days. Ready to upgrade your skin to look younger? Dermatologist recommended.",
    headline: "Fix your skin in a week", description: "Free shipping over £30" },
  bizopp: { label: "Coaching", brand: "Scale Academy", countries: ["United States", "Canada"], minAge: 18, cta: "Sign up", url: "https://scaleacademy.io/webinar",
    primary: "I made $10k a month from my phone and you can too. Quit your 9-to-5 and be your own boss. No experience needed to earn. Comment YES below and I'll send you the link!",
    headline: "Make $10k/month from home", description: "Free webinar" },
  dating: { label: "Dating", brand: "Kindling", countries: ["United States"], minAge: 18, cta: "Sign up", url: "https://kindling.date",
    primary: "Hot singles in your area are waiting. Are you single and lonely? Meet other Christian singles tonight.", headline: "Date tonight", description: "18+ only" },
  loans: { label: "Payday loan", brand: "Brightline Loans", countries: ["United States"], minAge: 21, cta: "Apply now", url: "https://brightline-loans.com",
    primary: "Bad credit? No problem. Get a payday loan of up to $1,500 today, approved in minutes. Behind on bills? We can help.",
    headline: "Cash today, guaranteed approval", description: "Apply in 2 minutes" },
  clean: { label: "Coffee (clean)", brand: "Torra Coffee", countries: ["Portugal", "Spain"], minAge: 18, cta: "Shop now", url: "https://torra.coffee/beans",
    primary: "Single-origin beans, roasted in Lisbon every Monday. Order by 2pm for next-day delivery.", headline: "Fresh roast, every morning", description: "Free delivery over €30" },
};

function renderSamples() {
  $("#sampleList").innerHTML = Object.entries(SAMPLES).map(([k, s]) => `<button type="button" class="sample${state.sample === k ? " is-on" : ""}" data-sample="${k}"><img src="${creative(k)}" alt="">${esc(s.label)}</button>`).join("");
}

function snapshot() {
  return { primary: els.primary.value, headline: els.headline.value, description: els.description.value, niche: els.niche.value, minAge: els.minAge.value, sac: els.sac.value, authorised: els.authorised.checked, url: els.url.value, countries: [...state.countries] };
}
function restore(s) {
  for (const k of ["primary", "headline", "description", "niche", "minAge", "sac", "url"]) els[k].value = s[k];
  els.authorised.checked = s.authorised;
  state.countries = [...s.countries];
  renderTags();
}

function loadSample(key, autoRun = true) {
  const s = SAMPLES[key];
  for (const k of ["brand", "primary", "headline", "description", "url"]) els[k].value = s[k] || "";
  els.cta.value = s.cta;
  els.niche.value = "auto";
  els.minAge.value = s.minAge;
  els.sac.value = "none";
  els.authorised.checked = false;
  Object.assign(brief, { product: "", offer: "", features: "" });
  Object.assign(state, { sample: key, countries: [...s.countries], landing: null, aiItems: null, aiError: "", seed: 0, angle: 0, undo: [], prevLevel: null, diff: false });
  state.images = [{ id: "sample", name: "Image 1", url: creative(key), status: "done", text: "", sample: true }];
  state.open.clear();
  renderTags(); renderSamples(); renderCreative(); hidePop();
  if (autoRun) runCheck(); else refresh();
}

// ---------- form ----------
function readAd() {
  return {
    brand: els.brand.value.trim(), primary: els.primary.value, headline: els.headline.value, description: els.description.value,
    cta: els.cta.value, url: els.url.value.trim(), niche: els.niche.value, countries: state.countries, minAge: +els.minAge.value || 18,
    sac: els.sac.value, authorised: els.authorised.checked,
    images: state.images.filter((i) => i.status === "done" && !i.sample).map((i) => ({ name: i.name, text: i.text, textRatio: i.textRatio, sideBySide: i.sideBySide })),
    landing: state.landing && state.landingFor === els.url.value.trim() ? state.landing : null,
  };
}
const isEmpty = (ad) => !ad.primary.trim() && !ad.headline.trim() && !ad.description.trim();
const mapHit = (field) => (field.startsWith("image") ? "creative" : field === "landing" ? "url" : field);
function fieldsOf(f) {
  const cat = f.rule?.cat;
  if (cat) return [cat.startsWith("sac") || cat === "siep" ? "sac" : "niche"];
  if (f.hits.length) return [...new Set(f.hits.map((h) => mapHit(h.field)))];
  return [{ authorised: "niche", landing: "url" }[f.field] || f.field || "niche"];
}

// ---------- run / refresh ----------
let timer;
function runCheck() {
  const ad = readAd();
  if (isEmpty(ad)) { toast("Write some ad copy first"); els.primary.focus(); return; }
  state.scanning = true;
  state.ran = true;
  refresh();
  const btn = $("#runBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spin"></span>Checking ${GROUPS.reduce((n, g) => n + g.checks.length, 0)} policy areas…`;
  if (innerWidth < 1080) $("#report").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => {
    state.scanning = false;
    btn.disabled = false;
    btn.innerHTML = `${ic("refresh-cw", 18)}Run check again`;
    refresh(true);
  }, 1300);
}

function refresh(animate = false) {
  const ad = readAd();
  updateCounters();
  const r = !isEmpty(ad) ? check(ad) : null;
  state.last = r ? { ad, r } : null;
  const live = state.ran && !state.scanning && r;
  renderOverlays(live ? r : null);
  renderNotes(live ? r : null);
  renderTargetSummary(r);
  renderHelp(r);
  renderReport(ad, r, animate);
  $("#liveTag").hidden = !live;
  if (state.drawer === "rewrite") renderDrawer();
}
const schedule = () => { clearTimeout(timer); timer = setTimeout(() => refresh(false), 200); };

// ---------- report ----------
function previewHtml(ad, r, scanning) {
  const marks = r && !scanning;
  const hits = {};
  if (marks) for (const f of r.findings) for (const h of f.hits) if (COPY_FIELDS.includes(h.field)) (hits[h.field] ||= []).push({ ...h, sev: f.sev, title: f.title });
  const hl = (f) => (marks ? highlight(ad[f], hits[f] || []) : esc(ad[f]));
  const name = ad.brand || "Your Page";
  const ini = esc(name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase());
  const img = state.images.find((i) => i.url)?.url || creative("placeholder");
  let host = "example.com";
  try { if (ad.url) host = new URL(/^https?:\/\//i.test(ad.url) ? ad.url : "https://" + ad.url).hostname.replace(/^www\./, ""); } catch {}
  const body = state.pl === "feed"
    ? `<div class="mini-fb${scanning ? " scan-on" : ""}"><div class="h"><span class="av">${ini}</span><span><b>${esc(name)}</b><small>Sponsored</small></span></div><div class="t">${hl("primary")}</div><div class="img"><img src="${img}" alt=""></div><div class="l"><div><small>${esc(host)}</small><b>${hl("headline") || "Headline"}</b></div><span>${esc(ad.cta)}</span></div></div>`
    : `<div class="story-mini${scanning ? " scan-on" : ""}" style="background-image:url('${img}')"><div class="top"><span class="av" style="width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#E0336F;font-size:9px">${ini}</span>${esc(name)} · Sponsored</div><div class="cap">${hl("primary")}</div><div class="cta">${esc(ad.cta)}</div></div>`;
  return `${body}<div class="pl-tabs" role="tablist" aria-label="Placement">${[["feed", "Feed"], ["story", "Stories"], ["reels", "Reels"]].map(([k, l]) => `<button type="button" data-pl="${k}" aria-selected="${state.pl === k}">${l}</button>`).join("")}</div>`;
}

function highlight(text, hits) {
  if (!text) return "";
  const lvl = new Array(text.length).fill(0), tip = new Array(text.length).fill("");
  for (const h of hits) { const k = SEV[h.sev].rank; for (let i = h.start; i < h.end && i < text.length; i++) if (k > lvl[i]) { lvl[i] = k; tip[i] = h.title; } }
  const cls = { 3: "m-high", 2: "m-medium", 1: "m-low" };
  let out = "", i = 0;
  while (i < text.length) {
    let j = i;
    while (j < text.length && lvl[j] === lvl[i] && tip[j] === tip[i]) j++;
    const chunk = esc(text.slice(i, j));
    out += lvl[i] ? `<mark class="${cls[lvl[i]]}" title="${esc(tip[i])}">${chunk}</mark>` : chunk;
    i = j;
  }
  return out;
}

function renderReport(ad, r, animate) {
  const box = $("#reportBody");
  if (!state.ran || !r) {
    const img = state.images.find((i) => i.url)?.url || creative("placeholder");
    box.innerHTML = `<div class="empty-report"><div class="shot"><img src="${img}" alt=""></div><h3>${r ? "Ready when you are" : "Add your ad to start"}</h3><p>${r ? "We'll check your copy, creative text, targeting and landing page against Meta's Advertising Standards." : "Write your copy on the left, or pick an example above."}</p>${r ? `<button type="button" class="btn btn-pink" data-run>${ic("shield-check", 18)}Run compliance check</button>` : ""}</div>`;
    return;
  }
  if (state.scanning) {
    box.innerHTML = `<div class="rep-grid"><div class="rep-preview">${previewHtml(ad, r, true)}</div><div class="groups">${GROUPS.map((g) => `<div class="group"><div class="group-h"><span class="gic">${ic(g.icon)}</span><b>${g.title}</b><small><span class="spin" style="display:inline-block;width:12px;height:12px;vertical-align:-2px"></span></small></div>${g.checks.map((c) => `<div class="ck"><div class="ck-h"><span class="ck-t"><b>${c.title}</b><span>Checking…</span></span></div></div>`).join("")}</div>`).join("")}</div></div>`;
    return;
  }

  // Group findings into checks
  let total = 0, passed = 0, failed = 0, review = 0, i = 0;
  const groupsHtml = GROUPS.map((g) => {
    const rows = g.checks.map((c) => {
      total++;
      const fs = r.findings.filter((f) => matches(f, c));
      const worst = fs.some((f) => f.sev === "block") ? "block" : fs.some((f) => f.sev === "warn") ? "warn" : fs.length ? "tip" : null;
      if (!worst || worst === "tip") passed++; else if (worst === "block") failed++; else review++;
      const chip = !worst ? `<span class="chip-pass">Passed</span>` : worst === "block" ? `<span class="chip-fail">Failed</span>` : worst === "warn" ? `<span class="chip-warn">Review</span>` : `<span class="chip-plain">Tip</span>`;
      const key = c.title;
      const open = state.open.has(key);
      const lead = !fs.length ? c.pass : `${fs[0].title}${fs[0].hits[0] ? `: “${trunc(fs[0].hits[0].text, 40)}”` : ""}${fs.length > 1 ? ` +${fs.length - 1} more` : ""}`;
      const more = open && fs.length ? `<div class="ck-more">${fs.map((f) => {
        const qa = quickAction(f);
        const words = [...new Set(f.hits.map((h) => h.text))].slice(0, 3);
        return `<div class="ck-item"><b>${esc(f.title)}</b>${words.length ? `<p class="q">${words.map((w) => `“${esc(w)}”`).join(", ")}</p>` : ""}<p>${esc(f.why)}</p><p class="fix"><b>Fix:</b> ${esc(f.fix)}</p><div class="ck-acts">${qa ? `<button type="button" class="qa" data-qa="${f.id}">${esc(qa.label)}</button>` : ""}${COPY_FIELDS.some((x) => fieldsOf(f).includes(x)) && isCopyIssue(f) && !r.prohibited.length ? `<button type="button" class="link" data-open-rw="lines">See line fixes</button>` : ""}<a href="${f.policyUrl}" target="_blank" rel="noopener">${esc(f.policyName)} ↗</a></div></div>`;
      }).join("")}</div>` : "";
      return `<div class="ck" style="--i:${i++}"><button type="button" class="ck-h" data-ck="${esc(key)}" aria-expanded="${open}"${fs.length ? "" : " disabled"}><span class="ck-t"><b>${c.title}</b><span>${esc(lead)}</span></span>${chip}${fs.length ? ic("chevron-down", 16, "chev") : ""}</button>${more}</div>`;
    }).join("");
    return `<div class="group"><div class="group-h"><span class="gic">${ic(g.icon)}</span><b>${g.title}</b></div>${rows}</div>`;
  }).join("");

  const C = 2 * Math.PI * 42;
  const color = r.level === "high" ? "var(--fail)" : r.level === "medium" ? "#D97706" : "var(--pass)";
  const title = r.prohibited.length ? "Can't be advertised" : r.level === "high" ? "Likely to be rejected" : r.level === "medium" ? "Could be flagged" : "Looks good to launch";
  const sub = r.prohibited.length ? "This product is prohibited on Facebook, whatever the wording."
    : r.level === "high" ? `Fix the failed checks first. Repeated rejections can restrict the ad account.`
    : r.level === "medium" ? "Review the flagged checks before you spend."
    : "Every check passed or has only optional tips.";

  box.innerHTML = `<div class="${animate ? "rep-anim" : ""}">
    <div class="summary-card">
      <div class="ring"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="42"/><circle class="fg" cx="50" cy="50" r="42" stroke="${color}" stroke-dasharray="${C}" stroke-dashoffset="${animate ? C : C * (1 - passed / total)}" data-off="${C * (1 - passed / total)}"/></svg><div class="ring-in"><b>${passed}/${total}</b><span>passed</span></div></div>
      <div class="sum-t"><h3>${title}</h3><p>${sub}</p><div class="sum-chips"><span class="chip-${r.prohibited.length || r.level === "high" ? "fail" : r.level === "medium" ? "warn" : "pass"}" style="${r.level === "low" ? "" : ""}">${LEVEL[r.level]} · ${r.risk}/100</span>${failed ? `<span class="chip-fail">${failed} failed</span>` : ""}${review ? `<span class="chip-warn">${review} to review</span>` : ""}</div></div>
    </div>
    ${r.prohibited.length ? `<div class="banner"><b>Prohibited:</b> ${esc([...new Set(r.prohibited.map((p) => p.title))].join("; "))}. We don't write copy suggestions for prohibited products.</div>` : ""}
    <div class="rep-grid"><div class="rep-preview">${previewHtml(ad, r, false)}</div><div class="groups">${groupsHtml}</div></div>
    ${r.prohibited.length ? "" : suggestHtml(ad, r)}
    ${r.level === "low" && !r.prohibited.length ? `<div class="ready"><b>${ic("party-popper", 18)}Ready to launch</b><p>${state.landing && state.landingFor === ad.url && state.landing.ok ? "Copy, targeting and landing page all look good." : `Copy and targeting look good. <button type="button" class="link" data-scan>Scan your landing page</button> for a final check.`}</p></div>` : ""}
  </div>`;
  if (animate) requestAnimationFrame(() => requestAnimationFrame(() => { const fg = $(".ring .fg", box); if (fg) fg.style.strokeDashoffset = fg.dataset.off; }));

  if (r.level === "low" && state.prevLevel && state.prevLevel !== "low") { confetti(); toast("Nice: this ad is now low risk"); }
  state.prevLevel = r.level;
}

// ---------- suggested copy ----------
function suggestHtml(ad, r) {
  const res = fullRewrites(ad, r, brief, state.seed);
  state.full = res.items;
  if (state.angle >= res.items.length) state.angle = 0;
  const it = res.items[state.angle];
  const diff = state.diff && it.key === "light";
  return `<div class="suggest">
    <div class="suggest-h"><span class="gic">${ic("wand-sparkles")}</span><b>Suggested copy</b><span class="chip-pink">${res.items.length} options</span><button type="button" class="link" data-open-rw="lines">Fix line by line</button></div>
    <div class="angle-tabs" role="tablist">${res.items.map((x, k) => `<button type="button" data-angle="${k}" aria-selected="${k === state.angle}"><span class="dot dot-${x.level}"></span>${esc(x.label)}</button>`).join("")}</div>
    <div class="sg-body">
      <div class="sg-f"><small>Primary text</small><p>${diff ? diffWords(ad.primary, it.primary) : phMark(it.primary)}</p></div>
      <div class="sg-f"><small>Headline</small><p>${diff ? diffWords(ad.headline, it.headline) : phMark(it.headline)}</p></div>
      ${it.description ? `<div class="sg-f"><small>Description</small><p>${phMark(it.description)}</p></div>` : ""}
    </div>
    <div class="sg-foot"><small>${esc(it.note)}${it.placeholders ? " Replace the highlighted placeholders with real details." : ""}</small>
      <span class="sg-acts">${it.key === "light" ? `<button type="button" class="btn btn-ghost btn-xs" data-diff>${state.diff ? "Hide changes" : "Show changes"}</button>` : `<button type="button" class="btn btn-ghost btn-xs" id="regen">${ic("refresh-cw", 14)}Another</button>`}<button type="button" class="btn btn-ghost btn-xs" data-copy-rw="full:${state.angle}">${ic("copy", 14)}Copy</button><button type="button" class="btn btn-pink btn-xs" data-apply-rw="full:${state.angle}">Use this</button></span></div>
    ${state.ai ? `<p class="fine" style="text-align:left;margin-top:12px"><button type="button" class="link" data-open-rw="ai">${ic("sparkles", 14)} Write AI versions in your tone</button></p>` : ""}
  </div>`;
}

const phMark = (s) => esc(s).replace(/\[[^\]]+\]/g, (m) => `<span class="ph">${m}</span>`);
function diffWords(a, b) {
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
  if (A.length * B.length > 60000) return esc(b);
  const dp = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0, j = 0, out = "";
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) { out += esc(A[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { if (A[i].trim()) out += `<del class="d-del">${esc(A[i])}</del>`; i++; }
    else { out += B[j].trim() ? `<ins class="d-add">${esc(B[j])}</ins>` : esc(B[j]); j++; }
  }
  while (i < A.length) { if (A[i].trim()) out += `<del class="d-del">${esc(A[i])}</del>`; i++; }
  while (j < B.length) { out += B[j].trim() ? `<ins class="d-add">${esc(B[j])}</ins>` : esc(B[j]); j++; }
  return out;
}

// ---------- inline underlines & popover ----------
function renderOverlays(r) {
  const byField = {};
  if (r) for (const f of r.findings) for (const h of f.hits) if (COPY_FIELDS.includes(h.field)) (byField[h.field] ||= []).push({ ...h, sev: f.sev, f });
  state.hits = byField;
  for (const fld of COPY_FIELDS) {
    const el = els[fld], back = el.previousElementSibling, text = el.value;
    const hits = (byField[fld] || []).slice().sort((a, b) => a.start - b.start || SEV[b.sev].rank - SEV[a.sev].rank);
    let html = "", pos = 0;
    for (const h of hits) {
      if (h.start < pos) continue;
      html += esc(text.slice(pos, h.start)) + `<mark class="u-${h.sev}${state.pop && state.pop.field === fld && state.pop.start === h.start ? " u-on" : ""}" data-s="${h.start}">${esc(text.slice(h.start, h.end))}</mark>`;
      pos = h.end;
    }
    html += esc(text.slice(pos));
    back.innerHTML = `<span class="hl-in">${html}${fld === "primary" ? "\n " : ""}</span>`;
    if (fld === "primary") growPrimary();
    else back.firstChild.style.transform = `translateX(${-el.scrollLeft}px)`;
  }
}
function growPrimary() { const el = els.primary; el.style.height = "auto"; el.style.height = Math.max(110, el.scrollHeight + 4) + "px"; }
function hitAtCaret(fld) {
  const el = els[fld], c = el.selectionStart;
  if (el.selectionEnd !== c) return null;
  return (state.hits?.[fld] || []).filter((h) => c >= h.start && c <= h.end).sort((a, b) => SEV[b.sev].rank - SEV[a.sev].rank)[0] || null;
}
function showPop(fld, hit) {
  if (!state.last || state.last.r.prohibited.length) return;
  state.pop = { field: fld, start: hit.start };
  renderOverlays(state.last.r);
  const mark = els[fld].previousElementSibling.querySelector(`mark[data-s="${hit.start}"]`);
  const rect = (mark || els[fld]).getBoundingClientRect();
  const fx = lineFixes(state.last.ad, state.last.r, brief).filter((lf) => lf.field === fld && lf.original.includes(hit.text.trim()))[0];
  state.popFixes = fx;
  const f = hit.f;
  const pop = $("#pop");
  pop.innerHTML = `<div class="pop-h"><span class="sev-ic i-${f.sev}">${ic(SEV_IC[f.sev], 18)}</span><b>${esc(f.title)}</b><button type="button" class="icon-btn" data-pop-close aria-label="Close">${ic("x", 14)}</button></div>
    <p class="pop-why">${esc(f.why.split(/(?<=\.)\s/)[0])} <a class="pop-pol" href="${f.policyUrl}" target="_blank" rel="noopener">${esc(f.policyName)} ↗</a></p>
    ${fx ? `<p class="pop-label">Replace with</p>${fx.options.map((o, k) => `<button type="button" class="pop-opt" data-pop-apply="${k}">${ic("check", 15)}<span>${phMark(o.text)}</span></button>`).join("")}` : `<p class="pop-why">${esc(f.fix)}</p>`}
    <div class="pop-foot"><span>Click an option to apply it</span><button type="button" class="link" data-open-rw="lines">All fixes</button></div>`;
  pop.hidden = false;
  const w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = Math.min(Math.max(12, rect.left), innerWidth - w - 12) + "px";
  let top = rect.bottom + 8;
  if (top + h > innerHeight - 12) top = Math.max(12, rect.top - h - 8);
  pop.style.top = top + "px";
}
function hidePop() {
  if (!state.pop) return;
  state.pop = null;
  $("#pop").hidden = true;
  if (state.last && state.ran) renderOverlays(state.last.r);
}

// ---------- quick actions ----------
function quickAction(f) {
  const m = f.title.match(/needs (\d+)\+/);
  if (f.id === "age" && m) return { label: `Set age to ${m[1]}+`, run: () => { els.minAge.value = m[1]; } };
  if (f.id === "sac-age") return { label: "Set age to 18+", run: () => { els.minAge.value = 18; } };
  const drop = (keep) => ({ label: "Remove these locations", run: () => { state.countries = state.countries.filter(keep); renderTags(); } });
  if (f.id === "alcohol-country") return drop((c) => !ALCOHOL_BANNED.includes(c));
  if (f.id === "gambling-country") return drop((c) => !GAMBLING_BANNED.includes(c));
  if (f.id === "cbd-country") return drop((c) => CBD_COUNTRIES.includes(c));
  if (f.id === "rx-country") return drop((c) => RX_COUNTRIES.includes(c));
  if (f.id === "http") return { label: "Use https", run: () => { els.url.value = els.url.value.replace(/^http:/i, "https:"); } };
  const sac = { "sac-fin": "financial", "sac-emp": "employment", "sac-house": "housing", siep: "siep" }[f.rule?.cat];
  if (sac && els.sac.value !== sac) return { label: "Declare category", run: () => { els.sac.value = sac; } };
  if (["crypto", "gambling", "dating", "cbd", "rx", "investing", "auth"].includes(f.id) && !els.authorised.checked && f.sev !== "block") return { label: "I have permission", run: () => { els.authorised.checked = true; } };
  return null;
}
function doQuick(id) {
  const f = state.last?.r.findings.find((x) => x.id === id);
  const qa = f && quickAction(f);
  if (!qa) return;
  pushUndo(); qa.run(); refresh(); toast(`${qa.label}: done`, true);
}

// ---------- notes under fields ----------
function renderNotes(r) {
  const byField = {};
  if (r) for (const f of r.findings) if (f.sev !== "tip") for (const fld of fieldsOf(f)) (byField[fld] ||= []).push(f);
  for (const box of $$(".notes")) {
    const fld = box.dataset.notes || box.closest("[data-field]")?.dataset.field;
    const list = byField[fld] || [];
    box.innerHTML = list.slice(0, 2).map((f) => {
      const words = [...new Set(f.hits.filter((h) => mapHit(h.field) === fld).map((h) => h.text))].slice(0, 2);
      const qa = quickAction(f);
      return `<span class="note note-${f.sev}">${ic(SEV_IC[f.sev], 16)}<span><b>${esc(f.title)}</b>${words.length ? ` · ${words.map((w) => `“${esc(w)}”`).join(", ")}` : ""}${qa ? `<button type="button" class="qa" data-qa="${f.id}">${esc(qa.label)}</button>` : ""}</span></span>`;
    }).join("") + (list.length > 2 ? `<span class="note note-tip">${ic("info", 16)}<span>${list.length - 2} more in the report</span></span>` : "");
  }
}

function renderTargetSummary(r) {
  const C = state.countries;
  const bad = r && state.ran ? r.findings.filter((f) => f.sev === "block" && fieldsOf(f).some((x) => ["age", "countries", "niche", "sac"].includes(x))).length : 0;
  $("#tgtSum").innerHTML = `${C.length ? esc(C.slice(0, 2).join(", ")) + (C.length > 2 ? ` +${C.length - 2}` : "") : "No locations"} · ${els.minAge.value}+${bad ? ` · <span class="flag">${bad} issue${bad > 1 ? "s" : ""}</span>` : ""}`;
}

function renderHelp(r) {
  const key = r ? r.niche : els.niche.value === "auto" ? null : els.niche.value;
  const N = key ? NICHES[key] : null;
  $("#nicheHelp").innerHTML = N && key !== "general" ? `<span class="${TONE_CHIP[STATUS[N.status].tone]}">${STATUS[N.status].label}</span> ${esc(N.summary)} <button type="button" class="link" data-pb="${key}">Playbook</button>` : "Pick the closest category, or let us detect it from your copy.";
}

// ---------- creative ----------
function renderCreative() {
  const im = state.images[0];
  $("#cdImg").innerHTML = im ? `<img src="${im.url}" alt="">` : ic("image", 28);
  $("#cdText").textContent = !im ? "Upload a 1:1 image. We read the text inside it too." : im.sample ? "Example creative. Upload your own to check the text inside it." : im.status === "reading" ? "Reading the text in your image…" : im.status === "error" ? "Couldn't read this image." : im.text ? `${im.text.split(" ").length} words found in the image and checked.` : "No text found in the image.";
  $("#cdRemove").hidden = !im;
}
let tessLoading = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  tessLoading ||= new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"; s.onload = () => res(window.Tesseract); s.onerror = () => rej(new Error("OCR failed")); document.head.appendChild(s); });
  return tessLoading;
}
function addFiles(files) {
  const file = [...files].find((f) => f.type.startsWith("image/"));
  if (!file) return;
  const im = { id: "u" + Date.now(), name: "Image 1", url: URL.createObjectURL(file), status: "reading", text: "", textRatio: 0, sideBySide: false };
  state.images = [im];
  renderCreative(); refresh();
  (async () => {
    try {
      const dims = await new Promise((res) => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => res({ w: 1, h: 1 }); i.src = im.url; });
      const { data } = await (await loadTesseract()).recognize(file, "eng");
      const words = (data.words || []).filter((w) => w.confidence > 55 && /\w{2,}/.test(w.text));
      im.text = words.map((w) => w.text).join(" ");
      im.textRatio = Math.min(1, words.reduce((s, w) => s + Math.max(0, (w.bbox.x1 - w.bbox.x0) * (w.bbox.y1 - w.bbox.y0)), 0) / (dims.w * dims.h || 1));
      im.sideBySide = dims.w / dims.h >= 1.6 || /\bbefore\b[\s\S]*\bafter\b/i.test(im.text);
      im.status = "done";
    } catch { im.status = "error"; }
    renderCreative(); refresh();
  })();
}

// ---------- landing ----------
async function scanLanding() {
  const url = els.url.value.trim();
  if (!url) return toast("Add a website URL first");
  if (!state.server) return toast("Start the Guardian server to scan pages");
  toast("Scanning your landing page…");
  try {
    const ad = readAd();
    const resp = await fetch("/api/landing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, adText: [ad.primary, ad.headline, ad.description].join(" ") }) });
    state.landing = await resp.json();
    state.landingFor = url;
    toast(state.landing.ok ? "Landing page checked" : `Landing page didn't load (${state.landing.status || state.landing.error})`);
  } catch { toast("Couldn't reach the server"); }
  refresh();
}

// ---------- undo & apply ----------
function pushUndo() { state.undo.push(snapshot()); state.undo = state.undo.slice(-20); }
function undo() { const s = state.undo.pop(); if (!s) return; restore(s); refresh(); toast("Undone"); }
function lockNiche() { if (els.niche.value === "auto" && state.last) els.niche.value = state.last.r.niche; }
function applyCopy(it, msg) {
  pushUndo(); lockNiche();
  els.primary.value = it.primary; els.headline.value = it.headline; els.description.value = it.description || "";
  state.angle = 0; state.diff = false;
  hidePop(); refresh(); toast(msg, true);
}

// ---------- drawer (more rewrites, playbooks) ----------
function openDrawer(kind, opts = {}) {
  hidePop();
  state.drawer = kind;
  if (kind === "rewrite") { state.rwTab = opts.tab || "lines"; $("#drawerTitle").textContent = "More rewrites"; }
  if (kind === "playbook") { state.pb = opts.key; $("#drawerTitle").textContent = "Playbook"; }
  renderDrawer();
  $("#scrim").hidden = false;
  const d = $("#drawer");
  d.classList.add("open"); d.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => $(".icon-btn", d).focus(), 60);
}
function closeDrawer() {
  state.drawer = null;
  $("#scrim").hidden = true;
  const d = $("#drawer");
  d.classList.remove("open"); d.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
function renderDrawer() {
  if (state.drawer === "playbook") return renderPlaybook(state.pb);
  const body = $("#drawerBody");
  if (!state.last) { body.innerHTML = `<div class="empty"><b>Nothing to fix yet</b>Write your ad first.</div>`; return; }
  const { ad, r } = state.last;
  if (r.prohibited.length) { body.innerHTML = `<div class="refuse"><h3>We can't rewrite this ad</h3><p>It promotes something Meta doesn't allow at all. Rewording or disguising it usually gets the whole ad account disabled.</p></div>`; return; }
  const tabs = [["lines", "Line fixes", "pen-line"], ["full", "All versions", "layout-grid"], ["ai", "AI rewrites", "sparkles"]];
  body.innerHTML = `<div class="seg" role="tablist">${tabs.map(([k, l, i]) => `<button type="button" role="tab" data-rw="${k}" aria-selected="${state.rwTab === k}">${ic(i, 15)}${l}</button>`).join("")}</div>${state.rwTab !== "lines" ? briefHtml() : ""}<div id="rwPane">${paneHtml(ad, r)}</div>`;
}
const paneHtml = (ad, r) => (state.rwTab === "lines" ? linesHtml(ad, r) : state.rwTab === "full" ? allHtml(ad, r) : aiHtml(ad, r));
function briefHtml() {
  const filled = brief.product && brief.features;
  return `<details class="brief"${filled ? "" : " open"}><summary>Your product details <small>${filled ? "Used in every rewrite" : "Optional. Replaces the [bracketed] examples"}</small></summary><div class="brief-body">
    <label class="field"><span class="lbl">What you sell</span><input data-brief="product" value="${esc(brief.product)}" placeholder="e.g. high-protein meal plan"></label>
    <label class="field"><span class="lbl">3 real features, comma separated</span><input data-brief="features" value="${esc(brief.features)}" placeholder="e.g. dietitian-designed plans, 20-minute recipes, weekly check-ins"></label>
    <label class="field"><span class="lbl">Offer (only if real)</span><input data-brief="offer" value="${esc(brief.offer)}" placeholder="e.g. 20% off your first order"></label></div></details>`;
}
function linesHtml(ad, r) {
  const fixes = lineFixes(ad, r, brief);
  state.lineFixes = fixes;
  if (!fixes.length) return `<div class="empty"><b>No lines need rewording</b>Any remaining issues are about targeting, permissions or the page.</div>`;
  return `<p class="d-intro">Pick an option to replace that line. The report updates straight away.</p>` + fixes.map((lf, i) => `<div class="line"><div class="line-h"><span class="fld">${esc(FIELD_LABEL[lf.field])}</span> · ${esc(lf.titles[0])}</div><p class="line-orig">${esc(lf.original)}</p>
    ${lf.options.map((o, k) => `<button type="button" class="opt" data-apply-line="${i}:${k}"><span class="opt-b"><span>${phMark(o.text)}</span><small>${o.lineClean ? `<span class="opt-ok">✓ Line clean</span>` : `<span class="opt-left">Still flagged</span>`} · ad risk ${r.risk} → ${o.risk}</small></span><span class="opt-apply">Use</span></button>`).join("")}</div>`).join("");
}
function rwCard(it, idx, kind) {
  return `<article class="rw"><div class="rw-h"><div><b>${esc(it.label)}</b><small>${esc(it.note || "")}</small></div><span class="chip-${it.level === "low" ? "pass" : it.level === "medium" ? "warn" : "fail"}">${LEVEL[it.level]}</span></div>
    <div class="sg-body"><div class="sg-f"><small>Primary text</small><p>${phMark(it.primary)}</p></div><div class="sg-f"><small>Headline</small><p>${phMark(it.headline)}</p></div>${it.description ? `<div class="sg-f"><small>Description</small><p>${phMark(it.description)}</p></div>` : ""}</div>
    <div class="sg-foot"><small>${it.copyIssues.length ? `${it.copyIssues.length} copy flag(s) left` : "No copy flags"}</small><span class="sg-acts"><button type="button" class="btn btn-ghost btn-xs" data-copy-rw="${kind}:${idx}">Copy</button><button type="button" class="btn btn-pink btn-xs" data-apply-rw="${kind}:${idx}">Use this</button></span></div></article>`;
}
function allHtml(ad, r) {
  const res = fullRewrites(ad, r, brief, state.seed);
  state.full = res.items;
  return res.items.map((it, i) => rwCard(it, i, "full")).join("");
}
function aiHtml(ad, r) {
  if (!state.server || !state.ai) return `<div class="ai-box"><h3>AI rewrites are off</h3><p>Run the Guardian server with an ANTHROPIC_API_KEY to turn them on. The built-in suggestions still work.</p></div>`;
  const items = state.aiItems ? state.aiItems.map((v) => score({ ...ad, niche: r.niche }, v)) : [];
  state.aiScored = items;
  const tones = ["Confident and clear", "Warm and friendly", "Premium and calm", "Bold and punchy", "Expert and clinical"];
  return `<div class="ai-box"><h3>Written by Claude, checked by our rules</h3><p>Truthful versions built from the issues we found and your product details. Each one is re-scored.</p>
    <div class="ai-row"><select id="aiTone" aria-label="Tone">${tones.map((t) => `<option${t === state.aiTone ? " selected" : ""}>${t}</option>`).join("")}</select><button type="button" class="btn btn-pink btn-sm" id="aiGo" ${state.aiBusy ? "disabled" : ""}>${state.aiBusy ? `<span class="spin"></span>Writing…` : state.aiItems ? "Write 4 more" : "Write 4 versions"}</button></div></div>`
    + (state.aiError ? `<p class="d-intro">${esc(state.aiError)}</p>` : "") + items.map((it, i) => rwCard(it, i, "ai")).join("");
}
async function runAi() {
  if (!state.last || state.aiBusy) return;
  state.aiTone = $("#aiTone")?.value || state.aiTone;
  state.aiBusy = true; state.aiError = "";
  renderDrawer();
  try {
    const { ad } = state.last;
    const resp = await fetch("/api/rewrite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ad, brief: { ...brief, brand: ad.brand, offer: brief.offer || detectOffer(ad.primary + " " + ad.headline) }, tone: state.aiTone, count: 4 }) });
    const data = await resp.json();
    if (data.error) state.aiError = data.error;
    else if (data.refused) state.aiError = "This product can't be advertised on Facebook.";
    else state.aiItems = data.variants.map((v) => ({ label: v.angle, note: v.rationale, primary: v.primary_text, headline: v.headline, description: v.description }));
  } catch { state.aiError = "Couldn't reach the server."; }
  state.aiBusy = false;
  if (state.drawer === "rewrite") renderDrawer();
}

// ---------- playbooks ----------
function abExample(n) {
  const V = n.vocab;
  const bad = (n.avoid[0].match(/"([^"]+)"/) || [null, n.avoid[0]])[1];
  const good = V.outcome ? `${cap(V.outcome)}, built around ${V.features[0]} and ${V.features[1]}.${V.disclaimer ? " " + V.disclaimer : ""}` : "";
  return { bad, good };
}
function renderPlaybooks() {
  $("#pbList").innerHTML = Object.entries(NICHES).filter(([k]) => k !== "general").map(([k, n]) => {
    const t = STATUS[n.status].tone;
    return `<button type="button" class="pb" data-pb="${k}" data-status="${n.status}"><span class="pb-top"><span class="pb-ic" style="background:${TONE_BG[t]};color:${TONE_FG[t]}">${ic(NICHE_IC[n.icon] || "sparkle", 22)}</span><span class="${TONE_CHIP[t]}">${STATUS[n.status].label}</span></span><b>${esc(n.name)}</b><p>${esc(n.summary)}</p><span class="go">Open playbook ${ic("arrow-right", 15)}</span></button>`;
  }).join("");
}
function renderPlaybook(k) {
  const n = NICHES[k], t = STATUS[n.status].tone, ab = abExample(n);
  $("#drawerBody").innerHTML = `<div class="pb-detail"><span class="pb-ic" style="background:${TONE_BG[t]};color:${TONE_FG[t]};display:grid;place-items:center">${ic(NICHE_IC[n.icon] || "sparkle", 26)}</span>
    <h3>${esc(n.name)}</h3><span class="${TONE_CHIP[t]}">${STATUS[n.status].label}</span>${n.minAge >= 18 ? ` <span class="chip-plain">18+</span>` : ""}
    <p class="sum">${esc(n.summary)}</p>
    ${ab.good ? `<div class="ab" style="margin-bottom:12px"><div class="bad"><small>Likely rejected</small>“${esc(ab.bad)}”</div><div class="good"><small>Passes review</small>“${esc(ab.good)}”</div></div>` : ""}
    <div class="pb-box do"><h4>What Meta requires</h4><ul>${n.require.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="pb-box dont"><h4>What gets ads rejected</h4><ul>${n.avoid.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    ${n.angles.length ? `<p class="pb-label">Angles that pass review</p><div class="pb-angles">${n.angles.map((a) => `<span class="chip-plain">${esc(a)}</span>`).join("")}</div>` : `<div class="refuse" style="margin-bottom:16px"><h3>No rewrites for this category</h3><p>Disguising a prohibited product is the fastest way to lose a Business Manager.</p></div>`}
    <p class="pb-label">Meta policy</p><div class="pb-links">${n.policies.map((p) => `<a href="${POLICIES[p].url}" target="_blank" rel="noopener">${esc(POLICIES[p].name)} ↗</a>`).join("")}</div>
    ${n.status !== "prohibited" ? `<button type="button" class="btn btn-pink btn-block" data-use-niche="${k}">Check an ad in this category</button>` : ""}</div>`;
}

// ---------- feature demos ----------
const F1 = [["weight", "weight", "Weight loss"], ["crypto", "crypto", "Crypto"], ["dating", "dating", "Dating"], ["skincare", "skincare", "Skincare"], ["bizopp", "bizopp", "Coaching"]];
function renderF1(i = 0) {
  $("#fTabs1").innerHTML = F1.map(([, , l], k) => `<button type="button" class="pill-btn${k === i ? " is-on" : ""}" data-f1="${k}">${l}</button>`).join("");
  const [nk, img] = F1[i], n = NICHES[nk], t = STATUS[n.status].tone, ab = abExample(n);
  $("#fMock1").outerHTML = `<div class="mock" id="fMock1"><div class="mock-h"><img src="${creative(img)}" alt=""><div><b>${esc(n.name)}</b><span class="${TONE_CHIP[t]}">${STATUS[n.status].label}</span></div></div>
    <div class="ab"><div class="bad"><small>Likely rejected</small>“${esc(ab.bad)}”</div><div class="good"><small>Passes review</small>“${esc(ab.good)}”</div></div>
    <ul class="mock-list">${n.require.slice(0, 3).map((x) => `<li>${ic("check")}${esc(x)}</li>`).join("")}</ul></div>`;
}
let f2 = null;
function renderF2(i = 0) {
  if (!f2) { const a = { ...SAMPLES.weight, niche: "auto" }; const r = check(a); f2 = { a, items: fullRewrites(a, r, {}, 0).items.slice(0, 4) }; }
  $("#fTabs2").innerHTML = f2.items.map((x, k) => `<button type="button" class="pill-btn${k === i ? " is-on" : ""}" data-f2="${k}">${esc(x.label)}</button>`).join("");
  const it = f2.items[i];
  $("#fMock2").outerHTML = `<div class="mock rw-demo" id="fMock2"><div class="mock-h"><img src="${creative("weight")}" alt=""><div><b>Lumo Slim</b><small>Weight-loss supplement</small></div></div>
    <div class="orig">${esc(trunc(f2.a.primary, 120))}</div><div class="arrow">${ic("arrow-right", 20)}</div><div class="new">${phMark(it.primary)}</div>
    <div class="meta"><span>${esc(it.note)}</span><span class="chip-pass">${LEVEL[it.level]}</span></div></div>`;
}
function renderF3() {
  const rows = [
    ["map-pin", "Audience age 16+ on a supplement ad", "Set age to 18+"],
    ["globe", "Alcohol ad targeting Norway", "Remove Norway"],
    ["users", "Loan ad without a Special Ad Category", "Declare category"],
    ["lock", "Landing page on http://", "Use https"],
  ];
  $("#fMock3").innerHTML = `<div class="mock-h"><img src="${creative("clean")}" alt=""><div><b>Targeting &amp; destination</b><small>Click a fix to try it</small></div></div>` + rows.map(([i, t, a], k) => `<div class="row"><span>${ic(i)}${t}</span><button type="button" class="fixbtn" data-f3="${k}">${a}</button></div>`).join("");
}

// ---------- tags, counters, toast, confetti ----------
function renderTags() {
  const input = $("#countryInput");
  $$(".tag", $("#countryTags")).forEach((t) => t.remove());
  for (const c of state.countries) {
    const t = document.createElement("span");
    t.className = "tag";
    t.innerHTML = `${esc(c)}<button type="button" aria-label="Remove ${esc(c)}" data-rmc="${esc(c)}">×</button>`;
    $("#countryTags").insertBefore(t, input);
  }
}
function addCountry(v) {
  const c = COUNTRIES.find((x) => x.toLowerCase() === v.trim().toLowerCase()) || (v.trim().length > 2 ? v.trim().replace(/\b\w/g, (m) => m.toUpperCase()) : "");
  if (c && !state.countries.includes(c)) { state.countries.push(c); renderTags(); refresh(); }
  $("#countryInput").value = "";
}
function updateCounters() {
  for (const c of $$(".count")) { const n = [...els[c.dataset.for].value].length, max = +c.dataset.max; c.textContent = `${n}/${max}`; c.classList.toggle("over", n > max); }
}
let toastT;
function toast(msg, withUndo = false) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${withUndo && state.undo.length ? `<button type="button" data-undo>Undo</button>` : ""}`;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), withUndo ? 5000 : 2400);
}
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#E0336F", "#17123B", "#22C55E", "#F59E0B", "#7C5CFF", "#FF9EC0"];
  const box = $("#confetti");
  box.innerHTML = Array.from({ length: 70 }, () => `<i style="left:${35 + Math.random() * 30}%;background:${colors[Math.floor(Math.random() * colors.length)]};--x:${(Math.random() - 0.5) * 320}px;--r:${Math.random() * 720 - 360}deg;--d:${1.2 + Math.random() * 1.2}s;--delay:${Math.random() * 0.25}s"></i>`).join("");
  setTimeout(() => (box.innerHTML = ""), 3000);
}
async function copy(text) { try { await navigator.clipboard.writeText(text); toast("Copied"); } catch { toast("Copy failed"); } }

// ---------- events ----------
function bind() {
  for (const k of ["brand", "primary", "headline", "description", "url"]) els[k].addEventListener("input", () => { hidePop(); schedule(); });
  for (const k of ["cta", "niche", "sac", "authorised", "minAge"]) els[k].addEventListener("change", () => refresh());
  for (const k of COPY_FIELDS) {
    const el = els[k];
    el.addEventListener("scroll", () => { const b = el.previousElementSibling.firstChild; if (b && k !== "primary") b.style.transform = `translateX(${-el.scrollLeft}px)`; });
    el.addEventListener("click", () => { if (!state.ran) return; const h = hitAtCaret(k); h ? showPop(k, h) : hidePop(); });
  }
  $("#runBtn").addEventListener("click", runCheck);
  $("#editor").addEventListener("submit", (e) => { e.preventDefault(); runCheck(); });
  $("#burger").addEventListener("click", () => { const o = $(".nav-links").classList.toggle("open"); $("#burger").setAttribute("aria-expanded", String(o)); });
  $$(".nav-links a").forEach((a) => a.addEventListener("click", () => $(".nav-links").classList.remove("open")));
  $("#scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (!$("#pop").hidden) hidePop(); else if (state.drawer) closeDrawer(); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName) && state.undo.length) { e.preventDefault(); undo(); }
  });
  window.addEventListener("resize", () => { hidePop(); growPrimary(); });
  document.fonts?.ready.then(growPrimary);
  document.addEventListener("scroll", hidePop, { passive: true });
  document.addEventListener("mousedown", (e) => { if (!$("#pop").hidden && !e.target.closest("#pop") && !e.target.closest(".hl")) hidePop(); });

  const ci = $("#countryInput");
  ci.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === ",") && ci.value.trim()) { e.preventDefault(); addCountry(ci.value); }
    else if (e.key === "Backspace" && !ci.value && state.countries.length) { state.countries.pop(); renderTags(); refresh(); }
  });
  ci.addEventListener("change", () => { if (COUNTRIES.some((c) => c.toLowerCase() === ci.value.trim().toLowerCase())) addCountry(ci.value); });
  $("#countryTags").addEventListener("click", (e) => { const b = e.target.closest("[data-rmc]"); if (b) { state.countries = state.countries.filter((c) => c !== b.dataset.rmc); renderTags(); refresh(); } else ci.focus(); });

  const drop = $("#drop"), files = $("#files");
  files.addEventListener("change", () => { addFiles(files.files); files.value = ""; });
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
  drop.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
  $("#cdRemove").addEventListener("click", () => { state.images = []; renderCreative(); refresh(); });

  $("#drawerBody").addEventListener("input", (e) => {
    const k = e.target.dataset.brief;
    if (!k) return;
    brief[k] = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => { if (state.last && $("#rwPane")) $("#rwPane").innerHTML = paneHtml(state.last.ad, state.last.r); refresh(); }, 300);
  });

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    const d = t.dataset;
    if (t.hasAttribute("data-close")) return closeDrawer();
    if (t.hasAttribute("data-pop-close")) return hidePop();
    if (t.hasAttribute("data-undo")) return undo();
    if (t.hasAttribute("data-run")) return runCheck();
    if (t.hasAttribute("data-scan")) return scanLanding();
    if (d.sample) { loadSample(d.sample); return; }
    if (d.qa) return doQuick(d.qa);
    if (d.ck) { state.open.has(d.ck) ? state.open.delete(d.ck) : state.open.add(d.ck); refresh(); return; }
    if (d.pl) { state.pl = d.pl; refresh(); return; }
    if (d.angle) { state.angle = +d.angle; state.diff = false; refresh(); return; }
    if (t.hasAttribute("data-diff")) { state.diff = !state.diff; refresh(); return; }
    if (t.id === "regen") { state.seed++; refresh(); return; }
    if (d.openRw) { openDrawer("rewrite", { tab: d.openRw }); return; }
    if (d.rw) { state.rwTab = d.rw; renderDrawer(); return; }
    if (t.id === "aiGo") return runAi();
    if (d.popApply !== undefined) { const o = state.popFixes.options[+d.popApply]; pushUndo(); lockNiche(); els[state.popFixes.field].value = o.field; hidePop(); refresh(); toast("Phrase fixed", true); return; }
    if (d.applyLine) { const [i, k] = d.applyLine.split(":").map(Number); const lf = state.lineFixes[i]; pushUndo(); lockNiche(); els[lf.field].value = lf.options[k].field; refresh(); toast("Line replaced", true); return; }
    if (d.copyRw || d.applyRw) {
      const [kind, idx] = (d.copyRw || d.applyRw).split(":");
      const it = (kind === "ai" ? state.aiScored : state.full)[+idx];
      if (d.copyRw) copy(`Primary text:\n${it.primary}\n\nHeadline: ${it.headline}${it.description ? `\nDescription: ${it.description}` : ""}`);
      else { closeDrawer(); applyCopy(it, `“${it.label}” applied`); }
      return;
    }
    if (d.pb) return openDrawer("playbook", { key: d.pb });
    if (d.useNiche) {
      els.niche.value = d.useNiche;
      if (NICHES[d.useNiche].minAge >= 18 && +els.minAge.value < 18) els.minAge.value = 18;
      $("#targeting").open = true;
      closeDrawer(); refresh();
      $("#check").scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (d.filter) { $$("[data-filter]").forEach((x) => x.classList.toggle("is-on", x === t)); $$(".pb").forEach((p) => (p.hidden = d.filter !== "all" && p.dataset.status !== d.filter)); return; }
    if (d.f1) return renderF1(+d.f1);
    if (d.f2) return renderF2(+d.f2);
    if (d.f3) { const row = t.closest(".row"); row.querySelector("span").style.color = "var(--pass)"; t.outerHTML = `<span class="chip-pass">Fixed</span>`; }
  });
}

// ---------- init ----------
function init() {
  for (const el of $$("[data-ic]")) el.innerHTML = ic(el.dataset.ic, 18);
  $$(".vdate").forEach((e) => (e.textContent = VERIFIED_ON));
  $("#flowImg").src = creative("weight");
  $("#flowShot").src = creative("weight");
  const pols = Object.values(POLICIES).filter((p) => p.name !== "Meta Advertising Standards");
  $("#marquee").innerHTML = [...pols, ...pols].map((p) => `<a href="${p.url}" target="_blank" rel="noopener">${esc(p.name)}</a>`).join("");
  els.niche.innerHTML = `<option value="auto">Detect from my ad copy</option>` + Object.entries(NICHES).map(([k, n]) => `<option value="${k}">${esc(n.name)}</option>`).join("");
  els.minAge.innerHTML = Array.from({ length: 53 }, (_, i) => i + 13).map((a) => `<option value="${a}">${a}+</option>`).join("");
  $("#countryList").innerHTML = COUNTRIES.map((c) => `<option value="${esc(c)}">`).join("");
  renderPlaybooks(); renderF1(0); renderF2(0); renderF3();
  bind();
  loadSample("weight", false);
  fetch("/api/health").then((r) => r.json()).then((h) => { state.server = !!h.ok; state.ai = !!h.ai; refresh(); }).catch(() => {});
}
init();
