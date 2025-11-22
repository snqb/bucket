import { test, expect } from '@playwright/test';

test.use({ storageState: {} }); // Fresh browser context

test('Test auth screen with import button', async ({ page }) => {
  console.log('📱 Step 1: Fresh session to auth screen...');
  // Use fresh context to get to auth screen
  await page.goto('http://localhost:5558');
  await page.waitForTimeout(5000);

  // Take screenshot to see what we get
  await page.screenshot({ path: '/tmp/fresh_auth_screen.png' });
  console.log('📸 Screenshot saved to /tmp/fresh_auth_screen.png');

  // Check for auth screen elements
  console.log('🔍 Step 2: Looking for auth elements...');

  const authTitle = page.locator('text=Enter Your Space');
  if (await authTitle.isVisible()) {
    console.log('✅ Found auth screen title');
  } else {
    console.log('❌ No auth screen title found');
  }

  // Check for all three buttons
  const pasteBtn = page.locator('button:has-text("Paste")');
  const importBtn = page.locator('button:has-text("Import")');
  const createNewBtn = page.locator('button:has-text("Create New")');

  const pasteVisible = await pasteBtn.isVisible();
  const importVisible = await importBtn.isVisible();
  const createNewVisible = await createNewBtn.isVisible();

  console.log(`Paste button visible: ${pasteVisible}`);
  console.log(`Import button visible: ${importVisible}`);
  console.log(`Create New button visible: ${createNewVisible}`);

  // List all buttons found
  const allButtons = await page.locator('button').all();
  console.log(`Found ${allButtons.length} buttons total:`);

  for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
    const button = allButtons[i];
    const text = await button.textContent();
    const title = await button.getAttribute('title');
    const isVisible = await button.isVisible();
    console.log(`  Button ${i + 1}: "${text}" (title: "${title}", visible: ${isVisible})`);
  }

  if (importVisible) {
    console.log('🎯 Step 3: Testing import functionality...');
    await importBtn.click();
    await page.waitForTimeout(500);

    // Check for import dialog
    const dialogTitle = page.locator('text=Import Wallet');
    if (await dialogTitle.isVisible()) {
      console.log('✅ Import dialog opened!');

      const textarea = page.locator('textarea[placeholder*="12-word"]');
      if (await textarea.isVisible()) {
        console.log('✅ Passphrase textarea found');

        // Test with a valid passphrase
        const validPassphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
        await textarea.fill(validPassphrase);

        const importSubmitBtn = page.locator('button:has-text("Import Wallet")');
        if (await importSubmitBtn.isVisible()) {
          await importSubmitBtn.click();
          await page.waitForTimeout(2000);

          // Check for success
          const successMsg = page.locator('text=/imported successfully/');
          if (await successMsg.isVisible()) {
            console.log('✅ Import successful!');
          }
        }
      }
    }
  }

  console.log(`Current URL: ${page.url()}`);
});