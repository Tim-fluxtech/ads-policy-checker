// Account recovery diagnosis, Guardian Growth profit calculator and the
// request form (profit audit / recovery case).
import { ic } from "./icons.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const eur = (n) => (Number.isFinite(n) ? new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n) : "∞");

// ---------- recovery diagnosis ----------
// Case types follow the PRD. Steps stay general and point to Meta's own tools;
// detailed routes are reviewed playbooks inside the paid Recovery Pack.
const CASES = {
  bm: { title: "Business Manager restricted", icon: "users", call: true, sum: "Your Business portfolio is restricted. That can stop every ad account, Page and pixel inside it, so it's the first thing to sort out.",
    docs: ["Business registration certificate", "Utility bill or bank statement showing the business address", "Government ID of an admin", "Domain verification for your website", "Screenshots of the restriction notice"] },
  adacct: { title: "Ad account disabled", icon: "credit-card", call: true, sum: "One ad account is disabled, usually for a policy or payment reason. The rest of your Business portfolio may still work normally.",
    docs: ["Screenshot of the notice in Account Quality", "Business registration or tax document", "Government ID of the account owner", "Domain verification for your website"] },
  hacked: { title: "Hacked admin", icon: "lock", call: true, sum: "Someone else has control of your account or Business portfolio. Securing your own login comes before anything else.",
    docs: ["Screenshots of unfamiliar admins, activity or ad accounts", "Receipts for any ad charges you didn't make", "Government ID matching your profile"],
    extra: ["Secure your email account first, then your Facebook login, then turn on 2FA", "Write down unfamiliar admins, ad accounts and charges with dates"] },
  reco: { title: "Not eligible for recommendations", icon: "eye", call: true, sum: "Your Page or content isn't being recommended to new people. Ads and existing followers may be unaffected, but reach drops.",
    docs: ["Screenshots from Page or Account Status", "List of the posts that were flagged", "Proof you own or licensed any reused content"] },
  profile: { title: "Personal profile locked or disabled", icon: "users", call: false, sum: "Your personal Facebook profile is locked or disabled. If you're the only admin of your business assets, that blocks them too.",
    docs: ["Government ID matching your profile name", "Screenshots of the notice", "Access to the email and phone number on the profile"] },
  verify: { title: "Identity or business verification", icon: "shield-check", call: false, sum: "Meta wants to confirm who you are or that your business is real before you can keep advertising.",
    docs: ["Government ID", "Business registration document", "Proof of address", "Proof you own your website domain"] },
  payment: { title: "Payment-related restriction", icon: "credit-card", call: false, sum: "Advertising is paused over a payment problem, such as a failed charge or a payment method Meta couldn't confirm.",
    docs: ["Card or bank statement showing the charges", "Invoices or receipts from Meta", "Proof the payment method belongs to you or your business"] },
};
const Q = [
  { key: "case", q: "What happened?", opts: [["bm", "My Business Manager is restricted", "Business portfolio, all assets affected", "users"], ["adacct", "My ad account was disabled", "Ads stopped in one ad account", "credit-card"], ["hacked", "Someone hacked my account", "Admins removed, unknown ads or charges", "lock"], ["reco", "My Page isn't being recommended", "\"Not eligible for recommendations\"", "eye"], ["profile", "My personal profile is locked", "Locked or disabled Facebook profile", "users"], ["verify", "Meta asked me to verify", "Identity or business verification", "shield-check"], ["payment", "Ads stopped over a payment", "Failed charge or payment method issue", "credit-card"]] },
  { key: "notice", q: "Did Meta send you an email or notice?", opts: [["yes", "Yes, I have it"], ["no", "No notice that I can find"], ["unsure", "Not sure"]] },
  { key: "when", q: "When did it start?", opts: [["recent", "In the last few days"], ["weeks", "One to four weeks ago"], ["month", "More than a month ago"]] },
  { key: "access", q: "Do you still have full admin access?", skip: (a) => a.case === "profile", opts: [["yes", "Yes, full access"], ["partial", "Some access, not all"], ["no", "No, I'm locked out"]] },
  { key: "appeal", q: "Have you already asked Meta for a review?", opts: [["no", "Not yet"], ["once", "Once"], ["many", "More than once"]] },
];
const wz = { step: 0, a: {} };
const COMMON_DO = ["Open Account Quality in Meta Business Suite to see exactly which asset is restricted and why", "Keep screenshots of every notice and email, with dates", "Request a review once, through Meta's own button, with facts only"];
const COMMON_DONT = ["Open new or rented ad accounts to keep advertising", "Use a VPN or someone else's ID", "Send repeated appeals or spam support chat", "Pay anyone who claims to be a Meta \"insider\""];

function steps() { return Q.filter((q) => !q.skip || !q.skip(wz.a)); }
function renderWizard() {
  const box = $("#wizard");
  if (!box) return;
  const qs = steps();
  if (wz.step >= qs.length) return renderResult(box);
  const q = qs[wz.step];
  box.innerHTML = `<div class="wz-top"><span>Free diagnosis · question ${wz.step + 1} of ${qs.length}</span><span>${ic("lock", 14)} Private</span></div>
    <div class="wz-bar"><span style="width:${(wz.step / qs.length) * 100}%"></span></div>
    <h3>${esc(q.q)}</h3>
    <div class="wz-opts">${q.opts.map(([v, l, sub, icon], i) => `<button type="button" class="wz-opt" style="animation-delay:${i * 40}ms" data-wz="${v}">${icon ? ic(icon, 20) : ""}<span>${esc(l)}${sub ? `<small>${esc(sub)}</small>` : ""}</span></button>`).join("")}</div>
    ${wz.step ? `<div class="wz-back"><button type="button" class="link" data-wz-back>← Back</button></div>` : ""}`;
}
function renderResult(box) {
  const a = wz.a, c = CASES[a.case];
  const notes = [];
  if (a.notice !== "yes") notes.push("No notice? The reason is usually listed in Account Quality or Business Support Home.");
  if (a.when === "month") notes.push("Some decisions can only be reviewed for a limited time. Check the date shown in Account Quality.");
  if (a.appeal === "many") notes.push("Repeated review requests can slow things down. Talk to a rep before you appeal again.");
  if (a.access === "no" && a.case !== "hacked") notes.push("You've lost admin access, so the route depends on who still has it. We'll map this in your case.");
  const doList = [...(c.extra || []), ...COMMON_DO];
  box.innerHTML = `<div class="wz-res">
    <div class="wz-top"><span>Your diagnosis</span><button type="button" class="link" data-wz-reset>Start over</button></div>
    <div class="wz-bar"><span style="width:100%"></span></div>
    <span class="chip-pink">${ic(c.icon, 14)} Case type</span>
    <h3>${esc(c.title)}</h3>
    <p>${esc(c.sum)}</p>
    ${notes.map((n) => `<div class="wz-urgent">${ic("triangle-alert", 16)}<span>${esc(n)}</span></div>`).join("")}
    <div class="wz-block do"><h4>${ic("check", 14)} Do this now</h4><ul>${doList.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="wz-block docs"><h4>${ic("book-open", 14)} Documents to prepare</h4><ul>${c.docs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="wz-block dont"><h4>${ic("ban", 14)} Don't</h4><ul>${COMMON_DONT.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="wz-support"><span class="chip-pass">AI case assistant</span><span class="chip-pass">Rep chat</span>${c.call ? `<span class="chip-pass">Book a call</span>` : `<span class="chip-plain">Calls not offered for this case</span>`}</div>
    <div class="wz-acts"><button type="button" class="btn btn-pink" data-lead="recovery">Start my recovery case · €49</button></div>
  </div>`;
}
function caseSummary() {
  const c = CASES[wz.a.case];
  if (!c) return "";
  const lab = (k) => Q.find((q) => q.key === k)?.opts.find((o) => o[0] === wz.a[k])?.[1] || "–";
  return `Case: ${c.title}\nNotice from Meta: ${lab("notice")}\nStarted: ${lab("when")}\nAdmin access: ${wz.a.case === "profile" ? "n/a" : lab("access")}\nReview requested: ${lab("appeal")}`;
}

// ---------- profit calculator ----------
const CF = [["cAov", "rAov"], ["cCost", "rCost"], ["cCpa", "rCpa"], ["cBudget", "rBudget"]];
function calcNumbers() {
  const v = (id) => Math.max(0, parseFloat($("#" + id).value) || 0);
  const aov = v("cAov"), cost = v("cCost"), cpa = Math.max(1, v("cCpa")), budget = v("cBudget");
  const margin = aov - cost, orders = budget / cpa, profit = orders * margin - budget;
  return { aov, cost, cpa, budget, margin, beCpa: margin, beRoas: margin > 0 ? aov / margin : Infinity, roas: aov / cpa, orders, revenue: orders * aov, profit, perSale: margin - cpa };
}
function renderCalc() {
  const out = $("#calcOut");
  if (!out) return;
  const n = calcNumbers();
  const max = Math.max(n.beCpa * 2, n.cpa * 1.25, 10);
  const be = Math.max(0, Math.min(100, (n.beCpa / max) * 100));
  const at = Math.max(0, Math.min(100, (n.cpa / max) * 100));
  let verdict;
  if (n.margin <= 0) verdict = `<div class="co-verdict bad">${ic("circle-alert", 18)}<span><b>Costs are higher than your price.</b> Ads can't fix this: every sale loses money before ad spend. Start with pricing or costs.</span></div>`;
  else if (n.perSale >= 0) verdict = `<div class="co-verdict good">${ic("circle-check", 18)}<span><b>Profitable: about ${eur(n.perSale)} kept per sale after ads.</b> At ${eur(n.budget)} a month that's roughly ${eur(n.profit)} profit on ${Math.round(n.orders)} sales. That's room to scale, carefully.</span></div>`;
  else verdict = `<div class="co-verdict bad">${ic("circle-alert", 18)}<span><b>Losing about ${eur(-n.perSale)} on every sale.</b> Get the cost per sale under ${eur(n.beCpa)}, or raise order value, before spending more.</span></div>`;
  out.innerHTML = `<div class="co-grid">
      <div><small>Break-even cost per sale</small><b>${eur(n.beCpa)}</b></div>
      <div><small>Break-even ROAS</small><b>${Number.isFinite(n.beRoas) ? n.beRoas.toFixed(2) + "x" : "–"}</b></div>
      <div><small>Your ROAS at this CPA</small><b>${n.roas.toFixed(2)}x</b></div>
      <div><small>Profit per month</small><b style="color:${n.profit >= 0 ? "var(--pass)" : "var(--fail)"}">${eur(n.profit)}</b></div>
    </div>
    <div class="co-bar" style="--be:${be}%"><i style="left:${at}%"></i></div>
    <div class="co-scale"><span>Profitable cost per sale</span><span>Losing money</span></div>
    ${verdict}`;
}

// ---------- request form ----------
let leadType = "agency";
function openLead(type) {
  leadType = type;
  const m = $("#leadModal"), f = $("#leadForm");
  if (f.dataset.done) { f.innerHTML = f.dataset.orig; delete f.dataset.done; bindIcons(f); }
  const rec = type === "recovery";
  $("#leadEyebrow").textContent = rec ? "Recovery Pack · €49" : "Guardian Growth";
  $("#leadTitle").textContent = rec ? "Start your recovery case" : "Book a free profit audit";
  $("#leadSub").textContent = rec
    ? "We'll reply with your case set-up and a payment link. You can cancel for a refund any time before we draft your appeal."
    : "Tell us about your business. We'll come back with your break-even numbers and what we'd test first, whether or not you hire us.";
  $("#leadAgencyFields").hidden = rec;
  $("#leadMsgLbl").textContent = rec ? "What does the notice from Meta say? (optional)" : "What do you sell, and what's not working? (optional)";
  const sum = $("#leadSummary");
  const text = rec ? caseSummary() : (() => { const n = calcNumbers(); return `Order value ${eur(n.aov)} · margin ${eur(n.margin)} · break-even CPA ${eur(n.beCpa)} · current CPA ${eur(n.cpa)} · budget ${eur(n.budget)}/month`; })();
  sum.hidden = !text;
  sum.innerHTML = text ? `<b>${rec ? "Your diagnosis" : "Your numbers from the calculator"}</b>${esc(text).replace(/\n/g, "<br>")}` : "";
  $("#leadErr").hidden = true;
  m.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => f.querySelector("input[name=name]")?.focus(), 50);
}
function closeLead() { $("#leadModal").hidden = true; document.body.style.overflow = ""; }
function bindIcons(root) { for (const el of root.querySelectorAll("[data-ic]")) el.innerHTML = ic(el.dataset.ic, 18); }

async function submitLead(e) {
  e.preventDefault();
  const f = $("#leadForm"), err = $("#leadErr"), btn = $("#leadSubmit");
  const data = Object.fromEntries(new FormData(f));
  if (!data.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "")) { err.textContent = "Please add your name and a valid email."; err.hidden = false; return; }
  data.type = leadType;
  data.summary = leadType === "recovery" ? caseSummary() : $("#leadSummary").textContent;
  btn.disabled = true; btn.innerHTML = `<span class="spin"></span> Sending…`;
  try {
    const r = await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || "failed");
    f.dataset.orig = f.innerHTML;
    f.dataset.done = "1";
    f.innerHTML = `<button type="button" class="icon-btn modal-x" data-lead-close aria-label="Close">${ic("x", 18)}</button><div class="lead-ok">${ic("circle-check", 52)}<h3>Request received</h3><p class="lead-sub">Thanks, ${esc(data.name.split(" ")[0])}. We'll reply to ${esc(data.email)}${leadType === "recovery" ? " with your case set-up" : " with your audit"}.</p><button type="button" class="btn btn-pink" data-lead-close>Done</button></div>`;
  } catch (ex) {
    err.textContent = ex.message === "failed" || ex.name === "TypeError" ? "We couldn't send that right now. Please try again in a moment." : ex.message;
    err.hidden = false;
    btn.disabled = false; btn.textContent = "Send request";
  }
}

// ---------- wiring ----------
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, [data-lead-close]");
  if (!t) return;
  if (t.dataset.wz) { wz.a[steps()[wz.step].key] = t.dataset.wz; wz.step++; renderWizard(); return; }
  if (t.hasAttribute("data-wz-back")) { wz.step = Math.max(0, wz.step - 1); renderWizard(); return; }
  if (t.hasAttribute("data-wz-reset")) { wz.step = 0; wz.a = {}; renderWizard(); return; }
  if (t.dataset.lead) { openLead(t.dataset.lead); return; }
  if (t.hasAttribute("data-lead-close")) closeLead();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#leadModal").hidden) closeLead(); });
$("#leadForm")?.addEventListener("submit", submitLead);
for (const [num, range] of CF) {
  const a = $("#" + num), b = $("#" + range);
  a?.addEventListener("input", () => { b.value = a.value; renderCalc(); });
  b?.addEventListener("input", () => { a.value = b.value; renderCalc(); });
}
renderWizard();
renderCalc();
