const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    console.error('Playwright is not installed. Run: npm install');
    process.exit(1);
  }

  const url = process.env.METRICS_URL || 'http://127.0.0.1:4200/metrics';
  const outFile = process.env.SCREENSHOT_OUT || path.resolve(process.cwd(), 'metrics-shot.png');

  const browser = await chromium.launch({
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 1,
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outFile, fullPage: true });
  await browser.close();

  const stats = await fs.stat(outFile);
  console.log(`Saved screenshot to ${outFile} (${stats.size} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
