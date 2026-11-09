// Gera o fundo panorâmico (7 slides x 1080 = 7560 x 1350): um mapa noturno com a rota do “desvio”.
// Saída: map.png (usado como imagem de fundo em slides-v2.html).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const W = 7560, H = 1350;
let seed = 20181204;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const r = (a, b) => a + rnd() * (b - a);

// curva suave (Catmull-Rom -> Bézier) passando pelos pontos
function smooth(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const parts = [];
// fundo
parts.push(`<rect width="${W}" height="${H}" fill="#18100B"/>`);

// parques
for (let i = 0; i < 16; i++) {
  const x = r(0, W), y = r(0, H), w = r(160, 420), h = r(120, 300);
  parts.push(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" rx="${r(20, 60).toFixed(0)}" fill="#1D2116"/>`);
}

// rio
{
  const top = [], bot = [];
  for (let x = -100; x <= W + 100; x += 120) {
    const y = 470 + 150 * Math.sin(x / 950) + 55 * Math.sin(x / 330);
    top.push([x, y - 46]); bot.push([x, y + 46]);
  }
  parts.push(`<path d="${smooth(top)} L${W + 100},${H + 50} L-100,${H + 50} Z" fill="none"/>`);
  parts.push(`<path d="${smooth(top)}" stroke="#121A1F" stroke-width="96" fill="none" stroke-linecap="round"/>`);
}

// ruas menores: bairros com inclinações diferentes
const minor = [];
for (let bx = -200; bx < W + 200; bx += 1500) {
  const slant = r(-0.28, 0.28);
  for (let x = bx; x < bx + 1500; x += r(78, 118)) {
    minor.push(`M${x.toFixed(0)},-20 L${(x + slant * (H + 40)).toFixed(0)},${H + 20}`);
  }
}
for (let y = -40; y < H + 40; y += r(84, 126)) {
  const pts = [];
  const amp = r(6, 26), ph = r(0, 6);
  for (let x = -100; x <= W + 100; x += 300) pts.push([x, y + amp * Math.sin(x / 520 + ph)]);
  minor.push(smooth(pts));
}
parts.push(`<path d="${minor.join(" ")}" stroke="#2B1F16" stroke-width="7" fill="none"/>`);

// avenidas
const names = ["AV. DO DESVIO", "RUA DO RIVAL", "ALAMEDA WHOPPER", "TRAVESSA DO CENTAVO", "AV. DA RECOMPRA", "RUA DA ATENÇÃO"];
const aves = [];
for (let k = 0; k < 6; k++) {
  const pts = [];
  const base = r(80, H - 80);
  for (let x = -200; x <= W + 200; x += 700) pts.push([x, Math.max(30, Math.min(H - 30, base + r(-260, 260)))]);
  aves.push(smooth(pts));
}
aves.forEach((d, k) => {
  parts.push(`<path id="av${k}" d="${d}" stroke="#46331F" stroke-width="18" fill="none" stroke-linecap="round"/>`);
  parts.push(`<path d="${d}" stroke="#563F2B" stroke-width="3" fill="none"/>`);
});
// rótulos das avenidas (piadas internas do mapa)
aves.forEach((d, k) => {
  for (let rep = 0; rep < 4; rep++) {
    parts.push(`<text font-family="Inter" font-weight="700" font-size="20" letter-spacing="4" fill="#6E5545" dy="-16"><textPath href="#av${k}" startOffset="${(8 + rep * 24 + k * 3) % 100}%">${names[k]}</textPath></text>`);
  }
});

// rota do desvio (contínua entre os slides)
const solid = [
  [705, 1150], [900, 1182], [1080, 1190], [1500, 1172], [1900, 1160], [2300, 1132], [2700, 1122], [3000, 1110],
  [3300, 1150], [3700, 1182], [4000, 1160], [4140, 1140], [4400, 1192], [4900, 1214], [5400, 1210], [5650, 1214],
];
const dashed = [[5650, 1214], [6100, 1216], [6600, 1210], [7000, 1214], [7330, 1192], [7430, 1080], [7420, 960]];
parts.push(`<path d="${smooth(solid)}" stroke="#FF8732" stroke-opacity="0.22" stroke-width="44" fill="none" stroke-linecap="round" filter="url(#glow)"/>`);
parts.push(`<path d="${smooth(solid)}" stroke="#FF8732" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
parts.push(`<path d="${smooth(dashed)}" stroke="#FF8732" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="2 26" opacity="0.95"/>`);

// cerca de 180 m ao redor do McDonald’s (slide 1) e você está aqui
parts.push(`<circle cx="800" cy="1085" r="160" fill="#FFC72C" fill-opacity="0.07" stroke="#FFC72C" stroke-width="4" stroke-dasharray="16 14"/>`);
parts.push(`<text x="800" y="910" text-anchor="middle" font-family="Inter" font-weight="800" font-size="24" letter-spacing="3" fill="#FFC72C">RAIO DE 180 M</text>`);
const pin = (x, y, fill, label, sub, above = false) => {
  const bw = Math.max(label.length * 17, sub ? sub.length * 11 : 0) + 40, bh = sub ? 78 : 50;
  parts.push(`<g transform="translate(${x},${y})">
    <ellipse cx="0" cy="6" rx="22" ry="7" fill="#000" opacity="0.45"/>
    <path d="M0,0 C-10,-20 -38,-40 -38,-70 C-38,-92 -21,-108 0,-108 C21,-108 38,-92 38,-70 C38,-40 10,-20 0,0 Z" fill="${fill}" stroke="#18100B" stroke-width="5"/>
    <circle cx="0" cy="-70" r="14" fill="#18100B"/>
    <g transform="translate(${above ? -bw / 2 : 52},${above ? -124 - bh : -104})">
      <rect width="${bw}" height="${bh}" rx="14" fill="#0E0906" fill-opacity="0.92" stroke="${fill}" stroke-width="2"/>
      <text x="20" y="34" font-family="Inter" font-weight="800" font-size="26" fill="${fill}">${label}</text>
      ${sub ? `<text x="20" y="64" font-family="Inter" font-weight="600" font-size="20" fill="#C9A892">${sub}</text>` : ""}
    </g>
  </g>`);
};
pin(800, 1085, "#FFC72C", "McDonald’s", "ponto de partida");
parts.push(`<circle cx="705" cy="1150" r="34" fill="#4AA3FF" fill-opacity="0.22"/><circle cx="705" cy="1150" r="15" fill="#4AA3FF" stroke="#F5EBDC" stroke-width="5"/>`);

// marcador do problema (slide 2) e da oferta (slide 3)
parts.push(`<g transform="translate(1900,1160)"><circle r="30" fill="#18100B" stroke="#FF8732" stroke-width="5"/><text y="12" text-anchor="middle" font-family="Anton" font-size="34" fill="#FF8732">?</text></g>`);
parts.push(`<g transform="translate(3000,1110)"><circle r="40" fill="#E9B44C" stroke="#18100B" stroke-width="5"/><circle r="30" fill="none" stroke="#9C6B1E" stroke-width="3"/><text y="13" text-anchor="middle" font-family="Anton" font-size="34" fill="#4A2C0A">1¢</text></g>`);

// Burger King (fim do slide 4)
pin(4140, 1140, "#FF8732", "Burger King", "retirada do Whopper", true);

// chegada (slide 7)
parts.push(`<g transform="translate(7420,960)">
  <circle r="46" fill="#FF8732" fill-opacity="0.18"/>
  <line x1="-6" y1="10" x2="-6" y2="-96" stroke="#F5EBDC" stroke-width="7" stroke-linecap="round"/>
  <g transform="translate(-3,-96)">
    ${[0, 1, 2, 3].map((c) => [0, 1].map((rw) => `<rect x="${c * 16}" y="${rw * 16}" width="16" height="16" fill="${(c + rw) % 2 ? "#18100B" : "#F5EBDC"}"/>`).join("")).join("")}
  </g>
</g>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><filter id="glow" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>
${parts.join("\n")}
</svg>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Anton"; src: url(node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2); }
@font-face { font-family: "Inter"; font-weight: 600; src: url(node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2); }
@font-face { font-family: "Inter"; font-weight: 700; src: url(node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2); }
@font-face { font-family: "Inter"; font-weight: 800; src: url(node_modules/@fontsource/inter/files/inter-latin-800-normal.woff2); }
body { margin: 0; } svg { display: block; }
</style></head><body>${svg}</body></html>`;

(async () => {
  const file = path.join(__dirname, "map.html");
  fs.writeFileSync(file, html);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto("file://" + file);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(__dirname, "map.png"), clip: { x: 0, y: 0, width: W, height: H } });
  await browser.close();
  fs.unlinkSync(file);
  console.log("ok map.png");
})();
