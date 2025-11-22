import { Page, expect } from '@playwright/test';

/**
 * Clear all localStorage and sessionStorage
 */
export async function clearAllStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Create a test wallet with optional label
 */
export async function createTestWallet(page: Page, label?: string): Promise<void> {
  // Ensure we're on auth screen
  const authScreen = page.locator('text=Enter Your Space');
  if (!(await authScreen.isVisible())) {
    // Click logout to get to auth screen
    const logoutBtn = page.locator('button[title="Logout"]');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  await expect(page.locator('text=Enter Your Space')).toBeVisible();

  // Create new wallet
  const createNewBtn = page.locator('button:has-text("Create New")');
  await expect(createNewBtn).toBeVisible();
  await createNewBtn.click();

  // Wait for passphrase generation
  await page.waitForTimeout(1000);

  // Optionally add label if input exists
  if (label) {
    const labelInput = page.locator('input[placeholder*="label"], input[placeholder*="name"]');
    if (await labelInput.count() > 0) {
      await labelInput.fill(label);
      await page.waitForTimeout(500);
    }
  }

  // Enter space
  const enterBtn = page.locator('button:has-text("Enter Space")');
  await expect(enterBtn).toBeVisible();
  await enterBtn.click();

  await page.waitForTimeout(3000);
}

/**
 * Verify auth state expectations
 */
export async function verifyAuthState(page: Page, expectations: {
  hasUserId?: boolean;
  hasPassphrase?: boolean;
  hasWallets?: boolean;
  intentionalLogout?: boolean;
}): Promise<void> {
  const userId = await page.evaluate(() => localStorage.getItem('bucket-userId'));
  const passphrase = await page.evaluate(() => localStorage.getItem('bucket-passphrase'));
  const wallets = await page.evaluate(() => localStorage.getItem('bucket-wallets'));
  const intentionalLogout = await page.evaluate(() => localStorage.getItem('bucket-intentional-logout'));

  if (expectations.hasUserId !== undefined) {
    if (expectations.hasUserId) {
      expect(userId).toBeTruthy();
      expect(userId!.length).toBeGreaterThan(0);
    } else {
      expect(userId).toBeNull();
    }
  }

  if (expectations.hasPassphrase !== undefined) {
    if (expectations.hasPassphrase) {
      expect(passphrase).toBeTruthy();
      expect(passphrase!.length).toBeGreaterThan(0);
      // Should be BIP-39 format (12 words)
      expect(passphrase!.split(' ').length).toBe(12);
    } else {
      expect(passphrase).toBeNull();
    }
  }

  if (expectations.hasWallets !== undefined) {
    if (expectations.hasWallets) {
      expect(wallets).toBeTruthy();
      const parsedWallets = JSON.parse(wallets!);
      expect(Array.isArray(parsedWallets)).toBe(true);
      expect(parsedWallets.length).toBeGreaterThan(0);
    } else {
      expect(wallets).toBeNull();
    }
  }

  if (expectations.intentionalLogout !== undefined) {
    if (expectations.intentionalLogout) {
      expect(intentionalLogout).toBe('true');
    } else {
      expect(intentionalLogout).toBeNull();
    }
  }
}

/**
 * Wait for sync to complete (max 10 seconds)
 */
export async function waitForSync(page: Page, timeoutMs: number = 10000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const syncStatus = await page.evaluate(() => {
      const statusElement = document.querySelector('[data-sync-status], .sync-status, .status');
      if (statusElement) {
        return statusElement.textContent;
      }
      return null;
    });

    // Check for various "connected" or "synced" states
    if (syncStatus && (
      syncStatus.includes('connected') ||
      syncStatus.includes('synced') ||
      syncStatus.includes('ready')
    )) {
      console.log(`✅ Sync completed: ${syncStatus}`);
      return;
    }

    // Also check if sync indicator is green (common pattern)
    const syncColor = await page.evaluate(() => {
      const statusElement = document.querySelector('[data-sync-status], .sync-status, .status');
      if (statusElement) {
        const computed = window.getComputedStyle(statusElement);
        return computed.color || computed.backgroundColor;
      }
      return null;
    });

    if (syncColor && (
      syncColor.includes('rgb(0, 128, 0)') || // green
      syncColor.includes('rgb(34, 197, 94)') || // green variant
      syncColor.includes('#00ff00') || // green hex
      syncColor.includes('#22c55e') // green variant
    )) {
      console.log('✅ Sync completed (green indicator)');
      return;
    }

    await page.waitForTimeout(500);
  }

  console.log('⚠️ Sync status check timed out');
}

/**
 * Helper to create a test list
 */
export async function createTestList(page: Page, name: string): Promise<void> {
  // Press N to create list or click create button
  await page.keyboard.press('n');
  await page.waitForTimeout(500);

  const listInput = page.locator('input[placeholder*="List name"], input[placeholder*="Create"]');
  if (await listInput.count() > 0) {
    await listInput.fill(name);
    await listInput.press('Enter');
    await page.waitForTimeout(1000);

    // Verify list was created
    await expect(page.locator(`text=${name}`)).toBeVisible();
  } else {
    throw new Error('Could not find list creation input');
  }
}

/**
 * Helper to create a test task
 */
export async function createTestTask(page: Page, description: string): Promise<void> {
  const taskInput = page.locator('input[placeholder*="Add"], input[placeholder*="task"]');
  if (await taskInput.count() > 0) {
    await taskInput.first().fill(description);
    await taskInput.first().press('Enter');
    await page.waitForTimeout(1000);

    // Verify task was created
    await expect(page.locator(`text=${description}`)).toBeVisible();
  } else {
    throw new Error('Could not find task creation input');
  }
}

/**
 * Helper to set task progress
 */
export async function setTaskProgress(page: Page, taskDescription: string, progress: number): Promise<void> {
  const taskElement = page.locator(`text=${taskDescription}`).first();
  if (await taskElement.count() > 0) {
    await taskElement.click();
    await page.waitForTimeout(500);

    // Try to find progress slider or input
    const progressSlider = page.locator('input[type="range"], [role="slider"], .progress-slider');
    if (await progressSlider.count() > 0) {
      // Set progress value
      await progressSlider.first().fill(progress.toString());
      await progressSlider.first().press('Enter');
      await page.waitForTimeout(500);
    } else {
      // Try typing the percentage directly
      await page.keyboard.press(String(progress % 10));
      await page.waitForTimeout(200);
      if (progress >= 10) {
        await page.keyboard.press(String(Math.floor(progress / 10) % 10));
      }
      if (progress === 100) {
        await page.keyboard.press('0');
        await page.keyboard.press('0');
      }
      await page.waitForTimeout(500);
    }
  } else {
    throw new Error(`Could not find task: ${taskDescription}`);
  }
}

/**
 * Helper to take a screenshot with a descriptive filename
 */
export async function takeScreenshot(page: Page, testName: string, description: string): Promise<void> {
  const filename = `${testName}_${description.toLowerCase().replace(/\s+/g, '_')}.png`;
  await page.screenshot({ path: `/tmp/${filename}` });
  console.log(`📸 Screenshot saved: ${filename}`);
}

/**
 * Helper to check console errors
 */
export async function checkConsoleErrors(page: Page): Promise<string[]> {
  const logs = await page.evaluate(() => {
    return (window as any).__testConsoleErrors || [];
  });
  return logs;
}

/**
 * Helper to setup console error capturing
 */
export async function setupConsoleCapture(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__testConsoleErrors = [];

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = function(...args) {
      (window as any).__testConsoleErrors.push(`ERROR: ${args.join(' ')}`);
      originalError.apply(console, args);
    };

    console.warn = function(...args) {
      (window as any).__testConsoleErrors.push(`WARN: ${args.join(' ')}`);
      originalWarn.apply(console, args);
    };
  });
}

/**
 * Helper to wait for app to be ready
 */
export async function waitForAppReady(page: Page, timeoutMs: number = 5000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const isLoading = await page.locator('text=Loading').count() > 0;
    const hasContent = await page.locator('button, input, textarea, [role="button"]').count() > 0;

    if (!isLoading && hasContent) {
      console.log('✅ App ready');
      return;
    }

    await page.waitForTimeout(500);
  }

  console.log('⚠️ App ready check timed out');
}