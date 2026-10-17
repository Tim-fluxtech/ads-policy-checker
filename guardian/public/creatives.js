// Flat product illustrations used as example ad creatives (1:1, 600×600).
// They are drawn here so the demo has real-looking images without stock photos.

const wrap = (bg, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs>${bg.defs || ""}</defs><rect width="600" height="600" fill="${bg.fill}"/>${body}</svg>`;
const grad = (id, a, b, angle = "0 0 1 1") => { const [x1, y1, x2, y2] = angle.split(" "); return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`; };
const shadow = (cx, cy, rx, ry = 18) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity=".12"/>`;

const SVG = {
  weight: wrap({ defs: grad("g", "#E3F7EC", "#BFE8D2"), fill: "url(#g)" }, `
    <circle cx="430" cy="150" r="120" fill="#fff" opacity=".45"/>
    <path d="M90 470c40-90 120-120 170-110-30 50-80 110-170 110Z" fill="#5FBF8A"/><path d="M110 455c40-40 90-70 140-85" stroke="#3E9E6B" stroke-width="5" fill="none"/>
    <path d="M520 430c-30-80-100-110-150-105 25 45 70 100 150 105Z" fill="#7ACF9F"/>
    ${shadow(300, 500, 120)}
    <rect x="215" y="120" width="170" height="60" rx="14" fill="#1F6B47"/>
    <rect x="195" y="170" width="210" height="330" rx="44" fill="#fff"/>
    <rect x="195" y="245" width="210" height="160" fill="#2E8B5E"/>
    <text x="300" y="315" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="40" fill="#fff" letter-spacing="4">LUMO</text>
    <text x="300" y="355" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#D7F2E3" letter-spacing="3">DAILY GREENS</text>
    <rect x="230" y="195" width="18" height="40" rx="9" fill="#fff" opacity=".7"/>
    <rect x="410" y="455" width="56" height="26" rx="13" fill="#F4C84A"/><rect x="438" y="455" width="28" height="26" rx="13" fill="#E8A93A"/>
    <rect x="130" y="470" width="56" height="26" rx="13" fill="#F4C84A" transform="rotate(-20 158 483)"/>`),

  crypto: wrap({ defs: grad("g", "#E6EBFF", "#C7D2FF"), fill: "url(#g)" }, `
    <circle cx="140" cy="140" r="90" fill="#fff" opacity=".5"/>
    ${shadow(300, 540, 140)}
    <rect x="180" y="70" width="240" height="460" rx="40" fill="#1E2340"/>
    <rect x="196" y="100" width="208" height="410" rx="26" fill="#fff"/>
    <text x="216" y="146" font-family="Arial, sans-serif" font-size="18" fill="#6B7194">Portfolio</text>
    <text x="216" y="182" font-family="Arial, sans-serif" font-weight="700" font-size="30" fill="#1E2340">€12,480</text>
    <polyline points="216,330 246,300 270,312 300,262 328,276 356,230 384,244" fill="none" stroke="#3F5BFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M216 330 246 300 270 312 300 262 328 276 356 230 384 244V380H216Z" fill="#3F5BFF" opacity=".12"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${220 + i * 34}" y="${410 - (i % 3) * 18 - i * 6}" width="20" height="${50 + (i % 3) * 18 + i * 6}" rx="5" fill="${i % 2 ? "#FF8A65" : "#4ADE80"}"/>`).join("")}
    <circle cx="455" cy="420" r="70" fill="#F7B731"/><circle cx="455" cy="420" r="54" fill="#FBD34D"/>
    <text x="455" y="443" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="62" fill="#B7791F">₿</text>`),

  skincare: wrap({ defs: grad("g", "#FFF0E8", "#FFD9C7") + grad("glass", "#E9A55B", "#C77A2E", "0 0 0 1"), fill: "url(#g)" }, `
    <circle cx="460" cy="160" r="110" fill="#fff" opacity=".5"/>
    <path d="M110 520c0-70 60-120 190-120s190 50 190 120Z" fill="#FFC9B0" opacity=".7"/>
    ${shadow(300, 505, 105)}
    <rect x="262" y="110" width="76" height="70" rx="16" fill="#2B2B2B"/>
    <rect x="285" y="70" width="30" height="50" rx="15" fill="#2B2B2B"/>
    <rect x="215" y="175" width="170" height="330" rx="34" fill="url(#glass)"/>
    <rect x="235" y="260" width="130" height="150" rx="10" fill="#FFF7F1"/>
    <text x="300" y="320" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#7A4A26">Kindred</text>
    <text x="300" y="356" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#A7714A" letter-spacing="3">HYDRATING</text>
    <text x="300" y="378" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#A7714A" letter-spacing="3">SERUM</text>
    <rect x="232" y="195" width="16" height="250" rx="8" fill="#fff" opacity=".35"/>
    <path d="M470 330c22 30 34 52 34 70a34 34 0 0 1-68 0c0-18 12-40 34-70Z" fill="#FFB38E"/>`),

  bizopp: wrap({ defs: grad("g", "#F1EDFF", "#DCD3FF"), fill: "url(#g)" }, `
    <circle cx="470" cy="130" r="90" fill="#FFE27A" opacity=".8"/>
    ${shadow(300, 470, 230, 22)}
    <rect x="120" y="140" width="360" height="240" rx="18" fill="#2A2350"/>
    <rect x="136" y="156" width="328" height="208" rx="8" fill="#fff"/>
    <rect x="80" y="380" width="440" height="34" rx="12" fill="#3B3270"/>
    <rect x="260" y="380" width="80" height="12" rx="6" fill="#2A2350"/>
    <rect x="156" y="178" width="140" height="14" rx="7" fill="#DCD3FF"/><rect x="156" y="202" width="96" height="10" rx="5" fill="#EEE9FF"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${330 + i * 30}" y="${330 - (i + 1) * 30}" width="20" height="${(i + 1) * 30}" rx="5" fill="#7C5CFF" opacity="${0.45 + i * 0.18}"/>`).join("")}
    <circle cx="215" cy="290" r="42" fill="#7C5CFF"/><path d="M205 270v40l32-20Z" fill="#fff"/>
    <rect x="70" y="440" width="100" height="70" rx="10" fill="#FF8A65" transform="rotate(-8 120 475)"/><rect x="82" y="456" width="60" height="8" rx="4" fill="#fff" opacity=".8" transform="rotate(-8 120 475)"/>`),

  dating: wrap({ defs: grad("g", "#FFE8EF", "#FFC8D8"), fill: "url(#g)" }, `
    <circle cx="140" cy="150" r="90" fill="#fff" opacity=".55"/>
    <rect x="90" y="170" width="300" height="150" rx="40" fill="#fff"/><path d="M140 310 120 360l70-40Z" fill="#fff"/>
    <rect x="120" y="210" width="190" height="16" rx="8" fill="#FFD1DE"/><rect x="120" y="242" width="140" height="16" rx="8" fill="#FFE3EB"/>
    <rect x="230" y="300" width="290" height="140" rx="40" fill="#FF5C8A"/><path d="M470 430 500 480l-70-40Z" fill="#FF5C8A"/>
    <path d="M375 395c-6-6-40-28-40-52a20 20 0 0 1 40-6 20 20 0 0 1 40 6c0 24-34 46-40 52Z" fill="#fff"/>
    <circle cx="460" cy="200" r="34" fill="#FFB0C6"/><circle cx="500" cy="250" r="16" fill="#FF8FB0"/>`),

  loans: wrap({ defs: grad("g", "#E8F1FB", "#CFE1F5") + grad("card", "#2563EB", "#1E3A8A"), fill: "url(#g)" }, `
    <circle cx="470" cy="150" r="100" fill="#fff" opacity=".5"/>
    ${shadow(290, 470, 200)}
    <rect x="110" y="190" width="340" height="215" rx="22" fill="url(#card)" transform="rotate(-8 280 297)"/>
    <rect x="150" y="240" width="56" height="42" rx="8" fill="#FBD34D" transform="rotate(-8 280 297)"/>
    <rect x="150" y="320" width="220" height="14" rx="7" fill="#fff" opacity=".6" transform="rotate(-8 280 297)"/>
    ${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="450" cy="${470 - i * 22}" rx="62" ry="18" fill="${i % 2 ? "#F7B731" : "#FBD34D"}"/>`).join("")}
    <ellipse cx="450" cy="382" rx="62" ry="18" fill="#FDE68A"/>`),

  clean: wrap({ defs: grad("g", "#F6EEE4", "#E8D7C3"), fill: "url(#g)" }, `
    <circle cx="140" cy="140" r="90" fill="#fff" opacity=".5"/>
    ${shadow(250, 500, 120)}
    <path d="M160 160h180l20 340H140Z" fill="#3B2A20"/>
    <path d="M160 160h180l-10-40H170Z" fill="#2A1D16"/>
    <rect x="175" y="250" width="150" height="150" rx="75" fill="#F3E3CF"/>
    <text x="250" y="320" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="34" fill="#3B2A20">TORRA</text>
    <text x="250" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#8A6A52" letter-spacing="3">LISBON</text>
    ${shadow(450, 505, 80, 14)}
    <path d="M385 380h130l-14 120h-102Z" fill="#fff"/><path d="M515 400h18a28 28 0 0 1 0 56h-24" fill="none" stroke="#fff" stroke-width="14"/>
    <path d="M425 350c-12-20 12-30 0-50M455 350c-12-20 12-30 0-50M485 350c-12-20 12-30 0-50" fill="none" stroke="#B89C84" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="450" cy="383" rx="62" ry="10" fill="#6B4A35"/>`),

  placeholder: wrap({ defs: grad("g", "#EEF1F5", "#DDE3EA"), fill: "url(#g)" }, `
    <rect x="200" y="210" width="200" height="160" rx="18" fill="none" stroke="#AEB6C1" stroke-width="10"/>
    <circle cx="255" cy="260" r="18" fill="#AEB6C1"/><path d="m210 360 60-60 40 40 30-30 50 50" fill="none" stroke="#AEB6C1" stroke-width="10" stroke-linejoin="round"/>`),
};

export const creative = (key) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SVG[key] || SVG.placeholder);
