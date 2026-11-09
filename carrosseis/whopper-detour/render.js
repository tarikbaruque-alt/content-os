// Renderiza cada <section class="slide"> em PNG 1080 x 1350.
// Uso: node render.js [arquivo.html] [pasta-de-saida]   (padrão: slides.html -> out)
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const src = process.argv[2] || "slides.html";
  const out = path.join(__dirname, process.argv[3] || "out");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(__dirname, src));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  const slides = await page.$$("section.slide");
  for (let i = 0; i < slides.length; i++) {
    const file = path.join(out, `${String(i + 1).padStart(2, "0")}.png`);
    await slides[i].screenshot({ path: file });
    console.log("ok", file);
  }
  await browser.close();
})();
