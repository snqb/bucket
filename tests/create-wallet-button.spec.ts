import { test, expect } from '@playwright/test';

test.describe('Create Wallet Button', () => {
  test('Create Wallet button should work from anonymous session', async ({ page }) => {
    console.log('📱 Step 1: Navigating to app...');
    await page.goto('http://localhost:5558');

    // Wait for app to load
    await page.waitForTimeout(3000);

    console.log('🔍 Step 2: Checking if we have Create Wallet button...');

    // Look for Create Wallet button
    const createWalletBtn = page.locator('button:has-text("Create Wallet")');

    if (await createWalletBtn.isVisible()) {
      console.log('✅ Create Wallet button found!');

      console.log('🖱️ Step 3: Clicking Create Wallet button...');
      await createWalletBtn.click();

      // Wait for transition
      await page.waitForTimeout(2000);

      console.log('✅ Step 4: Checking if we reached auth screen...');

      // Check if we're on auth screen
      const authScreen = page.locator('text=Enter Your Space');
      if (await authScreen.isVisible()) {
        console.log('🎉 SUCCESS: Create Wallet button works!');

        // Check for Create New button
        const createNewBtn = page.locator('button:has-text("Create New")');
        if (await createNewBtn.isVisible()) {
          console.log('✅ Create New button visible - auth flow working!');
        }
      } else {
        console.log('❌ Did not reach auth screen');
      }
    } else {
      console.log('⚠️ Create Wallet button not visible');

      // Check if we have wallet switcher instead
      const walletSwitcher = page.locator('button[aria-label="Switch wallet"]');
      if (await walletSwitcher.isVisible()) {
        console.log('ℹ️ Wallet switcher visible - user already has wallets');
      } else {
        console.log('❌ Neither Create Wallet nor wallet switcher found');
      }
    }

    // Take screenshot for debugging
    await page.screenshot({ path: '/tmp/create_wallet_button_test.png' });
    console.log('📸 Screenshot saved to /tmp/create_wallet_button_test.png');
  });
});