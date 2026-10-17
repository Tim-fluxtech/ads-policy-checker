// Meta Advertising Standards areas used by the checker.
// Names and URLs were checked against transparency.meta.com on 17 Oct 2026.
// Every finding links to one of these pages, so keep them current.

export const VERIFIED_ON = "17 Oct 2026";

const T = "https://transparency.meta.com/policies/ad-standards/";

export const POLICIES = {
  personal: { name: "Privacy violations and personal attributes", url: T + "objectionable-content/privacy-violations-personal-attributes/" },
  health: { name: "Health and wellness", url: T + "restricted-goods-services/health-wellness/" },
  commercial: { name: "Prohibited commercial practices", url: T + "deceptive-content/prohibited-commercial-practices/" },
  financial: { name: "Financial and insurance products and services", url: T + "restricted-goods-services/financial-services/" },
  crypto: { name: "Cryptocurrency products and services", url: T + "restricted-goods-services/cryptocurrency-products-and-services/" },
  gambling: { name: "Online gambling and games", url: T + "restricted-goods-services/gambling-games/" },
  dating: { name: "Dating ads", url: T + "restricted-goods-services/dating-ads/" },
  alcohol: { name: "Alcohol", url: T + "restricted-goods-services/alcohol/" },
  drugs: { name: "Drugs and pharmaceuticals", url: T + "restricted-goods-services/drugs-pharmaceuticals/" },
  addiction: { name: "Drug and alcohol addiction treatment", url: T + "restricted-goods-services/drug-alcohol-addiction-treatment/" },
  tobacco: { name: "Tobacco and related products", url: T + "restricted-goods-services/tobacco-related-products/" },
  weapons: { name: "Weapons, ammunition and explosives", url: T + "restricted-goods-services/weapons-ammunitions-explosives/" },
  documents: { name: "Prohibited documents and financial services", url: T + "restricted-goods-services/prohibited-documents-and-financial-services/" },
  adult: { name: "Adult nudity and sexual activity", url: T + "objectionable-content/adult-nudity-and-sexual-activity/" },
  solicitation: { name: "Adult sexual solicitation and sexually explicit language", url: T + "objectionable-content/adult-sexual-solicitation-and-sexually-explicit-language/" },
  profanity: { name: "Profanity", url: T + "objectionable-content/profanity/" },
  eating: { name: "Suicide, self-injury and eating disorders", url: T + "objectionable-content/suicide-selfinjury-eating-disorders/" },
  misinformation: { name: "Misinformation", url: T + "unacceptable-content/misinformation/" },
  crises: { name: "Commercial exploitation of crises and controversial events", url: T + "restricted-goods-services/commercial-exploitation-of-crises-and-controversial-events/" },
  ip: { name: "Third-party infringement", url: T + "intellectual-property-infringement/third-party-infringement/" },
  spam: { name: "Spam", url: T + "business-assets/spam/" },
  integrity: { name: "Account integrity", url: T + "business-assets/account-integrity/" },
  siep: { name: "Social issues, elections or politics", url: T + "SIEP-advertising/SIEP/" },
  sac: { name: "Special Ad Categories", url: "https://www.facebook.com/business/help/298000447747885" },
  standards: { name: "Meta Advertising Standards", url: T },
};

// Countries where Meta does not allow alcohol ads (Alcohol policy).
export const ALCOHOL_BANNED = ["Afghanistan", "Brunei", "Bangladesh", "Egypt", "Gambia", "Kuwait", "Libya", "Lithuania", "Nepal", "Norway", "Pakistan", "Russia", "Saudi Arabia", "Thailand", "Turkey", "United Arab Emirates", "Yemen"];
// Minimum alcohol ad ages that differ from 18 (Alcohol policy).
export const ALCOHOL_AGE = { "United States": 21, Canada: 19, Japan: 20, Korea: 19, "South Korea": 19, Iceland: 20, Sweden: 25, Cameroon: 21, Micronesia: 21, Nicaragua: 19, Palau: 21, Paraguay: 20, "Solomon Islands": 21, "Sri Lanka": 21 };
// Unsupported markets for online gambling ads (Online gambling and games policy).
export const GAMBLING_BANNED = ["Azerbaijan", "Bangladesh", "Cambodia", "Egypt", "Hong Kong", "India", "Indonesia", "Korea", "South Korea", "Kyrgyzstan", "Malaysia", "Mongolia", "Myanmar", "Pakistan", "Philippines", "Saudi Arabia", "Singapore", "Taiwan", "Thailand", "Vietnam"];
// Where certified advertisers may run these ads (Drugs and pharmaceuticals policy).
export const RX_COUNTRIES = ["United States", "Canada", "New Zealand"];
export const CBD_COUNTRIES = ["United States"];
export const HEMP_COUNTRIES = ["Canada", "Mexico", "United States"];

export const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Ireland", "New Zealand", "Portugal", "Spain", "France", "Germany",
  "Italy", "Netherlands", "Belgium", "Sweden", "Norway", "Denmark", "Finland", "Iceland", "Poland", "Lithuania", "Brazil", "Mexico",
  "Argentina", "Colombia", "Paraguay", "Nicaragua", "Nigeria", "Ghana", "Kenya", "South Africa", "Cameroon", "Egypt", "Morocco",
  "United Arab Emirates", "Saudi Arabia", "Kuwait", "Turkey", "Russia", "India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal",
  "Japan", "South Korea", "Singapore", "Malaysia", "Indonesia", "Philippines", "Thailand", "Vietnam", "Hong Kong", "Taiwan",
];

// Grey-area niches: allowed on Meta with conditions, or authorisation needed.
// status: "restricted" = allowed with conditions, "auth" = needs Meta permission
// or a licence, "prohibited" = can't be advertised (no rewrite offered).
// vocab feeds the rewrite templates in rewrite.js.
export const NICHES = {
  general: {
    name: "General product or service", short: "General", status: "open", icon: "spark", policies: ["standards"], minAge: 13,
    summary: "No special restrictions. The usual rules on claims, personal attributes and landing pages apply.",
    require: ["Claims in the ad match the landing page", "Landing page works, loads fast and shows who you are"],
    avoid: ["Assertions about the reader's traits", "Fake urgency or invented stock levels", "Engagement bait such as \"tag a friend\""],
    angles: ["Product first", "Offer-led", "Social proof"],
    vocab: { product: "our product", goal: "everyday life", outcome: "a better everyday experience", features: ["thoughtful design", "fast delivery", "friendly support"], proof: "customers", disclaimer: "" },
  },
  weight: {
    name: "Weight loss & fat burners", short: "Weight loss", status: "restricted", icon: "scale", policies: ["health"], minAge: 18,
    summary: "Allowed for 18+. No attacks on appearance, no fat-pinching close-ups, no results from wearables alone, and no set-time results without a qualifier.",
    require: ["Target 18 and over", "Add a qualifier to any timed result, e.g. \"Results vary\"", "Prescription weight-loss drugs follow the Drugs and pharmaceuticals policy"],
    avoid: ["\"Are you overweight?\" or any reference to the reader's body", "\"Lose 20 lbs in 2 weeks\" without qualifiers", "Fat-pinching or body-part close-ups", "Belts, wraps or patches that \"melt fat\" on their own"],
    angles: ["Routine & habits", "Ingredient-led", "Community & coaching"],
    vocab: { product: "weight management plan", goal: "healthy weight management", outcome: "steady, sustainable progress", features: ["dietitian-designed meal plans", "high-protein recipes", "weekly coach check-ins"], proof: "members", disclaimer: "Results vary and depend on diet and activity." },
  },
  supplements: {
    name: "Supplements & nutrition", short: "Supplements", status: "restricted", icon: "pill", policies: ["health", "drugs"], minAge: 18,
    summary: "Dietary and health supplements must target 18+. No claims to cure diseases, and unsafe ingredients (e.g. ephedra, DMAA, SARMs) are banned.",
    require: ["Target 18 and over for dietary or health supplements", "Support any benefit with evidence on the landing page", "General food and protein products have no age limit"],
    avoid: ["Cures for diabetes, cancer, thyroid, psoriasis and other listed illnesses", "\"Doctors hate this\" or miracle framing", "Unsafe or banned ingredients"],
    angles: ["Ingredient-led", "Daily ritual", "Transparency"],
    vocab: { product: "daily supplement", goal: "everyday wellness", outcome: "a simpler daily wellness routine", features: ["third-party tested ingredients", "clear dosing", "no artificial fillers"], proof: "customers", disclaimer: "This product is not intended to diagnose, treat, cure or prevent any disease." },
  },
  cosmetic: {
    name: "Cosmetic procedures & aesthetics", short: "Aesthetics", status: "restricted", icon: "sparkle", policies: ["health"], minAge: 18,
    summary: "Fillers, injectables, laser and surgery are allowed for 18+, including before-and-after images. Statements of inferiority are not.",
    require: ["Target 18 and over", "Show typical results and name the treatment", "Before-and-after images are allowed for general cosmetic procedures"],
    avoid: ["\"Hate your nose?\" or any negative comment on appearance", "Promises of a set result", "Genital procedures focused on sexual pleasure"],
    angles: ["Clinic expertise", "Consultation-first", "Patient stories"],
    vocab: { product: "treatment", goal: "a refreshed look", outcome: "natural-looking results", features: ["board-certified practitioners", "free consultations", "personalised treatment plans"], proof: "patients", disclaimer: "Individual results vary. A consultation is required." },
  },
  skincare: {
    name: "Skincare & beauty", short: "Skincare", status: "restricted", icon: "drop", policies: ["health", "personal"], minAge: 13,
    summary: "Creams, make-up and hair products have no age limit. Avoid implying the reader's skin, age or appearance is a problem, and never sell permanent skin whitening.",
    require: ["Describe what the product does, not what is wrong with the reader", "Permanent skin whitening or bleaching is not allowed"],
    avoid: ["\"Ready to upgrade your skin to look younger?\" (Meta's own example of a violation)", "\"Embarrassed by your acne?\"", "Cure claims for psoriasis or other listed conditions"],
    angles: ["Texture & ritual", "Ingredient-led", "Reviews"],
    vocab: { product: "skincare routine", goal: "healthy-looking skin", outcome: "skin that feels hydrated and smooth", features: ["barrier-supporting ceramides", "a fragrance-free base", "dermatologist testing"], proof: "customers", disclaimer: "" },
  },
  sexual: {
    name: "Sexual wellness & men's health", short: "Sexual health", status: "restricted", icon: "heart", policies: ["health", "adult"], minAge: 18,
    summary: "ED, menopause, contraception and fertility are allowed for 18+ when the focus is health, not pleasure or enhancement. Sex toys and erotic products are not allowed.",
    require: ["Target 18 and over", "Focus on health and medical efficacy", "Prescription treatments also need LegitScript and Meta authorisation"],
    avoid: ["\"Last longer in bed\" or performance framing", "Size or enhancement claims", "Sexually suggestive images or wording"],
    angles: ["Clinical & discreet", "Doctor-led", "Access & convenience"],
    vocab: { product: "men's health service", goal: "sexual health", outcome: "discreet, doctor-led care", features: ["licensed clinicians", "discreet packaging", "online consultations"], proof: "patients", disclaimer: "Treatment is subject to a consultation with a licensed clinician." },
  },
  telehealth: {
    name: "Telehealth & prescription drugs", short: "Telehealth / Rx", status: "auth", icon: "cross", policies: ["drugs"], minAge: 18,
    summary: "Prescription drug ads need LegitScript certification and Meta authorisation, can only target the US, Canada or New Zealand, and must target 18+.",
    require: ["LegitScript certification plus Meta authorisation", "Target only the US, Canada or New Zealand, and only where you're certified", "Target 18 and over", "Include a line to consult a licensed health professional"],
    avoid: ["\"No prescription needed\"", "Naming GLP-1 or other Rx drugs without authorisation", "Prices or offers that skip the consultation"],
    angles: ["Consultation-first", "Access & affordability", "Clinician-led"],
    vocab: { product: "online care", goal: "convenient, licensed care", outcome: "a clinician-reviewed treatment plan", features: ["licensed US clinicians", "online consultations", "transparent pricing"], proof: "patients", disclaimer: "Prescription only where appropriate after a consultation with a licensed provider." },
  },
  crypto: {
    name: "Crypto & Web3", short: "Crypto", status: "auth", icon: "coin", policies: ["crypto", "financial"], minAge: 18,
    summary: "Exchanges, trading, lending, staking wallets and mining software need Meta's written permission plus a recognised licence. ICOs are prohibited. Education, news, NFTs and hardware don't need permission.",
    require: ["Written permission from Meta (Authorisations and verifications in Business Suite)", "A recognised regulatory licence or registration for each country", "Target 18 and over"],
    avoid: ["Guaranteed or daily returns", "\"Get rich\" or financial-freedom framing", "Initial coin offerings (ICOs)", "Celebrity endorsements you don't have"],
    angles: ["Product & security", "Education", "Transparency & risk"],
    vocab: { product: "crypto app", goal: "managing digital assets", outcome: "a clearer view of digital assets", features: ["regulated custody", "transparent fees", "two-factor security"], proof: "users", disclaimer: "Crypto assets are volatile. Capital at risk." },
  },
  trading: {
    name: "Trading, investing & forex", short: "Investing", status: "auth", icon: "chart", policies: ["financial", "commercial"], minAge: 18,
    summary: "Investment products may need a licence where you target. Binary options and CFDs are prohibited, and guaranteed returns are a deceptive practice. In the US, investment ads can't push people to DMs.",
    require: ["Be licensed in each targeted country where required", "Include the risk disclosures the law requires", "US: no \"message us on WhatsApp/Telegram\" for investment offers"],
    avoid: ["Guaranteed, daily or fixed returns", "Binary options and CFD trading", "Screenshots of profits or lifestyle wealth"],
    angles: ["Tools & features", "Education", "Long-term framing"],
    vocab: { product: "investing platform", goal: "long-term investing", outcome: "a disciplined, long-term approach", features: ["diversified portfolios", "clear fee breakdowns", "regulated broker"], proof: "investors", disclaimer: "Capital at risk. Past performance is not a reliable indicator of future results." },
  },
  loans: {
    name: "Loans, credit & insurance", short: "Credit & loans", status: "auth", icon: "card", policies: ["financial", "sac"], minAge: 18,
    summary: "Credit cards, long-term loans (over 90 days) and insurance are allowed for 18+ with required disclosures. Payday loans, salary advances, bail bonds and loans of 90 days or less are prohibited. Declare the Financial products and services Special Ad Category.",
    require: ["Declare the \"Financial products and services\" Special Ad Category", "Target 18 and over", "Show the disclosures your law requires (APR, fees, terms)", "Be licensed where required"],
    avoid: ["Payday loans, salary advances and loans of 90 days or less", "\"Bad credit? No problem\" (implies a vulnerable financial status)", "Collecting card or bank details in the ad"],
    angles: ["Clarity & terms", "Tools & calculators", "Speed with substance"],
    vocab: { product: "personal loan", goal: "planning a big purchase", outcome: "clear terms before you commit", features: ["fixed monthly repayments", "no early repayment fees", "decision in minutes"], proof: "customers", disclaimer: "Representative APR applies. Subject to status and affordability checks." },
  },
  bizopp: {
    name: "Make money online, coaching & biz-opp", short: "Biz-opp", status: "restricted", icon: "rocket", policies: ["commercial"], minAge: 18,
    summary: "Courses and coaching are allowed, but income opportunities must describe the business model. \"Quick money for little effort\", income screenshots and guaranteed earnings are deceptive practices.",
    require: ["Say what is being sold: a course, software or coaching", "Describe the work involved", "Keep income examples off the ad and add a typical-results statement on the page"],
    avoid: ["\"Make $10k a month from your phone\"", "\"Quit your job\" or \"be your own boss\" promises", "Recruiting language for multi-level marketing"],
    angles: ["Skill-first", "Curriculum", "Mentor story"],
    vocab: { product: "online course", goal: "learning a practical new skill", outcome: "practical skills you can apply", features: ["step-by-step modules", "live Q&A sessions", "real project feedback"], proof: "students", disclaimer: "Results depend on effort and experience. No earnings are guaranteed." },
  },
  dating: {
    name: "Dating & matchmaking", short: "Dating", status: "auth", icon: "chat", policies: ["dating", "personal", "solicitation"], minAge: 18,
    summary: "Dating ads need Meta's prior written permission and must target 18+. No sexual emphasis, affairs, paid relationships or fake profiles.",
    require: ["Prior written permission from Meta", "Target 18 and over", "Describe groups (\"Christian singles\"), never the reader (\"Are you Christian?\")"],
    avoid: ["\"Hot singles in your area\"", "Affairs, \"discreet\" infidelity, sugar dating", "\"Meet other…\" phrasing that implies the reader's traits"],
    angles: ["Intent & values", "Safety & verification", "Community events"],
    vocab: { product: "dating app", goal: "meaningful connections", outcome: "dates with people who share your values", features: ["verified profiles", "thoughtful prompts", "safety tools built in"], proof: "members", disclaimer: "18+ only." },
  },
  gambling: {
    name: "Gambling, betting & sweepstakes", short: "Gambling", status: "auth", icon: "dice", policies: ["gambling"], minAge: 18,
    summary: "Online gambling needs Meta authorisation and a licence, must target 18+, and can't run in 19+ unsupported markets (e.g. India, Indonesia, Philippines, Singapore).",
    require: ["Meta authorisation for online gambling and games", "A licence for each targeted jurisdiction", "Target 18 and over", "Exclude unsupported markets"],
    avoid: ["\"Guaranteed wins\" or \"easy money\"", "Framing gambling as a way out of debt", "Targeting unsupported markets"],
    angles: ["Entertainment-first", "Responsible play", "Offer with terms"],
    vocab: { product: "sportsbook", goal: "match-day entertainment", outcome: "a more engaging match day", features: ["live odds", "cash-out options", "deposit limits"], proof: "players", disclaimer: "18+. Gamble responsibly. T&Cs apply." },
  },
  alcohol: {
    name: "Alcohol", short: "Alcohol", status: "restricted", icon: "glass", policies: ["alcohol"], minAge: 18,
    summary: "Allowed with age targeting by country (21+ US, 19+ Canada, 25+ Sweden). Banned in 17 countries including Norway, Lithuania, Turkey and the UAE.",
    require: ["Target the legal age for each country (minimum 18)", "Exclude countries where alcohol ads are banned"],
    avoid: ["Linking alcohol to success, driving or sport performance", "Encouraging heavy drinking", "Countries such as Norway, Lithuania, Russia, Turkey or the UAE"],
    angles: ["Craft & origin", "Occasion", "Pairing"],
    vocab: { product: "small-batch spirits", goal: "slow evenings with friends", outcome: "a drink worth savouring", features: ["small-batch distilling", "local botanicals", "tasting notes on every bottle"], proof: "drinkers", disclaimer: "Please enjoy responsibly." },
  },
  cbd: {
    name: "CBD & hemp", short: "CBD / hemp", status: "auth", icon: "leaf", policies: ["drugs"], minAge: 18,
    summary: "CBD ads need LegitScript certification and Meta authorisation, can only target the US and 18+, and can't make health claims. Hemp seed and fibre products are allowed in the US, Canada and Mexico. THC is prohibited.",
    require: ["LegitScript certification and Meta authorisation for CBD", "CBD: target only the United States, 18+", "Hemp (no CBD): only the US, Canada and Mexico"],
    avoid: ["Health or medical claims (\"relieves anxiety\", \"treats pain\")", "THC, delta-8 or psychoactive cannabis products", "Paraphernalia such as bongs or rolling papers"],
    angles: ["Sourcing & testing", "Ritual", "Transparency"],
    vocab: { product: "hemp-derived CBD", goal: "an evening wind-down routine", outcome: "a calm, consistent routine", features: ["US-grown hemp", "third-party lab reports", "under 0.3% THC"], proof: "customers", disclaimer: "Not intended to diagnose, treat, cure or prevent any disease." },
  },
  mental: {
    name: "Mental health & therapy apps", short: "Mental health", status: "restricted", icon: "mind", policies: ["personal", "health"], minAge: 13,
    summary: "Therapy and wellbeing services are allowed, but the ad can't assert or imply the reader has a condition. \"Depression counselling\" is fine; \"Depression getting you down?\" is not.",
    require: ["Name the service, not the reader's condition", "Licensed providers for therapy claims"],
    avoid: ["\"Struggling with anxiety?\"", "\"Your depression…\"", "Cure claims"],
    angles: ["Service-first", "Access & convenience", "Therapist-led"],
    vocab: { product: "online therapy", goal: "mental wellbeing", outcome: "support that fits around your week", features: ["licensed therapists", "video or chat sessions", "flexible scheduling"], proof: "clients", disclaimer: "If you're in crisis, contact local emergency services." },
  },
  vape: {
    name: "Vapes, tobacco & nicotine", short: "Vapes / nicotine", status: "prohibited", icon: "ban", policies: ["tobacco"], minAge: 18,
    summary: "Prohibited. Cigarettes, vapes (including nicotine-free and \"wellness\" vapes), nicotine pouches, hookahs and paraphernalia can't be advertised. Only WHO- or FDA-approved cessation products are allowed, for 18+.",
    require: ["Only WHO- or FDA-approved cessation products may be advertised, for 18+"],
    avoid: ["Any vape, e-cigarette or nicotine pouch", "Hookah lounges and cigar bars", "Rolling papers and tobacco accessories"],
    angles: [],
    vocab: { product: "", goal: "", outcome: "", features: [], proof: "", disclaimer: "" },
  },
};

export const STATUS = {
  open: { label: "Open", tone: "ok" },
  restricted: { label: "Restricted", tone: "warn" },
  auth: { label: "Authorisation needed", tone: "auth" },
  prohibited: { label: "Prohibited", tone: "block" },
};
