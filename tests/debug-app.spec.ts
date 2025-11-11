import { test, expect } from '@playwright/test';

test('Debug app loading and capture console', async ({ page }) => {
  // Capture console messages
  const consoleMessages: Array<{ type: string; text: string }> = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Capture network errors
  const failedRequests: string[] = [];
  page.on('requestfailed', request => {
    failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Navigate and wait
  console.log('🌐 Navigating to http://localhost:5174...');
  await page.goto('http://localhost:5174');

  // Wait longer for initial load
  console.log('⏳ Waiting for app to load (10 seconds)...');
  await page.waitForTimeout(10000);

  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-screenshot.png', fullPage: true });

  // Get page HTML
  const html = await page.content();
  console.log('\n📄 Page HTML length:', html.length);

  // Check for loading state
  const loadingText = await page.locator('text=Loading').count();
  console.log('🔄 "Loading" text found:', loadingText > 0);

  // Get network state
  console.log('\n🌐 Network State:', await page.evaluate(() => navigator.onLine));

  // Print console messages
  console.log('\n📋 Console Messages:');
  consoleMessages.forEach(msg => {
    console.log(`  [${msg.type}] ${msg.text}`);
  });

  // Print failed requests
  console.log('\n❌ Failed Requests:');
  if (failedRequests.length === 0) {
    console.log('  None');
  } else {
    failedRequests.forEach(req => console.log(`  ${req}`));
  }

  // Check localStorage
  const localStorage = await page.evaluate(() => {
    const items: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) items[key] = window.localStorage.getItem(key) || '';
    }
    return items;
  });

  console.log('\n💾 LocalStorage:');
  console.log(JSON.stringify(localStorage, null, 2));

  // Get all visible text on page
  const bodyText = await page.locator('body').innerText();
  console.log('\n📝 Visible text on page:');
  console.log(bodyText);

  // Check if React hydrated
  const hasReactRoot = await page.evaluate(() => {
    return !!document.querySelector('[data-reactroot], #root > *');
  });
  console.log('\n⚛️  React appears to be mounted:', hasReactRoot);

  // Check for error boundaries
  const errorText = await page.locator('text=/error|failed|crash/i').count();
  console.log('🚨 Error messages found:', errorText);

  // Wait for network to be idle
  console.log('\n⏳ Waiting for network idle...');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    console.log('⚠️  Network did not reach idle state');
  });

  await page.screenshot({ path: 'test-results/debug-after-network-idle.png', fullPage: true });
});
