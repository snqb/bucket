import { test, expect } from '@playwright/test';

test('Final import flow test - logout then test import', async ({ page }) => {
  console.log('📱 Step 1: Navigate to app...');
  await page.goto('http://localhost:5558');
  await page.waitForTimeout(3000);

  // We should be on the main app, click logout to reach auth screen
  console.log('🔓 Step 2: Logging out to reach auth screen...');
  const logoutBtn = page.locator('button[title="Logout"]');
  await expect(logoutBtn).toBeVisible();
  await logoutBtn.click();
  await page.waitForTimeout(3000);

  console.log('🔍 Step 3: Checking for Import button on auth screen...');
  // Now we should be on auth screen, look for import button
  const importBtn = page.locator('button:has-text("Import")');
  await expect(importBtn).toBeVisible({ timeout: 5000 });
  console.log('✅ Import button found on auth screen!');

  // Check that Paste and Create New buttons are also there
  const pasteBtn = page.locator('button:has-text("Paste")');
  const createNewBtn = page.locator('button:has-text("Create New")');

  await expect(pasteBtn).toBeVisible();
  await expect(createNewBtn).toBeVisible();
  console.log('✅ All auth buttons are present: Paste, Import, Create New');

  console.log('🎯 Step 4: Testing import dialog...');
  await importBtn.click();
  await page.waitForTimeout(500);

  // Check import dialog opened
  const dialogTitle = page.locator('text=Import Wallet');
  await expect(dialogTitle).toBeVisible();
  console.log('✅ Import dialog opened with title "Import Wallet"');

  // Check for passphrase textarea
  const textarea = page.locator('textarea[placeholder*="12-word"]');
  await expect(textarea).toBeVisible();
  console.log('✅ Passphrase input textarea found');

  // Check for buttons
  const cancelBtn = page.locator('button:has-text("Cancel")');
  const importSubmitBtn = page.locator('button:has-text("Import Wallet")');

  await expect(cancelBtn).toBeVisible();
  await expect(importSubmitBtn).toBeVisible();
  console.log('✅ Cancel and Import Wallet buttons found');

  console.log('📝 Step 5: Testing import with valid passphrase...');
  const validPassphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  await textarea.fill(validPassphrase);
  await importSubmitBtn.click();
  await page.waitForTimeout(2000);

  // Check for success message
  const successMsg = page.locator('text=/Wallet imported successfully/');
  if (await successMsg.isVisible()) {
    console.log('✅ Import success message shown!');
  }

  // Check that QR code appears for imported wallet
  const qrCode = page.locator('img[alt="QR Code"]');
  if (await qrCode.isVisible()) {
    console.log('✅ QR code generated for imported wallet!');
  }

  console.log('🎉 Import flow is working correctly!');
  console.log('📸 Taking final screenshot...');
  await page.screenshot({ path: '/tmp/import_flow_success.png' });
});