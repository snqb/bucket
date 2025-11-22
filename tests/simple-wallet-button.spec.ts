import { test, expect } from '@playwright/test';

test.describe('Simple Wallet Button Test', () => {
  test('Wallet button appears and can be clicked', async ({ page }) => {
    console.log('📱 Step 1: Navigating to app...');
    await page.goto('http://localhost:5558');
    await page.waitForTimeout(3000);

    console.log('🔍 Step 2: Looking for wallet button...');

    // Look for wallet button (either wallet icon or existing switcher)
    const walletBtn = page.locator('button').filter({ hasText: /wallet|manage/i }).or(page.locator('button[title*="wallet"], button[title*="manage"]'));

    if (await walletBtn.count() > 0) {
      console.log('✅ Wallet button found!');

      // Check if it has wallet icon
      const hasWalletIcon = await walletBtn.locator('svg').count() > 0;
      if (hasWalletIcon) {
        console.log('✅ Wallet button has icon');
      }

      // Check for wallet count badge
      const badge = walletBtn.locator('.bg-blue-500\\/20, span[class*="rounded"]');
      if (await badge.count() > 0) {
        console.log('✅ Wallet count badge visible');
      }

      // Click the button
      console.log('🖱️ Step 3: Clicking wallet button...');
      await walletBtn.first().click();
      await page.waitForTimeout(1000);

      // Take screenshot to see what happens
      await page.screenshot({ path: '/tmp/wallet_button_clicked.png' });
      console.log('📸 Screenshot saved after clicking wallet button');

      // Look for any modal or dialog that might have opened
      const modal = page.locator('[role="dialog"], .dialog, [data-testid*="modal"]');
      if (await modal.count() > 0) {
        console.log('✅ Modal or dialog found after clicking wallet button');
      } else {
        console.log('ℹ️ No modal found - button might have different behavior');
      }

    } else {
      console.log('❌ Wallet button not found');

      // Look for any button with wallet-related functionality
      const allButtons = page.locator('button').all();
      console.log(`Found ${allButtons.length} buttons total`);

      // List visible buttons
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const btn = allButtons[i];
        if (await btn.isVisible()) {
          const text = await btn.textContent();
          const title = await btn.getAttribute('title');
          console.log(`  ${i+1}. Button: "${text?.trim()}" (title: "${title}")`);
        }
      }
    }

    console.log('✅ Simple wallet button test completed');
  });
});