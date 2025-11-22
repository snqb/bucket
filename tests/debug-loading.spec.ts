import { test, expect } from '@playwright/test';

test('Debug loading issue', async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    consoleLogs.push(`[ERROR] ${error.message}`);
  });

  console.log('Navigating to http://localhost:5558');
  await page.goto('http://localhost:5558');

  // Wait and check state multiple times
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(2500);
    const loadingVisible = await page.locator('text=Loading...').isVisible();
    const welcomeVisible = await page.locator('text=Welcome').isVisible();
    console.log(`[${i * 2.5}s] Loading: ${loadingVisible}, Welcome: ${welcomeVisible}`);

    if (welcomeVisible) {
      console.log('Welcome screen appeared!');
      break;
    }
  }

  // Take screenshot of current state
  await page.screenshot({ path: 'test-results/debug-loading-state.png', fullPage: true });

  // Get page HTML to see what's rendered
  const bodyText = await page.locator('body').textContent();
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('\n=== PAGE CONTENT (text) ===');
  console.log(bodyText);
  console.log('\n=== PAGE HTML ===');
  console.log(bodyHTML.substring(0, 1000));

  // Check localStorage
  const localStorage = await page.evaluate(() => {
    return JSON.stringify(window.localStorage, null, 2);
  });
  console.log('\n=== LOCAL STORAGE ===');
  console.log(localStorage);

  // Print all console logs
  console.log('\n=== BROWSER CONSOLE LOGS ===');
  consoleLogs.forEach(log => console.log(log));

  // Check if loading screen is still visible
  const loadingVisible = await page.locator('text=Loading...').isVisible();
  console.log(`\n=== LOADING SCREEN VISIBLE: ${loadingVisible} ===`);

  // Check if welcome screen appeared
  const welcomeVisible = await page.locator('text=Welcome').isVisible();
  console.log(`=== WELCOME SCREEN VISIBLE: ${welcomeVisible} ===`);
});
