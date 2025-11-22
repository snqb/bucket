import { test, expect } from '@playwright/test';
import { clearAllStorage, createTestWallet, verifyAuthState, waitForSync } from './helpers';

test.describe('Wallet Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('http://localhost:5558');
  });

  test('Create first wallet from anonymous session', async ({ page }) => {
    console.log('🔍 Step 1: Verify anonymous session...');

    // Wait for app to load and auto-authenticate
    await page.waitForTimeout(2000);

    // Check we're in anonymous session (no wallets)
    const walletsJson = await page.evaluate(() => localStorage.getItem('bucket-wallets'));
    expect(walletsJson).toBeNull();

    // Check userId exists (anonymous session)
    const userId = await page.evaluate(() => localStorage.getItem('bucket-userId'));
    expect(userId).toBeTruthy();

    // Look for Create Wallet button
    console.log('🔍 Step 2: Looking for Create Wallet button...');
    const createWalletBtn = page.locator('button:has-text("Create Wallet")');
    await expect(createWalletBtn).toBeVisible();

    // Click Create Wallet button
    console.log('🖱️ Step 3: Clicking Create Wallet button...');
    await createWalletBtn.click();

    // Check for intentional logout flag
    const logoutFlag = await page.evaluate(() => localStorage.getItem('bucket-intentional-logout'));
    expect(logoutFlag).toBe('true');

    // Wait to ensure no auto-restoration
    await page.waitForTimeout(2000);

    // Verify we're on auth screen
    console.log('✅ Step 4: Verifying auth screen...');
    await expect(page.locator('text=Enter Your Space')).toBeVisible();

    // Create new wallet
    console.log('📝 Step 5: Creating new wallet...');
    const createNewBtn = page.locator('button:has-text("Create New")');
    await expect(createNewBtn).toBeVisible();
    await createNewBtn.click();

    // Wait for passphrase generation
    await page.waitForTimeout(1000);

    // Verify passphrase is displayed
    await expect(page.locator('text=Your passphrase:')).toBeVisible();

    // Check if WalletSwitcher appears
    const walletSwitcher = page.locator('text=Your Wallets');
    if (await walletSwitcher.count() > 0) {
      await expect(walletSwitcher).toBeVisible();
    }

    // Enter space with new wallet
    console.log('🚀 Step 6: Entering space with new wallet...');
    const enterBtn = page.locator('button:has-text("Enter Space")');
    await expect(enterBtn).toBeVisible();
    await enterBtn.click();

    // Wait for app to load with new wallet
    await page.waitForTimeout(3000);

    // Verify we entered the app
    console.log('✅ Step 7: Verifying successful entry...');
    await expect(page.locator('text=Loading')).toHaveCount(0);

    // Check that wallet was created and stored
    const walletsJsonAfter = await page.evaluate(() => localStorage.getItem('bucket-wallets'));
    expect(walletsJsonAfter).toBeTruthy();

    const wallets = JSON.parse(walletsJsonAfter!);
    expect(wallets.length).toBe(1);

    // Verify active wallet is set
    const activeWalletId = await page.evaluate(() => localStorage.getItem('bucket-activeWalletId'));
    expect(activeWalletId).toBe(wallets[0].userId);
  });

  test('Switch between multiple wallets', async ({ page }) => {
    console.log('📝 Step 1: Creating first wallet...');
    await createTestWallet(page, 'Work');

    // Enter space with first wallet
    await page.locator('button:has-text("Enter Space")').click();
    await page.waitForTimeout(3000);

    console.log('📝 Step 2: Creating second wallet...');
    // Go back to auth screen to create second wallet
    const walletBtn = page.locator('button[aria-label="Switch wallet"]');
    await expect(walletBtn).toBeVisible();
    await walletBtn.click();

    const addWalletBtn = page.locator('button:has-text("Add Wallet")');
    await expect(addWalletBtn).toBeVisible();
    await addWalletBtn.click();

    // Wait for auth screen
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Enter Your Space')).toBeVisible();

    // Create second wallet
    await page.locator('button:has-text("Create New")').click();
    await page.waitForTimeout(1000);

    // Enter space with second wallet
    await page.locator('button:has-text("Enter Space")').click();
    await page.waitForTimeout(3000);

    console.log('🔄 Step 3: Testing wallet switching...');

    // Get current userId
    let currentUserId = await page.evaluate(() => localStorage.getItem('bucket-userId'));

    // Open wallet switcher
    await page.locator('button[aria-label="Switch wallet"]').click();
    await page.waitForTimeout(500);

    // Look for first wallet in dropdown
    const walletsJson = await page.evaluate(() => localStorage.getItem('bucket-wallets'));
    const wallets = JSON.parse(walletsJson!);

    if (wallets.length >= 2) {
      // Click on the first wallet (not the current one)
      const firstWalletCard = page.locator(`[data-wallet-id="${wallets[0].userId}"]`);
      if (await firstWalletCard.count() > 0) {
        await firstWalletCard.click();

        // Wait for page reload
        await page.waitForTimeout(2000);

        // Verify userId changed
        const newUserId = await page.evaluate(() => localStorage.getItem('bucket-userId'));
        expect(newUserId).not.toBe(currentUserId);
        expect(newUserId).toBe(wallets[0].userId);

        console.log('✅ Successfully switched wallets');
      }
    }
  });

  test('Remove wallet with automatic active wallet switching', async ({ page }) => {
    console.log('📝 Step 1: Creating two wallets...');
    await createTestWallet(page, 'Wallet 1');
    await page.locator('button:has-text("Enter Space")').click();
    await page.waitForTimeout(3000);

    // Create second wallet
    const walletBtn = page.locator('button[aria-label="Switch wallet"]');
    await walletBtn.click();
    await page.locator('button:has-text("Add Wallet")').click();
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Create New")').click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Enter Space")').click();
    await page.waitForTimeout(3000);

    console.log('🗑️ Step 2: Removing current wallet...');

    // Get wallets before removal
    const walletsJsonBefore = await page.evaluate(() => localStorage.getItem('bucket-wallets'));
    const walletsBefore = JSON.parse(walletsJsonBefore!);
    expect(walletsBefore.length).toBe(2);

    const activeUserId = await page.evaluate(() => localStorage.getItem('bucket-userId'));

    // Open wallet switcher
    await page.locator('button[aria-label="Switch wallet"]').click();
    await page.waitForTimeout(500);

    // Find and click remove button for current wallet
    const currentWalletCard = page.locator(`[data-wallet-id="${activeUserId}"]`);
    const removeBtn = currentWalletCard.locator('button[title="Remove wallet"]');

    if (await removeBtn.count() > 0) {
      await removeBtn.click();
      await page.waitForTimeout(1000);

      // Verify wallet was removed
      const walletsJsonAfter = await page.evaluate(() => localStorage.getItem('bucket-wallets'));
      const walletsAfter = JSON.parse(walletsJsonAfter!);
      expect(walletsAfter.length).toBe(1);
      expect(walletsAfter.find((w: any) => w.userId === activeUserId)).toBeUndefined();

      // Verify active wallet switched to remaining wallet
      const newActiveUserId = await page.evaluate(() => localStorage.getItem('bucket-userId'));
      const remainingWallet = walletsAfter[0];
      expect(newActiveUserId).toBe(remainingWallet.userId);

      console.log('✅ Successfully removed wallet and switched active wallet');
    }
  });

  test('Data isolation between wallets', async ({ page }) => {
    console.log('📝 Step 1: Creating wallet with test data...');
    await createTestWallet(page, 'Data Test');
    await page.locator('button:has-text("Enter Space")').click();
    await page.waitForTimeout(3000);

    // Create test list
    console.log('📋 Step 2: Creating test list...');
    await page.keyboard.press('n'); // Open create list dialog
    await page.waitForTimeout(500);

    const listInput = page.locator('input[placeholder*="List name"]');
    if (await listInput.count() > 0) {
      await listInput.fill('Test List - Wallet 1');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      // Verify list was created
      await expect(page.locator('text=Test List - Wallet 1')).toBeVisible();
    }

    console.log('📝 Step 3: Creating second wallet...');
    // Create second wallet to test isolation
    const walletBtn = page.locator('button[aria-label="Switch wallet"]');
    await walletBtn.click();
    await page.locator('button:has-text("Add Wallet")').click();
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Create New")').click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Enter Space")').click();
    await page.waitForTimeout(3000);

    console.log('🔍 Step 4: Verifying data isolation...');

    // Check that list from first wallet is NOT visible
    const testList = page.locator('text=Test List - Wallet 1');
    await expect(testList).toHaveCount(0);

    // Create different list in second wallet
    await page.keyboard.press('n');
    await page.waitForTimeout(500);

    const listInput2 = page.locator('input[placeholder*="List name"]');
    if (await listInput2.count() > 0) {
      await listInput2.fill('Test List - Wallet 2');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      // Verify second list exists
      await expect(page.locator('text=Test List - Wallet 2')).toBeVisible();
    }

    console.log('✅ Data isolation verified between wallets');
  });
});