# Guardian go-live checklist

Goal: Guardian live on the internet, form requests landing in your inbox, and customers able to pay €49 for the Recovery Pack. Budget: about $7/month hosting + ~€12/year domain. Stripe takes about 1.5% + €0.25 per EU card payment.

The code is ready. Every step below needs your own accounts, so you do them, and they take about 2 hours in all.

## 1. Legal basics (do first)
- [ ] Open your activity with Finanças (Portal das Finanças → Início de atividade) so you can issue *recibos verdes*/invoices. Pick a services CAE/CIRS code (e.g. consultancy/marketing). Ask an accountant if unsure.
- [ ] Fill every `[placeholder]` in `public/privacy.html` and `public/terms.html`: your name or business name, address, NIF, contact email, date. Search for `[` to find them all.
- [ ] Check the name. "Guardian" is generic and widely used. Search the EUIPO trademark register and pick a domain you can own (e.g. `adguardian.eu`, `preflightads.com`). Buy it at Cloudflare Registrar or Namecheap.

## 2. Email alerts (Resend, free)
- [ ] Sign up at resend.com with the email you want alerts sent to.
- [ ] API Keys → create one. You'll paste it into Render as `RESEND_API_KEY`.
- [ ] `LEAD_NOTIFY_TO` = that same email. (The default sender only delivers to your own Resend login email. Later, verify your domain in Resend and set `LEAD_NOTIFY_FROM` to `Guardian <hello@yourdomain>`.)

## 3. Payments (Stripe Payment Link)
- [ ] Create a Stripe account and finish activation (identity, bank account, business details, website = your domain).
- [ ] Payment Links → New → product "Recovery Pack", €49, one-time. Turn on "Collect customers' email". Set the confirmation message to: "Thanks! We'll email your case set-up within 1 working day."
- [ ] Copy the link (`https://buy.stripe.com/...`). It goes into Render as `RECOVERY_PAY_LINK`.
- [ ] Each payment shows a `client_reference_id` (like `GMW980ENR8E9374`). It matches the Request ID in your email alert, so you know which case paid.
- [ ] Turn on Stripe invoices/receipts, and issue the matching *recibo verde* for each sale.

## 4. Put it online (Render)
- [ ] Push this repo to GitHub (`Tim-fluxtech/ads-policy-checker`).
- [ ] render.com → New → Blueprint → pick the repo. It reads `render.yaml` (Starter plan, Frankfurt).
- [ ] Paste the secrets: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `LEAD_NOTIFY_TO`, `RECOVERY_PAY_LINK`.
- [ ] Settings → Custom Domains → add your domain and follow the DNS steps.
- [ ] Open `https://yourdomain/api/health`: `leadEmail` and `recoveryPay` should both be `true`.
- [ ] Send yourself a test Recovery request: the email should arrive and the Pay button should open Stripe. Use Stripe test mode first if you like, then swap to the live link.
- [ ] Set a monthly spend limit in the Anthropic console. The site also caps AI rewrites at 50 a day (`AI_DAILY_CAP`).

## 5. First customers (the 14-day goal: one paid Recovery Pack or one agency audit)
- [ ] Reply to every request within 24 hours. Speed is the product for someone whose ad account is locked.
- [ ] Post helpful answers (not ads) where people get banned: r/FacebookAds, r/PPC, Facebook-ads and dropshipping groups, Portuguese SME groups. Answer the question fully, then mention the free check.
- [ ] Make 3–5 reels with Crown Studio: "Why Meta rejected your ad", "3 words that get ads banned", "What to do in the first hour after your ad account is disabled".
- [ ] Offer 5 free profit audits to local businesses already running ads (look them up in the Meta Ad Library). Audits are how Guardian Growth gets clients.

## Delivering a Recovery Pack (what you promised)
1. Diagnosis + official route + document list (the site's wizard gives you a start). Email it within 1 working day.
2. Appeal drafts written for their case. Revise them as often as they need.
3. Evidence pack PDF (their documents in order, with a one-page summary).
4. Email support for 60 days.
Never ask for passwords or 2FA codes, never promise reinstatement, and only use Meta's own channels. Refund anyone who asks before the first appeal draft is sent.
