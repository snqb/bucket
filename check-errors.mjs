import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Collect console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Collect network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      consoleLogs.push({
        type: 'network-error',
        status: response.status(),
        url: response.url()
      });
    }
  });

  console.log('Loading page and checking for errors...\n');
  await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  console.log('Console messages and errors:');
  consoleLogs.forEach(log => {
    console.log(`[${log.type}] ${log.text || `${log.status} ${log.url}`}`);
  });

  if (consoleLogs.length === 0) {
    console.log('No errors in console');
  }

  // Check if still loading
  const loadingText = await page.innerText('body').catch(() => '');
  console.log('\nPage content:', loadingText.substring(0, 100));

  await browser.close();
})();
