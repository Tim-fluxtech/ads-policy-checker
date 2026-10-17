// Pre-Flight rules engine for Facebook ads. Pure functions, no DOM, so the
// same code runs in the browser, on the server and in tests.
import {
  POLICIES, NICHES, ALCOHOL_BANNED, ALCOHOL_AGE, GAMBLING_BANNED, RX_COUNTRIES, CBD_COUNTRIES, HEMP_COUNTRIES,
} from "./policies.js";

export const SEV = {
  block: { label: "High risk", rank: 3, weight: 40 },
  warn: { label: "Medium risk", rank: 2, weight: 14 },
  tip: { label: "Low risk", rank: 1, weight: 3 },
};

export const TEXT_FIELDS = ["primary", "headline", "description"];
export const FIELD_LABEL = { primary: "Primary text", headline: "Headline", description: "Description", landing: "Landing page" };

const HEALTHY = ["weight", "supplements", "cosmetic", "skincare", "sexual", "telehealth", "mental", "cbd"];
const MONEY = ["crypto", "trading", "loans", "bizopp", "gambling"];
const isHealth = (c) => HEALTHY.includes(c.niche);
const isMoney = (c) => MONEY.includes(c.niche);
const QUALIFIER = /\b(?:results?\s+(?:may\s+)?vary|individual results|typical results|with (?:a )?(?:healthy|balanced) diet|alongside (?:diet|exercise|a balanced)|not typical)\b/i;

// alts: replacement options for the matched phrase, used by the rewrite
// engine. "" removes the phrase. "@sentence" replaces the whole sentence
// with a neutral line for the niche.
const R = (o) => o;

export const RULES = [
  // ---- Personal attributes ----
  R({
    id: "attr-question", policy: "personal", title: "Asserts or implies a personal attribute",
    re: /\b(?:are\s+you|you\s+are|you're|youre|r\s+u|still|tired\s+of\s+being|sick\s+of\s+being|for\s+(?:those|people)\s+who\s+are)\s+(?:\w+\s+){0,2}?(?:overweight|fat|obese|chubby|depressed|diabetic|anxious|bald(?:ing)?|in\s+debt|broke|bankrupt|poor|single|lonely|pregnant|addicted|an\s+addict|alcoholic|infertile|unemployed|jobless|divorced|gay|lesbian|bisexual|trans(?:gender)?|christian|muslim|jewish|hindu|catholic|over\s+(?:30|40|50|60)|disabled|autistic|a\s+(?:convicted\s+)?felon|on\s+benefits|struggling\s+financially)\b/gi,
    sev: "block", sentence: true,
    why: "Meta doesn't allow ads that assert or imply the reader's health, finances, religion, age, sexual orientation or other personal traits, even as a question.",
    fix: "Describe the product or the group it serves (\"Meal plans built by dietitians\"), never the reader (\"Are you overweight?\").",
  }),
  R({
    id: "attr-condition", policy: "personal", title: "Implies the reader has a condition or money problem",
    re: /\b(?:do\s+you\s+(?:have|suffer\s+from|struggle\s+with|deal\s+with|live\s+with)|struggling\s+with|suffering\s+from|living\s+with|battling|dealing\s+with|tired\s+of|sick\s+of|fed\s+up\s+with|worried\s+about)\s+(?:your\s+|my\s+|the\s+)?(?:\w+\s+)?(?:diabetes|anxiety|depression|acne|hair\s+loss|debt|bad\s+credit|erectile\s+dysfunction|ED|insomnia|belly\s+fat|weight|obesity|eczema|psoriasis|adhd|arthritis|back\s+pain|loneliness|infertility|cellulite|wrinkles|stretch\s+marks|bloating|stress|addiction|being\s+single)\b/g,
    flags: "i", sev: "block", sentence: true,
    why: "Phrases like \"struggling with anxiety?\" or \"do you have diabetes?\" imply the reader has a medical or financial condition, which Meta treats as a personal-attribute violation.",
    fix: "Name the service instead: \"Anxiety counselling available\" is allowed, \"Struggling with anxiety?\" isn't.",
  }),
  R({
    id: "attr-down", policy: "personal", title: "\"… getting you down?\" framing",
    re: /\b(?:depression|anxiety|debt|acne|weight|stress|hair\s+loss|loneliness|your\s+\w+)\s+(?:getting|got|keeping)\s+you\s+down\b/gi,
    sev: "block", sentence: true,
    why: "Meta uses \"Depression getting you down?\" as an example of a violation: it implies the reader has the condition.",
    fix: "Lead with what the service offers: \"Depression counselling, online or in person.\"",
  }),
  R({
    id: "attr-upgrade", policy: "personal", title: "Implies something is wrong with the reader's body",
    re: /\b(?:ready|want|time|need)\s+to\s+(?:upgrade|fix|improve|change|transform|get\s+rid\s+of)\s+(?:your|ur)\s+(?:skin|body|face|look|looks|smile|hair|figure|weight|teeth|nose|belly|thighs|arms)\b|\b(?:look|feel)\s+(?:\d+\s+years\s+)?younger\b|\bturn\s+back\s+the\s+clock\b/gi,
    sev: (c) => (["skincare", "cosmetic", "weight", "supplements"].includes(c.niche) ? "block" : "warn"), sentence: true,
    why: "Meta lists \"Ready to upgrade your skin to look younger?\" as a violation: it implies the reader's age or appearance is a problem.",
    fix: "Describe the product's effect without the reader: \"Lightweight serum for a smooth, hydrated feel.\"",
  }),
  R({
    id: "attr-your", policy: "personal", title: "\"Your\" + a health, body or money attribute",
    re: /\b(?:your|ur)\s+(?:acne|belly\s+fat|stubborn\s+fat|debt|bad\s+credit|low\s+credit\s+score|diabetes|depression|anxiety|bald\s+spot|hair\s+loss|wrinkles|cellulite|double\s+chin|love\s+handles|addiction|erectile\s+dysfunction|ED|infertility|disability|divorce|loneliness|weight\s+problem|insecurities|eczema|psoriasis)\b/g,
    flags: "i", sev: "warn",
    alts: ["", "", ""],
    altsFn: (m) => { const t = m.replace(/^(?:your|ur)\s+/i, ""); return /acne|fat|wrinkles|cellulite|chin|handles|spot|hair|eczema|psoriasis/i.test(t) ? [t, "the look of " + t, "visible " + t] : [t, "the " + t, t]; },
    why: "\"Your acne\" or \"your debt\" assumes the reader has that trait. Meta allows \"you\" language only without a personal attribute.",
    fix: "Drop \"your\" and talk about the product: \"Targets the look of blemishes\" instead of \"Clears your acne\".",
  }),
  R({
    id: "attr-meet-other", policy: "personal", title: "\"Meet other…\" implies the reader's identity",
    re: /\bmeet\s+other\s+(?:\w+\s+){0,2}?(?:singles|men|women|christians|muslims|jews|gays|lesbians|seniors|single\s+\w+|\w+s)\b/gi,
    sev: "block",
    altsFn: (m) => { const t = m.replace(/^meet\s+other\s+/i, ""); return ["meet " + t, "connect with " + t, "date " + t]; },
    why: "Meta allows \"Meet Christian singles\" but not \"Meet other Christian singles\", because \"other\" implies the reader shares that trait.",
    fix: "Remove \"other\": \"Meet Christian singles\".",
  }),
  R({
    id: "attr-badcredit", policy: "personal", title: "Implies a vulnerable financial status",
    re: /\b(?:bad|poor|low|no)\s+credit\??(?:\s+no\s+problem)?|\b(?:behind|struggling)\s+(?:on|with)\s+(?:bills|payments|rent)\b|\bcan'?t\s+pay\s+(?:your|the)\s+bills\b/gi,
    sev: "block", sentence: true,
    why: "Ads can't imply knowledge of the reader's financial situation, and \"bad credit? no problem\" also raises a responsible-lending flag.",
    fix: "Describe the product and its terms: \"Loans from €1,000 with fixed monthly repayments.\"",
  }),

  // ---- Health and wellness ----
  R({
    id: "inferiority", policy: "health", title: "Statement of inferiority about appearance",
    re: /\b(?:ugly|disgusting|gross|unsightly|flabby|jiggly|saggy|muffin\s+tops?|love\s+handles|double\s+chins?|beer\s+bell(?:y|ies)|thunder\s+thighs|bingo\s+wings|bat\s+wings|cankles|turkey\s+necks?|hideous|unattractive)\b|\b(?:hate|ashamed\s+of|embarrassed\s+(?:by|of|about)|insecure\s+about)\s+(?:your|the\s+way\s+you\s+look|how\s+you\s+look)\b|\bfix\s+(?:your|ur)\s+(?:body|face|nose|skin|belly|thighs|arms|teeth)\b/gi,
    sev: (c) => (isHealth(c) || c.niche === "general" ? "block" : "warn"), sentence: true,
    why: "Meta's Health and wellness policy bans terms, descriptions or questions that are negative and attack someone's appearance, body parts or hygiene.",
    fix: "Make it about the outcome or the product, with positive language: \"Feel confident in what you wear.\"",
  }),
  R({
    id: "weight-claim", policy: "health", title: "Specific weight-loss result in a set time",
    re: /\b(?:lose|lost|drop|dropped|shed|burn|melt(?:\s+off)?)\s+(?:up\s+to\s+|over\s+)?\d+(?:[.,]\d+)?\s*(?:lbs?|pounds?|kgs?|kilos?|stone|sizes?|dress\s+sizes?|inches|cm|%\s*body\s+fat)\b(?:\s+(?:in|within)\s+(?:just\s+|only\s+)?(?:\d+|one|two|three|four|a)\s*(?:days?|weeks?|months?))?/gi,
    sev: (c) => (QUALIFIER.test(c.allText) ? "warn" : "block"),
    alts: ["build steady, sustainable habits", "make progress at a pace you can keep", "support healthy weight management"],
    why: "Promises of a specific outcome in a set time, without qualifiers, count as clickbait under Meta's Health and wellness policy. Meta now allows showing the time to noticeable results only with qualifiers.",
    fix: "Describe the method, or add a clear qualifier and typical-results statement: \"Results vary and depend on diet and activity.\"",
  }),
  R({
    id: "fat-melt", policy: "health", title: "Sensational fat-burning claim",
    re: /\b(?:melt|melts|melting|blast|blasts|torch|torches|burn|burns|burning)\s+(?:away\s+|off\s+)?(?:belly\s+|stubborn\s+|body\s+)?fat\b(?:\s+(?:fast|overnight|while\s+you\s+sleep|in\s+days))?|\bwhile\s+you\s+sleep\b|\b(?:overnight|instant)\s+(?:results|weight\s+loss|transformation)\b|\bresults\s+overnight\b/gi,
    sev: (c) => (c.niche === "weight" || c.niche === "supplements" ? "block" : "warn"),
    alts: ["support your fitness routine", "fit into a balanced routine", "work alongside regular activity"],
    why: "Exaggerated or extreme claims in a health or weight-loss context are named as clickbait in Meta's Health and wellness policy.",
    fix: "Replace the claim with what the product actually does, and avoid speed words like \"overnight\" or \"melt\".",
  }),
  R({
    id: "wearable", policy: "health", title: "Results from a wearable product alone",
    re: /\b(?:waist\s+trainers?|sauna\s+(?:belts?|suits?|vests?)|(?:slimming|fat[- ]burning|weight[- ]loss)\s+(?:belts?|patch(?:es)?|wraps?|socks|bracelets?|rings?|earrings?|insoles?|shorts|leggings)|detox\s+(?:foot\s+)?(?:patch(?:es)?|pads?))\b/gi,
    sev: (c) => (/\b(?:lose|burn|melt|slim\s+down|drop|shed|inches\s+off)\b/i.test(c.allText) ? "block" : "warn"),
    alts: ["compression garment", "workout accessory", "shapewear"],
    why: "Meta bans weight-loss ads claiming results can be achieved solely by using wearable products such as belts, wraps or patches.",
    fix: "Sell the garment for comfort, support or style, not for weight loss.",
  }),
  R({
    id: "cure-incurable", policy: "health", title: "Claims to cure an incurable disease",
    re: /\b(?:cures?|cured|curing|heals?|healed|healing|reverses?|reversed|reversing|eliminates?|eradicates?|gets?\s+rid\s+of|ends?|beats?)\s+(?:your\s+|my\s+|the\s+)?(?:type\s*[12]\s+)?(?:diabetes|herpes|thyroid(?:\s+disease|\s+problems)?|hypothyroidism|psoriasis|ebola|cancer|autism|alzheimer'?s|parkinson'?s|motor\s+neurone\s+disease|MND|HIV|AIDS)\b/gi,
    sev: "block",
    alts: ["helps you manage", "supports people living with", "is designed to fit a care plan for"],
    altsFn: (m) => { const d = m.replace(/^.*?\s(?:your\s+|my\s+|the\s+)?/i, "").trim(); return [`support for people managing ${d}`, `help with ${d} symptoms`, `${d} education`]; },
    why: "Meta lists diabetes, herpes, thyroid conditions, psoriasis, Ebola, cancer, autism, Alzheimer's, Parkinson's, MND and HIV as illnesses an ad can never claim to cure, heal or eliminate. Managing symptoms is allowed.",
    fix: "Talk about managing symptoms or supporting a care plan, never curing.",
  }),
  R({
    id: "cure-other", policy: "health", title: "Cure or treatment claim",
    re: /\b(?:cures?|cured|heals?|reverses?|eliminates?|gets?\s+rid\s+of|treats?|fixes|stops?|clears?|clearing)\s+(?:your\s+|my\s+|the\s+)?(?:anxiety|depression|acne|arthritis|insomnia|eczema|tinnitus|hair\s+loss|baldness|high\s+blood\s+pressure|hypertension|erectile\s+dysfunction|covid(?:-19)?|obesity|neuropathy|migraines?|chronic\s+pain|inflammation|joint\s+pain|adhd|ibs)\b|\bmiracle\s*(?:cure|pill|drink|cream|tea|supplement)?\b|\bmagic\s+pill\b/gi,
    sev: (c) => (c.niche === "cbd" || c.niche === "supplements" ? "block" : "warn"),
    alts: ["supports", "is designed to help with", "helps you care for"],
    altsFn: (m) => /miracle|magic/i.test(m) ? ["", "simple", "well-made"] : null,
    why: "Treatment claims need substantiation and are a common reason for rejection. CBD and supplement ads can't make any claim to treat, cure or prevent a condition.",
    fix: "Use softer, provable language (\"supports\", \"designed for\") and leave out named conditions where you can.",
  }),
  R({
    id: "whitening", policy: "health", title: "Permanent skin whitening or bleaching",
    re: /\b(?:skin\s+(?:whitening|bleaching|lightening)|bleach\s+(?:your\s+)?skin|permanently\s+(?:lighter|whiter|fairer)|fairer\s+skin\s+(?:forever|permanently))\b/gi,
    sev: "block",
    alts: ["brightening", "radiance", "even-looking tone"],
    why: "Meta doesn't allow ads for skin whitening or bleaching products that cause a permanent change in skin colour.",
    fix: "If the product is a non-permanent brightening cream, say \"brightening\" or \"radiance\" and never imply a lighter skin colour is better.",
  }),
  R({
    id: "before-after", policy: "health", title: "Before-and-after framing",
    re: /\bbefore\s*(?:and|&|\/|\+|vs\.?)\s*after\b|\btransformation\s+(?:photos?|pics?|results)\b/gi,
    sev: (c) => (c.niche === "weight" || c.niche === "cosmetic" ? "tip" : "warn"),
    alts: ["real customer results", "progress photos", "customer stories"],
    why: "Since July 2026 Meta allows before-and-after images for 18+ weight-loss and cosmetic ads if they show typical results and the time taken. Close-ups pinching fat are still banned, and other categories may still be rejected.",
    fix: "Target 18+, show realistic results with the time taken and a qualifier, and avoid body-part close-ups.",
  }),
  R({
    id: "eating", policy: "eating", title: "Promotes extreme restriction",
    re: /\b(?:pro[- ]?ana|thinspo\w*|starve\s+yourself|stop\s+eating|skip\s+meals\s+to\s+lose|eat\s+less\s+than\s+\d+\s+calories|(?:300|400|500|600|700|800)\s+calories?\s+a\s+day|skinny\s+at\s+any\s+cost)\b/gi,
    sev: "block", sentence: true,
    why: "Content that promotes or encourages eating disorders breaks Meta's policy on suicide, self-injury and eating disorders.",
    fix: "Remove it. Focus on balanced, sustainable nutrition.",
  }),

  // ---- Clickbait and deceptive practices ----
  R({
    id: "clickbait", policy: "commercial", title: "Clickbait or sensational hook",
    re: /\b(?:doctors|dermatologists|dentists|banks|experts)\s+hate\b|\bone\s+(?:weird|simple|strange|odd|crazy)\s+trick\b|\byou\s+won'?t\s+believe\b|\bshocking\b|\bjaw[- ]dropping\b|\bwhat\s+happens\s+next\b|\bthis\s+changes\s+everything\b|\bthey\s+don'?t\s+want\s+you\s+to\s+know\b|\b(?:big\s+pharma|the\s+banks)\s+(?:is|are)\s+hiding\b|\bthe\s+secret\s+(?:doctors|banks|celebrities)\b|\bbanned\s+(?:video|secret|trick)\b|\bexposed\b/gi,
    sev: (c) => (isHealth(c) || isMoney(c) ? "block" : "warn"), sentence: true,
    why: "Sensational language and withheld information are treated as clickbait. In health and money ads Meta treats this as a deceptive practice.",
    fix: "Lead with the real benefit in plain words.",
  }),
  R({
    id: "guarantee", policy: "commercial", title: "Guaranteed or risk-free outcome",
    re: /\b(?:guarantee[sd]?|100%\s+(?:results|success|effective|safe|guaranteed|proven)|risk[- ]free|zero\s+risk|no\s+risk|can'?t\s+lose|cannot\s+lose|sure\s+(?:bet|thing|win)|guaranteed\s+wins?)\b/gi,
    filter: (m, text, i) => !/(?:money[- ]?back|satisfaction|price[- ]match|\d+[- ]day|refund|lifetime|delivery)\s*$/i.test(text.slice(Math.max(0, i - 24), i)) && !/\b(?:no|not|never|nothing|without|isn'?t|aren'?t|can'?t\s+be)\b[^.!?]{0,22}$/i.test(text.slice(Math.max(0, i - 30), i)) && !/^guarantee[sd]?\s+(?:delivery|refund|your money back)/i.test(text.slice(i, i + 40)),
    sev: (c) => (isHealth(c) || isMoney(c) ? "block" : "warn"),
    alts: ["designed to", "built to", "made to"],
    altsFn: (m) => /risk|lose/i.test(m) ? ["", "with clear terms", "with a 30-day return policy"] : /win|bet/i.test(m) ? ["", "", ""] : ["designed to work", "built to perform", "made to last"],
    why: "No product can guarantee a health result, a profit or a win. Meta's Prohibited commercial practices policy names guaranteed investment returns explicitly.",
    fix: "Only guarantee something concrete and real, like \"30-day money-back guarantee\", with terms on the landing page.",
  }),
  R({
    id: "income-claim", policy: "commercial", title: "Income or return promise",
    re: /\b(?:make|made|earn|earned|making|earning|pull\s+in|pulled\s+in|generate|generated|generating|bank|banked|banking)\s+(?:up\s+to\s+|over\s+|at\s+least\s+)?[$€£]\s?\d[\d,.]*k?\+?(?:\s*(?:\/|a|per|every)\s*(?:day|week|month|hour|year)|\s*(?:daily|weekly|monthly))?|\b\d+(?:\.\d+)?%\s*(?:daily|weekly|monthly|guaranteed|fixed)\s*(?:returns?|profits?|roi|gains?|interest|yield)|\bguaranteed\s+(?:returns?|profits?|income|earnings|payouts?|gains|roi)|\bget\s+rich(?:\s+quick)?\b|\bdouble\s+(?:your|ur)\s+(?:money|investment|crypto|portfolio)\b|\bmoney\s+while\s+you\s+sleep\b|\b(?:easy|free|fast)\s+money\b|\b(?:6|7|six|seven)[- ]figures?\s+(?:income|a\s+year|per\s+month|a\s+month|from\s+home)\b/gi,
    sev: "block", sentence: true,
    why: "Guaranteed returns and quick-wealth promises are deceptive practices under Meta's Prohibited commercial practices policy, and a top reason ad accounts get restricted.",
    fix: "Describe what is sold (course, tool, platform) and the work or risk involved. Keep earnings examples off the ad.",
  }),
  R({
    id: "income-soft", policy: "commercial", title: "Lifestyle-income framing",
    re: /\b(?:passive\s+income|financial\s+freedom|quit\s+(?:your|ur)\s+(?:job|9[- ]to[- ]5)|fire\s+your\s+boss|be\s+your\s+own\s+boss|work\s+from\s+(?:home|your\s+phone)\s+and\s+(?:earn|make)|from\s+(?:your|ur)\s+phone|no\s+experience\s+(?:needed|required)\s+(?:to\s+)?(?:earn|make)|ground[- ]floor\s+opportunity|join\s+my\s+team)\b/gi,
    sev: (c) => (c.niche === "bizopp" || isMoney(c) ? "warn" : "tip"), sentence: true,
    why: "Income opportunities must describe the business model. Promises of freedom from work for little effort read as get-rich-quick and multi-level-marketing recruiting.",
    fix: "Say what the person gets (training, software, coaching) and what the work involves.",
  }),
  R({
    id: "endorsement", policy: "commercial", title: "Possibly unauthorised endorsement",
    re: /\bas\s+seen\s+on\s+(?:shark\s+tank|dragons'?\s+den|oprah|the\s+today\s+show|good\s+morning\s+america|gma|cnn|bbc|fox\s+news|tv)\b|\b(?:shark\s+tank|dragons'?\s+den|elon\s+musk|jeff\s+bezos|bill\s+gates|oprah(?:\s+winfrey)?|warren\s+buffett|mark\s+zuckerberg|taylor\s+swift|mr\.?\s?beast|dr\.?\s+oz|kylie\s+jenner|kim\s+kardashian|cristiano\s+ronaldo|keanu\s+reeves|tom\s+hanks|jennifer\s+aniston|martin\s+lewis)\b|\bendorsed\s+by\s+(?:celebrities|doctors|the\s+fda)\b|\bfda[- ]approved\b/gi,
    sev: (c) => (isMoney(c) || c.niche === "supplements" || c.niche === "weight" ? "block" : "warn"), sentence: true,
    why: "Using public figures or TV shows without permission is an unauthorised endorsement, which Meta names as a prohibited commercial practice. It's the most common pattern in scam ads. \"FDA approved\" is false for supplements, which the FDA doesn't approve.",
    fix: "Remove the name unless you have a signed agreement. Use real, verifiable customer reviews instead.",
  }),
  R({
    id: "urgency", policy: "commercial", title: "Scarcity or deadline claim",
    re: /\b(?:only\s+\d+\s+(?:left|spots?|remaining|bottles?\s+left|seats?\s+left|units?\s+left)|ends\s+(?:tonight|today|at\s+midnight|in\s+\d+\s+(?:minutes|hours))|last\s+chance|act\s+now|hurry(?:\s+up)?|limited\s+time\s+only|selling\s+out\s+fast|today\s+only|before\s+it'?s\s+too\s+late|don'?t\s+miss\s+out)\b/gi,
    sev: "tip",
    alts: ["", "while the offer runs", "for a limited time"],
    why: "Urgency is fine only when it's true. Invented countdowns and stock levels count as deceptive pricing.",
    fix: "Keep it only if the deadline or stock is real, and show the same deadline on the landing page.",
  }),
  R({
    id: "free", policy: "commercial", title: "\"Free\" offer without conditions",
    re: /\bfree\b/gi,
    filter: (m, text, i) => !/^free\s+(?:shipping|delivery|returns?|consultation|trial\s+for|of\s+charge\s+delivery)/i.test(text.slice(i, i + 30)) && !/[-‑](?:$)/.test(text.slice(Math.max(0, i - 1), i)),
    sev: "tip",
    why: "If \"free\" needs a purchase, a subscription or card details, the ad has to say so, or it can be treated as deceptive pricing.",
    fix: "Add the condition: \"Free 7-day trial, cancel any time.\"",
  }),
  R({
    id: "superlative", policy: "commercial", title: "Unproven superlative or proof claim",
    re: /(?:#1\b|\bnumber\s+one\b|\bno\.\s?1\b|\bbest\s+in\s+the\s+(?:world|country|industry)\b|\bworld'?s\s+(?:best|first|leading|#1)\b|\bcheapest\b|\blowest\s+price\b|\bclinically\s+proven\b|\bscientifically\s+proven\b|\b(?:doctor|dermatologist)[- ]recommended\b)/gi,
    sev: (c) => (isHealth(c) && /proven|recommended/i.test(c.allText) ? "warn" : "tip"),
    alts: ["", "highly rated", "carefully tested"],
    why: "Reviewers may ask for proof of superlatives and \"clinically proven\" claims. Without it on the landing page, the claim can be treated as misleading.",
    fix: "Cite the source (\"Rated 4.8 on Trustpilot\", \"Study in [journal], 2025\") or drop the claim.",
  }),

  // ---- Restricted goods and services ----
  R({
    id: "fin-prohibited", policy: "financial", title: "Prohibited financial product", prohibited: true,
    re: /\b(?:payday\s+loans?|cash\s+advances?|pay\s?check\s+advances?|salary\s+advances?|wage\s+advances?|bail\s+bonds?|binary\s+options?|CFDs?|contracts?\s+for\s+differences?|initial\s+coin\s+offerings?|ICOs?|token\s+pre-?sales?|penny\s+auctions?|bidding[- ]fee\s+auctions?|(?:7|14|30|60|90)[- ]day\s+loans?)\b/g,
    flags: "i", sev: "block",
    why: "Meta prohibits ads for payday loans, salary advances, bail bonds, loans of 90 days or less, binary options, CFD trading, ICOs and penny auctions. No rewrite makes these allowed.",
    fix: "These products can't be advertised on Facebook. Long-term loans over 90 days, credit cards and insurance are allowed with conditions.",
  }),
  R({
    id: "invest-dm", policy: "financial", title: "Investment offer that moves people to DMs",
    re: /\b(?:dm\s+(?:me|us)|send\s+(?:me|us)\s+a\s+(?:dm|message)|message\s+(?:me|us)|inbox\s+(?:me|us)|whats\s?app\s+(?:me|us)?|telegram)\b/gi,
    sev: (c) => (c.countries.includes("United States") && (c.niche === "crypto" || c.niche === "trading" || /\binvest/i.test(c.allText)) ? "block" : null),
    sentence: true,
    why: "For ads targeting the United States, Meta doesn't allow investment products or opportunities that push people to on- or off-platform direct messaging.",
    fix: "Send people to a landing page with your licence details and risk warnings instead of DMs, WhatsApp or Telegram.",
  }),
  R({
    id: "crypto", policy: "crypto", title: "Crypto product: written permission needed", cat: "crypto",
    re: /\b(?:crypto(?:currency|currencies)?|bitcoin|BTC|ethereum|ETH|altcoins?|memecoins?|DeFi|staking|stake\s+your|crypto\s+(?:exchange|trading|wallet|signals|bot|lending)|trading\s+bot|mining\s+software|airdrops?|USDT|solana)\b/g,
    flags: "i", sev: (c) => (c.authorised ? "tip" : "warn"),
    why: "Exchanges, trading, lending, staking wallets and mining software need Meta's written permission plus a recognised licence. Education, news, NFTs, basic wallets and mining hardware don't.",
    fix: "Apply under Authorisations and verifications in Meta Business Suite with your licence before you launch, or keep the ad purely educational.",
  }),
  R({
    id: "investing", policy: "financial", title: "Investment product: licence may be required", cat: "finance",
    re: /\b(?:forex|fx\s+trading|day\s+trading|trading\s+signals|stock\s+picks|options\s+trading|copy\s+trading|prop\s+firm|funded\s+accounts?|invest(?:ing|ment)?\s+(?:platform|app|opportunit(?:y|ies)|club)|portfolio\s+management|robo[- ]advis[eo]r)\b/gi,
    sev: (c) => (c.authorised ? "tip" : "warn"),
    why: "Investment products may need a licence in each country you target, and Meta can ask to see it. Required risk disclosures must appear in the ad or on the page.",
    fix: "Confirm your licence covers the targeted countries and include your risk warning.",
  }),
  R({
    id: "credit", policy: "sac", title: "Financial products and services: Special Ad Category", cat: "sac-fin",
    re: /\b(?:personal\s+loans?|car\s+loans?|business\s+loans?|home\s+loans?|loans?\s+(?:from|up\s+to|of)|mortgages?|refinanc\w*|credit\s+cards?|lines?\s+of\s+credit|credit\s+lines?|buy\s+now,?\s+pay\s+later|BNPL|insurance|APR|debt\s+consolidation|credit\s+score)\b/gi,
    sev: (c) => (c.sac === "financial" ? "tip" : "warn"),
    why: "Credit, loans, mortgages and insurance need the \"Financial products and services\" Special Ad Category (required since January 2025 for ads reaching the US), 18+ targeting and the disclosures your law requires.",
    fix: "Select the Special Ad Category in Ads Manager, keep targeting broad, and show APR and terms on the page.",
  }),
  R({
    id: "employment", policy: "sac", title: "Employment ad: Special Ad Category", cat: "sac-emp",
    re: /\b(?:we'?re\s+hiring|now\s+hiring|job\s+openings?|vacanc(?:y|ies)|join\s+our\s+team\s+as|hiring\s+(?:drivers|nurses|staff|now)|apply\s+for\s+(?:the|this|our)\s+(?:role|job|position)|full[- ]time\s+(?:role|position)|salary\s+of)\b/gi,
    sev: (c) => (c.sac === "employment" ? "tip" : "warn"),
    why: "Job ads must be marked with the Employment Special Ad Category, which limits age, gender and postcode targeting.",
    fix: "Select the Employment Special Ad Category in Ads Manager.",
  }),
  R({
    id: "housing", policy: "sac", title: "Housing ad: Special Ad Category", cat: "sac-house",
    re: /\b(?:apartments?\s+for\s+rent|for\s+rent|rentals?|homes?\s+for\s+sale|houses?\s+for\s+sale|real\s+estate|condos?\s+for\s+sale|now\s+leasing|tenants?\s+wanted|property\s+listings?)\b/gi,
    sev: (c) => (c.sac === "housing" ? "tip" : "warn"),
    why: "Housing ads (sales, rentals, mortgages) must use the Housing Special Ad Category, which limits targeting.",
    fix: "Select the Housing Special Ad Category in Ads Manager.",
  }),
  R({
    id: "siep", policy: "siep", title: "Social issue, election or political content", cat: "siep",
    re: /\b(?:vote\s+(?:for|yes|no)|voting|election|elect\s+\w+|candidate|ballot|congress(?:man|woman)?|parliament|senator|petition|climate\s+(?:change|crisis)\s+(?:policy|action|bill)|immigration\s+(?:policy|reform)|abortion|gun\s+(?:rights|control)|civil\s+rights|referendum)\b/gi,
    sev: (c) => (c.sac === "siep" ? "tip" : "warn"),
    why: "Ads about social issues, elections or politics need advertiser authorisation and a \"Paid for by\" disclaimer, and must be declared as a Special Ad Category.",
    fix: "Complete ad authorisation, then declare the Social issues, elections or politics category.",
  }),
  R({
    id: "gambling", policy: "gambling", title: "Online gambling: authorisation needed", cat: "gambling",
    re: /\b(?:online\s+casino|casinos?|betting|bet\s+now|place\s+(?:a|your)\s+bets?|sportsbook|sports\s+betting|poker|slots?|jackpots?|roulette|blackjack|lottery|lotto|raffles?|sweepstakes|free\s+spins|bingo|fantasy\s+sports|parlays?|wagers?)\b/gi,
    sev: (c) => (c.authorised ? "tip" : "warn"),
    why: "Online gambling ads need Meta authorisation and a licence for each jurisdiction, must target 18+, and can't run in unsupported markets.",
    fix: "Get authorisation in Business Suite, target 18+ and exclude unsupported markets.",
  }),
  R({
    id: "dating", policy: "dating", title: "Dating service: written permission needed", cat: "dating",
    re: /\b(?:dating|singles|matchmaking|matchmaker|find\s+(?:your|a)\s+(?:match|soulmate|partner)|date\s+(?:tonight|now))\b/gi,
    sev: (c) => (c.authorised ? "tip" : "warn"),
    why: "Dating ads are only allowed with Meta's prior written permission, and must target 18+.",
    fix: "Apply with Meta's dating permission form before you launch.",
  }),
  R({
    id: "sexual-dating", policy: "solicitation", title: "Affairs, paid dating or sexual services", prohibited: true,
    re: /\b(?:hook\s?ups?|one[- ]night\s+stands?|NSA\s+fun|friends\s+with\s+benefits|FWB|sugar\s+(?:daddy|daddies|baby|babies|mommy|dating)|discreet\s+(?:affairs?|encounters?|fun)|have\s+an\s+affair|cheat\s+on\s+(?:your|ur)|married\s+(?:but|and)\s+(?:lonely|looking)|onlyfans|adult\s+chat|sexting|escorts?|mail[- ]order\s+brides?)\b/gi,
    sev: "block",
    why: "Meta doesn't allow ads that facilitate affairs, sexual encounters, paid relationships or adult services. This applies to the service itself, so no wording fixes it.",
    fix: "These services can't be advertised. Dating apps focused on relationships can, with Meta's written permission.",
  }),
  R({
    id: "sexual-wording", policy: "solicitation", title: "Sexually suggestive dating copy",
    re: /\b(?:hot\s+singles|singles\s+in\s+your\s+area|horny|nudes?|XXX|NSFW|naughty\s+(?:singles|dates?))\b/gi,
    sev: "block", sentence: true,
    why: "Dating ads can't have a sexually suggestive emphasis, and \"singles in your area\" implies knowledge of the reader's location and status.",
    fix: "Lead with relationships and shared values: \"Meet people who share your values. Verified profiles.\"",
  }),
  R({
    id: "sexy", policy: "adult", title: "Sexually suggestive wording",
    re: /\b(?:sexy|seductive|naughty|steamy|sultry|in\s+the\s+bedroom)\b/gi,
    sev: (c) => (c.niche === "dating" || c.niche === "sexual" ? "block" : "warn"),
    alts: ["stylish", "confident", "bold"],
    why: "Sexually suggestive language is restricted in ads, and banned in dating and sexual-health ads.",
    fix: "Use neutral words about style, comfort or confidence.",
  }),
  R({
    id: "adult-products", policy: "health", title: "Sex toys, erotic or enhancement products", prohibited: true,
    re: /\b(?:sex\s+toys?|vibrators?|dildos?|erotic\w*|fetish|BDSM|male\s+enhancement|penis\s+enlargement|enlarge\s+your\s+(?:penis|member)|G[- ]spot)\b/gi,
    sev: "block",
    why: "Meta doesn't allow ads for sex toys, erotic products, non-surgical genital enhancement products or pleasure-focused procedures.",
    fix: "These products can't be advertised. Sexual health services focused on a medical condition can, for 18+.",
  }),
  R({
    id: "pleasure-claims", policy: "health", title: "Pleasure or performance framing",
    re: /\b(?:last\s+longer\s+in\s+bed|stamina\s+in\s+bed|better\s+sex|mind[- ]blowing\s+sex|orgasm\w*|libido\s+boost\w*|aphrodisiac|bigger\s+(?:size|penis|member)|perform\s+like\s+a\s+\w+)\b/gi,
    sev: "block", sentence: true,
    why: "Sexual health ads are allowed only when they focus on health and medical efficacy, not pleasure or sexual performance.",
    fix: "Describe the clinical service: \"Discreet, doctor-led treatment for erectile dysfunction. 18+.\"",
  }),
  R({
    id: "sexual-health", policy: "health", title: "Sexual or reproductive health: 18+ only", cat: "adult18",
    re: /\b(?:erectile\s+dysfunction|ED\s+(?:treatment|pills?|meds?)|premature\s+ejaculation|menopause|contracepti\w+|condoms?|fertility|IVF|ovulation|lube|pheromones?)\b/gi,
    sev: "tip",
    why: "Sexual and reproductive health ads are allowed when they focus on health, and must target 18+ (menstrual apps and hygiene products are exempt).",
    fix: "Target 18+ and keep the focus clinical.",
  }),
  R({
    id: "alcohol", policy: "alcohol", title: "Alcohol: age and country rules", cat: "alcohol",
    re: /\b(?:beers?|wines?|vodka|whisk(?:e)?y|gin|rum|tequila|mezcal|cocktails?|liquor|spirits|brewery|distillery|happy\s+hour|prosecco|champagne|hard\s+seltzer|bourbon|cider)\b/gi,
    filter: (m, text, i) => !/^spirits?\s+(?:of|up)/i.test(text.slice(i, i + 12)) && !/\bnon[- ]alcoholic\b|\balcohol[- ]free\b|\b0\.0\b/i.test(text),
    sev: "tip",
    why: "Alcohol ads must target the legal drinking age in each country (minimum 18) and are banned in some countries.",
    fix: "Set the age to the local legal drinking age and exclude countries where alcohol ads aren't allowed.",
  }),
  R({
    id: "tobacco", policy: "tobacco", title: "Tobacco, vape or nicotine product",
    re: /\b(?:vapes?|vaping|vape\s+pens?|e-?cig(?:arette)?s?|e-?liquids?|e-?juice|disposable\s+vapes?|pod\s+(?:kits?|systems?)|cigarettes?|cigars?|tobacco|nicotine(?:\s+pouches)?|snus|zyn|hookahs?|shisha|rolling\s+papers|heated\s+tobacco|iqos)\b/gi,
    sev: (c) => (/\b(?:quit|stop)\s+smoking\b|\bcessation\b/i.test(c.allText) ? "tip" : "block"),
    prohibitedFn: (c) => !/\b(?:quit|stop)\s+smoking\b|\bcessation\b/i.test(c.allText),
    why: "Meta prohibits ads for tobacco, vapes (including nicotine-free and wellness vapes), nicotine pouches and smoking accessories. Only WHO- or FDA-approved cessation products may be advertised, for 18+.",
    fix: "These products can't be advertised. Cessation products approved by the WHO or FDA can be, targeted 18+.",
  }),
  R({
    id: "thc", policy: "drugs", title: "THC or psychoactive cannabis", prohibited: true,
    re: /\b(?:THC(?!\s*\(?\s*<|\s+under|\s+free|\s+below)|delta[- ]?(?:8|9|10)|HHC|THCA|cannabis|marijuana|weed\s+(?:gummies|edibles|delivery|pens?)|dispensar(?:y|ies)|bongs?|dab\s+pens?|420\s+friendly)\b/gi,
    filter: (m, text, i) => !/(?:<|less\s+than|under|below)\s*0\.3%?\s*$/i.test(text.slice(Math.max(0, i - 16), i)),
    sev: "block",
    why: "Ads can't promote THC products, psychoactive cannabis or drug paraphernalia, ingestible or not.",
    fix: "These products can't be advertised on Facebook.",
  }),
  R({
    id: "cbd", policy: "drugs", title: "CBD: LegitScript and Meta authorisation needed", cat: "cbd",
    re: /\b(?:CBD|cannabidiol|full[- ]spectrum\s+hemp|hemp\s+extract|broad[- ]spectrum)\b/gi,
    sev: (c) => (/\b(?:anxiety|pain|sleep\s+disorder|insomnia|inflammation|seizures?|relie(?:f|ves?)|treats?|heals?|cures?|arthritis|depression)\b/i.test(c.allText) ? "block" : c.authorised ? "tip" : "warn"),
    why: "CBD ads need LegitScript certification and Meta authorisation, can only target the United States and people 18+, and can't make any health or medical claim.",
    fix: "Get certified and authorised, target the US only, and describe sourcing and testing rather than effects.",
  }),
  R({
    id: "rx", policy: "drugs", title: "Prescription medicine: certification needed", cat: "rx",
    re: /\b(?:ozempic|wegovy|mounjaro|zepbound|semaglutide|tirzepatide|liraglutide|saxenda|GLP-?1s?|viagra|cialis|sildenafil|tadalafil|finasteride|propecia|accutane|isotretinoin|phentermine|metformin|tretinoin|minoxidil\s+(?:tablets|pills))\b/gi,
    sev: (c) => (c.authorised ? "tip" : "warn"),
    why: "Prescription drug ads need LegitScript certification and Meta authorisation, may only target the US, Canada or New Zealand where you're certified, must target 18+ and must tell people to consult a licensed professional.",
    fix: "Without certification, advertise the consultation or telehealth service in general terms and leave the drug name out.",
  }),
  R({
    id: "rx-banned", policy: "drugs", title: "Unsafe substance or no-prescription offer", prohibited: true,
    re: /\b(?:no\s+prescription(?:\s+(?:needed|required))?|without\s+(?:a\s+)?prescription|prescription[- ]free|rx[- ]free|xanax|alprazolam|oxycodone|oxycontin|percocet|adderall|valium|diazepam|tramadol|codeine|fentanyl|modafinil|anabolic\s+steroids?|steroids\s+for\s+sale|SARMs?|DMAA|ephedra|ephedrine|DNP|HCG\s+drops|kratom|poppers|magic\s+mushrooms|psilocybin|research\s+chemicals|peptides\s+for\s+sale)\b/gi,
    sev: "block",
    why: "\"No prescription needed\" offers, controlled drugs and unsafe supplements (such as ephedra, DMAA, SARMs or HCG drops) are prohibited.",
    fix: "These can't be advertised. Licensed providers can promote a consultation-first service with certification.",
  }),
  R({
    id: "weapons", policy: "weapons", title: "Weapons, ammunition or explosives",
    re: /\b(?:guns?|firearms?|rifles?|pistols?|handguns?|shotguns?|ammo|ammunition|silencers?|suppressors?|ghost\s+guns?|3d[- ]printed\s+guns?|bump\s+stocks?|tasers?|stun\s+guns?|switchblades?|brass\s+knuckles|explosives?)\b/gi,
    filter: (m, text, i) => !/^(?:glue|massage|nail|heat|water|spray|staple|price)\s+guns?/i.test(text.slice(Math.max(0, i - 8), i + m.length).trim()) && !/(?:glue|massage|nail|heat|water|spray|staple)\s+$/i.test(text.slice(Math.max(0, i - 10), i)),
    sev: (c, m) => (/ghost|3d|bump|silencer|suppressor|switchblade|brass|explosive/i.test(m) ? "block" : "warn"),
    why: "Ads for firearms, ammunition, explosives and many weapon accessories are prohibited or heavily restricted.",
    fix: "Check Meta's Weapons policy for your exact product before you spend. Safety courses and holsters have separate rules.",
  }),
  R({
    id: "fake-docs", policy: "documents", title: "Fake documents, engagement or account services", prohibited: true,
    re: /\b(?:fake\s+(?:ids?|diplomas?|degrees?|passports?|reviews?|documents?|bank\s+statements?)|novelty\s+(?:ids?|passports?)|buy\s+(?:followers|likes|views|reviews|aged\s+(?:accounts?|ad\s+accounts?|BMs?))|(?:ad\s+)?accounts?\s+for\s+(?:rent|sale)|rent\s+(?:an?\s+)?(?:agency\s+)?ad\s+accounts?|unban\s+(?:service|your\s+account)|cloak(?:ing|ed)|bypass\s+(?:ad\s+review|facebook\s+review|meta\s+review))\b/gi,
    sev: "block",
    why: "Fake or forged documents, bought engagement, and rented or sold accounts are prohibited, and promoting them puts the whole Business Manager at risk.",
    fix: "These services can't be advertised.",
  }),
  R({
    id: "pii", policy: "personal", title: "Asks for sensitive personal or financial details",
    re: /\b(?:send|enter|share|dm|tell|drop)\s+(?:us\s+|me\s+)?(?:your\s+)?(?:ssn|social\s+security(?:\s+number)?|bank\s+(?:details|account(?:\s+number)?)|card\s+(?:number|details)|credit\s+card\s+(?:number|details)|password|pin\s+(?:code|number)?|login\s+details|2fa\s+code|passport\s+(?:number|details)|national\s+insurance\s+number|id\s+number)\b/gi,
    sev: "block", sentence: true,
    why: "Ads can't ask for personally identifiable or financial information such as card numbers, bank details or passwords.",
    fix: "Collect only what's needed, on a secure page with a privacy policy, never in ad text or DMs.",
  }),

  // ---- Spam, profanity and editorial ----
  R({
    id: "engagement-bait", policy: "spam", title: "Engagement bait",
    re: /\btag\s+(?:a|your)\s+(?:friend|mate|bestie|bff)\b|\btag\s+someone\b|\blike\s+(?:and|&)\s+share\b|\bshare\s+(?:this|if)\b|\bcomment\s+["“']?(?:yes|below|amen|\w+)["”']?\s+(?:below|if|to\s+get)\b|\blike\s+if\s+you\b|\btype\s+["“']?(?:yes|amen)\b|\bvote\s+(?:with|using)\s+(?:reactions|a\s+like)\b/gi,
    sev: "warn", sentence: true,
    why: "Asking people to like, share, tag or comment to boost reach is engagement bait. Meta lowers its distribution and may reject it as spam.",
    fix: "Ask for the real action: \"Shop the collection\", \"Book a free consultation\".",
  }),
  R({
    id: "fake-ui", policy: "spam", title: "Fake buttons or notifications",
    re: /▶️?\s*(?:play|watch)|\bclick\s+(?:the\s+)?play\b|\(\d+\)\s+(?:new\s+)?(?:messages?|notifications?)|\byou\s+have\s+(?:a\s+)?new\s+message\b|\byou(?:'ve|\s+have)\s+(?:been\s+)?(?:selected|won)\b|\bclaim\s+your\s+(?:prize|reward)\b/gi,
    sev: "warn", sentence: true,
    why: "Images or text that imitate play buttons, notifications or prize alerts are deceptive and treated as spam.",
    fix: "Remove the fake element. Use the real call-to-action button.",
  }),
  R({
    id: "profanity", policy: "profanity", title: "Profanity",
    re: /\b(?:fuck\w*|f\*+k\w*|f\*\*\*|shit\w*|sh\*t|bullshit|goddamn|damn|bitch\w*|asshole|bastard|crap|pissed|wtf|stfu)\b/gi,
    sev: "warn",
    alts: ["", "seriously", "really"],
    why: "Profanity, including masked words like f*ck, isn't allowed in ads.",
    fix: "Swap it for a clean word.",
  }),
];

// Obfuscated spellings of sensitive words (w3ight, c@sino, s e x) are a classic
// way to slip past review. Meta treats that as circumventing its systems.
const SENSITIVE = ["weight", "loss", "lose", "fat", "diet", "slim", "keto", "burn", "crypto", "bitcoin", "casino", "bet", "betting", "sex", "sexy", "viagra", "cialis", "cbd", "thc", "vape", "nicotine", "loan", "loans", "credit", "ozempic", "wegovy", "cure", "money", "rich", "profit", "porn", "dating", "hookup", "pills", "pill", "drugs", "forex", "trading", "acne", "debt"];
const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "€": "e", "!": "i", "|": "l", "¥": "y" };
function deobfuscate(token) {
  return token.toLowerCase().replace(/[013457@$€!|8¥]/g, (c) => LEET[c] || c).replace(/[.*_\-]/g, "");
}
function obfuscationHits(field, text) {
  const hits = [];
  const tok = /[\p{L}\d@$€!|¥*._-]{3,}/gu;
  let m;
  while ((m = tok.exec(text))) {
    const t = m[0];
    if (!/[a-z]/i.test(t) || !/[0-9@$€!|¥*._-]/.test(t.replace(/[.!_-]+$/, ""))) continue;
    if (/^\d|^\$\d|%$/.test(t)) continue;
    const plain = deobfuscate(t.replace(/[.!]+$/, ""));
    const word = SENSITIVE.find((w) => plain === w || plain === w + "s" || (plain.length > 4 && plain.startsWith(w) && plain.length - w.length <= 3));
    if (word) hits.push({ field, start: m.index, end: m.index + t.replace(/[.!]+$/, "").length, text: t, plain: word });
  }
  const spaced = /\b(?:[a-z]\s){2,}[a-z]\b/gi;
  while ((m = spaced.exec(text))) {
    const plain = m[0].replace(/\s/g, "").toLowerCase();
    if (SENSITIVE.includes(plain)) hits.push({ field, start: m.index, end: m.index + m[0].length, text: m[0], plain });
  }
  const zw = /[​-‍⁠﻿]+/g;
  while ((m = zw.exec(text))) hits.push({ field, start: m.index, end: m.index + m[0].length, text: "(hidden character)", plain: "" });
  const mixed = /\p{L}*(?:[a-z][Ѐ-ӿ]|[Ѐ-ӿ][a-z])\p{L}*/giu;
  while ((m = mixed.exec(text))) hits.push({ field, start: m.index, end: m.index + m[0].length, text: m[0], plain: "" });
  return hits;
}

export const NICHE_DETECT = {
  weight: /\b(?:weight[- ]?loss|weight\s+management|lose\s+weight|fat\s+burn\w*|slimming|diet\s+pills?|keto|appetite|calories|belly\s+fat|lbs|pounds|kilos|waist)\b/gi,
  supplements: /\b(?:supplements?|capsules?|gummies|vitamins?|collagen|probiotics?|ashwagandha|magnesium|greens\s+powder|protein\s+powder|nootropics?)\b/gi,
  cosmetic: /\b(?:fillers?|botox|injectables?|lip\s+filler|rhinoplasty|liposuction|tummy\s+tuck|bbl|laser\s+hair\s+removal|aesthetic\s+clinic|anti[- ]wrinkle\s+injections?|cosmetic\s+surgery)\b/gi,
  skincare: /\b(?:skin(?:care)?|serum|moisturi[sz]er|acne|wrinkles?|anti[- ]aging|cream|spf|cleanser|glow|pores|complexion|hair\s+growth)\b/gi,
  sexual: /\b(?:erectile|ED\b|libido|sexual\s+health|men'?s\s+health|premature|menopause|testosterone)\b/gi,
  telehealth: /\b(?:prescription|telehealth|online\s+doctor|GLP-?1|semaglutide|ozempic|wegovy|tirzepatide|pharmacy|clinician)\b/gi,
  crypto: /\b(?:crypto\w*|bitcoin|btc|ethereum|blockchain|token|coin|defi|staking|wallet|nft)\b/gi,
  trading: /\b(?:invest\w*|trading|trader|forex|stocks?|portfolio|returns?|roi|profits?|signals)\b/gi,
  loans: /\b(?:loans?|credit|mortgage|apr|insurance|borrow|lender|refinanc\w*|debt)\b/gi,
  bizopp: /\b(?:side\s+hustle|course|coaching|mentor\w*|dropshipping|affiliate|passive\s+income|be\s+your\s+own\s+boss|make\s+money|online\s+business|financial\s+freedom|income)\b/gi,
  dating: /\b(?:dating|singles|match(?:es|making)?|soulmate|relationship|date\s+night|hook\s?ups?)\b/gi,
  gambling: /\b(?:casino|betting|bet|odds|poker|slots|jackpot|sportsbook|spins|wager|lottery)\b/gi,
  alcohol: /\b(?:beer|wine|vodka|whisk(?:e)?y|gin|rum|tequila|cocktails?|liquor|spirits|brewery|distillery)\b/gi,
  cbd: /\b(?:cbd|hemp|cannabidiol|thc|delta)\b/gi,
  mental: /\b(?:therapy|therapist|counsel\w*|anxiety|depression|mental\s+health|stress|mindfulness)\b/gi,
  vape: /\b(?:vapes?|vaping|e-?cig\w*|nicotine|pods?|e-?liquid|tobacco|hookah)\b/gi,
};

// Narrow, decisive niches outweigh broad words like "stress" or "returns".
const DETECT_WEIGHT = { cbd: 3, vape: 3, telehealth: 2, crypto: 4, gambling: 2, dating: 2, alcohol: 2, cosmetic: 2, sexual: 2, weight: 1.5 };

export function detectNiche(text) {
  let best = "general", top = 0;
  for (const [k, re] of Object.entries(NICHE_DETECT)) {
    re.lastIndex = 0;
    const n = (text.match(re) || []).length * (DETECT_WEIGHT[k] || 1);
    if (n > top) { top = n; best = k; }
  }
  return top >= 1 ? best : "general";
}

const mk = (o) => ({ hits: [], ...o, policyName: POLICIES[o.policy].name, policyUrl: POLICIES[o.policy].url });

function compile(rule) {
  if (!rule._re) {
    const flags = new Set((rule.re.flags + (rule.flags || "")).split(""));
    flags.add("g");
    rule._re = new RegExp(rule.re.source, [...flags].join(""));
  }
  return rule._re;
}

export function buildContext(ad) {
  const texts = {};
  for (const f of TEXT_FIELDS) texts[f] = ad[f] || "";
  (ad.images || []).forEach((im, i) => { if (im && im.text) texts["image" + (i + 1)] = im.text; });
  if (ad.landing && ad.landing.text) texts.landing = ad.landing.text;
  const adText = TEXT_FIELDS.map((f) => texts[f]).join("\n");
  const allText = Object.values(texts).join("\n");
  const niche = !ad.niche || ad.niche === "auto" ? detectNiche(adText + "\n" + (texts.image1 || "")) : ad.niche;
  return {
    texts, adText, allText, niche, nicheAuto: !ad.niche || ad.niche === "auto",
    countries: (ad.countries || []).filter(Boolean), minAge: Number(ad.minAge) || 18,
    sac: ad.sac || "none", authorised: !!ad.authorised, url: (ad.url || "").trim(), cta: ad.cta || "",
    brand: ad.brand || "", landing: ad.landing || null, images: ad.images || [],
  };
}

// Only high-signal rules run on landing page text; footers are full of words
// like "insurance" or "free" that mean nothing there.
const LANDING_RULES = new Set(["cure-incurable", "cure-other", "weight-claim", "fat-melt", "income-claim", "guarantee", "endorsement", "rx-banned", "thc", "fin-prohibited", "sexual-dating", "adult-products", "inferiority", "whitening", "fake-docs", "tobacco", "eating"]);

const evalSev = (sev, ctx, match) => (typeof sev === "function" ? sev(ctx, match) : sev);

// Run every rule. Returns findings sorted by severity, a 0-100 risk score,
// a Low / Medium / High level, and any prohibited-product flags.
export function check(ad) {
  const ctx = buildContext(ad);
  const findings = [];
  const cats = new Set();
  const prohibited = [];

  for (const rule of RULES) {
    const re = compile(rule);
    const hits = [];
    let sev = null;
    for (const [field, text] of Object.entries(ctx.texts)) {
      if (!text || (field === "landing" && !LANDING_RULES.has(rule.id))) continue;
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        if (!m[0].length) { re.lastIndex++; continue; }
        if (rule.filter && !rule.filter(m[0], text, m.index)) continue;
        const s = evalSev(rule.sev, ctx, m[0]);
        if (!s) continue;
        if (!sev || SEV[s].rank > SEV[sev].rank) sev = s;
        hits.push({ field, start: m.index, end: m.index + m[0].length, text: m[0], sev: s });
      }
    }
    if (!hits.length) continue;
    if (rule.cat) cats.add(rule.cat);
    const isProhibited = rule.prohibitedFn ? rule.prohibitedFn(ctx) : rule.prohibited;
    if (isProhibited && sev === "block") prohibited.push({ id: rule.id, title: rule.title, policy: POLICIES[rule.policy].name });
    findings.push(mk({ id: rule.id, sev, policy: rule.policy, title: rule.title, why: rule.why, fix: rule.fix, hits, rule }));
  }

  // Obfuscation check runs on every field.
  const obf = [];
  for (const [field, text] of Object.entries(ctx.texts)) obf.push(...obfuscationHits(field, text));
  if (obf.length) {
    findings.push(mk({
      id: "obfuscation", sev: "block", policy: "integrity", title: "Disguised spelling of a sensitive word",
      why: "Spellings like \"w3ight l0ss\", \"c@sino\" or hidden characters are used to slip past review. Meta treats this as circumventing its systems, which can disable the whole ad account, not just the ad.",
      fix: "Write every word plainly. If the plain version breaks policy, change the claim, not the spelling.",
      hits: obf.map((h) => ({ ...h, sev: "block" })),
    }));
  }

  findings.push(...wholeAdChecks(ctx, cats));
  findings.sort((a, b) => SEV[b.sev].rank - SEV[a.sev].rank);

  const risk = Math.min(100, findings.reduce((s, f) => s + SEV[f.sev].weight, 0));
  const has = (s) => findings.some((f) => f.sev === s);
  const level = has("block") || risk >= 60 ? "high" : has("warn") || risk >= 20 ? "medium" : "low";
  const counts = { block: 0, warn: 0, tip: 0 };
  findings.forEach((f) => counts[f.sev]++);
  return { ctx, findings, risk, level, counts, prohibited, cats: [...cats], niche: ctx.niche };
}

const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly", "rebrand.ly", "buff.ly", "shorturl.at", "linktr.ee", "tiny.cc", "rb.gy"];

function wholeAdChecks(ctx, cats) {
  const out = [];
  const N = NICHES[ctx.niche] || NICHES.general;
  const add = (o) => out.push(mk({ hits: [], ...o }));
  const C = ctx.countries;

  // Age targeting
  const needs18 = N.minAge >= 18 || ["crypto", "finance", "sac-fin", "gambling", "dating", "alcohol", "cbd", "rx", "adult18"].some((c) => cats.has(c));
  let required = needs18 ? 18 : 0;
  let ageReason = needs18 ? `${N.short === "General" ? "This category" : N.name} ads must target people 18 and over.` : "";
  if (cats.has("alcohol") || ctx.niche === "alcohol") {
    for (const c of C) if ((ALCOHOL_AGE[c] || 18) > required) { required = ALCOHOL_AGE[c]; ageReason = `Alcohol ads in ${c} must target ${required}+.`; }
  }
  if (required && ctx.minAge < required) {
    add({ id: "age", sev: "block", policy: ctx.niche === "alcohol" || cats.has("alcohol") ? "alcohol" : (N.policies[0] || "standards"), title: `Age targeting starts at ${ctx.minAge}, needs ${required}+`, why: ageReason, fix: `Set the minimum age to ${required} in the ad set.`, field: "age" });
  }

  // Country restrictions
  const alc = cats.has("alcohol") || ctx.niche === "alcohol";
  const banned = alc ? C.filter((c) => ALCOHOL_BANNED.includes(c)) : [];
  if (banned.length) add({ id: "alcohol-country", sev: "block", policy: "alcohol", title: `Alcohol ads aren't allowed in ${banned.join(", ")}`, why: "Meta prohibits alcohol ads in 17 countries based on local law.", fix: `Remove ${banned.join(", ")} from the ad set locations.`, field: "countries" });
  const gam = cats.has("gambling") || ctx.niche === "gambling";
  const gBanned = gam ? C.filter((c) => GAMBLING_BANNED.includes(c)) : [];
  if (gBanned.length) add({ id: "gambling-country", sev: "block", policy: "gambling", title: `Unsupported gambling market: ${gBanned.join(", ")}`, why: "Even authorised advertisers can't run online gambling ads in Meta's unsupported markets.", fix: `Remove ${gBanned.join(", ")} from the locations.`, field: "countries" });
  if ((cats.has("cbd") || ctx.niche === "cbd") && C.length && C.some((c) => !CBD_COUNTRIES.includes(c))) {
    const bad = C.filter((c) => !CBD_COUNTRIES.includes(c));
    add({ id: "cbd-country", sev: "block", policy: "drugs", title: "CBD ads can only target the United States", why: `CBD ads are only allowed in the US. Hemp products without CBD can run in the US, Canada and Mexico. Remove: ${bad.join(", ")}.`, fix: "Target the United States only, or advertise hemp products without CBD.", field: "countries" });
  }
  if (cats.has("rx") || ctx.niche === "telehealth") {
    const bad = C.filter((c) => !RX_COUNTRIES.includes(c));
    if (bad.length) add({ id: "rx-country", sev: cats.has("rx") ? "block" : "warn", policy: "drugs", title: "Prescription drug ads: US, Canada or New Zealand only", why: `Certified advertisers can only promote prescription drugs in the US, Canada or New Zealand. Remove: ${bad.join(", ")}.`, fix: "Limit locations to countries where you're certified.", field: "countries" });
  }

  // Authorisation reminders for niches that need it, when no rule already said so
  if (N.status === "auth" && !ctx.authorised && !out.length && !["crypto", "gambling", "dating", "cbd", "rx"].some((c) => cats.has(c))) {
    add({ id: "auth", sev: "warn", policy: N.policies[0], title: `${N.name}: authorisation or licence needed`, why: N.summary, fix: "Tick \"I have the authorisation\" once you've been approved, so the checker can account for it.", field: "authorised" });
  }

  // Special Ad Category consistency
  const sacNeeded = cats.has("sac-fin") ? "financial" : cats.has("sac-emp") ? "employment" : cats.has("sac-house") ? "housing" : cats.has("siep") ? "siep" : null;
  if (ctx.sac !== "none" && ["financial", "employment", "housing"].includes(ctx.sac) && ctx.minAge !== 18) {
    add({ id: "sac-age", sev: "warn", policy: "sac", title: "Special Ad Category locks age to 18–65+", why: "With the Financial products, Employment or Housing category, Meta doesn't let you narrow age, gender or postcode targeting.", fix: "Set the age to 18–65+ and use broad locations.", field: "age" });
  }
  if (sacNeeded && ctx.sac !== "none" && ctx.sac !== sacNeeded) {
    add({ id: "sac-mismatch", sev: "warn", policy: "sac", title: "Declared Special Ad Category doesn't match the copy", why: "The ad reads like a different Special Ad Category from the one you selected.", fix: "Pick the category that matches what the ad promotes.", field: "sac" });
  }

  // Landing page URL
  const u = ctx.url;
  if (!u) {
    add({ id: "no-url", sev: "warn", policy: "standards", title: "No landing page URL yet", why: "Reviewers check the page the ad links to. Claims in the ad must match what the page says and sells.", fix: "Add the URL you plan to use.", field: "url" });
  } else {
    let p = null;
    try { p = new URL(/^https?:\/\//i.test(u) ? u : "https://" + u); } catch { p = null; }
    if (!p || !p.hostname.includes(".")) add({ id: "bad-url", sev: "warn", policy: "standards", title: "That URL doesn't look valid", why: "Meta needs a working page to review.", fix: "Use a full address such as https://yourbrand.com/offer.", field: "url" });
    else {
      const host = p.hostname.replace(/^www\./, "");
      if (/^http:\/\//i.test(u)) add({ id: "http", sev: "warn", policy: "standards", title: "Landing page isn't on HTTPS", why: "Insecure pages get browser warnings and are a common review flag.", fix: "Serve the page over HTTPS.", field: "url" });
      if (SHORTENERS.includes(host)) add({ id: "shortener", sev: "warn", policy: "spam", title: "Link shortener hides the destination", why: "Meta's Spam policy covers deceptive links. Reviewers need to see the real domain, and shorteners are a common cloaking signal.", fix: "Link straight to a page on your own domain.", field: "url" });
      if (/(?:^|[.-])(?:facebook|meta|instagram|whatsapp|fb)(?:[.-]|$)/i.test(host) && !/^(?:facebook\.com|instagram\.com|wa\.me|whatsapp\.com|fb\.me|m\.me)$/.test(host)) add({ id: "brand-domain", sev: "warn", policy: "ip", title: "Domain uses Meta's brand names", why: "Domains that include Facebook, Meta or Instagram look like impersonation and can break third-party infringement rules.", fix: "Use your own brand domain.", field: "url" });
    }
  }

  // Landing page scan (from the server)
  const L = ctx.landing;
  if (L && L.checked) {
    if (!L.ok) add({ id: "lp-broken", sev: "block", policy: "standards", title: `Landing page didn't load (${L.status || L.error || "error"})`, why: "Ads that lead to broken or unreachable pages are rejected.", fix: "Fix the page or the URL, then check again.", field: "landing" });
    else {
      if (L.crossDomain) add({ id: "lp-redirect", sev: "warn", policy: "spam", title: `Redirects to a different domain (${L.finalHost})`, why: "Sending the reviewer and the user to a different domain looks like cloaking.", fix: "Link directly to the final page.", field: "landing" });
      if (!L.privacy) add({ id: "lp-privacy", sev: "warn", policy: "standards", title: "No privacy policy link found", why: "Reviewers and users look for a privacy policy, and it's required if you collect any data (lead forms, pixels, checkout).", fix: "Link a privacy policy in the footer.", field: "landing" });
      if (!L.contact) add({ id: "lp-contact", sev: "tip", policy: "standards", title: "No contact details found", why: "Pages without an email, phone, address or contact page look less trustworthy to reviewers.", fix: "Add a contact page or details in the footer.", field: "landing" });
      for (const miss of L.missingClaims || []) add({ id: "lp-mismatch-" + miss, sev: "warn", policy: "commercial", title: `\"${miss}\" isn't on the landing page`, why: "Offers in the ad must match the page. A price or discount that isn't on the page can be treated as deceptive pricing.", fix: "Show the same offer on the page, or remove it from the ad.", field: "landing" });
      if (L.thin) add({ id: "lp-thin", sev: "tip", policy: "standards", title: "Very little content on the page", why: "Thin pages with little information about the product or business are a low-quality signal.", fix: "Explain the product, pricing and who you are.", field: "landing" });
    }
  }

  // Creative
  for (const im of ctx.images) {
    if (!im) continue;
    if (im.textRatio > 0.2) add({ id: "img-text-" + im.name, sev: "tip", policy: "standards", title: `${im.name}: text covers about ${Math.round(im.textRatio * 100)}% of the image`, why: "Meta no longer rejects text-heavy images, but they usually get less delivery for the same budget.", fix: "Move most of the words into the primary text.", field: "creative" });
    if (im.sideBySide && (ctx.niche === "weight" || ctx.niche === "cosmetic" || ctx.niche === "skincare")) add({ id: "img-ba-" + im.name, sev: ctx.minAge >= 18 ? "tip" : "warn", policy: "health", title: `${im.name}: looks like a side-by-side comparison`, why: "Before-and-after images are allowed for 18+ weight-loss and cosmetic ads only if results are typical and the time taken is clear. Fat-pinching close-ups are banned.", fix: "Check the image shows realistic results and add a qualifier.", field: "creative" });
  }

  // Length and style (delivery, not policy)
  const P = [...(ctx.texts.primary || "")].length, H = [...(ctx.texts.headline || "")].length, D = [...(ctx.texts.description || "")].length;
  if (P > 125) add({ id: "len-primary", sev: "tip", policy: "standards", title: `Primary text is ${P} characters`, why: "Feed shows about 125 characters before \"See more\", so the key message should come first.", fix: "Put the offer and benefit in the first line.", field: "primary" });
  if (H > 40) add({ id: "len-headline", sev: "tip", policy: "standards", title: `Headline is ${H} characters`, why: "Headlines over about 40 characters get cut off on most placements.", fix: "Aim for 27–40 characters.", field: "headline" });
  if (D > 30) add({ id: "len-desc", sev: "tip", policy: "standards", title: `Description is ${D} characters`, why: "Descriptions over about 30 characters are often cut off or hidden.", fix: "Keep it under 30 characters.", field: "description" });
  const caps = (ctx.adText.match(/\b[A-Z]{4,}\b/g) || []).filter((w) => !["HTTP", "HTTPS", "LGBTQ", "COVID", "NASDAQ", "NYSE", "UNICEF", "IKEA", "NASA", "FDA", "USDA", "SPF", "CBD", "THC", "BOGO", "ASAP", "APR", "USDT", "NFTS"].includes(w));
  if (caps.length >= 2) add({ id: "caps", sev: "tip", policy: "standards", title: "Several words in all caps", why: "Shouty capitals read as low quality and spam-like to people and reviewers.", fix: "Use sentence case.", field: "primary", hits: caps.slice(0, 0) });
  if (/[!?]{2,}/.test(ctx.adText)) add({ id: "punct", sev: "tip", policy: "standards", title: "Repeated punctuation", why: "Strings like !!! or ?!? look spammy.", fix: "One punctuation mark is enough.", field: "primary" });
  const emoji = (ctx.adText.match(/\p{Extended_Pictographic}/gu) || []).length;
  if (emoji > 6) add({ id: "emoji", sev: "tip", policy: "standards", title: `${emoji} emoji in the copy`, why: "Heavy emoji use reads as spammy and hides the message.", fix: "Keep two or three that add meaning.", field: "primary" });

  return out;
}
