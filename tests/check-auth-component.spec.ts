import { test, expect } from '@playwright/test';

test('Debug - Check what auth component is rendering', async ({ page }) => {
  console.log('📱 Step 1: Navigate to app...');
  await page.goto('http://localhost:5558');
  await page.waitForTimeout(3000);

  // Logout to get to auth screen
  console.log('🔓 Step 2: Logging out...');
  const logoutBtn = page.locator('button[title="Logout"]');
  await logoutBtn.click();
  await page.waitForTimeout(3000);

  // Check all buttons on the page
  console.log('🔍 Step 3: Analyzing auth screen buttons...');
  const allButtons = await page.locator('button').all();
  console.log(`Found ${allButtons.length} buttons on auth screen:`);

  for (let i = 0; i < allButtons.length; i++) {
    const button = allButtons[i];
    const text = await button.textContent();
    const title = await button.getAttribute('title');
    const className = await button.getAttribute('class');
    console.log(`  Button ${i + 1}:`);
    console.log(`    Text: "${text}"`);
    console.log(`    Title: "${title}"`);
    console.log(`    Classes: ${className}`);
    console.log('');
  }

  // Check for Upload icon anywhere on page
  console.log('🔍 Step 4: Looking for Upload icons...');
  const uploadIcons = await page.locator('svg').all();
  console.log(`Found ${uploadIcons.length} SVG icons`);

  // Check for the word "Import" anywhere on page (case insensitive)
  console.log('🔍 Step 5: Searching for "Import" text on page...');
  const pageContent = await page.content();
  if (pageContent.toLowerCase().includes('import')) {
    console.log('✅ Found "Import" text in page content');
  } else {
    console.log('❌ No "Import" text found in page content');
  }

  // Check if dialog import component exists in DOM but is hidden
  console.log('🔍 Step 6: Checking for hidden import dialog...');
  const importDialog = page.locator('text=Import Wallet');
  const dialogExists = await importDialog.count();
  console.log(`Import dialog elements found: ${dialogExists}`);

  // Screenshot for manual inspection
  console.log('📸 Step 7: Taking detailed screenshots...');
  await page.screenshot({ path: '/tmp/auth_screen_detailed.png', fullPage: true });
  console.log('📸 Full page screenshot saved to /tmp/auth_screen_detailed.png');

  // Check for any console errors
  console.log('🔍 Step 8: Checking browser console...');
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`Console error: ${msg.text()}`);
    }
  });

  // Check if React can render our import component by trying to trigger it manually
  console.log('🎯 Step 9: Testing direct navigation...');
  await page.goto('http://localhost:5558');
  await page.reload();
  await page.waitForTimeout(5000);
});