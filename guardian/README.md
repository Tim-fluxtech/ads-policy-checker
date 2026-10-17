# Guardian Pre-Flight: Facebook ads policy checker

The Pre-Flight Checker from the Ad Account Guardian PRD, built for Facebook (Meta) ads only. The site is a single page in the style of modern compliance-checker landing pages: a floating nav, a hero that animates the check flow, and the checker itself (your ad on the left; a **Run compliance check** button with a scan animation; a pass/fail report on the right). Then come feature panels with live demos, the grey-area playbooks, pricing and FAQ.

The report lists all 13 policy checks in three groups (Meta platform compliance, claims and consumer protection, targeting and destination). Each check shows Passed, Review or Failed, with the exact words, why it matters and a link to the Meta policy. Suggested copy sits under the report as angle tabs. After the first run, everything re-checks live: underlined phrases are clickable for quick fixes, one-click fixes handle targeting, and Undo is available.

The page also has:
- **Account recovery** (`#recovery`): a free 5-question diagnosis covering the PRD's 7 case types: Business Manager restricted, ad account disabled, hacked admin, recommendations, profile, verification and payment. It returns the case type, what to do now, documents to prepare, what not to do, and which support fits, with calls only for Business Manager, ad account, hacked-admin and recommendation cases. Its CTA starts a Recovery Pack request. It never promises reinstatement and only points to Meta's own channels.
- **Guardian Growth** (`#agency`): the done-for-you agency offer for individuals and SMEs, positioned on profit after ad spend. It has a live profit calculator (break-even cost per sale, break-even ROAS, monthly profit), the 4-step process, Launch / Growth / Scale packages, and a "free profit audit" request. It makes no return guarantees.
- Requests from both forms are posted to `/api/lead` and saved to `data/leads.jsonl` (git-ignored) until you connect email or a CRM.

Paste an ad and it gives you:

- **A risk score**: Low / Medium / High, plus a 0–100 number. It's never shown as pass/fail.
- **Every issue linked to the Meta policy it touches.** Each one names the Advertising Standards area, quotes the exact words that triggered it, explains why and suggests a fix.
- **Multiple compliant rewrites:**
  - **Line fixes:** three options for every flagged sentence. Each option shows whether that line is now clean.
  - **Full rewrites:** a "light touch" edit of your own copy, plus four or five complete ads written from angles that pass review in your niche. Each one is re-checked and scored before you see it.
  - **AI rewrites:** written by Claude in the tone you pick, then scored by the same rules.
- **Grey-area playbooks** for 16 restricted niches: weight loss, supplements, aesthetics, skincare, sexual health, telehealth/Rx, crypto, investing, loans, biz-opp/coaching, dating, gambling, alcohol, CBD, mental health and vapes. Each lists what Meta requires, what gets ads rejected, and the angles that work.

## Run it

```bash
cd guardian
npm install
npm start
```

Then open http://localhost:5173. To turn on AI rewrites, set `ANTHROPIC_API_KEY` first (see `.env.example`). Everything else works without it.

```bash
npm test
```

This runs 30 tests: a labelled set of 24 ads with expected levels and must-flag rules, plus checks on how rewrites behave.

## What gets checked

| Area | Examples |
|---|---|
| Copy rules (52, plus obfuscation) | Personal attributes ("Are you overweight?", "Meet other…"), statements of inferiority, timed weight claims, cure claims (including Meta's list of incurable diseases), wearable-only results, clickbait, guarantees, income claims, unauthorised endorsements, engagement bait, fake buttons, profanity, PII requests |
| Restricted and prohibited goods | Crypto, investing, credit/loans/insurance, gambling, dating, alcohol, CBD/THC, prescription drugs, tobacco/vapes, weapons, fake documents, rented ad accounts |
| Obfuscation | Disguised spellings like `w3ight l0ss`, `c@sino`, `s e x`, hidden characters and mixed scripts. Meta treats these as circumvention |
| Targeting | Minimum age per niche, alcohol ages by country (21+ US, 19+ Canada, 25+ Sweden), alcohol-banned countries, gambling's unsupported markets, CBD (US only), Rx (US/CA/NZ only), Special Ad Category mismatches and age locks |
| Landing page (server) | Loads, redirects off-domain, privacy policy, contact details, ad offers that don't appear on the page, thin content, and health/money claims in the page text |
| Creative | Text inside images (OCR via Tesseract.js in the browser), text-heavy images, side-by-side before/after layouts |

Policy names, URLs and rules were checked against Meta's Transparency Center on **17 Oct 2026**, including the July 2026 Health and wellness update, which now allows before-and-after images and timed results with qualifiers for 18+ ads. `public/policies.js` holds every policy link and country list; update `VERIFIED_ON` whenever you re-check them.

## Rules the product follows

- **Rewrites stay truthful.** Example features and product names show as `[bracketed placeholders]` until you fill the rewrite brief. Social-proof templates use `[rating]` and `[number]` placeholders, never made-up figures.
- **Nothing gets disguised.** Prohibited products (vapes, payday loans, THC, sex toys, escorts and affairs, fake documents and so on) get a refusal and no rewrite. The AI prompt forbids misspellings, euphemisms and invented claims, and treats ad text as data, not instructions.
- **No Meta logins**, no affiliation claims, and a "risk estimate, not Meta's decision" disclaimer on every result.

## Files

```
guardian/
  server.mjs          static site + /api/landing (SSRF-guarded page scan) + /api/rewrite (Claude)
  public/
    index.html        Ads Manager-style workspace, playbooks and plans views
    styles.css
    app.js            UI: live checking, field notes, review, preview, drawer, OCR, playbooks
    engine.js         rules engine (pure, runs in browser, server and tests)
    rewrite.js        line fixes, angle-based full rewrites, scoring
    policies.js       Meta policy registry, country lists, niche playbooks
  test/engine.test.mjs
```

## Known limits

- These are pattern rules plus optional AI. They can't fully read context, and Meta also judges images and video, which are only partly covered here (OCR only, no video).
- The landing-page scan reads server-rendered HTML. Pages that build their content in JavaScript may look thin.
- The private-address guard checks DNS before fetching. For a public deployment, also run the scanner behind an egress proxy to rule out DNS-rebinding tricks.
- Accounts, billing, rep chat and the Recovery Assistant from the PRD aren't part of this build.

Independent service, not affiliated with or endorsed by Meta.
