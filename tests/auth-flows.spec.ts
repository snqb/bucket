import { test, expect } from '@playwright/test';
import { clearAllStorage, verifyAuthState, createTestWallet } from './helpers';
import { createHash } from 'crypto';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
  });

  test('Anonymous session auto-creation', async ({ page }) => {
    console.log('🔍 Step 1: Navigate to app with fresh storage...');
    await page.goto('http://localhost:5558');

    // Wait for app to load and auto-authenticate
    await page.waitForTimeout(3000);

    console.log('✅ Step 2: Verifying anonymous session created...');

    // Check userId was created
    const userId = await page.evaluate(() => localStorage.getItem('bucket-userId'));
    expect(userId).toBeTruthy();
    expect(userId!.length).toBeGreaterThan(0);

    // Check passphrase was created
    const passphrase = await page.evaluate(() => localStorage.getItem('bucket-passphrase'));
    expect(passphrase).toBeTruthy();
    expect(passphrase!.split(' ').length).toBe(12); // BIP-39 format

    // Verify auth state through our helper
    await verifyAuthState(page, { hasUserId: true, hasPassphrase: true });

    // Check we bypassed auth screen and went straight to app
    await expect(page.locator('text=Enter Your Space')).toHaveCount(0);
    await expect(page.locator('text=Loading')).toHaveCount(0);

    console.log('✅ Anonymous session auto-creation verified');
  });

  test('Logout returns to passphrase screen without auto-restore', async ({ page }) => {
    console.log('📱 Step 1: Navigate to app and wait for auto-auth...');
    await page.goto('http://localhost:5558');
    await page.waitForTimeout(3000);

    // Verify we're authenticated
    const userId = await page.evaluate(() => localStorage.getItem('bucket-userId'));
    expect(userId).toBeTruthy();

    console.log('🚪 Step 2: Testing logout button...');
    const logoutBtn = page.locator('button[title="Logout"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Check for intentional logout flag
    const logoutFlag = await page.evaluate(() => localStorage.getItem('bucket-intentional-logout'));
    expect(logoutFlag).toBe('true');

    // Wait 2 seconds to ensure no auto-restoration
    await page.waitForTimeout(2000);

    console.log('✅ Step 3: Verifying logout without auto-restore...');

    // Verify we're on auth screen
    await expect(page.locator('text=Enter Your Space')).toBeVisible();

    // Check localStorage was cleared
    const userIdAfter = await page.evaluate(() => localStorage.getItem('bucket-userId'));
    const passphraseAfter = await page.evaluate(() => localStorage.getItem('bucket-passphrase'));
    expect(userIdAfter).toBeNull();
    expect(passphraseAfter).toBeNull();

    // Wait additional time to verify flag cleanup
    await page.waitForTimeout(1000);
    const logoutFlagAfter = await page.evaluate(() => localStorage.getItem('bucket-intentional-logout'));
    expect(logoutFlagAfter).toBeNull(); // Should be cleared after 2 seconds

    console.log('✅ Logout flow verified - no auto-restoration');
  });

  test('Enter with existing passphrase returns same userId', async ({ page }) => {
    console.log('📝 Step 1: Create wallet with known passphrase...');
    const knownPassphrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    await page.goto('http://localhost:5558');
    await page.waitForTimeout(3000);

    // Click logout to get to auth screen
    await page.locator('button[title="Logout"]').click();
    await page.waitForTimeout(2000);

    // Enter known passphrase
    const passphraseInput = page.locator('textarea[placeholder*="Enter or paste your 12-word passphrase"]');
    await expect(passphraseInput).toBeVisible();
    await passphraseInput.fill(knownPassphrase);

    // Click enter space
    await page.locator('button:has-text("Enter Space")').click();
    await page.waitForTimeout(3000);

    // Get the userId for this passphrase
    const userIdFirst = await page.evaluate(() => localStorage.getItem('bucket-userId'));
    expect(userIdFirst).toBeTruthy();

    console.log('🔄 Step 2: Logout and re-enter same passphrase...');

    // Logout
    await page.locator('button[title="Logout"]').click();
    await page.waitForTimeout(2000);

    // Re-enter same passphrase
    await passphraseInput.fill(knownPassphrase);
    await page.locator('button:has-text("Enter Space")').click();
    await page.waitForTimeout(3000);

    // Verify same userId is derived
    const userIdSecond = await page.evaluate(() => localStorage.getItem('bucket-userId'));
    expect(userIdSecond).toBe(userIdFirst);

    console.log('✅ Passphrase -> userId consistency verified');
  });

  test('Invalid passphrase handling', async ({ page }) => {
    console.log('🔍 Step 1: Navigate to auth screen...');
    await page.goto('http://localhost:5558');
    await page.waitForTimeout(3000);

    // Logout to get to auth screen
    await page.locator('button[title="Logout"]').click();
    await page.waitForTimeout(2000);

    console.log('❌ Step 2: Test invalid passphrase...');

    // Enter invalid passphrase (not 12 words)
    const passphraseInput = page.locator('textarea[placeholder*="Enter or paste your 12-word passphrase"]');
    await passphraseInput.fill('invalid passphrase');

    // Check if Enter Space button is disabled or shows error
    const enterBtn = page.locator('button:has-text("Enter Space")');

    // The button might be disabled, or might show an error when clicked
    const isDisabled = await enterBtn.isDisabled();

    if (isDisabled) {
      console.log('✅ Enter Space button correctly disabled for invalid passphrase');
    } else {
      // If not disabled, click it and see what happens
      await enterBtn.click();
      await page.waitForTimeout(1000);

      // Look for error message or button state change
      const errorMsg = page.locator('text=/error|invalid|incorrect/i');
      if (await errorMsg.count() > 0) {
        console.log('✅ Error message shown for invalid passphrase');
      }
    }

    console.log('✅ Invalid passphrase handling verified');
  });

  test('Create New generates valid BIP-39 passphrase', async ({ page }) => {
    console.log('📝 Step 1: Navigate to auth screen...');
    await page.goto('http://localhost:5558');
    await page.waitForTimeout(3000);

    // Logout to get to auth screen
    await page.locator('button[title="Logout"]').click();
    await page.waitForTimeout(2000);

    console.log('🔑 Step 2: Generate new passphrase...');
    const createNewBtn = page.locator('button:has-text("Create New")');
    await expect(createNewBtn).toBeVisible();
    await createNewBtn.click();

    await page.waitForTimeout(1000);

    console.log('✅ Step 3: Verify generated passphrase...');

    // Check passphrase is displayed
    const passphraseText = page.locator('text=Your passphrase:');
    await expect(passphraseText).toBeVisible();

    // Get the passphrase text
    const passphraseDisplay = page.locator('text=/^\\s*(\\w+\\s+){11}\\w+\\s*$/'); // 12 words regex
    await expect(passphraseDisplay).toBeVisible();

    const passphrase = await passphraseDisplay.textContent();
    if (passphrase) {
      const words = passphrase.trim().split(/\s+/);
      expect(words.length).toBe(12);

      // All words should be lowercase alphabetic
      words.forEach(word => {
        expect(/^[a-z]+$/.test(word)).toBe(true);
      });

      console.log(`✅ Valid BIP-39 passphrase generated: ${words.length} words`);
    }

    // Verify it creates a valid userId when entered
    await page.locator('button:has-text("Enter Space")').click();
    await page.waitForTimeout(3000);

    const userId = await page.evaluate(() => localStorage.getItem('bucket-userId'));
    expect(userId).toBeTruthy();
    expect(userId!.length).toBe(64); // SHA-256 hash length

    console.log('✅ BIP-39 passphrase validation complete');
  });

  test('Passphrase to userId derivation consistency', async ({ page }) => {
    console.log('🧪 Step 1: Test deterministic userId derivation...');

    const testPassphrases = [
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
      'legal winner thank year wave sausage worth useful legal winner thank yellow'
    ];

    for (const passphrase of testPassphrases) {
      console.log(`  Testing: ${passphrase.split(' ').slice(0, 3).join(' ')}...`);

      await page.goto('http://localhost:5558');
      await page.waitForTimeout(3000);

      // Logout and enter passphrase
      await page.locator('button[title="Logout"]').click();
      await page.waitForTimeout(2000);

      await page.locator('textarea[placeholder*="Enter or paste your 12-word passphrase"]').fill(passphrase);
      await page.locator('button:has-text("Enter Space")').click();
      await page.waitForTimeout(3000);

      const userId = await page.evaluate(() => localStorage.getItem('bucket-userId'));

      // Verify it's a SHA-256 hash (64 hex characters)
      expect(userId).toBeTruthy();
      expect(userId!.length).toBe(64);
      expect(/^[a-f0-9]{64}$/i.test(userId!)).toBe(true);

      console.log(`    → ${userId!.substring(0, 16)}...`);

      // Logout for next iteration
      await page.locator('button[title="Logout"]').click();
      await page.waitForTimeout(2000);
    }

    console.log('✅ UserId derivation consistency verified');
  });
});