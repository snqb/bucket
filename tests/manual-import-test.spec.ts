import { test, expect } from '@playwright/test';

test.use({ storageState: {} }); // Use fresh browser context

test('Manual test - check auth screen elements', async ({ page }) => {
  console.log('📱 Step 1: Fresh session with cleared storage...');
  await page.goto('http://localhost:5558');

  // Clear storage completely
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.reload();
  await page.waitForTimeout(5000);

  // Take screenshot to see what we're getting
  await page.screenshot({ path: '/tmp/auth_screen_debug.png' });
  console.log('📸 Screenshot saved to /tmp/auth_screen_debug.png');

  // Check all buttons that should be on auth screen
  console.log('🔍 Step 2: Checking for expected auth screen elements...');

  const pasteBtn = page.locator('button:has-text("Paste")');
  const createNewBtn = page.locator('button:has-text("Create New")');
  const importBtn = page.locator('button:has-text("Import")');

  if (await pasteBtn.isVisible()) {
    console.log('✅ Paste button found');
  } else {
    console.log('❌ Paste button NOT found');
  }

  if (await createNewBtn.isVisible()) {
    console.log('✅ Create New button found');
  } else {
    console.log('❌ Create New button NOT found');
  }

  if (await importBtn.isVisible()) {
    console.log('✅ Import button found');
  } else {
    console.log('❌ Import button NOT found');
  }

  // Check for passphrase textarea
  const passphraseTextarea = page.locator('textarea[placeholder*="passphrase"]');
  if (await passphraseTextarea.isVisible()) {
    console.log('✅ Passphrase textarea found');
  } else {
    console.log('❌ Passphrase textarea NOT found');
  }

  // Check for auth title
  const authTitle = page.locator('text=Enter Your Space');
  if (await authTitle.isVisible()) {
    console.log('✅ Auth screen title found');
  } else {
    console.log('❌ Auth screen title NOT found - might be on different screen');
  }

  // List all buttons found on page
  console.log('🔍 Step 3: Listing all buttons on page...');
  const allButtons = await page.locator('button').all();
  console.log(`Found ${allButtons.length} buttons:`);

  for (let i = 0; i < allButtons.length; i++) {
    const button = allButtons[i];
    const text = await button.textContent();
    const title = await button.getAttribute('title');
    console.log(`  Button ${i + 1}: "${text}" (title: "${title}")`);
  }

  // Check if we're on the right page by checking URL
  console.log(`Current URL: ${page.url()}`);
});