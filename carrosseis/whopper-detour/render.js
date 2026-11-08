// Renderiza cada <section class="slide"> de slides.html em PNG 1080 x 1350 (out/01.png ... 07.png).
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const out = path.join(__dirname, "out");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(__dirname, "slides.html"));
  await page.evaluate(() => document.fonts.ready);
  const slides = await page.$$("section.slide");
  for (let i = 0; i < slides.length; i++) {
    const file = path.join(out, `${String(i + 1).padStart(2, "0")}.png`);
    await slides[i].screenshot({ path: file });
    console.log("ok", file);
  }
  await browser.close();
})();
