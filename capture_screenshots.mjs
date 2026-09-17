import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\Yashvardhan\\.gemini\\antigravity\\brain\\693c286f-cdc1-4b3a-b5bf-0dc4f557cfdd\\screenshots';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Desktop Viewport
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Taking Desktop: Finder...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_1_finder.png') });

  // Click Timeline / Matrix tab
  console.log('Taking Desktop: Timeline...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((el) => el.textContent.includes('Schedule Matrix'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_2_timeline.png') });

  // Click Weekly Grid tab
  console.log('Taking Desktop: Weekly...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((el) => el.textContent.includes('Weekly Grid'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_3_weekly.png') });

  // Click Classes tab
  console.log('Taking Desktop: Classes...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((el) => el.textContent.includes('Classes'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_4_classes.png') });

  // Click Data tab
  console.log('Taking Desktop: Data...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((el) => el.textContent.includes('Data Center'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_5_datacenter.png') });

  // Open AI Copilot
  console.log('Capturing Desktop: 6. AI Copilot...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((el) => el.textContent.includes('AI Copilot'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Click first preset prompt chip in AI modal
  await page.evaluate(() => {
    const chip = document.querySelector('button.text-\\[11px\\].font-bold');
    if (chip) chip.click();
  });
  // Wait for Gemini AI response
  await new Promise((r) => setTimeout(r, 4500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_6_ai_modal.png') });

  // Close AI modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button > svg.lucide-x')?.parentElement;
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // 2. Mobile Viewport (iPhone 14 / Pixel 7: 390 x 844)
  console.log('\n--- Mobile Captures (390 x 844) ---');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));

  console.log('Capturing Mobile: 1. Finder...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_1_finder.png') });

  console.log('Capturing Mobile: 2. Matrix...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((el) => el.textContent.includes('Matrix'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_2_matrix.png') });

  console.log('Capturing Mobile: 3. Weekly Routine...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((el) => el.textContent.includes('Weekly'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_3_weekly.png') });

  console.log('Capturing Mobile: 4. Classes Cards...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((el) => el.textContent.includes('Classes'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_4_classes.png') });

  console.log('Capturing Mobile: 5. AI Copilot Modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((el) => el.textContent.includes('AI Copilot'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_5_ai_modal.png') });

  await browser.close();
  console.log('All screenshots successfully refreshed in:', ARTIFACTS_DIR);
}

capture().catch((e) => {
  console.error('Capture error:', e);
  process.exit(1);
});
