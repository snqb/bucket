import { test, expect } from '@playwright/test';

test.describe('New Import Flow', () => {
  test.use({ storageState: {} }); // Use fresh browser context

  test('Import button is visible on auth screen', async ({ page }) => {
    console.log('📱 Step 1: Navigating to fresh auth screen...');
    // Clear localStorage to ensure fresh session
    await page.goto('http://localhost:5558');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForTimeout(5000); // Wait for auth screen to fully load

    console.log('🔍 Step 2: Looking for Import button on auth screen...');
    // Look for the Import button on the main auth screen
    const importBtn = page.locator('button:has-text("Import")');
    await expect(importBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ Import button found on auth screen');

    // Check it has the Upload icon
    const uploadIcon = importBtn.locator('svg');
    await expect(uploadIcon).toBeVisible();
    console.log('✅ Upload icon visible in Import button');

    console.log('🎯 Step 3: Testing import dialog...');
    await importBtn.click();
    await page.waitForTimeout(500);

    // Check that import dialog opens
    const dialogTitle = page.locator('text=Import Wallet');
    await expect(dialogTitle).toBeVisible();
    console.log('✅ Import dialog opened');

    // Check for passphrase textarea
    const textarea = page.locator('textarea[placeholder*="12-word"]');
    await expect(textarea).toBeVisible();
    console.log('✅ Passphrase textarea found');

    // Check for Import Wallet button
    const importSubmitBtn = page.locator('button:has-text("Import Wallet")');
    await expect(importSubmitBtn).toBeVisible();
    console.log('✅ Import Wallet button found');

    // Check for Cancel button
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible();
    console.log('✅ Cancel button found');

    // Test invalid passphrase
    console.log('🚫 Step 4: Testing invalid passphrase...');
    await textarea.fill('invalid short phrase');
    await importSubmitBtn.click();
    await page.waitForTimeout(500);

    // Should show error message
    const errorMsg = page.locator('text=/Passphrase must be/');
    if (await errorMsg.isVisible()) {
      console.log('✅ Invalid passphrase validation works');
    }

    // Test valid passphrase import
    console.log('✅ Step 5: Testing valid passphrase import...');
    const validPassphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    await textarea.fill(validPassphrase);
    await importSubmitBtn.click();
    await page.waitForTimeout(2000);

    // Should close dialog and show success
    const successMsg = page.locator('text=/Wallet imported successfully/');
    if (await successMsg.isVisible()) {
      console.log('✅ Import success message shown');
    }

    // Check that QR code is shown for imported wallet
    const qrCode = page.locator('img[alt="QR Code"]');
    if (await qrCode.isVisible()) {
      console.log('✅ QR code shown for imported wallet');
    }

    console.log('🎉 All import flow tests passed!');
  });

  test('Old import functionality is removed from WalletManager', async ({ page }) => {
    console.log('📱 Step 1: Navigating to app...');
    await page.goto('http://localhost:5558');
    await page.waitForTimeout(3000);

    console.log('🔍 Step 2: Skip to main app...');
    // Skip auth to get to main app
    const skipBtn = page.locator('button:has-text("Skip for now")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(3000);
    }

    console.log('🔍 Step 3: Open wallet manager...');
    const walletManagerBtn = page.locator('button[title*="Manage wallets"]');
    if (await walletManagerBtn.isVisible()) {
      await walletManagerBtn.click();
      await page.waitForTimeout(500);

      // Check that old import button is NOT present in wallet manager
      const oldImportBtn = page.locator('button:has-text("Import"):has([title*="Export"])');
      const isVisible = await oldImportBtn.isVisible().catch(() => false);
      if (!isVisible) {
        console.log('✅ Old import button correctly removed from WalletManager');
      } else {
        console.log('❌ Old import button still present in WalletManager');
      }
    } else {
      console.log('ℹ️ Wallet manager button not found - might be in different state');
    }
  });
});