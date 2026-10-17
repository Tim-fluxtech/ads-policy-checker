// Compliant rewrites. Two layers:
// 1. Line fixes: for every flagged sentence, three alternatives that keep the
//    rest of the copy as written.
// 2. Full rewrites: several complete ads, each written from a different
//    angle that is known to pass review in that niche.
// Every option is run back through the checker so its risk is shown, not assumed.
// Rewrites never disguise a product: prohibited products get no rewrite.
import { check, RULES, SEV, TEXT_FIELDS } from "./engine.js";
import { NICHES } from "./policies.js";

const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));
const cap = (s) => (s ? s.replace(/^(\[?)(\p{L})/u, (m, a, b) => a + b.toUpperCase()) : s);
const list = (a) => (a.length <= 1 ? a.join("") : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
const fit = (s, max, ...fallbacks) => [s, ...fallbacks].find((x) => x && [...x].length <= max) || [...(fallbacks.at(-1) || s)].slice(0, max).join("").trim();
const ACRONYMS = new Set(["HTTP", "HTTPS", "LGBTQ", "COVID", "NASA", "FDA", "USDA", "SPF", "CBD", "THC", "BOGO", "APR", "APY", "USDT", "IVF", "GLP", "NFT", "NFTS", "USA", "BTC", "ETH", "CEO", "SEO", "ROI", "VAT", "DIY", "FAQ", "NHS", "GDPR", "API", "SUV", "BMW", "UPS", "DHL", "PDF", "SMS", "LED", "USB", "NBA", "NFL", "UFC", "ATM", "IRA", "ISA", "ETF", "LLC", "LTD", "B2B", "SAAS", "CRM", "HIV", "MND", "ADHD", "IBS", "ICU", "MRI", "OTC", "DNA"]);

export function cleanText(s) {
  return s
    .replace(/\b[A-Z][A-Z'’]{2,}\b/g, (w) => (ACRONYMS.has(w) ? w : w.toLowerCase()))
    .replace(/([!?])[!?]+/g, "$1")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,;:])(?=[.!?])/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/,\s*\./g, ".")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/(^|[.!?]\s+|\n)([a-z])/g, (m, a, b) => a + b.toUpperCase())
    .replace(/^\s*[,.;:]\s*/, "")
    .trim();
}

export function detectOffer(text) {
  const m = text.match(/\b(?:\d{1,2}%\s+off(?:\s+(?:your\s+)?(?:first\s+)?(?:order|box|month|purchase))?|free\s+(?:shipping|delivery)(?:\s+(?:over|on\s+orders\s+over)\s+[$€£]?\d+)?|\d+[- ]day\s+(?:money[- ]back\s+guarantee|free\s+trial|returns?)|buy\s+one,?\s+get\s+one(?:\s+free)?|BOGO|save\s+[$€£]?\d+%?(?:\s+today)?|first\s+(?:month|lesson|session|class|box)\s+(?:free|for\s+[$€£]\d+))\b/i);
  return m ? cleanText(m[0]) : "";
}

function vocabFor(niche, brief) {
  const V = (NICHES[niche] || NICHES.general).vocab;
  // Example features and product names are wrapped in [brackets] so the
  // advertiser sees them as placeholders, never as claims we made up.
  const feats = (brief.features || "").split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  const F = feats.length >= 3 ? feats : [...feats, ...V.features.map((f) => `[${f}]`)].slice(0, 3);
  const P = (brief.product || "").trim() || `[${V.product}]`;
  const brand = (brief.brand || "").trim();
  return { V, F, P, brand, B: brand || `Our ${P}`, b: brand || `our ${P}`, O: (brief.offer || "").trim(), D: V.disclaimer };
}

// Neutral replacement lines for rules that need the whole sentence gone.
// Headlines and descriptions get short versions without a full stop.
function hooks(x, field = "primary") {
  const { V, F, P, brand } = x;
  if (field === "headline") return [fit(cap(V.outcome), 40, `Designed for ${V.goal}`, brand || cap(P)), fit(`Designed for ${V.goal}`, 40, brand || cap(P)), fit(brand ? `${brand}: ${F[0]}` : cap(F[0]), 40, brand || cap(P))];
  if (field === "description") return ["See how it works", "Learn more", "Explore the details"];
  return [
    `Built for ${V.goal}.`,
    `${cap(V.outcome)}, without the guesswork.`,
    `${brand ? brand + ": " + F[0] : cap(F[0])}, ${F[1]} and ${F[2]}.`,
  ];
}

function sentences(text) {
  const out = [];
  const re = /[^.!?\n]+(?:[.!?]+|$)["”']?\s*|\n+/g;
  let m;
  while ((m = re.exec(text))) { if (!m[0]) { re.lastIndex++; continue; } out.push({ start: m.index, end: m.index + m[0].length, text: m[0] }); }
  return out;
}

// k picks the alternative (0-2). A sentence is rewritten whole when a rule
// asks for it or when two different rules overlap in it, because stitching
// several phrase swaps together reads badly.
// lite (used by auto-fix) only uses the two neutral lines and drops further
// flagged sentences, so no [placeholder] text lands in the live ad.
function fixSentence(sent, hits, k, x, field = "primary", rot = 0, lite = false) {
  const trail = sent.text.match(/\s*$/)[0];
  const ruleIds = new Set(hits.map((h) => h.rule));
  const whole = hits.some((h) => RULE_BY_ID[h.rule]?.sentence) || (hits.length > 1 && !ruleIds.has("obfuscation"));
  if (whole && lite) return k + rot >= 2 ? "" : hooks(x, field)[k + rot] + trail;
  if (whole) return hooks(x, field)[(k + rot) % 3] + trail;
  let s = sent.text;
  for (const h of [...hits].sort((a, b) => b.start - a.start)) {
    const rule = RULE_BY_ID[h.rule];
    let rep = null;
    if (h.rule === "obfuscation") rep = h.plain || "";
    else if (rule) {
      const viaFn = rule.altsFn ? rule.altsFn(h.text) : null;
      rep = viaFn ? viaFn[k] : rule.alts ? rule.alts[k] : null;
    }
    if (rep === null || rep === undefined) continue;
    const a = h.start - sent.start, b = h.end - sent.start;
    if (a < 0 || b > s.length) continue;
    s = s.slice(0, a) + rep + s.slice(b);
  }
  const out = cleanText(s);
  if (!out.replace(/[\p{P}\p{S}\s]/gu, "")) return "";
  return out + trail;
}

const finish = (field, text) => (field === "primary" ? cleanText(text) : cleanText(text).replace(/\.$/, ""));

function collectHits(result) {
  const byField = {};
  for (const f of result.findings) {
    for (const h of f.hits) {
      if (!TEXT_FIELDS.includes(h.field)) continue;
      (byField[h.field] ||= []).push({ ...h, rule: f.id, title: f.title });
    }
  }
  return byField;
}

const LINE_LABELS = ["Option A", "Option B", "Option C"];

// Line-level fixes: three alternatives for each flagged sentence. Each option
// reports whether the line itself is now clean and the whole ad's new risk.
export function lineFixes(ad, result, brief = {}) {
  if (result.prohibited.length) return [];
  ad = { ...ad, niche: result.niche }; // keep the niche fixed while the wording changes
  const x = vocabFor(result.niche, { brand: ad.brand, ...brief });
  const byField = collectHits(result);
  const out = [];
  let rot = 0;
  for (const field of TEXT_FIELDS) {
    const text = ad[field] || "";
    const hits = byField[field];
    if (!hits || !text) continue;
    for (const sent of sentences(text)) {
      const inside = hits.filter((h) => h.start < sent.end && h.end > sent.start);
      if (!inside.length) continue;
      const fixable = inside.filter(isFixable);
      if (!fixable.length) continue;
      const seen = new Set();
      const options = [];
      for (let k = 0; k < 3; k++) {
        const fixed = fixSentence(sent, fixable, k, x, field, rot);
        const key = fixed.trim().toLowerCase();
        if (seen.has(key) || key === sent.text.trim().toLowerCase()) continue;
        seen.add(key);
        const newField = finish(field, text.slice(0, sent.start) + fixed + text.slice(sent.end));
        const whole = check({ ...ad, [field]: newField });
        const alone = check({ ...ad, primary: field === "primary" ? fixed : "", headline: field === "headline" ? fixed : "", description: field === "description" ? fixed : "" });
        const left = alone.findings.filter(isCopyIssue);
        options.push({ label: LINE_LABELS[options.length], text: finish(field, fixed) || "(remove this line)", field: newField, risk: whole.risk, level: whole.level, lineClean: !left.length, lineLeft: left.map((f) => f.title) });
      }
      rot++;
      if (options.length) out.push({ field, original: sent.text.trim(), rules: [...new Set(fixable.map((h) => h.rule))], titles: [...new Set(inside.map((h) => h.title))], options });
    }
  }
  return out;
}

const isFixable = (h) => { const r = RULE_BY_ID[h.rule]; return h.rule === "obfuscation" || !!(r && (r.sentence || r.alts || r.altsFn)); };

// ---------- Full rewrites ----------

const ANGLES = {
  product: {
    label: "Product first", note: "Leads with what it is and what's in it.",
    v: [
      (x) => ({ p: `${x.B} brings together ${list(x.F)}. ${x.O ? x.O + ". " : ""}${x.D}`, h: fit(`${cap(x.P)} with ${x.F[0]}`, 40, `${cap(x.P)}, done properly`, cap(x.P)), d: fit(x.O || "See what's inside", 30, "See what's inside") }),
      (x) => ({ p: `What you get with ${x.b}: ${list(x.F)}. Designed for ${x.V.goal}. ${x.O ? x.O + ". " : ""}${x.D}`, h: fit(`Designed for ${x.V.goal}`, 40, "Designed with care"), d: "Learn how it works" }),
      (x) => ({ p: `${cap(x.F[0])}. ${cap(x.F[1])}. ${cap(x.F[2])}. That's ${x.b}, built for ${x.V.goal}. ${x.O ? x.O + ". " : ""}${x.D}`, h: fit(x.brand ? `${x.brand}: ${x.V.outcome}` : cap(x.V.outcome), 40, cap(x.V.outcome), x.brand || cap(x.P)), d: fit(x.O || "Explore the details", 30, "Explore the details") }),
    ],
  },
  routine: {
    label: "Routine & lifestyle", note: "Sells the experience and the habit, not a result.",
    v: [
      (x) => ({ p: `Small steps, done consistently. ${x.B} makes ${x.V.goal} part of a normal week, with ${x.F[0]} and ${x.F[1]}. ${x.O ? x.O + ". " : ""}${x.D}`, h: "A routine you can keep", d: "Start today" }),
      (x) => ({ p: `Built to fit a busy schedule: ${list(x.F)}. ${cap(x.V.outcome)}, one day at a time. ${x.O ? x.O + ". " : ""}${x.D}`, h: "Fits around your week", d: "See how it works" }),
      (x) => ({ p: `Mornings, evenings, weekends: ${x.b} works around real life. ${cap(x.F[0])} and ${x.F[1]}, without the overwhelm. ${x.O ? x.O + ". " : ""}${x.D}`, h: fit(cap(x.V.outcome), 40, "Made for real life"), d: "Get started" }),
    ],
  },
  proof: {
    label: "Social proof", note: "Uses real reviews. Fill the [brackets] with verifiable numbers.",
    v: [
      (x) => ({ p: `Rated [4.8/5] by [number] ${x.V.proof}. Here's why they choose ${x.b}: ${list(x.F)}. ${x.D || "Individual experiences vary."}`, h: fit(`Rated [4.8/5] by ${x.V.proof}`, 40, "Rated [4.8/5]"), d: "Read real reviews" }),
      (x) => ({ p: `[Number] ${x.V.proof} use ${x.b} for ${x.V.goal}. ${cap(x.F[0])}, ${x.F[1]} and ${x.F[2]}. Read their reviews on our site. ${x.D}`, h: fit(`Loved by [number] ${x.V.proof}`, 40, "Loved by [number] customers"), d: "See reviews" }),
      (x) => ({ p: `"[Paste a real customer quote]" – [first name], verified customer. ${x.B}: ${list(x.F)}. ${x.D || "Individual experiences vary."}`, h: fit(`What ${x.V.proof} are saying`, 40, "What people are saying"), d: "Verified reviews" }),
    ],
  },
  education: {
    label: "Educate first", note: "Curiosity through useful information, not clickbait.",
    v: [
      (x) => ({ p: `What actually helps with ${x.V.goal}? ${cap(x.F[0])}, ${x.F[1]} and ${x.F[2]}. ${x.B} explains each step, then helps you put it into practice. ${x.D}`, h: fit(`How ${x.brand || "it"} works`, 40, "How it works"), d: "Learn more" }),
      (x) => ({ p: `Start with the basics: ${list(x.F)}. ${x.B} walks you through each one, step by step. ${x.D}`, h: fit(`${cap(x.V.goal)}, explained`, 40, "Explained, step by step"), d: "Learn the basics" }),
      (x) => ({ p: `3 things worth knowing about ${x.V.goal}: 1) ${x.F[0]}, 2) ${x.F[1]}, 3) ${x.F[2]}. ${x.B} is built around all three. ${x.D}`, h: "3 things worth knowing", d: "Read more" }),
    ],
  },
  offer: {
    label: "Offer-led", note: "Puts the deal first, with terms stated.",
    v: [
      (x) => ({ p: `${x.O ? `${x.O} on ${x.b}.` : `${cap(x.b)}, ready when you are.`} ${cap(list(x.F))}. Full terms on our site. ${x.D}`, h: fit(x.O || `Try ${x.brand || "it"} today`, 40, "Try it today"), d: x.O ? "Terms apply" : "See pricing" }),
      (x) => ({ p: `${x.B}: ${x.F[0]}, ${x.F[1]} and ${x.F[2]}. ${x.O ? x.O + ". " : ""}See pricing and terms before you commit. ${x.D}`, h: "Clear pricing, no surprises", d: x.O ? "See offer terms" : "See pricing" }),
      (x) => ({ p: `${x.O ? `Now: ${x.O}. ` : ""}${cap(x.V.outcome)} with ${x.b}. ${cap(x.F[0])} and ${x.F[1]} included. ${x.D}`, h: fit(x.O || cap(x.V.outcome), 40, "See what's included"), d: x.O ? "Terms apply" : "Learn more" }),
    ],
  },
  expert: {
    label: "Expert-led", note: "Consultation first, which reviewers trust in health niches.",
    v: [
      (x) => ({ p: `Every ${x.P} starts with a consultation. ${cap(list(x.F))}. You decide what's right after that. ${x.D}`, h: "Start with a consultation", d: "Book online" }),
      (x) => ({ p: `Care that starts with a conversation. ${x.B} offers ${list(x.F)}. ${x.D}`, h: fit(`Expert-led ${x.P}`, 40, "Expert-led care"), d: "Book a consultation" }),
      (x) => ({ p: `Questions first, treatment second. Talk to our team about ${x.V.goal}, with ${x.F[0]} and ${x.F[1]}. ${x.D}`, h: "Talk to our team", d: "Book now" }),
    ],
  },
  transparency: {
    label: "Transparency & risk", note: "Fees, terms and risks up front: the safest angle for money niches.",
    v: [
      (x) => ({ p: `${x.B}: ${list(x.F)}. We publish fees, terms and risks up front, so you can decide with the full picture. ${x.D}`, h: "Fees and risks, up front", d: "Read the details" }),
      (x) => ({ p: `No hype, just the details. ${cap(x.F[0])}, ${x.F[1]} and ${x.F[2]}. ${x.D}`, h: fit(`${cap(x.P)}, explained clearly`, 40, "Explained clearly"), d: "See how it works" }),
      (x) => ({ p: `Before you start: here's exactly how ${x.b} works, what it costs and the risks involved. ${cap(x.F[0])} and ${x.F[1]} as standard. ${x.D}`, h: "Know before you start", d: "Read first" }),
    ],
  },
  story: {
    label: "Founder story", note: "Why the product exists, in the brand's own voice.",
    v: [
      (x) => ({ p: `We started ${x.brand || "this"} because ${x.V.goal} shouldn't be complicated. Today that means ${list(x.F)}. ${x.O ? x.O + ". " : ""}${x.D}`, h: fit(`Why we built ${x.brand || "this"}`, 40, "Why we built this"), d: "Our story" }),
      (x) => ({ p: `${x.brand || "We"} began with one idea: make ${x.V.goal} simpler. So we built ${x.b} around ${list(x.F)}. ${x.D}`, h: "Built around one idea", d: "Read our story" }),
      (x) => ({ p: `Made by a small team that cares about ${x.V.goal}. ${cap(x.F[0])}, ${x.F[1]} and ${x.F[2]}, with no shortcuts. ${x.D}`, h: "Made with no shortcuts", d: "Meet the team" }),
    ],
  },
};

export const ANGLE_SETS = {
  general: ["product", "offer", "proof", "routine", "story"],
  weight: ["routine", "product", "proof", "education", "offer"],
  supplements: ["product", "transparency", "routine", "proof", "education"],
  cosmetic: ["expert", "product", "proof", "offer"],
  skincare: ["routine", "product", "proof", "education", "offer"],
  sexual: ["expert", "product", "transparency", "offer"],
  telehealth: ["expert", "transparency", "product", "offer"],
  crypto: ["transparency", "education", "product", "offer"],
  trading: ["education", "transparency", "product", "story"],
  loans: ["transparency", "product", "offer", "education"],
  bizopp: ["education", "product", "story", "proof"],
  dating: ["product", "story", "proof", "offer"],
  gambling: ["transparency", "product", "offer"],
  alcohol: ["story", "product", "routine", "offer"],
  cbd: ["transparency", "product", "routine"],
  mental: ["expert", "product", "routine", "education"],
};

function lightTouch(ad, result, x) {
  const byField = collectHits(result);
  const out = {};
  for (const field of TEXT_FIELDS) {
    let text = ad[field] || "";
    const hits = (byField[field] || []).filter(isFixable);
    if (hits.length) {
      const flagged = sentences(text).filter((s) => hits.some((h) => h.start < s.end && h.end > s.start));
      // Rewrite back to front so offsets stay valid; rotate replacement lines.
      flagged.reverse().forEach((s, i) => {
        const inside = hits.filter((h) => h.start < s.end && h.end > s.start);
        text = text.slice(0, s.start) + fixSentence(s, inside, 0, x, field, flagged.length - 1 - i, true) + text.slice(s.end);
      });
      text = dedupeSentences(text);
    }
    out[field] = finish(field, text);
  }
  if (x.D && !out.primary.includes(x.D) && result.findings.some((f) => ["weight-claim", "before-after", "cure-other", "income-soft", "guarantee", "fat-melt"].includes(f.id))) out.primary = (out.primary + " " + x.D).trim();
  return out;
}

function dedupeSentences(text) {
  const seen = new Set();
  return sentences(text).filter((s) => { const k = s.text.trim().toLowerCase(); if (!k || seen.has(k)) return !k; seen.add(k); return true; }).map((s) => s.text).join("");
}

// Full rewrites: one complete ad per angle. seed rotates the variants.
export function fullRewrites(ad, result, brief = {}, seed = 0) {
  if (result.prohibited.length) return { refused: true, reasons: result.prohibited, items: [] };
  ad = { ...ad, niche: result.niche };
  const offer = brief.offer || detectOffer([ad.primary, ad.headline, ad.description].join(" "));
  const x = vocabFor(result.niche, { brand: ad.brand, ...brief, offer });
  const items = [];

  const lt = lightTouch(ad, result, x);
  items.push(score(ad, { key: "light", label: "Light touch", note: "Your copy, with only the risky phrases changed.", primary: lt.primary, headline: lt.headline, description: lt.description }));

  const keys = ANGLE_SETS[result.niche] || ANGLE_SETS.general;
  keys.forEach((key, i) => {
    const A = ANGLES[key];
    const t = A.v[(seed + i) % A.v.length](x);
    items.push(score(ad, { key, label: A.label, note: A.note, primary: finish("primary", t.p), headline: finish("headline", t.h), description: finish("description", t.d) }));
  });
  return { refused: false, items, offer, vocab: x };
}

// Scores a rewrite on its copy alone: targeting and URL problems can't be
// fixed by rewording, so they'd only hide the difference between versions.
export function score(ad, item) {
  const r = check({ ...ad, primary: item.primary, headline: item.headline, description: item.description });
  const copyIssues = r.findings.filter(isCopyIssue);
  const risk = Math.min(100, copyIssues.reduce((s, f) => s + SEV[f.sev].weight, 0));
  const level = copyIssues.some((f) => f.sev === "block") || risk >= 60 ? "high" : copyIssues.some((f) => f.sev === "warn") || risk >= 20 ? "medium" : "low";
  return { ...item, risk, level, adRisk: r.risk, copyIssues: copyIssues.map((f) => ({ id: f.id, sev: f.sev, title: f.title })), placeholders: /\[[^\]]+\]/.test(item.primary + item.headline) };
}

export function copyRisk(result) {
  return Math.min(100, result.findings.filter(isCopyIssue).reduce((s, f) => s + SEV[f.sev].weight, 0));
}

// A copy issue is one rewording can fix. Category notices (crypto permission,
// Special Ad Categories, LegitScript) depend on the product, not the words.
export const isCopyIssue = (f) => !f.rule?.cat && f.hits.some((h) => TEXT_FIELDS.includes(h.field));
